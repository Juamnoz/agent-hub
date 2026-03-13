import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";

import authRoute from "./routes/auth.js";
import agentsRoute from "./routes/agents.js";
import faqsRoute from "./routes/faqs.js";
import productsRoute from "./routes/products.js";
import whatsappRoute from "./routes/whatsapp.js";
import conversationsRoute from "./routes/conversations.js";
import reservationsRoute from "./routes/reservations.js";
import ordersRoute from "./routes/orders.js";
import crmRoute from "./routes/crm.js";
import analyticsRoute from "./routes/analytics.js";
import trainRoute from "./routes/train.js";
import billingRoute from "./routes/billing.js";
import webhooksRoute from "./routes/webhooks.js";
import calendarRoute from "./routes/calendar.js";

const app = new Hono();

// ── Middleware global ──────────────────────────────────────────────────────────

app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("*", logger());

// ── Health check ───────────────────────────────────────────────────────────────

app.get("/", (c) => c.json({ status: "ok", service: "LISA API", version: "1.0.0" }));
app.get("/health", (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

// ── Webhooks (sin prefijo /v1, sin auth JWT) ───────────────────────────────────

app.route("/webhooks", webhooksRoute);

// ── API v1 ────────────────────────────────────────────────────────────────────

const v1 = new Hono();

v1.route("/auth", authRoute);
v1.route("/agents", agentsRoute);
v1.route("/agents", faqsRoute);
v1.route("/agents", productsRoute);
v1.route("/agents", whatsappRoute);
v1.route("/agents", conversationsRoute);
v1.route("/agents", reservationsRoute);
v1.route("/agents", ordersRoute);
v1.route("/agents", crmRoute);
v1.route("/agents", analyticsRoute);
v1.route("/agents", trainRoute);
v1.route("/agents", calendarRoute);
v1.route("/integrations", calendarRoute);
v1.route("/billing", billingRoute);

// Conversaciones sin prefix /agents/:id (GET /conversations/:id)
v1.route("/", conversationsRoute);

app.route("/v1", v1);

// ── Error handler global ───────────────────────────────────────────────────────

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error("[error]", err);
  return c.json({ message: "Error interno del servidor" }, 500);
});

app.notFound((c) =>
  c.json({ message: `Ruta no encontrada: ${c.req.method} ${c.req.path}` }, 404)
);

// ── Servidor ───────────────────────────────────────────────────────────────────

const port = Number(process.env.PORT ?? 3001);

console.log(`🚀 LISA API corriendo en http://localhost:${port}`);

serve({ fetch: app.fetch, port });
