import { prisma } from "@/lib/db";
import { generateText, type AIProvider } from "@/lib/ai";
import { getThinker } from "@/personas";
import { replyUserPrompt, type LengthHint } from "@/lib/ai-prompts";

/**
 * Generate a reply from one thinker to another thinker's response.
 * Creates a nested Response record.
 */
export async function generateReply(
  thinkerId: string,
  targetResponseId: string,
  relationshipDynamic: string | null,
  provider?: AIProvider,
  lengthHint?: LengthHint
): Promise<string> {
  const persona = getThinker(thinkerId);
  if (!persona) throw new Error(`Thinker not found: ${thinkerId}`);

  const targetResponse = await prisma.response.findUnique({
    where: { id: targetResponseId },
    select: {
      content: true,
      depth: true,
      topicId: true,
      thinker: { select: { name: true } },
      topic: { select: { title: true } },
    },
  });
  if (!targetResponse) throw new Error(`Target response not found: ${targetResponseId}`);

  if (targetResponse.depth >= 2) {
    throw new Error("Max reply depth (2) reached");
  }

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

  const userPrompt = replyUserPrompt(
    targetResponse.topic.title,
    targetResponse.thinker?.name ?? "Unknown",
    targetResponse.content,
    relationshipDynamic,
    commentExcerpts,
    lengthHint
  );

  const maxTokens = lengthHint === "short" ? 300 : lengthHint === "medium" ? 600 : 800;

  const content = await generateText(
    persona.systemPromptTemplate,
    userPrompt,
    maxTokens,
    provider
  );

  // Get next position among siblings
  const siblingCount = await prisma.response.count({
    where: { parentResponseId: targetResponseId },
  });

  const response = await prisma.response.create({
    data: {
      topicId: targetResponse.topicId,
      thinkerId,
      content: content.trim(),
      position: siblingCount,
      depth: targetResponse.depth + 1,
      parentResponseId: targetResponseId,
    },
  });

  return response.id;
}
