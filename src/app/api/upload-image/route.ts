import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/setup-db";

export const runtime = "nodejs";

const BUCKET = "agent-images";
const MAX_MB = 5;

export async function POST(req: NextRequest) {
  // Verify JWT from Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const agentId = formData.get("agentId") as string | null;

  if (!file || !agentId) {
    return NextResponse.json({ error: "Archivo y agentId requeridos" }, { status: 400 });
  }

  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `El archivo supera ${MAX_MB}MB` }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG o WebP" }, { status: 400 });
  }

  const path = `rooms/${agentId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await (supabase as any).storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = (supabase as any).storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
