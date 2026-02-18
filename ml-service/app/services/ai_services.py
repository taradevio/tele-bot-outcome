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
    timeout=30 
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


async def refine_receipt(raw_text: str):

    receipt_id = str(uuid.uuid4())

    category_examples = get_category_examples(raw_text)

    examples = """
    CONTOH 1:
    INPUT OCR: "ALFAMART \n TGL 02-01-2026 \n INDOMIE GORENG 3.000 \n CLEAR SHAMPOO 25.000 \n TOTAL 28.000"
    OUTPUT JSON:
    {
      "receipt_id": "{receipt_id}",
      "merchant_name": "ALFAMART",
      "date": "2026-01-02",
      "items": [
        {"name": "INDOMIE GORENG", "qty": 1, "price": 3000, "total_price": 3000, "category": "Food & Beverage"},
        {"name": "CLEAR SHAMPOO", "qty": 1, "price": 25000, "total_price": 25000, "category": "Shopping"}
      ],
      "total_amount": 28000
    }

     CONTOH 2:
    INPUT OCR: "Cafe Eatery \n TGL 20-02-2025 \n Indomie Goreng 3.000 \n Cafe Latte 25.000 \n JUMLAH UANG 30.000 \n KEMBALI 2.000 TOTAL 28.000"
    OUTPUT JSON:
    {
      "receipt_id": "{receipt_id}",
      "merchant_name": "Cafe Eatery",
      "date": "2026-02-20",
      "items": [
        {"name": "Indomie Goreng", "qty": 1, "price": 3000, "total_price": 3000, "category": "Food & Beverage"},
        {"name": "Cafe Latte", "qty": 1, "price": 25000, "total_price": 25000, "category": "Shopping"}
      ],
      "total_amount": 28000
    }
    """

    prompt = f"""
    Kamu adalah sistem AI ekstraksi data profesional. Gunakan contoh format berikut untuk memproses data baru.

    {examples}

    Tugas: Ubah teks OCR berantakan ini menjadi JSON yang valid.
    Bahasa: Support Bahasa Indonesia, Bahasa Inggris, dan Bahasa Jepang.

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
    5. KATEGORI: Pilih satu yang paling relevan: [Food & Beverage, Shopping, Transport, Bills, Health, Entertainment, Others].

    VALIDASI WAJIB:
    - total_amount HARUS sama dengan sum(total_price dari semua items)
    - Kalau ada "JUMLAH UANG" atau "KEMBALI", jangan pakai itu sebagai total_amount
    - total_amount adalah subtotal belanja, bukan uang dibayar/diterima

    Think step by step:
    1. Identifikasi mana TOTAL belanja (bukan JUMLAH UANG/KEMBALI)
    2. Hitung sum dari semua items
    3. Pastikan total_amount = sum(items) = TOTAL belanja (bukan JUMLAH UANG)


    FORMAT JSON YANG DIMINTA:
    {{
      "receipt_id": "{receipt_id}",
      "merchant_name": "string",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "items": [
        {{"name": "string", "qty": int, "price": int, "total_price": int, "category": "string"}}
      ],
      "total_amount": int
    }}

    PANDUAN KATEGORI: [Food & Beverage, Shopping, Transport, Bills, Health, Entertainment, Others]
    Hanya berikan output dalam format JSON mentah tanpa penjelasan.
    """

    try:
        logger.info(f"Sending prompt to Ollama for LLM processing for receipt ID: {receipt_id}")

        response = await custom_client.generate(
                model="gpt-oss:120b-cloud",
                prompt=prompt,
                format="json",
                options={
                    "temperature": 0.2,
                    "num_predict": 1024,
                    "top_k": 25,
                    "top_p": 0.6
                }

            )

        try:
            response_data = json.loads(response['response'])
            response_data['receipt_id'] = receipt_id

            # print("--- REFINED RECEIPT START ---")
            # print(response_data)
            # print("--- REFINED RECEIPT END ---")

            return response_data

        except:
            return {"error": "failed", "receipt_id": receipt_id}
    
    except Exception as e:
        logger.error(f"Ollama LLM processing failed for receipt ID {receipt_id}: {e}")
        return None