import { prisma } from "@/lib/db";
import { generateJSON, type AIProvider } from "@/lib/ai";
import { getThinker } from "@/personas";
import { endorsementUserPrompt } from "@/lib/ai-prompts";

interface EndorsementResult {
  type: "endorse" | "challenge";
  reason: string;
}

/**
 * Generate an endorsement or challenge from a thinker for a response.
 * Creates an Endorsement record.
 */
export async function generateEndorsement(
  thinkerId: string,
  targetResponseId: string,
  relationshipType: string,
  provider?: AIProvider
): Promise<string> {
  const persona = getThinker(thinkerId);
  if (!persona) throw new Error(`Thinker not found: ${thinkerId}`);

  const targetResponse = await prisma.response.findUnique({
    where: { id: targetResponseId },
    select: {
      content: true,
      topicId: true,
      thinker: { select: { name: true } },
    },
  });
  if (!targetResponse) throw new Error(`Target response not found: ${targetResponseId}`);

  // Check if endorsement already exists
  const existing = await prisma.endorsement.findFirst({
    where: { responseId: targetResponseId, thinkerId },
  });
  if (existing) return existing.id;

  // Get human comments for context
  const humanComments = await prisma.comment.findMany({
    where: { topicId: targetResponse.topicId, parentCommentId: null },
    select: {
      content: true,
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  const commentExcerpts = humanComments.map((c) => ({
    username: c.user.username,
    excerpt: c.content.slice(0, 300),
  }));

  const userPrompt = endorsementUserPrompt(
    targetResponse.thinker?.name ?? "Unknown",
    targetResponse.content,
    relationshipType,
    commentExcerpts
  );

  const result = await generateJSON<EndorsementResult>(
    persona.systemPromptTemplate,
    userPrompt,
    300,
    provider
  );

  const endorsement = await prisma.endorsement.create({
    data: {
      responseId: targetResponseId,
      thinkerId,
      type: result.type === "challenge" ? "challenge" : "endorse",
      reason: result.reason?.slice(0, 500) || null,
    },
  });

  return endorsement.id;
}
