import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/setup-db";
import { verifyCookieToken } from "@/lib/setup-crypto";

export const runtime = "nodejs";

const BUCKET = "agent-images";
const MAX_MB = 5;

export async function POST(req: NextRequest) {
  const token = req.cookies.get("setup_auth")?.value ?? "";
  const secret = process.env.SETUP_AUTH_SECRET ?? "changeme";
  const agencyId = await verifyCookieToken(token, secret);
  if (!agencyId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const agentSlug = formData.get("agentSlug") as string | null;

  if (!file || !agentSlug) {
    return NextResponse.json({ error: "Archivo y agentSlug requeridos" }, { status: 400 });
  }

  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `El archivo supera ${MAX_MB}MB` }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG o WebP" }, { status: 400 });
  }

  const path = `${agencyId}/${agentSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await (supabase as any).storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = (supabase as any).storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
