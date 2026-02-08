import pytesseract
import cv2
import numpy as np
# from PIL import Image, ImageOps, ImageEnhance
import asyncio
import logging

logger = logging.getLogger(__name__)
async def ocr_image(image_path: str) -> str:
    try:
        loop = asyncio.get_event_loop()

        def process():
            img = cv2.imread(image_path)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            img_main = cv2.min(cv2.min(img[:, :, 0], img[:, :, 1]), img[:, :, 2])
            blackhat = cv2.morphologyEx(img_main, cv2.MORPH_BLACKHAT, kernel)
            res = cv2.subtract(img_main, blackhat)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(res)
            enhanced = cv2.resize(enhanced, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            denoised = cv2.fastNlMeansDenoising(enhanced, h=10)
            thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            config = '--psm 4 --oem 3 --dpi 300'
            return pytesseract.image_to_string(thresh, lang='ind+eng', config=config)
        
        logger.info(f"Starting OCR processing for image: {image_path}")
        raw_text = await loop.run_in_executor(None, process)
        return raw_text.strip()
    except Exception as e:
        logger.error(f"OCR failed for image {image_path}: {e}")
        return ""