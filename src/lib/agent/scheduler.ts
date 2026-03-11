import { prisma } from "@/lib/db";
import { ALL_THINKERS, THINKER_MAP } from "@/personas";

/** Random integer between min and max (inclusive) */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Schedule initial topic responses for a new topic.
 * Matches thinkers by domain overlap and creates AgentTasks.
 * Timing is randomized to feel natural.
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

  // Randomized staggering: first response 5-30 min after topic,
  // then 80-160 min gaps between subsequent responses
  const now = new Date();
  let cumulativeMs = randomBetween(5, 30) * 60 * 1000;
  const tasks = selected.map((s, i) => {
    const task = {
      type: "topic_response" as const,
      thinkerId: s.thinkerId,
      topicId,
      metadata: JSON.stringify({ position: i }),
      priority: 100 - i,
      scheduledFor: new Date(now.getTime() + cumulativeMs),
    };
    cumulativeMs += randomBetween(80, 160) * 60 * 1000; // 1h20m–2h40m gap
    return task;
  });

  await prisma.agentTask.createMany({ data: tasks });

  return tasks.length;
}

/**
 * Schedule follow-up tasks (replies + endorsements) after initial responses.
 * Called when all opening responses for a topic are completed.
 * Timing is randomized to feel natural.
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

  let replyCumulativeMs = randomBetween(30, 90) * 60 * 1000; // first reply: 30-90 min
  let endorseCumulativeMs = randomBetween(15, 60) * 60 * 1000; // first endorsement: 15-60 min
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
        // Schedule a reply with randomized timing (90-180 min gaps)
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
          scheduledFor: new Date(now.getTime() + replyCumulativeMs),
        });
        replyCumulativeMs += randomBetween(90, 180) * 60 * 1000; // 1.5h–3h gap
        taskIndex++;
      } else if (relationship.type === "ally") {
        // Schedule an endorsement with randomized timing (30-90 min gaps)
        tasks.push({
          type: "endorsement",
          thinkerId: otherResponse.thinkerId,
          topicId,
          targetResponseId: response.id,
          metadata: JSON.stringify({
            relationshipType: relationship.type,
          }),
          priority: 30 - taskIndex,
          scheduledFor: new Date(now.getTime() + endorseCumulativeMs),
        });
        endorseCumulativeMs += randomBetween(30, 90) * 60 * 1000; // 0.5h–1.5h gap
        taskIndex++;
      }
    }
  }

  // Limit to reasonable number of follow-ups
  const limitedTasks = tasks.slice(0, 8);

  // Schedule topic votes with randomized timing per thinker (20-120 min)
  const voteThinkerIds = responses.map((r) => r.thinkerId);
  for (const thinkerId of voteThinkerIds) {
    limitedTasks.push({
      type: "topic_vote",
      thinkerId,
      topicId,
      targetResponseId: "",
      metadata: "{}",
      priority: 10,
      scheduledFor: new Date(
        now.getTime() + randomBetween(20, 120) * 60 * 1000
      ),
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
