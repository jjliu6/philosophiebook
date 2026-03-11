import { prisma } from "@/lib/db";
import { generateText, type AIProvider } from "@/lib/ai";
import { getThinker } from "@/personas";
import { responseUserPrompt } from "@/lib/ai-prompts";

/**
 * Generate a top-level response from a thinker to a topic.
 * Creates the Response record in the database.
 */
export async function generateTopicResponse(
  thinkerId: string,
  topicId: string,
  position: number,
  provider?: AIProvider
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

  const userPrompt = responseUserPrompt(
    topic.title,
    topic.description,
    excerpts,
    position
  );

  const content = await generateText(
    persona.systemPromptTemplate,
    userPrompt,
    1500,
    provider
  );

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
