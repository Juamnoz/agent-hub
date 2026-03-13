import { createRouter } from "../types.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const calendarRoute = createRouter();

const CALCOM_API_URL = process.env.CALCOM_API_URL ?? "https://api.cal.com/v1";
const CALCOM_CLIENT_ID = process.env.CALCOM_CLIENT_ID ?? "";
const CALCOM_CLIENT_SECRET = process.env.CALCOM_CLIENT_SECRET ?? "";
const CALCOM_REDIRECT_URI = process.env.CALCOM_REDIRECT_URI ?? "";

// ── Helper: obtener agente verificando ownership ───────────────────────────────

async function getAgent(agentId: string, userId: string, role: string) {
  if (role === "superadmin") {
    return db.query.agents.findFirst({ where: eq(agents.id, agentId) });
  }
  return db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
}

// ── Helper: llamar Cal.com API ─────────────────────────────────────────────────

async function calcomFetch(path: string, accessToken: string, options: RequestInit = {}) {
  const res = await fetch(`${CALCOM_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ── GET /integrations/calcom/connect?agentId=xxx ───────────────────────────────
// Genera URL OAuth de Cal.com y redirige

calendarRoute.get("/integrations/calcom/connect", authMiddleware, async (c) => {
  const agentId = c.req.query("agentId");
  if (!agentId) return c.json({ message: "agentId requerido" }, 400);

  const userId = c.get("userId") as string;
  const role = c.get("role") as string;

  const agent = await getAgent(agentId, userId, role);
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const params = new URLSearchParams({
    client_id: CALCOM_CLIENT_ID,
    redirect_uri: CALCOM_REDIRECT_URI,
    response_type: "code",
    scope: "READ_BOOKING,READ_EVENT_TYPE,READ_PROFILE",
    state: agentId,
  });

  return c.redirect(`https://app.cal.com/oauth/authorize?${params.toString()}`);
});

// ── GET /integrations/calcom/callback?code=xxx&state=agentId ──────────────────
// Recibe el code de Cal.com, intercambia por tokens y guarda en DB
// Nota: esta ruta es pública (no requiere authMiddleware) porque viene de Cal.com

calendarRoute.get("/integrations/calcom/callback", async (c) => {
  const code = c.req.query("code");
  const agentId = c.req.query("state");
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

  if (!code || !agentId) {
    return c.redirect(`${frontendUrl}/agents/${agentId}?cal=error&reason=missing_params`);
  }

  try {
    // Intercambiar code por tokens
    const tokenRes = await fetch("https://app.cal.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CALCOM_CLIENT_ID,
        client_secret: CALCOM_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: CALCOM_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[calcom/callback] token error:", err);
      return c.redirect(`${frontendUrl}/agents/${agentId}?cal=error&reason=token_exchange`);
    }

    const { access_token, refresh_token } = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
    };

    // Obtener perfil del usuario Cal.com
    const profile = await calcomFetch("/me", access_token) as { username?: string; email?: string };
    const calUsername = profile.username ?? profile.email ?? "";

    // Guardar en DB
    await db
      .update(agents)
      .set({
        calAccessToken: access_token,
        calRefreshToken: refresh_token,
        calUsername,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agentId));

    return c.redirect(`${frontendUrl}/agents/${agentId}/settings?cal=connected`);
  } catch (err) {
    console.error("[calcom/callback] error:", err);
    return c.redirect(`${frontendUrl}/agents/${agentId}?cal=error&reason=server_error`);
  }
});

// ── Rutas protegidas por auth ──────────────────────────────────────────────────

calendarRoute.use("/agents/*", authMiddleware);

// GET /agents/:id/calendar/event-types
calendarRoute.get("/:id/calendar/event-types", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("id");

  const agent = await getAgent(agentId, userId, role);
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);
  if (!agent.calAccessToken) return c.json({ message: "Calendario no conectado" }, 400);

  const data = await calcomFetch("/event-types", agent.calAccessToken) as { event_types: unknown[] };
  return c.json(data.event_types ?? []);
});

// POST /agents/:id/calendar/event-type
// body: { eventTypeId: string }
calendarRoute.post("/:id/calendar/event-type", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("id");
  const body = await c.req.json() as { eventTypeId: string };

  if (!body.eventTypeId) return c.json({ message: "eventTypeId requerido" }, 400);

  const agent = await getAgent(agentId, userId, role);
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);
  if (!agent.calAccessToken) return c.json({ message: "Calendario no conectado" }, 400);

  // Obtener detalles del event type para extraer el booking URL
  const data = await calcomFetch(`/event-types/${body.eventTypeId}`, agent.calAccessToken) as {
    event_type?: { slug?: string };
  };
  const slug = data.event_type?.slug ?? body.eventTypeId;
  const calBookingUrl = `https://cal.com/${agent.calUsername}/${slug}`;

  const whereClause = role === "superadmin"
    ? eq(agents.id, agentId)
    : and(eq(agents.id, agentId), eq(agents.userId, userId));

  const [updated] = await db
    .update(agents)
    .set({ calEventTypeId: String(body.eventTypeId), calBookingUrl, updatedAt: new Date() })
    .where(whereClause!)
    .returning();

  return c.json({ calEventTypeId: updated.calEventTypeId, calBookingUrl: updated.calBookingUrl });
});

// GET /agents/:id/calendar/bookings?from=ISO&to=ISO
calendarRoute.get("/:id/calendar/bookings", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("id");
  const from = c.req.query("from") ?? new Date().toISOString().split("T")[0];
  const to = c.req.query("to");

  const agent = await getAgent(agentId, userId, role);
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);
  if (!agent.calAccessToken) return c.json({ message: "Calendario no conectado" }, 400);

  const params = new URLSearchParams({ dateFrom: from });
  if (to) params.set("dateTo", to);
  if (agent.calEventTypeId) params.set("eventTypeId", agent.calEventTypeId);

  const data = await calcomFetch(`/bookings?${params.toString()}`, agent.calAccessToken) as {
    bookings: unknown[];
  };
  return c.json(data.bookings ?? []);
});

// POST /agents/:id/calendar/disconnect
calendarRoute.post("/:id/calendar/disconnect", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("id");

  const agent = await getAgent(agentId, userId, role);
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const whereClause = role === "superadmin"
    ? eq(agents.id, agentId)
    : and(eq(agents.id, agentId), eq(agents.userId, userId));

  await db
    .update(agents)
    .set({
      calAccessToken: null,
      calRefreshToken: null,
      calEventTypeId: null,
      calBookingUrl: null,
      calUsername: null,
      updatedAt: new Date(),
    })
    .where(whereClause!);

  return c.json({ message: "Calendario desconectado" });
});

export default calendarRoute;
