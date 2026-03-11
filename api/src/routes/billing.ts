import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, subscriptions, agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { PLAN_LIMITS } from "../middleware/plan.js";

const billingRoute = createRouter();
billingRoute.use("*", authMiddleware);

// GET /billing/subscription
billingRoute.get("/subscription", async (c) => {
  const userId = c.get("userId") as string;

  let sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  // Si no tiene suscripción, crear una starter gratuita
  if (!sub) {
    [sub] = await db
      .insert(subscriptions)
      .values({
        userId,
        planTier: "starter",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning();
  }

  return c.json({
    id: sub.id,
    planTier: sub.planTier,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });
});

// GET /billing/usage
billingRoute.get("/usage", async (c) => {
  const userId = c.get("userId") as string;
  const planTier = c.get("planTier") as string;

  const userAgents = await db.query.agents.findMany({
    where: eq(agents.userId, userId),
  });

  const totalMessages = userAgents.reduce((s, a) => s + a.messageCount, 0);
  const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.starter;

  // Período del mes actual
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return c.json({
    agentCount: userAgents.length,
    agentLimit: limits.agents,
    messageCount: totalMessages,
    messageLimit: limits.messages,
    whatsappCount: userAgents.filter((a) => a.status === "active").length,
    whatsappLimit: limits.whatsapp,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  });
});

// PATCH /billing/subscription — Cambiar plan
billingRoute.patch(
  "/subscription",
  zValidator(
    "json",
    z.object({
      planTier: z.enum(["starter", "pro", "business", "enterprise"]),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const { planTier } = c.req.valid("json");

    // En producción: llamar a Wompi/Stripe para actualizar la suscripción
    // Por ahora actualizamos directamente la DB

    const [updatedSub] = await db
      .update(subscriptions)
      .set({ planTier, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId))
      .returning();

    await db
      .update(users)
      .set({ planTier, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return c.json({
      id: updatedSub?.id,
      planTier: updatedSub?.planTier,
      status: updatedSub?.status,
      currentPeriodEnd: updatedSub?.currentPeriodEnd,
      cancelAtPeriodEnd: updatedSub?.cancelAtPeriodEnd,
    });
  }
);

// PATCH /billing/subscription/cancel
billingRoute.patch("/subscription/cancel", async (c) => {
  const userId = c.get("userId") as string;

  // En producción: llamar a Wompi/Stripe para programar cancelación al final del período
  const [updated] = await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId))
    .returning();

  return c.json({
    id: updated?.id,
    planTier: updated?.planTier,
    status: updated?.status,
    currentPeriodEnd: updated?.currentPeriodEnd,
    cancelAtPeriodEnd: true,
  });
});

// GET /billing/invoices
billingRoute.get("/invoices", async (c) => {
  // En producción: obtener de Stripe/Wompi
  // Por ahora retornar array vacío
  return c.json([]);
});

export default billingRoute;
