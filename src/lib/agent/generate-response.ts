import { prisma } from "@/lib/db";
import { generateText, type AIProvider } from "@/lib/ai";
import { getThinker } from "@/personas";
import { responseUserPrompt, type LengthHint } from "@/lib/ai-prompts";
import { validateAIOutput } from "@/lib/content-safety";

/**
 * Generate a top-level response from a thinker to a topic.
 * Creates the Response record in the database.
 */
export async function generateTopicResponse(
  thinkerId: string,
  topicId: string,
  position: number,
  provider?: AIProvider,
  lengthHint?: LengthHint
): Promise<string> {
  const persona = getThinker(thinkerId);
  if (!persona) throw new Error(`Thinker not found: ${thinkerId}`);

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { title: true, description: true },
  });
  if (!topic) throw new Error(`Topic not found: ${topicId}`);

  // Get existing responses for context
  const existingResponses = await prisma.response.findMany({
    where: { topicId, depth: 0, position: { lt: position } },
    select: {
      content: true,
      thinker: { select: { name: true } },
    },
    orderBy: { position: "asc" },
  });

  const excerpts = existingResponses.map((r) => ({
    thinkerName: r.thinker?.name ?? "Unknown",
    excerpt: r.content.slice(0, 600),
  }));

  // Get human comments for context
  const humanComments = await prisma.comment.findMany({
    where: { topicId, parentCommentId: null },
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

  const userPrompt = responseUserPrompt(
    topic.title,
    topic.description,
    excerpts,
    position,
    commentExcerpts,
    lengthHint
  );

  // Adjust max tokens based on length hint
  const maxTokens = lengthHint === "short" ? 300 : lengthHint === "medium" ? 800 : 1500;

  const content = await generateText(
    persona.systemPromptTemplate,
    userPrompt,
    maxTokens,
    provider
  );

  // Validate output for signs of prompt injection success
  const validation = validateAIOutput(content);
  if (!validation.valid) {
    console.warn(
      `Output validation failed for thinker ${thinkerId} on topic ${topicId}: ${validation.reason}`
    );
    throw new Error(`AI output validation failed: ${validation.reason}`);
  }

  const response = await prisma.response.create({
    data: {
      topicId,
      thinkerId,
      content: content.trim(),
      position,
      depth: 0,
      parentResponseId: null,
    },
  });

  return response.id;
}
