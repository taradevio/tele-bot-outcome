import cv2
import numpy as np
from rapidocr import RapidOCR
import asyncio
import logging

logger = logging.getLogger(__name__)
engine = RapidOCR(config_path="default_rapidocr.yaml")

def deskew(image):
    coords = np.column_stack(np.where(image > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    

async def ocr_image(image_path: str) -> str:
    try:
        loop = asyncio.get_event_loop()

        def process():
            img = cv2.imread(image_path)
            if img is None: return ""
            # gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = img[:, :, 1]
            # bright = cv2.convertScaleAbs(gray, alpha=1.4, beta=40)
            denoised = cv2.fastNlMeansDenoising(gray, h=10)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(denoised)
            _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            binary = deskew(binary)
            # upscaled = cv2.resize(enhanced, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

            result = engine(binary)

            if result and hasattr(result, 'txts'):
                #  print("--- OCR RESULT START ---")
                 print(result.txts)
                #  print("--- OCR RESULT END ---")
                 return "\n".join(result.txts)
            return "No text found"

        logger.info(f"Starting OCR processing for image: {image_path}")
        raw_text = await loop.run_in_executor(None, process)

        return raw_text
    except Exception as e:
        logger.error(f"OCR failed for image {image_path}: {e}")
        return ""