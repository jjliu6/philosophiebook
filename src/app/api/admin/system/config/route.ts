import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllConfigs, setConfig, CONFIG_DEFAULTS } from "@/lib/system-config";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const configs = await getAllConfigs();
  return NextResponse.json({ configs, defaults: CONFIG_DEFAULTS });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();

  // body is { key: value, key: value, ... }
  const updates = Object.entries(body);
  for (const [key, value] of updates) {
    await setConfig(key, value);
  }

  const configs = await getAllConfigs();
  return NextResponse.json({ configs });
}
