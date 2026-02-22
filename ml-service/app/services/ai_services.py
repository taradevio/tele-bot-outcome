import ollama
import asyncio
import json
import logging
import uuid
import os
from ollama import AsyncClient

logger = logging.getLogger(__name__)

custom_client = AsyncClient(
    host=os.getenv("OLLAMA_API_KEY", "http://localhost:11434"),
    timeout=50 
)


def get_category_examples(items_text: str) -> str:
    """Generate contoh kategori berdasarkan items yang terdeteksi"""
    
    # Keywords untuk tiap kategori
    category_keywords = {
        "Food & Beverage": ["makanan", "minuman", "snack", "nasi", "mie", "kopi", "teh", "roti", "kue", "daging", "sayur", "buah", "susu", "jus"],
        "Shopping": ["sabun", "shampoo", "deterjen", "pasta gigi", "tissue", "baju", "celana", "sepatu", "tas", "kosmetik", "alat tulis"],
        "Transport": ["bensin", "parking", "parkir", "toll", "tol", "gojek", "grab", "taksi", "bus", "kereta", "pesawat"],
        "Bills": ["listrik", "air", "internet", "pulsa", "token", "pln", "pdam", "tagihan"],
        "Health": ["obat", "vitamin", "suplemen", "dokter", "rumah sakit", "apotek", "masker", "handsanitizer"],
        "Entertainment": ["nonton", "bioskop", "game", "spotify", "netflix", "konser", "hiburan"],
        "Electronics": ["laptop", "komputer", "hp", "charger", "kabel", "coolingpad", "headset", "mouse", "keyboard", "monitor", "printer", "kulkas", "tv"],
    }
    
    # Deteksi kategori yang relevan dari items
    detected_categories = set()
    items_lower = items_text.lower()
    
    for category, keywords in category_keywords.items():
        if any(kw in items_lower for kw in keywords):
            detected_categories.add(category)
    
    # Generate contoh untuk kategori yang terdeteksi + default
    examples = []
    
    if "Food & Beverage" in detected_categories or not detected_categories:
        examples.append("""
        "KRPIK SINGKONG BALADO" → "Food & Beverage"
        "ROTI ANAZKA" → "Food & Beverage"  
        "Nasi Goreng Special" → "Food & Beverage"
        """)
    
    if "Shopping" in detected_categories:
        examples.append("""
        "SABUN MANDI LUX" → "Shopping"
        "SHAMPOO CLEAR" → "Shopping"
        "DETERJEN RINCO" → "Shopping"
        "Tissue Paseo" → "Shopping"
        """)
        
    if "Health" in detected_categories:
        examples.append("""
        "PARACETAMOL" → "Health"
        "MASKER MEDIS" → "Health"
        """)
    
    return "\n".join(examples) if examples else '"ITEM" → "Others"'


def is_valid_ocr_text(raw_text: str) -> tuple[bool, str]:
    if not raw_text:
        return False, "Empty OCR result"
    
    cleaned = raw_text.strip()
    
    # 1. Minimal ada 2 baris — receipt valid pasti multi-line
    lines = [l for l in cleaned.split('\n') if l.strip()]
    if len(lines) < 2:
        return False, "Too few lines detected"
    
    # 2. Minimal ada satu angka — receipt pasti ada nominal
    if not any(char.isdigit() for char in cleaned):
        return False, "No numeric values detected"
    
    # 3. Minimal ada satu token dengan panjang > 3 char
    # (filter noise kayak "A B C D" yang masing-masing 1 char)
    tokens = cleaned.split()
    meaningful_tokens = [t for t in tokens if len(t) > 3]
    if len(meaningful_tokens) < 2:
        return False, "Insufficient meaningful text"
    
    return True, "OK"

def determine_receipt_status(response_data: dict, thresholds: dict = None) -> dict:
    if thresholds is None:
        thresholds = {
            "total_amount": 0.85,
            "merchant_name": 0.75,
            "date": 0.80,
            "time": 0.70,
            "items": 0.70,
            "category": 0.60
        }
    
    low_confidence_fields = []
    
    # Check header fields
    header_fields = ["merchant_name", "date", "time", "total_amount"]
    for field in header_fields:
        if field in response_data:
            confidence = response_data[field].get("confidence", 0)
            threshold = thresholds.get(field, 0.8)
            if confidence <= threshold:
                low_confidence_fields.append({
                    "field": field,
                    "confidence": confidence,
                    "value": response_data[field].get("value")
                })
    
    # Check items
    for i, item in enumerate(response_data.get("items", [])):
        for field in ["name", "price", "qty"]:
            if field in item:
                confidence = item[field].get("confidence", 0)
                if confidence <= thresholds.get("items", 0.70):
                    low_confidence_fields.append({
                        "field": f"items[{i}].{field}",
                        "confidence": confidence,
                        "value": item[field].get("value")
                    })
    
    # Determine status
    if not low_confidence_fields:
        status = "VERIFIED"
    else:
        status = "ACTION_REQUIRED"
    
    return {
        "status": status,
        "low_confidence_fields": low_confidence_fields,
        "requires_review": len(low_confidence_fields) > 0
    }

async def refine_receipt(raw_text: str):

    is_valid, reason = is_valid_ocr_text(raw_text)
    if not is_valid:
        return {
            "error": "ocr_failed",
            "status": "FAILED",
            "message": reason
        }
    

    receipt_id = str(uuid.uuid4())

    category_examples = get_category_examples(raw_text)
    prompt = f"""
    Kamu adalah sistem AI ekstraksi data profesional. Gunakan contoh format berikut untuk memproses data baru.

    DATA OCR:
    {raw_text}

    KLASIFIKASI KATEGORI:
    {category_examples}

    INSTRUKSI KHUSUS:
    1. MERCHANT_NAME: Ambil dari baris yang menyatakan nama toko atau nama PT yang tertera.
    2. CURRENCY: Hapus semua titik/koma pemisah ribuan. Pastikan total_amount adalah INTEGER.
    3. TOTAL_AMOUNT: 
        - Cari kata "TOTAL", "T O T A L", atau "SUBTOTAL" (bukan "JUMLAH UANG" atau "KEMBALI")
        - "JUMLAH UANG" = uang yang dibayarkan (bukan total belanja)
        - "KEMBALI" = kembalian (bukan total belanja)
        - TOTAL yang benar adalah jumlah yang harus dibayar untuk barang, BUKAN uang yang diterima kasir
        - Dalam contoh: TOTAL=8.000, JUMLAH UANG=10.000, KEMBALI=2.000 → total_amount=8000
    4. DATE & TIME - EKSTRAKSI TELITI:
        - Cari pattern: Tgl, Tanggal, Date, TGL, tgl
        - Format input bisa: DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, atau tulisan bulan (Januari, Jan, January)
        - Konversi SELALU ke YYYY-MM-DD (ISO 8601)
        - Contoh: "12/02/2026" → "2026-02-12", "02-Jan-2026" → "2026-01-02"
        - TIME: Cari "Jam", "Time", "Waktu", atau format HH:MM
        - Contoh: "Jam :10:57" → "10:57", "10.57" → "10:57"
        - Jika tidak ditemukan date/time, gunakan null
        - PASTIKAN format date valid sebelum output!
    
    5. CONFIDENCE SCORING:
        - Berikan confidence score (0.0 - 1.0) untuk setiap field
        - 0.9-1.0: Teks jelas, tidak ambigu
        - 0.7-0.9: Teks terbaca tapi ada sedikit keraguan
        - 0.5-0.7: Teks partially unclear atau ada multiple interpretasi
        - < 0.5: Teks sangat tidak jelas, hasil adalah best guess
   
        Faktor yang menurunkan confidence:
        - Teks terpotong atau tidak lengkap
        - Ada karakter yang ambigu (0 vs O, 1 vs I)
        - Multiple kemungkinan nilai
        - Field tidak ditemukan tapi di-infer



    FORMAT JSON YANG DIMINTA:
    {{
      "receipt_id": "{receipt_id}",
      "merchant_name": {{"value": "string", "confidence": float}},
      "date": {{"value": "YYYY-MM-DD or null", "confidence: float"}},
      "time": {{"value": "HH:MM or null", "confidence": float}},
      "items": [
        {{
        "name": {{"value": "string", "confidence": float}},
        "qty": {{"value": int, "confidence": float}},
        "price": {{"value": int, "confidence": float}},
        "total_price": {{"value": int, "confidence": float}},
        "category": {{"value": "string", "confidence": float}}
        }}
      ],
      "total_amount": {{"value": int, "confidence": float}}
    }}

    Hanya berikan output dalam format JSON mentah tanpa penjelasan.
    """

    try:
        logger.info(f"Sending prompt to Ollama for LLM processing for receipt ID: {receipt_id}")

        response = await custom_client.generate(
                model="gpt-oss:20b-cloud",
                prompt=prompt,
                format="json",
                options={
                    "temperature": 0.3,
                    # "num_predict": 600,
                    "top_k": 20,
                    "top_p": 0.6,
                }

            )

        try:
            response_data = json.loads(response['response'])
            scoring = determine_receipt_status(response_data)
            response_data['receipt_id'] = receipt_id

            print("--- REFINED RECEIPT START ---")
            print(response_data)
            print("--- REFINED RECEIPT END ---")

            return {
                "receipt_data": response_data,
                "status": scoring["status"],
                "low_confidence_fields": scoring["low_confidence_fields"],
                "requires_review": scoring["requires_review"]
            }

        except:
            return {"error": "failed", "receipt_id": receipt_id, "response": response}
    
    except Exception as e:
        logger.error(f"Ollama LLM processing failed for receipt ID {receipt_id}: {e}")
        return None