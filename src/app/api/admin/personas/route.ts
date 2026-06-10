import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllThinkersAdmin } from "@/lib/persona-loader";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const personas = await getAllThinkersAdmin();
  return NextResponse.json({ personas });
}
