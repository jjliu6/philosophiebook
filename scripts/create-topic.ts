/**
 * CLI script to create a topic and schedule AI response tasks.
 * Used by Claude Code to insert topics without needing the Anthropic API.
 *
 * Usage:
 *   npx tsx scripts/create-topic.ts \
 *     --title "Your topic title" \
 *     --description "Topic description" \
 *     --domains "ethics_morality,technology_ai"
 *
 * Available domains:
 *   politics_governance, ethics_morality, technology_ai, economics_inequality,
 *   personal_meaning, education, environment, war_conflict, identity_gender,
 *   art_culture, religion_spirituality, psychology_mental_health
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { ALL_THINKERS } from "../src/personas";

const prisma = new PrismaClient();

const VALID_DOMAINS = [
  "politics_governance",
  "ethics_morality",
  "technology_ai",
  "economics_inequality",
  "personal_meaning",
  "education",
  "environment",
  "war_conflict",
  "identity_gender",
  "art_culture",
  "religion_spirituality",
  "psychology_mental_health",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    result[key] = args[i + 1];
  }

  return result;
}

async function main() {
  const args = parseArgs();

  if (!args.title) {
    console.error("Error: --title is required");
    process.exit(1);
  }

  const title = args.title;
  const description = args.description || "";
  const domains = (args.domains || "")
    .split(",")
    .map((d) => d.trim())
    .filter((d) => VALID_DOMAINS.includes(d));

  if (domains.length === 0) {
    console.error(
      "Error: at least one valid domain is required. Use --domains with comma-separated values."
    );
    console.error("Valid domains:", VALID_DOMAINS.join(", "));
    process.exit(1);
  }

  // Create topic
  const topic = await prisma.topic.create({
    data: {
      title,
      description,
      domains: JSON.stringify(domains),
      sourceType: "news",
      status: "active",
    },
  });

  console.log(`✅ Topic created: ${topic.id}`);
  console.log(`   Title: ${title}`);
  console.log(`   Domains: ${domains.join(", ")}`);

  // Schedule AI response tasks — match thinkers by domain
  const scored = ALL_THINKERS.map((thinker) => {
    const overlap = thinker.topicDomains.filter((d) =>
      domains.includes(d)
    ).length;
    return { thinkerId: thinker.id, name: thinker.name, overlap };
  })
    .filter((t) => t.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap);

  const selected = scored.slice(0, Math.min(6, Math.max(4, scored.length)));

  // Fallback if no domain match
  if (selected.length === 0) {
    const shuffled = [...ALL_THINKERS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4 && i < shuffled.length; i++) {
      selected.push({ thinkerId: shuffled[i].id, name: shuffled[i].name, overlap: 0 });
    }
  }

  const now = new Date();
  const tasks = selected.map((s, i) => ({
    type: "topic_response",
    thinkerId: s.thinkerId,
    topicId: topic.id,
    metadata: JSON.stringify({ position: i }),
    priority: 100 - i,
    scheduledFor: new Date(now.getTime() + i * 2 * 60 * 60 * 1000),
  }));

  await prisma.agentTask.createMany({ data: tasks });

  console.log(`\n📋 Scheduled ${tasks.length} response tasks:`);
  for (const s of selected) {
    console.log(`   - ${s.name} (domain overlap: ${s.overlap})`);
  }

  console.log(`\n🔗 View topic: http://localhost:3000/topic/${topic.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
