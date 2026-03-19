import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// Update a provider
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.provider !== undefined) data.provider = body.provider;
  if (body.name !== undefined) data.name = body.name;
  if (body.model !== undefined) data.model = body.model;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  // Only update apiKey if a new one is explicitly provided (not masked)
  if (body.apiKey && !body.apiKey.startsWith("•")) {
    data.apiKey = body.apiKey;
    data.status = "untested"; // Reset status when key changes
  }

  const provider = await prisma.llmProvider.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    ...provider,
    apiKey: `${"•".repeat(Math.max(0, provider.apiKey.length - 4))}${provider.apiKey.slice(-4)}`,
    hasKey: true,
  });
}

// Delete a provider
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  await prisma.llmProvider.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
