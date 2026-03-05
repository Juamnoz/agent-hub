import { NextRequest, NextResponse } from "next/server";
import { verifyCookieToken } from "@/lib/setup-crypto";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("setup_auth")?.value ?? "";
  const secret = process.env.SETUP_AUTH_SECRET ?? "changeme";
  const agencyId = await verifyCookieToken(token, secret);
  if (!agencyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let text = "";

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    text = buffer.toString("utf-8");
  } else if (name.endsWith(".pdf")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    text = result.text;
  } else if (name.endsWith(".docx")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    return NextResponse.json({ error: "Formato no soportado. Usa .txt, .pdf o .docx" }, { status: 400 });
  }

  return NextResponse.json({ text: text.trim() });
}
