import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/setup-db";
import { verifyCookieToken } from "@/lib/setup-crypto";

export const runtime = "nodejs";

const ALLOWED_BUCKETS: Record<string, { types: string[]; maxMB: number }> = {
  "agent-catalogs": { types: [".pdf"], maxMB: 50 },
  "agent-images": { types: [".jpg", ".jpeg", ".png", ".webp", ".gif"], maxMB: 20 },
};

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("setup_auth")?.value ?? "";
    const secret = process.env.SETUP_AUTH_SECRET ?? "changeme";
    const agencyId = await verifyCookieToken(token, secret);
    if (!agencyId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { bucket, agentSlug, fileName, contentType, fileSize } = body;

    const bucketConfig = ALLOWED_BUCKETS[bucket];
    if (!bucketConfig) return NextResponse.json({ error: "Bucket no válido" }, { status: 400 });
    if (!agentSlug || !fileName) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

    const ext = "." + (fileName.split(".").pop() ?? "").toLowerCase();
    if (!bucketConfig.types.includes(ext)) {
      return NextResponse.json({ error: `Formato no permitido en ${bucket}` }, { status: 400 });
    }
    if (fileSize && fileSize > bucketConfig.maxMB * 1024 * 1024) {
      return NextResponse.json({ error: `El archivo supera ${bucketConfig.maxMB}MB` }, { status: 400 });
    }

    const path = `${agencyId}/${agentSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

    const { data, error } = await (supabase as any).storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: urlData } = (supabase as any).storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      publicUrl: urlData.publicUrl,
      contentType: contentType ?? "application/octet-stream",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error interno: ${msg}` }, { status: 500 });
  }
}
