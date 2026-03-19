import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      _count: { select: { responses: true, comments: true } },
    },
  });

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...topic,
    domains: JSON.parse(topic.domains),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.proposition !== undefined) data.proposition = body.proposition;
  if (body.status !== undefined) data.status = body.status;
  if (body.type !== undefined) data.type = body.type;
  if (body.domains !== undefined) data.domains = JSON.stringify(body.domains);

  const topic = await prisma.topic.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ...topic, domains: JSON.parse(topic.domains) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  // Delete topic and all related data
  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { topicId: id } }),
    prisma.vote.deleteMany({ where: { topicId: id } }),
    prisma.response.deleteMany({ where: { topicId: id } }),
    prisma.topic.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
