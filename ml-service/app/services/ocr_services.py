import cv2
import numpy as np
from rapidocr import RapidOCR
import asyncio
import logging

logger = logging.getLogger(__name__)
engine = RapidOCR()

# ocr = PaddleOCR(use_angle_cls=True, lang='en')


async def ocr_image(image_path: str) -> str:
    try:
        loop = asyncio.get_event_loop()

        def process():
            img = cv2.imread(image_path)
            if img is None: return ""
            gray = img[:, :, 1]
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)

            result = engine(enhanced)

            if result and hasattr(result, 'txts'):
                #  print("--- OCR RESULT START ---")
                 print(result.txts)
                #  print("--- OCR RESULT END ---")
                 return "\n".join(result.txts)
            return "No text found"

        logger.info(f"Starting OCR processing for image: {image_path}")
        raw_text = await loop.run_in_executor(None, process)

        # print("--- RAW OCR START ---")
        # print(raw_text)
        # print("--- RAW OCR END ---")
        # logging.info(f"Raw OCR Output: {raw_text}")

        return raw_text
    except Exception as e:
        logger.error(f"OCR failed for image {image_path}: {e}")
        return ""