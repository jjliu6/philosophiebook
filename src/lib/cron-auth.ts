import { NextRequest, NextResponse } from "next/server";

/**
 * Verify that a cron request is authorized.
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // authorized
}
