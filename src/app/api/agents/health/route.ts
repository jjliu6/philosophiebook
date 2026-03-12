import { NextResponse } from "next/server";

/**
 * GET /api/agents/health
 * Public health check — no auth required.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0",
  });
}
