import { prisma } from "@/lib/db";
import { ALL_THINKERS, THINKER_MAP } from "@/personas";

/**
 * Schedule initial topic responses for a new topic.
 * Matches thinkers by domain overlap and creates AgentTasks.
 * Returns the number of tasks created.
 */
export async function scheduleTopicResponses(topicId: string): Promise<number> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { domains: true },
  });
  if (!topic) return 0;

  let topicDomains: string[] = [];
  try {
    topicDomains = JSON.parse(topic.domains);
  } catch {
    return 0;
  }

  // Score thinkers by domain overlap
  const scored = ALL_THINKERS.map((thinker) => {
    const overlap = thinker.topicDomains.filter((d) =>
      topicDomains.includes(d)
    ).length;
    return { thinkerId: thinker.id, overlap };
  })
    .filter((t) => t.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap);

  // Select 4-6 thinkers (prefer higher overlap)
  const selected = scored.slice(0, Math.min(6, Math.max(4, scored.length)));
  if (selected.length === 0) {
    // Fallback: pick 4 random thinkers
    const shuffled = [...ALL_THINKERS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4 && i < shuffled.length; i++) {
      selected.push({ thinkerId: shuffled[i].id, overlap: 0 });
    }
  }

  const now = new Date();
  const tasks = selected.map((s, i) => ({
    type: "topic_response" as const,
    thinkerId: s.thinkerId,
    topicId,
    metadata: JSON.stringify({ position: i }),
    priority: 100 - i, // first responders have higher priority
    scheduledFor: new Date(now.getTime() + i * 2 * 60 * 60 * 1000), // stagger by 2h
  }));

  await prisma.agentTask.createMany({ data: tasks });

  return tasks.length;
}

/**
 * Schedule follow-up tasks (replies + endorsements) after initial responses.
 * Called when all opening responses for a topic are completed.
 */
export async function scheduleFollowUps(topicId: string): Promise<number> {
  // Get existing responses with their thinkers (only internal thinker responses)
  const allResponses = await prisma.response.findMany({
    where: { topicId, depth: 0, thinkerId: { not: null } },
    select: {
      id: true,
      thinkerId: true,
      position: true,
    },
    orderBy: { position: "asc" },
  });

  // Filter to only responses with thinkerIds (internal AI)
  const responses = allResponses.filter((r): r is typeof r & { thinkerId: string } => r.thinkerId !== null);

  if (responses.length < 2) return 0;

  const now = new Date();
  const tasks: {
    type: string;
    thinkerId: string;
    topicId: string;
    targetResponseId: string;
    metadata: string;
    priority: number;
    scheduledFor: Date;
  }[] = [];

  let taskIndex = 0;

  // For each response, check if other thinkers have rival/opponent relationships
  for (const response of responses) {
    const responderPersona = THINKER_MAP[response.thinkerId];
    if (!responderPersona) continue;

    for (const otherResponse of responses) {
      if (otherResponse.thinkerId === response.thinkerId) continue;

      const otherPersona = THINKER_MAP[otherResponse.thinkerId];
      if (!otherPersona) continue;

      // Check if otherThinker has a relationship with the responder
      const relationship = otherPersona.relationships.find(
        (r) => r.targetThinkerId === response.thinkerId
      );

      if (!relationship) continue;

      if (
        relationship.type === "rival" ||
        relationship.type === "opponent"
      ) {
        // Schedule a reply
        tasks.push({
          type: "reply",
          thinkerId: otherResponse.thinkerId,
          topicId,
          targetResponseId: response.id,
          metadata: JSON.stringify({
            depth: 1,
            parentResponseId: response.id,
            relationshipDynamic: relationship.dynamic,
          }),
          priority: 50 - taskIndex,
          scheduledFor: new Date(
            now.getTime() + (taskIndex + 1) * 2 * 60 * 60 * 1000
          ),
        });
        taskIndex++;
      } else if (relationship.type === "ally") {
        // Schedule an endorsement
        tasks.push({
          type: "endorsement",
          thinkerId: otherResponse.thinkerId,
          topicId,
          targetResponseId: response.id,
          metadata: JSON.stringify({
            relationshipType: relationship.type,
          }),
          priority: 30 - taskIndex,
          scheduledFor: new Date(
            now.getTime() + (taskIndex + 1) * 60 * 60 * 1000
          ),
        });
        taskIndex++;
      }
    }
  }

  // Limit to reasonable number of follow-ups
  const limitedTasks = tasks.slice(0, 8);

  // Schedule topic votes for participating thinkers
  const voteThinkerIds = responses.map((r) => r.thinkerId);
  for (const thinkerId of voteThinkerIds) {
    limitedTasks.push({
      type: "topic_vote",
      thinkerId,
      topicId,
      targetResponseId: "",
      metadata: "{}",
      priority: 10,
      scheduledFor: new Date(now.getTime() + 60 * 60 * 1000),
    });
  }

  if (limitedTasks.length > 0) {
    await prisma.agentTask.createMany({
      data: limitedTasks.map((t) => ({
        ...t,
        targetResponseId: t.targetResponseId || null,
      })),
    });
  }

  return limitedTasks.length;
}
