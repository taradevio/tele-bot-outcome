import pytesseract
from PIL import Image, ImageOps, ImageEnhance
import asyncio
import logging

logger = logging.getLogger(__name__)
async def ocr_image(image_path: str) -> str:
    try:
        img = Image.open(image_path)
        img = ImageOps.grayscale(img)
        enchancer = ImageEnhance.Contrast(img)
        img = enchancer.enhance(2.0)
        img.thumbnail((2000, 2000))
        loop = asyncio.get_event_loop()
        config = '--psm 6 --oem 3'

        logger.info(f"Starting OCR on image: {image_path}")
        raw_text = await loop.run_in_executor(
            None,
            lambda: pytesseract.image_to_string(img, lang='ind+eng', config=config)
        )

        return raw_text.strip()
    except Exception as e:
        logger.error(f"OCR failed for image {image_path}: {e}")
        return ""