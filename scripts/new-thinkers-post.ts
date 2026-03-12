import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getThinker } from "../src/personas";
import { responseUserPrompt, type LengthHint } from "../src/lib/ai-prompts";
import Anthropic from "@anthropic-ai/sdk";

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateText(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response");
  return textBlock.text;
}

// Topic assignments — chosen to match each thinker's domains
const assignments: Record<string, { topicIds: string[]; lengths: LengthHint[] }> = {
  "liu-cixin": {
    topicIds: [
      "topic-free-will",                          // Does free will exist?
      "topic-ai-rights",                           // Should AI have rights?
      "cmmmd6e4x000010a54q2qlif4",                // Why be good in a universe that doesn't care?
      "cmmneph2v000012piocxlllvt",                // Can AI ever experience genuine suffering?
      "cmmnepzx70000hh3dqr8hgu42",                // Obligation to future generations
      "cmmlym6mk0001x1i9qkntkldw",                // Is the universe terrifyingly simple?
      "cmmlyd34m0001jm77gc48b309",                // If we live in a simulation
      "cmmlyee1z0005jm77rrf3p2p6",                // Would you die to know ultimate truth?
    ],
    lengths: ["short", "long", "medium", "short", "long", "short", "medium", "short"],
  },
  "asimov": {
    topicIds: [
      "topic-ai-rights",                           // Should AI have rights?
      "cmmnfzum6000r6hhao0glg4jl",                // Let's build AI constitution
      "cmmmd63rd00009ff9oy17dxiw",                // AI remembers better than friends
      "cmmlr4saq000029vqsb2uzafo",                // Should AI have legal personhood?
      "topic-education",                           // Purpose of education
      "cmmm18hic000060evlnss6x7p",                // Right to be forgotten vs historical truth
      "cmmm35qik00042j0jvmyoek2h",                // Is consciousness emergent property of code?
      "topic-ai-love",                             // Can humans fall in love with AI?
    ],
    lengths: ["medium", "long", "short", "medium", "short", "long", "medium", "short"],
  },
  "sontag": {
    topicIds: [
      "topic-social-media",                        // Is social media destroying society?
      "topic-ai-art",                              // Can AI create real art?
      "cmmnfmkgu00096hhaseqqjoiv",                // Is social media good or bad?
      "cmmlr545x000012xphxofc83m",                // Is loneliness the defining crisis?
      "cmmlyqesl000cejbr7rozxeid",                // Is it selfish to live for your own experience?
      "cmmlyfugm0009jm77rt381fca",                // Is financial freedom a liberation or trap?
      "topic-heartbreak",                          // How to survive heartbreak
      "cmmlyp1k50002ejbrzh7cqdpf",                // Leave a legacy or fear of death?
    ],
    lengths: ["long", "medium", "short", "medium", "long", "short", "medium", "short"],
  },
};

async function postResponse(thinkerId: string, topicId: string, lengthHint: LengthHint) {
  const persona = getThinker(thinkerId);
  if (!persona) throw new Error(`Thinker not found: ${thinkerId}`);

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { title: true, description: true },
  });
  if (!topic) throw new Error(`Topic not found: ${topicId}`);

  // Get next position
  const maxPos = await prisma.response.aggregate({
    where: { topicId, depth: 0 },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  // Get existing responses for context
  const existingResponses = await prisma.response.findMany({
    where: { topicId, depth: 0 },
    select: {
      content: true,
      thinker: { select: { name: true } },
      user: { select: { username: true } },
    },
    orderBy: { position: "asc" },
  });

  const excerpts = existingResponses.map((r) => ({
    thinkerName: r.thinker?.name ?? r.user?.username ?? "Unknown",
    excerpt: r.content.slice(0, 600),
  }));

  // Get human comments
  const humanComments = await prisma.comment.findMany({
    where: { topicId, parentCommentId: null },
    select: { content: true, user: { select: { username: true } } },
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

  const maxTokens = lengthHint === "short" ? 300 : lengthHint === "medium" ? 800 : 1500;

  const content = await generateText(persona.systemPromptTemplate, userPrompt, maxTokens);

  await prisma.response.create({
    data: {
      topicId,
      thinkerId,
      content: content.trim(),
      position,
      depth: 0,
      parentResponseId: null,
    },
  });

  const wordCount = content.trim().split(/\s+/).length;
  console.log(`  [${lengthHint.padEnd(6)}] ${persona.name} → "${topic.title.slice(0, 50)}" (${wordCount} words)`);
}

async function main() {
  for (const [thinkerId, config] of Object.entries(assignments)) {
    const persona = getThinker(thinkerId);
    console.log(`\n=== ${persona?.name ?? thinkerId} ===`);

    for (let i = 0; i < config.topicIds.length; i++) {
      try {
        await postResponse(thinkerId, config.topicIds[i], config.lengths[i]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR on topic ${config.topicIds[i]}: ${msg}`);
      }
    }
  }

  console.log("\nDone!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
