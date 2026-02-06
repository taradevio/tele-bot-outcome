import ollama
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

async def refine_receipt(raw_text: str):
    prompt = f"""
    Kamu adalah sistem AI ekstraksi data profesional. 
    Tugas: Ubah teks OCR berantakan ini menjadi JSON yang valid.
    Bahasa: Support Bahasa Indonesia, Bahasa Inggris, dan Bahasa Jepang.

    DATA OCR:
    {raw_text}

    FORMAT JSON YANG DIMINTA:
    {{
      "merchant_name": "string",
      "date": "YYYY-MM-DD",
      "time: "HH:MM",
      "items": [
        {{"name": "string", "qty": int, "price": int, "total_price": int}}
      ],
      "total_amount": int
    }}

    Hanya berikan output dalam format JSON mentah tanpa penjelasan.
    """

    try:
        logger.info("Sending prompt to Ollama for LLM processing.")
        loop = asyncio.get_event_loop()


        response = await loop.run_in_executor(
            None,
            lambda: ollama.generate(
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
        )

        return json.loads(response['response'])
    
    except Exception as e:
        logger.error(f"Ollama LLM processing failed: {e}")
        return None