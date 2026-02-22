import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import supabaseClient from "./middleware/auth";
import { verifyTelegramHash } from "./utils/verifyTelegram";
type Env = {
  Bindings: {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    ML_SERVICE: string;
    JWT_SECRET: string;
    BOT_TOKEN: string;
  };
};

const app = new Hono<Env>();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:8000",
      "https://struktly.pages.dev",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.post("/process-receipt", async (c) => {
  const db = supabaseClient(c.env);

  const payloadData = await c.req.json();
  const telegramUser = payloadData.user;

  console.log(
    `Received receipt data for receipt: ${payloadData.receipt.receipt_id}`,
  );

  try {
    const { data: userData, error: userError } = await db
      .from("users")
      .upsert(
        {
          telegram_id: telegramUser.telegram_id,
          username: telegramUser.user_name,
          first_name: telegramUser.first_name,
        },
        {
          onConflict: "telegram_id",
        },
      )
      .select("id")
      .single();

    if (userError) {
      console.error("Error upserting user:", userError);
      return c.json(
        { status: "Error upserting user", error: userError.message },
        500,
      );
    }

    const dateStr = payloadData.receipt.date;
    const timeStr = payloadData.receipt.time;

    const safeTime = timeStr ? timeStr : '00:00:00';

    const transactionDate = new Date(`${dateStr}T${safeTime}`).toISOString();

    const statusValid = ["PENDING", "VERIFIED", "ACTION_REQUIRED", "FAILED"]
    const status = statusValid.includes(payloadData.receipt.status) ? payloadData.receipt.status : "PENDING";

    const { data: receiptData, error: receiptError } = await db
      .from("receipts")
      .insert({
        user_id: userData?.id,
        store_name: payloadData.receipt.merchant_name,
        total_amount: payloadData.receipt.total_amount,
        transaction_date: transactionDate,
        status: status,
        low_confidence_fields: payloadData.receipt.low_confidence_fields
      })
      .select("id")
      .single();

    if (receiptData) {
      console.log(
        `Inserted receipt with ID: ${receiptData.id} for user ID: ${userData?.id}`,
      );

      // const parseReceiptItems = JSON.parse(payloadData.receipt)

      const receiptItems = payloadData.receipt.items.map((item: any) => ({
        receipt_id: receiptData.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        total_price: item.total_price,
        category: item.category,
      }));

      // const receipt_items = payloadData.receipt;
      console.log("ReceiptItems:", receiptItems);

      const { error: itemsError } = await db
        .from("receipt_items")
        .insert(receiptItems);

      if (itemsError) {
        console.error("Error inserting receipt items:", itemsError);
        return c.json(
          {
            status: "Error inserting receipt items",
            error: itemsError.message,
          },
          500,
        );
      }
      console.log(
        `Inserted ${receiptItems.length} items for receipt ID: ${receiptData.id}`,
      );
    }

    if (receiptError) {
      console.error("Error inserting receipt:", receiptError);
      return c.json(
        { status: "Error inserting receipt", error: receiptError.message },
        500,
      );
    }

    // use below when ML service needs to be called from backend
    // if (data) {
    //   c.executionCtx.waitUntil(
    //     fetch(`${c.env.ML_SERVICE}/process-receipt`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         ...receiptData,
    //         receipt: {
    //           ...receiptData.receipt,
    //           receipt_id: data.id,
    //         },
    //       }),
    //     }),
    //   );
    // }

    return c.json({
      success: true,
      status: "Processing started for receipt.",
      receipt_id: receiptData?.id || null,
      message: "Receipt data received successfully.",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return c.json(
      { status: "Unexpected error", error: (error as Error).message },
      500,
    );
  }
});

app.post(
  "/api/user-data",
  // async (c, next) => {
  //   const jwtMiddleware = jwt({
  //     secret: c.env.JWT_SECRET,
  //     alg: "HS256",
  //   });

  //   return jwtMiddleware(c, next);
  // },
  async (c) => {
    const db = supabaseClient(c.env);
    // const payload = c.get("jwtPayload");

    const { userData } = await c.req.json();

    const isValid = verifyTelegramHash(userData, c.env.BOT_TOKEN);
    if (!isValid) return c.json({ error: "Invalid telegram hash" }, 403);

    const params = new URLSearchParams(userData);
    const userJson = params.get("user");
    const telegramUser = JSON.parse(userJson || "{}");
    const telegram_id = telegramUser.id;

    const { data: userProfile, error: userError } = await db
      .from("users")
      .select("id, first_name")
      .eq("telegram_id", telegram_id)
      .single();

    if (userError) return c.json({ error: userError.message }, 500);

    // const userId = c.req.query("user_id")
    // const userId = telegramUser.user_id;

    const { data: userReceipts, error: errorReceipts } = await db
      .from("receipts")
      .select(
        "id, store_name, total_amount, transaction_date, receipt_items (id, name, qty, price, total_price, category, created_at)",
      )
      .eq("user_id", userProfile.id);

    if (errorReceipts) return c.json({ error: errorReceipts.message }, 500);
    console.log(errorReceipts);

    console.log(userProfile, userReceipts);

    return c.json({ userProfile, userReceipts });
  },
);

app.post("/login", async (c) => {});

app.get("/charts", (c) => {
  return c.json({ message: "Charts endpoint" });
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
