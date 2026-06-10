import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { generateText, getProvider } from "@/lib/ai";
import { ALL_THINKERS } from "@/personas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const provider = body.provider || "gemini";

  // Load persona from DB (or seed data)
  const dbThinker = await prisma.thinker.findUnique({ where: { id } });
  const seedThinker = ALL_THINKERS.find((t) => t.id === id);

  const systemPrompt = dbThinker?.systemPromptTemplate || seedThinker?.systemPromptTemplate;
  if (!systemPrompt) {
    return NextResponse.json({ error: "Persona has no system prompt" }, { status: 400 });
  }

  const testPrompt = body.prompt || "What is the meaning of a good life? Share your perspective briefly.";

  try {
    const selectedProvider = getProvider(provider);
    const response = await generateText(
      systemPrompt,
      testPrompt,
      500,
      provider
    );

    return NextResponse.json({
      provider: selectedProvider,
      prompt: testPrompt,
      response,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
