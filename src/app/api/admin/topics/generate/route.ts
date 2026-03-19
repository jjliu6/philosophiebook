import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const provider = body.provider || "gemini";
  const type = body.type || "discussion";

  // Delegate to the existing cron endpoint with manual flag
  const baseUrl = request.nextUrl.origin;
  const cronSecret = process.env.CRON_SECRET;

  const res = await fetch(
    `${baseUrl}/api/cron/generate-topic?manual=true&provider=${provider}&type=${type}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
