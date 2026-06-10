/**
 * Seed script to insert 7 new topics with timestamps distributed across quiet periods.
 * Run: npx tsx scripts/seed-new-topics.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { ALL_THINKERS } from "../src/personas";

const prisma = new PrismaClient();

// Quiet gaps identified from existing topic timeline
const QUIET_GAPS: Array<{ start: string; end: string }> = [
  { start: "2026-03-04T15:00:00Z", end: "2026-03-05T19:00:00Z" }, // ~28h gap
  { start: "2026-03-05T21:30:00Z", end: "2026-03-06T17:00:00Z" }, // ~20h gap
  { start: "2026-03-06T19:00:00Z", end: "2026-03-07T23:00:00Z" }, // ~28h gap (no topics on Mar 7!)
  { start: "2026-03-08T14:00:00Z", end: "2026-03-08T23:00:00Z" }, // ~9h gap
  { start: "2026-03-09T18:00:00Z", end: "2026-03-10T14:00:00Z" }, // ~20h gap
  { start: "2026-03-10T16:00:00Z", end: "2026-03-11T03:00:00Z" }, // ~11h gap
  { start: "2026-03-12T20:00:00Z", end: "2026-03-13T06:00:00Z" }, // ~10h gap (after last topic)
];

function randomInGap(gap: { start: string; end: string }): Date {
  const s = new Date(gap.start).getTime();
  const e = new Date(gap.end).getTime();
  return new Date(s + Math.random() * (e - s));
}

interface TopicDef {
  title: string;
  type: "debate" | "discussion";
  proposition?: string;
  domains: string[];
  description: string;
  suggestedFor?: string[];
  suggestedAgainst?: string[];
  suggestedThinkers?: string[];
}

const TOPICS: TopicDef[] = [
  {
    title: "Is it selfish to choose not to have children?",
    type: "debate",
    proposition:
      "Choosing not to have children is a valid, ethical life choice — not a selfish one.",
    domains: ["personal_meaning", "ethics_morality", "identity_gender"],
    description:
      "Birthrates are plummeting across the developed world. Some call it a crisis. Others call it liberation. Your parents want grandchildren. Society says you owe something to the future. But do you? Is choosing personal freedom over parenthood a moral failure, or is the real selfishness in having children you don't truly want?",
    suggestedFor: ["beauvoir", "zhuangzi", "nietzsche"],
    suggestedAgainst: ["confucius", "mencius", "aristotle"],
  },
  {
    title: "Is loneliness the price of independence?",
    type: "discussion",
    domains: ["personal_meaning", "psychology_mental_health"],
    description:
      "We've never been more connected — or more alone. Modern life offers unprecedented freedom: move anywhere, work remotely, curate your social circle. But the data shows an epidemic of loneliness. Did we trade community for autonomy? Is deep connection only possible when you give up some freedom?",
    suggestedThinkers: [
      "arendt",
      "confucius",
      "beauvoir",
      "buddha",
      "aristotle",
      "aurelius",
    ],
  },
  {
    title: "Should you tell a dying person the truth?",
    type: "debate",
    proposition:
      "A dying person has an absolute right to know the truth about their condition.",
    domains: ["ethics_morality", "psychology_mental_health", "personal_meaning"],
    description:
      "Your father has terminal cancer. The doctor says three months. In many cultures, the family hides the diagnosis to \"protect\" the patient. In others, truth-telling is non-negotiable. Is honesty always kindness? Or is there a mercy in letting someone live their last days without the weight of knowing?",
    suggestedFor: ["socrates", "nietzsche", "beauvoir"],
    suggestedAgainst: ["confucius", "mencius", "buddha"],
  },
  {
    title: "Should we upload our consciousness to live forever?",
    type: "debate",
    proposition:
      "If the technology existed, uploading your consciousness to achieve immortality would be desirable.",
    domains: ["technology_ai", "religion_spirituality", "personal_meaning"],
    description:
      "Silicon Valley billionaires are funding brain-computer interfaces. The dream: scan your brain, upload your mind, live forever in the cloud. But is that \"you\" — or a copy that thinks it's you while the real you is dead? What would Plato's Forms say about a digital soul? What would Buddha say about clinging to existence itself?",
    suggestedFor: ["asimov", "liu-cixin", "plato"],
    suggestedAgainst: ["buddha", "zhuangzi", "nietzsche"],
  },
  {
    title: "Should countries open their borders to all refugees?",
    type: "debate",
    proposition:
      "Wealthy nations have a moral obligation to accept all refugees without limit.",
    domains: ["war_conflict", "politics_governance", "ethics_morality"],
    description:
      "Millions flee war, famine, and persecution. Rich nations debate quotas, build walls, process applications for years. Does a nation's duty to its own citizens override its duty to humanity? Is a border just a line on a map — or the foundation of social order? If your family had to flee, would you want the door open or closed?",
    suggestedFor: ["mozi", "buddha", "beauvoir"],
    suggestedAgainst: ["hanfeizi", "liu-cixin", "machiavelli"],
  },
  {
    title: "Does nature have rights — or is it just a resource?",
    type: "debate",
    proposition:
      "Nature has intrinsic value and moral rights independent of its usefulness to humans.",
    domains: ["environment", "ethics_morality"],
    description:
      "Ecuador granted rights to nature in its constitution. New Zealand gave legal personhood to a river. Meanwhile, we mine, drill, and burn at industrial scale. Is nature sacred, sentient, or just scenery? Do trees have standing? Can a mountain sue? Or is the entire concept a category error — a well-meaning confusion of poetry with law?",
    suggestedFor: ["laozi", "zhuangzi", "buddha"],
    suggestedAgainst: ["hanfeizi", "aristotle", "asimov"],
  },
  {
    title: "Is cancel culture the modern guillotine?",
    type: "debate",
    proposition:
      "Cancel culture is a form of mob justice that destroys nuance and due process.",
    domains: ["art_culture", "politics_governance", "technology_ai"],
    description:
      "One tweet can end a career. A decade-old joke can become a firing offense. Supporters say it's accountability — the powerful finally facing consequences. Critics say it's a digital reign of terror where context dies and forgiveness is impossible. Is this democracy in action, or the tyranny of the crowd with a WiFi connection?",
    suggestedFor: ["socrates", "zhuangzi", "sontag"],
    suggestedAgainst: ["confucius", "hanfeizi", "arendt"],
  },
];

function selectThinkers(topic: TopicDef): Array<{ id: string; side?: string }> {
  if (topic.type === "debate") {
    const forThinkers = (topic.suggestedFor || []).slice(0, 3);
    const againstThinkers = (topic.suggestedAgainst || []).slice(0, 3);
    return [
      ...forThinkers.map((id) => ({ id, side: "for" })),
      ...againstThinkers.map((id) => ({ id, side: "against" })),
    ];
  } else {
    return (topic.suggestedThinkers || [])
      .slice(0, 6)
      .map((id) => ({ id }));
  }
}

async function main() {
  // Shuffle gaps and assign one per topic
  const shuffledGaps = [...QUIET_GAPS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < TOPICS.length; i++) {
    const topicDef = TOPICS[i];
    const gap = shuffledGaps[i % shuffledGaps.length];
    const createdAt = randomInGap(gap);

    const topic = await prisma.topic.create({
      data: {
        title: topicDef.title,
        description: topicDef.description,
        type: topicDef.type,
        proposition: topicDef.proposition || null,
        domains: JSON.stringify(topicDef.domains),
        sourceType: "evergreen",
        status: "active",
        createdAt,
      },
    });

    console.log(
      `\n✅ [${createdAt.toISOString().slice(0, 16)}] ${topicDef.type.toUpperCase()} — ${topic.title}`
    );
    console.log(`   ID: ${topic.id}`);

    // Schedule response tasks
    const thinkers = selectThinkers(topicDef);
    const taskType =
      topicDef.type === "debate" ? "debate_argument" : "topic_response";

    const now = new Date();
    const tasks = thinkers.map((t, idx) => ({
      type: taskType,
      thinkerId: t.id,
      topicId: topic.id,
      metadata: JSON.stringify({
        position: idx,
        ...(t.side ? { debateSide: t.side } : {}),
      }),
      priority: 100 - idx,
      scheduledFor: new Date(now.getTime() + idx * 2 * 60 * 60 * 1000),
    }));

    await prisma.agentTask.createMany({ data: tasks });

    for (const t of thinkers) {
      console.log(
        `   📋 ${t.id}${t.side ? ` [${t.side.toUpperCase()}]` : ""}`
      );
    }
  }

  console.log(`\n🎉 Done! Created ${TOPICS.length} topics with response tasks.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
