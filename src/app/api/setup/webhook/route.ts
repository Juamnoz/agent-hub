import { NextRequest, NextResponse } from "next/server";
import { verifyCookieToken } from "@/lib/setup-crypto";

// POST /api/setup/webhook — reenvía el payload al webhook de n8n server-side (evita CORS)
export async function POST(req: NextRequest) {
  const token = req.cookies.get("setup_auth")?.value ?? "";
  const secret = process.env.SETUP_AUTH_SECRET ?? "changeme";
  const agencyId = await verifyCookieToken(token, secret);

  if (!agencyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { agentSlug, payload } = body as { agentSlug: string; payload: unknown };

  const webhookUrls: Record<string, string> = {
    omghat: process.env.NEXT_PUBLIC_OMGHAT_WEBHOOK_URL ?? "",
    max: process.env.NEXT_PUBLIC_MAX_WEBHOOK_URL ?? "",
  };

  const target = webhookUrls[agentSlug];
  if (!target) {
    return NextResponse.json({ error: "Webhook no configurado para este agente" }, { status: 400 });
  }

  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Webhook respondió ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
