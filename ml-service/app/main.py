import os
import logging
import httpx
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks
from telegram import Update
from telegram.request import HTTPXRequest
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv
from datetime import datetime
from pydantic import BaseModel

from app.services.ocr_services import ocr_image
from app.services.ai_services import refine_receipt

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8787")

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)


class ReceiptData(BaseModel):
    receipt_id: str
    merchant_name: str
    items: list
    date: str
    price: float
    time: str
    total_amount: float
    category: str

class TelegramUser(BaseModel):
    telegram_id: int
    first_name: str
    user_name: str

class DataRequest(BaseModel):
    receipt: ReceiptData
    user: TelegramUser

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
        # asyncio.create_task(update.message.reply_text(f"OCR Result:\n{raw_text}"))
        
        asyncio.create_task(background_refine(update, raw_text, file_path))
    
async def background_refine(update, raw_text, file_path):
    refined_data = await refine_receipt(raw_text)

    if not refined_data:
        await update.message.reply_text('Sorry, I could not refine the receipt data. Please try again.')
        if os.path.exists(file_path):
            os.remove(file_path)
        return

    user = update.effective_user
    telegram_id = user.id
    first_name = user.first_name or "NoFirstName"
    user_name = user.username or "NoUsername"

    payload = {
        "receipt": refined_data,
        "user": {
            "telegram_id": telegram_id,
            "first_name": first_name,
            "user_name": user_name
        }
    }

    logger.info(f"Received receipt image from user: {first_name} (ID: {telegram_id}, Username: {user_name})")

    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Sending {payload} to backend for receipt ID: {refined_data.get('receipt_id', 'N/A')}")
            response = await client.post(
                f"{BACKEND_URL}/process-receipt",
                json=payload,
                timeout=20.0
            )

            if response.status_code == 200:
                hono_data = response.json()
                db_id = hono_data.get("receipt_id", "N/A")
                logger.info(f"Successfully stored receipt data in backend with ID: {db_id}")
            else:
                logger.error(f"Failed to store receipt data in backend. Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            logger.error(f"Error sending receipt data to backend: {e}")

    if refined_data:
        store_name = refined_data.get("merchant_name", "N/A")
        items = refined_data.get("items", [])
        date = refined_data.get("date", "N/A")
        price = refined_data.get("price", 0)
        time = refined_data.get("time", "N/A")
        total_amount = refined_data.get("total_amount", 0)
        category = refined_data.get("category", "N/A")
        receipt_id = refined_data.get("receipt_id", "N/A")

    item_list = ""
    for item in items:
        name = item.get("name", "N/A")
        qty = item.get("qty", 0)
        price = item.get("price", 0)
        total = item.get("total_price", 0)
        category = item.get("category", "N/A")
        item_list += f"• {name} x{qty} @{price:,} - Rp {total:,}\n"
        
    try:
        clean_date = datetime.strptime(date, "%Y-%m-%d").strftime("%d %b %Y")
    except:
        clean_date = date
        
    caption = (
            f"🏪 *STORE:* {store_name.upper()}\n"
            f"📅 *DATE:* {clean_date} | {time}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"🛒 *PURCHASED ITEMS:*\n"
            f"{item_list}"
            f"───────────────\n"
            f"💰 *TOTAL AMOUNT:* *Rp {total_amount:,}*\n"
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



# we'll use below when requests coming from backend
# @app.post("/process-receipt")
# async def process_receipt(payload: DataRequest, background_tasks: BackgroundTasks):
#     logger.info(f"User Info - ID: {payload.user.telegram_id}, Name: {payload.user.first_name}, Username: {payload.user.user_name}")
#     logger.info(f"Received receipt data for receipt: {payload.receipt.receipt_id}")

#     background_tasks.add_task(background_refine, payload)
#     return {"status": "Processing started for receipt."}