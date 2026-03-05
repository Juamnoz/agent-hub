import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/setup-db";
import { generateSalt, hashPasscode } from "@/lib/setup-crypto";

export async function GET(req: NextRequest) {
  const seedSecret = process.env.SETUP_SEED_SECRET;
  if (!seedSecret) {
    return NextResponse.json({ error: "Seed deshabilitado" }, { status: 403 });
  }
  if (req.nextUrl.searchParams.get("secret") !== seedSecret) {
    return NextResponse.json({ error: "Secret incorrecto" }, { status: 403 });
  }

  const agencyName = process.env.SETUP_AGENCY_NAME ?? "Mi Agencia";
  const passcode = process.env.SETUP_INITIAL_PASSCODE;
  if (!passcode) {
    return NextResponse.json({ error: "Falta SETUP_INITIAL_PASSCODE" }, { status: 400 });
  }

  // ¿Ya existe una agencia?
  const { data: existing } = await supabase
    .from("setup_agencies")
    .select("id")
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ ok: false, message: "Ya existe una agencia. Seed omitido." });
  }

  const salt = await generateSalt();
  const passcode_hash = await hashPasscode(passcode, salt);

  const agents = [
    {
      slug: "omghat",
      name: "OMGHat",
      description: "Agente activo — listo para configurar",
      enabled: true,
      webhook_url: process.env.NEXT_PUBLIC_OMGHAT_WEBHOOK_URL ?? "",
    },
    {
      slug: "max",
      name: "Max",
      description: "Agente desactivado — pendiente de activación",
      enabled: false,
      webhook_url: process.env.NEXT_PUBLIC_MAX_WEBHOOK_URL ?? "",
    },
  ];

  const { error } = await supabase.from("setup_agencies").insert({
    name: agencyName,
    passcode_hash,
    salt,
    agents,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `Agencia "${agencyName}" creada. Elimina SETUP_SEED_SECRET y SETUP_INITIAL_PASSCODE de las env vars.`,
  });
}
