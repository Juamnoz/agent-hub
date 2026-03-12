import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/setup-db";

export const runtime = "nodejs";

const BUCKET = "agent-catalogs";
const MAX_MB = 10;

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: `El archivo supera ${MAX_MB}MB. Comprime el PDF antes de subirlo.` }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
  }

  const path = `dashboard/${agentId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.pdf`;
  const bytes = await file.arrayBuffer();

  const { error } = await (supabase as any).storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = (supabase as any).storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl, name: file.name });
}
