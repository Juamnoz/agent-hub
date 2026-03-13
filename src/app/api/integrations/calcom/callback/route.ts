import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/integrations/calcom/callback
 *
 * Cal.com redirige aquí tras el OAuth.
 * Params: ?code=xxx&state=agentId
 *
 * 1. Llama al backend para intercambiar code → tokens
 * 2. Redirige al wizard en el paso Calendario con resultado
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const agentId = searchParams.get("state"); // state = agentId

  const errorRedirect = (id: string | null) =>
    NextResponse.redirect(
      new URL(`/agents/new?agentId=${id ?? ""}&cal=error`, origin)
    );

  if (!code || !agentId) {
    return errorRedirect(agentId);
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

  try {
    const res = await fetch(
      `${apiBase}/integrations/calcom/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(agentId)}`
    );

    if (!res.ok) {
      return errorRedirect(agentId);
    }

    return NextResponse.redirect(
      new URL(`/agents/new?agentId=${agentId}&cal=connected`, origin)
    );
  } catch {
    return errorRedirect(agentId);
  }
}
