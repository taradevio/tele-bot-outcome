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

async def refine_receipt(raw_text: str):

    receipt_id = str(uuid.uuid4())

    examples = """
    CONTOH:
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
    """

    prompt = f"""
    Kamu adalah sistem AI ekstraksi data profesional. Gunakan contoh format berikut untuk memproses data baru.

    {examples}

    Tugas: Ubah teks OCR berantakan ini menjadi JSON yang valid.
    Bahasa: Support Bahasa Indonesia, Bahasa Inggris, dan Bahasa Jepang.

    DATA OCR:
    {raw_text}

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
                    "temperature": 0.1,
                    "num_predict": 1024,
                    "top_k": 20,
                    "top_p": 0.2
                }

            )

        try:
            response_data = json.loads(response['response'])
            response_data['receipt_id'] = receipt_id
            return response_data

        except:
            return {"error": "failed", "receipt_id": receipt_id}
    
    except Exception as e:
        logger.error(f"Ollama LLM processing failed for receipt ID {receipt_id}: {e}")
        return None