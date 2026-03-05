import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/setup-db";
import { verifyPasscode, buildCookieToken } from "@/lib/setup-crypto";

const COOKIE_NAME = "setup_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

// POST /api/setup/auth — login
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, passcode } = body as { username?: string; passcode?: string };

  if (!username?.trim() || !passcode?.trim()) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const { data, error } = await (supabase as any)
    .from("setup_agencies")
    .select("id, name, passcode_hash, salt, username")
    .ilike("username", username.trim())
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Agencia no configurada" }, { status: 503 });
  }

  const row = data as { id: string; name: string; passcode_hash: string; salt: string };
  const valid = await verifyPasscode(passcode.trim(), row.salt, row.passcode_hash);

  if (!valid) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const secret = process.env.SETUP_AUTH_SECRET ?? "changeme";
  const token = await buildCookieToken(row.id, secret);

  const res = NextResponse.json({ ok: true, agencyName: row.name });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}

// DELETE /api/setup/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
