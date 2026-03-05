import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/setup-db";
import { verifyCookieToken } from "@/lib/setup-crypto";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("setup_auth")?.value ?? "";
  const secret = process.env.SETUP_AUTH_SECRET ?? "changeme";
  const agencyId = await verifyCookieToken(token, secret);

  if (!agencyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await (supabase as any)
    .from("setup_agencies")
    .select("name, agents")
    .eq("id", agencyId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Agencia no encontrada" }, { status: 404 });
  }

  const row = data as { name: string; agents: unknown[] };
  return NextResponse.json({ agencyName: row.name, agents: row.agents });
}
