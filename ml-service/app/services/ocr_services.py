import cv2
import numpy as np
from rapidocr import RapidOCR
import asyncio
import logging

logger = logging.getLogger(__name__)
engine = RapidOCR()


# def process(image_path: str) -> str:
#     img = cv2.imread(image_path)
#     if img is None: 
#         return ""
    
#     # Grayscale proper
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
#     # Denoise (reduce grain/noise)
#     denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    
#     # CLAHE (sudah ada)
#     clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
#     enhanced = clahe.apply(denoised)
    
#     # Sharpening (edge enhancement)
#     kernel = np.array([[-1,-1,-1], 
#                        [-1, 9,-1], 
#                        [-1,-1,-1]])
#     sharpened = cv2.filter2D(enhanced, -1, kernel)
    
#     # Binarization (threshold) - optional tapi membantu
#     _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
#     # Upscale (RapidOCR lebih baik dengan text lebih besar)
#     scale = 1.5
#     upscaled = cv2.resize(binary, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
#     result = engine(upscaled)
    
#     if result and hasattr(result, 'txts'):
#         return "\n".join(result.txts)
#     return "No text found"

# # Detect skew angle dan rotate
# def deskew(image):
#     coords = np.column_stack(np.where(image > 0))
#     angle = cv2.minAreaRect(coords)[-1]
    
#     if angle < -45:
#         angle = -(90 + angle)
#     else:
#         angle = -angle
    
#     if abs(angle) > 0.5:  # Hanya rotate kalau significant
#         (h, w) = image.shape[:2]
#         center = (w // 2, h // 2)
#         M = cv2.getRotationMatrix2D(center, angle, 1.0)
#         rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
#         return rotated
#     return image

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