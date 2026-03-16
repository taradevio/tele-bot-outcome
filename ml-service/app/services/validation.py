import re
import logging

logger = logging.getLogger(__name__)

# ── Field risk classification ──────────────────────────────────────────────────
HIGH_RISK_FIELDS   = {"total_amount", "price"}
MEDIUM_RISK_FIELDS = {"date", "time", "qty", "discount_value", "voucher_amount"}
LOW_RISK_FIELDS    = {"merchant_name", "items", "category"}

# ── Calibrated thresholds (update these after empirical tuning) ────────────────
# These are educated starting points — replace with real values after calibration
FIELD_THRESHOLDS = {
    "merchant_name":  0.65,
    "items":          0.68,
    "qty":            0.75,
    "date":           0.75,
    "time":           0.72,
    "price":          0.85,
    "discount_value": 0.80,
    "voucher_amount": 0.80,
    "total_amount":   0.88,
    "discount_total": 0.85,
    "voucher_total":  0.85,
    "category":       0.60,
}


def is_valid_ocr_text(raw_text: str) -> tuple[bool, str]:
    if not raw_text:
        return False, "Empty OCR result"

    cleaned = raw_text.strip()
    lines = [l for l in cleaned.split('\n') if l.strip()]
    if len(lines) < 2:
        return False, "Too few lines detected"
    if not any(char.isdigit() for char in cleaned):
        return False, "No numeric values detected"

    tokens = cleaned.split()
    meaningful_tokens = [t for t in tokens if len(t) > 3]
    if len(meaningful_tokens) < 2:
        return False, "Insufficient meaningful text"

    return True, "OK"


def match_field_confidence(field_value, ocr_boxes: list, field_name: str = "") -> float:
    """
    Match LLM-extracted field value against OCR boxes.
    Handles 3 cases:
      1. Direct match     — "INDOMARET" == "INDOMARET"
      2. Partial match    — "KITA" in "KITA SAYUR WARUNG"
      3. Multi-box merge  — "KITA SAYUR WARUNG" spread across multiple boxes
    """
    if not field_value or not ocr_boxes:
        return 0.0

    field_str = str(field_value).strip().lower()

    # ── Numeric fields: normalize before matching ──────────────────────────
    # "24000" should match "24.000=", "24.", ".000" etc.
    if field_name in {"total_amount", "price", "qty", "discount_value", "voucher_amount"}:
        return _match_numeric_confidence(field_value, ocr_boxes)

    # ── Date fields: match raw fragments ──────────────────────────────────
    if field_name in {"date", "time"}:
        return _match_date_confidence(field_str, ocr_boxes)

    # ── Text fields: token-based matching ────────────────────────────────
    return _match_text_confidence(field_str, ocr_boxes)


def _match_text_confidence(field_str: str, ocr_boxes: list) -> float:
    """
    For multi-word fields like "KITA SAYUR WARUNG":
    Split into tokens, find each token in boxes, return average confidence
    of matched boxes. This handles LLM concatenating multiple OCR boxes.
    """
    tokens = field_str.upper().split()
    if not tokens:
        return 0.0

    matched_confidences = []

    for token in tokens:
        if len(token) <= 2:  # skip noise tokens like "x", "rp"
            continue

        best_match = 0.0
        for box in ocr_boxes:
            box_text = box["text"].strip().upper()
            # Token fully contained in box or box fully contained in token
            if token in box_text or box_text in token:
                best_match = max(best_match, box["confidence"])

        if best_match > 0:
            matched_confidences.append(best_match)

    if not matched_confidences:
        return 0.0

    # Return average confidence of matched tokens
    # If only half the tokens matched, confidence is naturally lower
    coverage = len(matched_confidences) / max(len([t for t in tokens if len(t) > 2]), 1)
    avg_conf = sum(matched_confidences) / len(matched_confidences)

    return avg_conf * coverage  # penalize partial matches


def _match_numeric_confidence(field_value, ocr_boxes: list) -> float:
    """
    For numeric fields: normalize value and box texts, then compare.
    "24000" should match "24.000=", "24.", ".000"
    Strategy: find boxes that contain numeric fragments of the value.
    """
    # Normalize field value to plain digits
    target_digits = re.sub(r'[^\d]', '', str(field_value))
    if not target_digits:
        return 0.0

    best_conf = 0.0
    for box in ocr_boxes:
        box_digits = re.sub(r'[^\d]', '', box["text"])
        if not box_digits:
            continue

        # Check if box digits are a substring of target, or target is in box
        if box_digits in target_digits or target_digits in box_digits:
            best_conf = max(best_conf, box["confidence"])

    return best_conf


def _match_date_confidence(field_str: str, ocr_boxes: list) -> float:
    """
    Date "2026-02-15" should match OCR boxes "Tg1.15/02/" and "/2026".
    Extract numeric fragments and match against boxes.
    """
    # Extract date parts: year, month, day
    parts = re.findall(r'\d+', field_str)  # ["2026", "02", "15"]
    if not parts:
        return 0.0

    matched = []
    for part in parts:
        for box in ocr_boxes:
            if part in box["text"] or part in re.sub(r'[^\d]', '', box["text"]):
                matched.append(box["confidence"])
                break

    if not matched:
        return 0.0

    return sum(matched) / len(matched)


def classify_field_status(confidence: float, field_name: str) -> str:
    """
    Classify a field as VERIFIED / ACTION_REQUIRED
    based on calibrated per-field thresholds.
    """
    threshold = FIELD_THRESHOLDS.get(field_name, 0.75)

    if confidence >= threshold:
        return "VERIFIED"
    else:
        return "ACTION_REQUIRED"


# def arithmetic_cross_check(response_data: dict) -> list[dict]:
#     """
#     Verify LLM math is internally consistent.
#     Catches cases where OCR confidence matching passes but numbers are wrong.
#     """
#     issues = []
#     items = response_data.get("items", [])
    
#     if not items:
#         return issues
    
#     # 1. Per-item: qty * price == total_price?
#     for i, item in enumerate(items):
#         qty   = item.get("qty", {}).get("value", 0) or 0
#         price = item.get("price", {}).get("value", 0) or 0
#         total = item.get("total_price", {}).get("value", 0) or 0
#         disc  = item.get("discount_value", {}).get("value", 0) or 0
#         vouc  = item.get("voucher_amount", {}).get("value", 0) or 0
        
#         expected = (qty * price) - disc - vouc
        
#         if total > 0 and expected > 0 and abs(expected - total) > 10:  # 10 rupiah tolerance
#             issues.append({
#                 "field": f"items[{i}].total_price",
#                 "status": "ACTION_REQUIRED",
#                 "reason": f"qty*price={expected} != total_price={total}",
#                 "confidence": 0.0,
#                 "value": total
#             })
    
#     # 2. sum(item totals) == total_amount?
#     declared_total = response_data.get("total_amount", {}).get("value", 0) or 0
#     sum_items = sum(
#         (item.get("total_price", {}).get("value", 0) or 0)
#         for item in items
#     )
    
#     if declared_total > 0 and sum_items > 0 and abs(declared_total - sum_items) > 10:
#         issues.append({
#             "field": "total_amount",
#             "status": "ACTION_REQUIRED", 
#             "reason": f"sum(items)={sum_items} != total_amount={declared_total}",
#             "confidence": 0.0,
#             "value": declared_total
#         })
    
#     return issues


def arithmetic_cross_check(response_data: dict) -> list[dict]:
    issues = []
    items = response_data.get("items", [])

    if not items:
        return issues

    for i, item in enumerate(items):
        qty   = item.get("qty", {}).get("value", 0) or 0
        price = item.get("price", {}).get("value", 0) or 0
        total = item.get("total_price", {}).get("value", 0) or 0
        vouc  = item.get("voucher_amount", {}).get("value", 0) or 0

        # Handle discount_type — bisa nested atau flat
        disc_type = (
            item.get("discount_type", {}).get("value")
            if isinstance(item.get("discount_type"), dict)
            else item.get("discount_type")
        )
        disc_value = item.get("discount_value", {}).get("value", 0) or 0

        base = qty * price

        # Hitung discount nominal
        if disc_type == "percentage":
            disc_nominal = round(base * disc_value / 100)
        else:
            disc_nominal = disc_value  # treat as nominal

        expected = base - disc_nominal - vouc

        if total > 0 and expected > 0 and abs(expected - total) > 10:
            issues.append({
                "field":      f"items[{i}].total_price",
                "status":     "ACTION_REQUIRED",
                "reason":     f"qty*price-disc={expected} != total_price={total}",
                "confidence": 0.0,
                "value":      total
            })

    # sum(items) == total_amount
    declared_total = response_data.get("total_amount", {}).get("value", 0) or 0
    sum_items = sum(
        (item.get("total_price", {}).get("value", 0) or 0)
        for item in items
    )

    if declared_total > 0 and sum_items > 0 and abs(declared_total - sum_items) > 10:
        issues.append({
            "field":      "total_amount",
            "status":     "ACTION_REQUIRED",
            "reason":     f"sum(items)={sum_items} != total_amount={declared_total}",
            "confidence": 0.0,
            "value":      declared_total
        })

    return issues

def determine_receipt_status(response_data: dict, ocr_boxes: list) -> dict:
    """
    Classify each field using REAL RapidOCR confidence scores,
    not LLM self-reported confidence.
    """
    field_results = {}
    low_confidence_fields = []

    # ── Header fields ──────────────────────────────────────────────────────────
    header_fields = ["merchant_name", "date", "time", "total_amount"]
    for field in header_fields:
        if field not in response_data:
            field_results[field] = {"status": "ACTION_REQUIRED", "reason": "field_missing"}
            continue

        value = response_data[field].get("value")
        real_conf = match_field_confidence(str(value), ocr_boxes, field_name=field)
        status = classify_field_status(real_conf, field)

        field_results[field] = {
            "value": value,
            "ocr_confidence": real_conf,  # real score from RapidOCR
            "status": status,
        }

        if status != "VERIFIED":
            low_confidence_fields.append({
                "field": field,
                "confidence": real_conf,
                "status": status,
                "value": value,
            })

    # ── Items ──────────────────────────────────────────────────────────────────
    for i, item in enumerate(response_data.get("items", [])):
        for sub_field in ["name", "price", "qty"]:
            if sub_field not in item:
                continue

            value = item[sub_field].get("value")
            real_conf = match_field_confidence(str(value), ocr_boxes, field_name=sub_field)
            
            # Map item sub-field to threshold key
            threshold_key = "items" if sub_field == "name" else sub_field
            status = classify_field_status(real_conf, threshold_key)

            field_key = f"items[{i}].{sub_field}"
            field_results[field_key] = {
                "value": value,
                "ocr_confidence": real_conf,
                "status": status,
            }

            if status != "VERIFIED":
                low_confidence_fields.append({
                    "field": field_key,
                    "confidence": real_conf,
                    "status": status,
                    "value": value,
                })

    if not response_data.get("items"):
        low_confidence_fields.append({
            "field": "items",
            "confidence": 0.0,
            "status": "ACTION_REQUIRED",
            "value": [],
            "reason": "No items extracted by LLM"
        })
    
    arithmetic_issues = arithmetic_cross_check(response_data)
    low_confidence_fields.extend(arithmetic_issues)

    # ── Overall receipt status (weighted by field risk) ────────────────────────
    high_risk_failed = any(
        f["field"] in HIGH_RISK_FIELDS and f["status"] == "ACTION_REQUIRED"
        for f in low_confidence_fields
    )

    if not low_confidence_fields:
        overall_status = "VERIFIED"
    else:
        overall_status = "ACTION_REQUIRED"

    return {
        "status": overall_status,
        "field_results": field_results,
        "low_confidence_fields": low_confidence_fields,
        "requires_review": len(low_confidence_fields) > 0,
    }
