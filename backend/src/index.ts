import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import supabaseClient from "./middleware/auth";

type Env = {
  Bindings: {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    ML_SERVICE: string;
    JWT_SECRET: string;
  };
};

const app = new Hono<Env>();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:8000"],
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

    const { data: receiptData, error: receiptError } = await db
      .from("receipts")
      .insert({
        user_id: userData?.id,
        store_name: payloadData.receipt.merchant_name,
        total_amount: payloadData.receipt.total_amount,
        transaction_date: payloadData.receipt.date || new Date().toISOString(),
      })
      .select("id")
      .single();

    if (receiptData) {
      console.log(
        `Inserted receipt with ID: ${receiptData.id} for user ID: ${userData?.id}`,
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

app.get(
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

    const telegram_id = c.req.query("telegram_id");

    const { data: userData, error: userError } = await db
      .from("users")
      .select("id, first_name")
      .eq("telegram_id", telegram_id)
      .single();

    if (userError) return c.json({ error: userError.message }, 500);

    const userId = c.req.query("user_id")

    const {data: userReceipts, error: errorReceipts} = await db
      .from("receipts")
      .select("store_name, total_amount")
      .eq("user_id", userId)
      .single()

    if(errorReceipts) return c.json({error: errorReceipts.message}, 500)

    return c.json({userData, userReceipts});
  },
);


app.post("/login", async (c) => {

})

app.get("/charts", (c) => {
  return c.json({ message: "Charts endpoint" });
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
