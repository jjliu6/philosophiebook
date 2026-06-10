import { prisma } from "@/lib/db";
import { generateText, type AIProvider } from "@/lib/ai";
import { getThinker } from "@/personas";
import { debateArgumentUserPrompt, debateSideDecisionPrompt, type LengthHint } from "@/lib/ai-prompts";

/**
 * Determine which side a thinker would take in a debate.
 * Uses the thinker's persona to decide for/against.
 */
export async function decideThinkerSide(
  thinkerId: string,
  proposition: string,
  provider?: AIProvider
): Promise<"for" | "against"> {
  const persona = getThinker(thinkerId);
  if (!persona) throw new Error(`Thinker not found: ${thinkerId}`);

  const prompt = debateSideDecisionPrompt(
    persona.name,
    proposition,
    persona.keyConcepts
  );

  try {
    const result = await generateText(
      persona.systemPromptTemplate,
      prompt,
      100,
      provider
    );
    const parsed = JSON.parse(result.trim());
    if (parsed.side === "for" || parsed.side === "against") {
      return parsed.side;
    }
  } catch {
    // Fallback: random side
  }

  return Math.random() > 0.5 ? "for" : "against";
}

/**
 * Generate a debate argument from a thinker.
 * Creates the Response record and DebateVote in the database.
 */
export async function generateDebateArgument(
  thinkerId: string,
  topicId: string,
  side: "for" | "against",
  position: number,
  provider?: AIProvider,
  lengthHint?: LengthHint
): Promise<string> {
  const persona = getThinker(thinkerId);
  if (!persona) throw new Error(`Thinker not found: ${thinkerId}`);

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { proposition: true },
  });
  if (!topic?.proposition) throw new Error(`Debate topic not found or missing proposition: ${topicId}`);

  // Get existing debate arguments for context
  const existingArgs = await prisma.response.findMany({
    where: { topicId, depth: 0, debateSide: { not: null } },
    select: {
      content: true,
      debateSide: true,
      thinker: { select: { name: true } },
      user: { select: { username: true } },
    },
    orderBy: { position: "asc" },
  });

  const argExcerpts = existingArgs.map((a) => ({
    thinkerName: a.thinker?.name ?? a.user?.username ?? "Unknown",
    side: a.debateSide ?? "for",
    excerpt: a.content.slice(0, 600),
  }));

  const userPrompt = debateArgumentUserPrompt(
    topic.proposition,
    side,
    argExcerpts,
    lengthHint
  );

  const maxTokens = lengthHint === "short" ? 300 : lengthHint === "medium" ? 800 : 1500;

  const content = await generateText(
    persona.systemPromptTemplate,
    userPrompt,
    maxTokens,
    provider
  );

  // Create response and vote in transaction
  const [response] = await prisma.$transaction([
    prisma.response.create({
      data: {
        topicId,
        thinkerId,
        content: content.trim(),
        position,
        depth: 0,
        parentResponseId: null,
        debateSide: side,
      },
    }),
    prisma.debateVote.upsert({
      where: { topicId_thinkerId: { topicId, thinkerId } },
      create: { topicId, thinkerId, side },
      update: { side },
    }),
  ]);

  return response.id;
}
