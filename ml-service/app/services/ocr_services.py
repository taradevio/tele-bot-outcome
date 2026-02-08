import pytesseract
import cv2
import numpy as np
# from PIL import Image, ImageOps, ImageEnhance
import asyncio
import logging
# from paddleocr import PaddleOCR
logger = logging.getLogger(__name__)

# ocr = PaddleOCR(use_angle_cls=True, lang='en')

async def ocr_image(image_path: str) -> str:
    try:
        loop = asyncio.get_event_loop()

        def process():
           img = cv2.imread(image_path)
           if img is None: return ""
           img = cv2.resize(img, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
           
           gray = img[:, :, 1]
           alpha = 1.8 # Contrast
           beta = -60  # Brightness
           adjusted = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
           _, thresh = cv2.threshold(adjusted, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
           config = '--psm 6 --oem 3'
           return pytesseract.image_to_string(thresh, lang='ind+eng', config=config)
       
        logger.info(f"Starting OCR processing for image: {image_path}")
        raw_text = await loop.run_in_executor(None, process)
        return raw_text.strip()
    except Exception as e:
        logger.error(f"OCR failed for image {image_path}: {e}")
        return ""


# def ocr_image(img_path):
#     try:
#         result = ocr.predict(img_path, cls=True)
        
#         # Check kalo result kosong atau None
#         if not result or result[0] is None:
#             return ""

#         lines = []
#         for res in result:
#             for line in res:
#                 text = line[1][0] # Ambil teksnya
#                 confidence = line[1][1] # Ambil tingkat keyakinannya
                
#                 # Filter: kalo confidence di bawah 0.5, skip aja biar gak jadi sampah ke AI
#                 if confidence > 0.5:
#                     lines.append(text)

#         return " ".join(lines)
    
#     except Exception as e:
#         print(f"PaddleOCR Error: {e}")
#         return ""