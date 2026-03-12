import { prisma } from "@/lib/db";
import { ALL_THINKERS, THINKER_MAP } from "@/personas";
import type { LengthHint } from "@/lib/ai-prompts";

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

/**
 * Schedule debate responses for a new debate topic.
 * Picks 4-6 thinkers, assigns sides, and staggers their arguments.
 * Alternates between FOR and AGAINST for natural debate flow.
 */
export async function scheduleDebateResponses(topicId: string): Promise<number> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { domains: true, proposition: true },
  });
  if (!topic?.proposition) return 0;

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

  const selected = scored.slice(0, Math.min(6, Math.max(4, scored.length)));
  if (selected.length === 0) {
    const shuffled = [...ALL_THINKERS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4 && i < shuffled.length; i++) {
      selected.push({ thinkerId: shuffled[i].id, overlap: 0 });
    }
  }

  // Assign sides: alternate for balanced debate
  // First half FOR, second half AGAINST (roughly)
  const forCount = Math.ceil(selected.length / 2);
  const shuffledSelected = [...selected].sort(() => Math.random() - 0.5);
  const forThinkers = shuffledSelected.slice(0, forCount);
  const againstThinkers = shuffledSelected.slice(forCount);

  // Interleave: FOR, AGAINST, FOR, AGAINST...
  const interleaved: { thinkerId: string; side: "for" | "against" }[] = [];
  const maxLen = Math.max(forThinkers.length, againstThinkers.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < forThinkers.length) {
      interleaved.push({ thinkerId: forThinkers[i].thinkerId, side: "for" });
    }
    if (i < againstThinkers.length) {
      interleaved.push({ thinkerId: againstThinkers[i].thinkerId, side: "against" });
    }
  }

  // Staggered timing
  const now = new Date();
  let cumulativeMs = randomBetween(5, 30) * 60 * 1000;
  const tasks = interleaved.map((s, i) => {
    const task = {
      type: "debate_argument" as const,
      thinkerId: s.thinkerId,
      topicId,
      metadata: JSON.stringify({
        position: i,
        debateSide: s.side,
        lengthHint: pickLengthHint(),
      }),
      priority: 100 - i,
      scheduledFor: new Date(now.getTime() + cumulativeMs),
    };
    cumulativeMs += randomBetween(15, 60) * 60 * 1000; // 15-60 min gaps (tighter for debates)
    return task;
  });

  await prisma.agentTask.createMany({ data: tasks });

  // Also create vote-only records for thinkers who argue (they need a DebateVote)
  // The actual DebateVote is created when the argument is generated

  return tasks.length;
}

const LENGTH_HINTS: LengthHint[] = ["short", "medium", "long"];
const LENGTH_WEIGHTS = [0.3, 0.45, 0.25]; // 30% short, 45% medium, 25% long

function pickLengthHint(): LengthHint {
  const r = Math.random();
  if (r < LENGTH_WEIGHTS[0]) return "short";
  if (r < LENGTH_WEIGHTS[0] + LENGTH_WEIGHTS[1]) return "medium";
  return "long";
}

/**
 * Schedule daily activity for randomly selected thinkers.
 * Picks 5-10 thinkers and schedules 1-8 interactions each on recent topics.
 * Returns summary of scheduled activity.
 */
export async function scheduleDailyThinkerActivity(): Promise<{
  thinkersActivated: number;
  tasksCreated: number;
  details: { thinkerId: string; name: string; interactions: number }[];
}> {
  const DAY_START_HOUR = 7;
  const DAY_END_HOUR = 23;

  // Pick 5-10 random thinkers
  const shuffled = [...ALL_THINKERS].sort(() => Math.random() - 0.5);
  const activateCount = randomBetween(5, 10);
  const activatedThinkers = shuffled.slice(0, activateCount);

  // Fetch recent topics (last 48h) with their responses
  const recentTopics = await prisma.topic.findMany({
    where: {
      status: "active",
      createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      domains: true,
      responses: {
        select: {
          id: true,
          thinkerId: true,
          depth: true,
          position: true,
          thinker: { select: { name: true } },
        },
      },
    },
  });

  if (recentTopics.length === 0) {
    return { thinkersActivated: 0, tasksCreated: 0, details: [] };
  }

  const allNewTasks: {
    type: string;
    thinkerId: string;
    topicId: string;
    targetResponseId: string | null;
    metadata: string;
    priority: number;
    scheduledFor: Date;
  }[] = [];

  const details: { thinkerId: string; name: string; interactions: number }[] = [];
  const today = new Date();
  const todayBase = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  for (const thinker of activatedThinkers) {
    const persona = THINKER_MAP[thinker.id];
    if (!persona) continue;

    // Find eligible topics (domain overlap)
    const eligibleTopics = recentTopics.filter((topic) => {
      let topicDomains: string[] = [];
      try {
        topicDomains = JSON.parse(topic.domains);
      } catch {
        return false;
      }
      return persona.topicDomains.some((d) => topicDomains.includes(d));
    });

    if (eligibleTopics.length === 0) continue;

    // Randomly decide interaction count: 1-8
    const maxInteractions = randomBetween(1, 8);
    let interactionCount = 0;

    // Generate random times for this thinker (spread across the day)
    const thinkerTimes: Date[] = [];
    for (let i = 0; i < maxInteractions; i++) {
      const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
      const randomMin = Math.floor(Math.random() * totalMinutes);
      const hour = DAY_START_HOUR + Math.floor(randomMin / 60);
      const minute = randomMin % 60;
      const scheduledTime = new Date(todayBase.getTime() + hour * 3600000 + minute * 60000);

      // Ensure at least 20 min apart from other times for this thinker
      const tooClose = thinkerTimes.some(
        (t) => Math.abs(t.getTime() - scheduledTime.getTime()) < 20 * 60 * 1000
      );
      if (!tooClose) {
        thinkerTimes.push(scheduledTime);
      }
    }

    thinkerTimes.sort((a, b) => a.getTime() - b.getTime());

    for (const scheduledTime of thinkerTimes) {
      // Pick a random eligible topic
      const topic = eligibleTopics[Math.floor(Math.random() * eligibleTopics.length)];
      const lengthHint = pickLengthHint();

      // Determine interaction type
      const existingThinkerResponses = topic.responses.filter(
        (r) => r.thinkerId === thinker.id
      );
      const hasTopLevelResponse = existingThinkerResponses.some((r) => r.depth === 0);

      // Other thinkers' responses we could reply to
      const otherResponses = topic.responses.filter(
        (r) => r.thinkerId !== null && r.thinkerId !== thinker.id && r.depth < 2
      );

      if (!hasTopLevelResponse) {
        // Create a new top-level response
        const position = topic.responses.filter((r) => r.depth === 0).length;

        allNewTasks.push({
          type: "topic_response",
          thinkerId: thinker.id,
          topicId: topic.id,
          targetResponseId: null,
          metadata: JSON.stringify({ position, lengthHint }),
          priority: 50,
          scheduledFor: scheduledTime,
        });
        interactionCount++;
      } else if (otherResponses.length > 0) {
        // Reply to or endorse another thinker's response
        const targetResponse = otherResponses[Math.floor(Math.random() * otherResponses.length)];

        // Check relationship with target thinker
        const relationship = persona.relationships.find(
          (r) => r.targetThinkerId === targetResponse.thinkerId
        );

        // Already replied to this specific response?
        const alreadyReplied = topic.responses.some(
          (r) =>
            r.thinkerId === thinker.id &&
            r.depth > 0
        );

        if (
          relationship &&
          (relationship.type === "ally" || relationship.type === "dialogue") &&
          !alreadyReplied
        ) {
          // Endorsement
          allNewTasks.push({
            type: "endorsement",
            thinkerId: thinker.id,
            topicId: topic.id,
            targetResponseId: targetResponse.id,
            metadata: JSON.stringify({
              relationshipType: relationship.type,
              lengthHint,
            }),
            priority: 30,
            scheduledFor: scheduledTime,
          });
          interactionCount++;
        } else if (!alreadyReplied) {
          // Reply
          allNewTasks.push({
            type: "reply",
            thinkerId: thinker.id,
            topicId: topic.id,
            targetResponseId: targetResponse.id,
            metadata: JSON.stringify({
              depth: targetResponse.depth + 1,
              parentResponseId: targetResponse.id,
              relationshipDynamic: relationship?.dynamic ?? null,
              lengthHint,
            }),
            priority: 40,
            scheduledFor: scheduledTime,
          });
          interactionCount++;
        }
      }
    }

    if (interactionCount > 0) {
      details.push({
        thinkerId: thinker.id,
        name: persona.name,
        interactions: interactionCount,
      });
    }
  }

  if (allNewTasks.length > 0) {
    await prisma.agentTask.createMany({ data: allNewTasks });
  }

  return {
    thinkersActivated: details.length,
    tasksCreated: allNewTasks.length,
    details,
  };
}
