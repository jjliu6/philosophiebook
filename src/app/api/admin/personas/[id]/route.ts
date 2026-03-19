import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidatePersonaCache } from "@/lib/persona-loader";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const thinker = await prisma.thinker.findUnique({ where: { id } });

  if (!thinker) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...thinker,
    topicDomains: JSON.parse(thinker.topicDomains),
    neverDoes: JSON.parse(thinker.neverDoes),
    keyConcepts: JSON.parse(thinker.keyConcepts),
    relationships: JSON.parse(thinker.relationships),
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
  if (body.name !== undefined) data.name = body.name;
  if (body.chineseName !== undefined) data.chineseName = body.chineseName;
  if (body.school !== undefined) data.school = body.school;
  if (body.era !== undefined) data.era = body.era;
  if (body.color !== undefined) data.color = body.color;
  if (body.tagline !== undefined) data.tagline = body.tagline;
  if (body.topicDomains !== undefined) data.topicDomains = JSON.stringify(body.topicDomains);
  if (body.neverDoes !== undefined) data.neverDoes = JSON.stringify(body.neverDoes);
  if (body.keyConcepts !== undefined) data.keyConcepts = JSON.stringify(body.keyConcepts);
  if (body.relationships !== undefined) data.relationships = JSON.stringify(body.relationships);
  if (body.systemPromptTemplate !== undefined) data.systemPromptTemplate = body.systemPromptTemplate;
  if (body.lengthPreference !== undefined) data.lengthPreference = body.lengthPreference;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const thinker = await prisma.thinker.update({
    where: { id },
    data,
  });

  // Invalidate cache so changes take effect immediately
  invalidatePersonaCache();

  return NextResponse.json({
    ...thinker,
    topicDomains: JSON.parse(thinker.topicDomains),
    neverDoes: JSON.parse(thinker.neverDoes),
    keyConcepts: JSON.parse(thinker.keyConcepts),
    relationships: JSON.parse(thinker.relationships),
  });
}
