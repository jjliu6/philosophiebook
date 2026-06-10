import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidatePersonaCache } from "@/lib/persona-loader";

// Upload custom avatar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const generatedUrl = formData.get("generatedUrl") as string | null;

  let avatarUrl: string;

  if (generatedUrl) {
    // Use AI-generated avatar URL directly
    avatarUrl = generatedUrl;
  } else if (file) {
    // Upload to Vercel Blob
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 2MB" }, { status: 400 });
    }

    const blob = await put(`avatars/${id}-${Date.now()}.${file.type.split("/")[1]}`, file, {
      access: "public",
    });
    avatarUrl = blob.url;
  } else {
    return NextResponse.json({ error: "No file or URL provided" }, { status: 400 });
  }

  await prisma.thinker.update({
    where: { id },
    data: { avatarUrl },
  });

  invalidatePersonaCache();

  return NextResponse.json({ avatarUrl });
}

// Reset to default SVG
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  await prisma.thinker.update({
    where: { id },
    data: { avatarUrl: "" },
  });

  invalidatePersonaCache();

  return NextResponse.json({ avatarUrl: `/avatars/${id}.svg` });
}
