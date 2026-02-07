import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bindings } from "hono/types";


const app = new Hono();

app.use(
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/charts", (c) => {
  return c.json({ message: "Charts endpoint" });
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
