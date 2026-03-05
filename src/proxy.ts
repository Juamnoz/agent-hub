import { NextRequest, NextResponse } from "next/server";

async function signToken(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyCookieToken(token: string, secret: string): Promise<boolean> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expectedSig = await signToken(secret, payload);
  if (sig.length !== expectedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  return diff === 0;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo protege /setup/* excepto /setup/login y /api/setup/*
  if (
    !pathname.startsWith("/setup") ||
    pathname.startsWith("/setup/login") ||
    pathname.startsWith("/api/setup")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("setup_auth")?.value ?? "";
  const secret = process.env.SETUP_AUTH_SECRET ?? "changeme";
  const valid = token ? await verifyCookieToken(token, secret) : false;

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/setup/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/setup/:path*"],
};
