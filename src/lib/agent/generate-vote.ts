import { prisma } from "@/lib/db";
import { getThinker } from "@/personas";

/**
 * Generate a topic vote from a thinker.
 * Uses domain matching logic — no LLM call needed.
 * Creates a TopicVote record and updates the cached voteScore.
 */
export async function generateTopicVote(
  thinkerId: string,
  topicId: string
): Promise<void> {
  const persona = getThinker(thinkerId);
  if (!persona) throw new Error(`Thinker not found: ${thinkerId}`);

  // Check if vote already exists
  const existing = await prisma.topicVote.findFirst({
    where: { topicId, thinkerId },
  });
  if (existing) return;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { domains: true },
  });
  if (!topic) return;

  let topicDomains: string[] = [];
  try {
    topicDomains = JSON.parse(topic.domains);
  } catch {
    topicDomains = [];
  }

  // Domain overlap determines vote tendency
  const overlap = persona.topicDomains.filter((d) =>
    topicDomains.includes(d)
  ).length;

  // High overlap → upvote; low overlap → slight chance of downvote
  let value: 1 | -1;
  if (overlap >= 2) {
    value = 1;
  } else if (overlap === 1) {
    value = Math.random() > 0.2 ? 1 : -1; // 80% upvote
  } else {
    value = Math.random() > 0.4 ? 1 : -1; // 60% upvote
  }

  await prisma.$transaction([
    prisma.topicVote.create({
      data: { topicId, thinkerId, value },
    }),
    prisma.topic.update({
      where: { id: topicId },
      data: { voteScore: { increment: value } },
    }),
  ]);
}
