import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from telegram import Update
from telegram.request import HTTPXRequest
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv

from app.services.ocr_services import ocr_image
from app.services.ai_services import refine_receipt

load_dotenv()

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('Hello! Send me a receipt image and I will extract the text for you.')

async def handle_receipt_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('Processing your receipt image...')
    photo_file = await update.message.photo[-1].get_file()
    file_path = f"temp_receipt_{photo_file.file_id}.jpg"
    await photo_file.download_to_drive(file_path)

    await update.message.reply_text('Performing OCR on the image...')
    raw_text = await ocr_image(file_path)

    if not raw_text:
        await update.message.reply_text('Sorry, the OCR process failed. Please try again with a clearer image.')
    else:
        await update.message.reply_text("Refining extracted data...")
        
        refined_data = await refine_receipt(raw_text)

        if refined_data:
            store_name = refined_data.get("merchant_name", "N/A")
            items = refined_data.get("items", [])
            date = refined_data.get("date", "N/A")
            price = refined_data.get("price", 0)
            time = refined_data.get("time", "N/A")
            total_amount = refined_data.get("total_amount", 0)

        item_list = ""
        for item in items:
            name = item.get("name", "N/A")
            qty = item.get("qty", 0)
            price = item.get("price", 0)
            total = item.get("total_price", 0)
            item_list += f"• {name} x{qty} @{price:,} - Rp {total:,}\n"
        
        caption = (
               f"🏪 *Store:* {store_name}\n"
               f"📅 *Date:* {date} {time}\n"
               f"🛒 *Items:* \n{item_list}"
               f"───────────────\n"
               f"💰 *Total Amount:* Rp {total_amount:,}\n"
            )
        
        await update.message.reply_text(caption, parse_mode='Markdown')
    
    if os.path.exists(file_path):
        os.remove(file_path)



@asynccontextmanager
async def lifespan(app: FastAPI):
    request_config = HTTPXRequest(
        connect_timeout=20.0,
        read_timeout=60.0
    )
    ocr_app = Application.builder().token(os.getenv("TELEGRAM_BOT_TOKEN")).request(request_config).build()
    ocr_app.add_handler(CommandHandler("start", start_command))
    ocr_app.add_handler(MessageHandler(filters.PHOTO, handle_receipt_photo))

    await ocr_app.initialize()
    await ocr_app.start()
    await ocr_app.updater.start_polling()

    app.state.ocr_app = ocr_app
    logger.info("Telegram bot started.")

    yield

    await ocr_app.updater.stop()
    await ocr_app.stop()
    await ocr_app.shutdown()


app = FastAPI(lifespan=lifespan)
@app.get("/")
async def root():
    return {"message": "OCR Telegram Bot is running."}