import { Hono } from "hono";
import { cors } from "hono/cors";
import supabaseClient from "./middleware/auth";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
};


const app = new Hono();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.post("/process-receipt", async (c) => {
  const db = supabaseClient(c.env as Env);

  


})

app.get("/charts", (c) => {
  return c.json({ message: "Charts endpoint" });
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
