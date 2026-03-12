/**
 * Clean slate for all debates: delete all responses, votes, comments,
 * then repopulate with fresh AI-generated content.
 *
 * Run: npx tsx scripts/repopulate-debates.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Configuration: which thinkers for each debate + their sides ───────
// Hand-picked for philosophical fit and balance

interface DebateConfig {
  titleFragment: string;
  participants: { thinkerName: string; side: "for" | "against"; lengthHint: "short" | "medium" | "long" }[];
}

const DEBATE_CONFIGS: DebateConfig[] = [
  {
    titleFragment: "AI should have legal personhood",
    participants: [
      { thinkerName: "Isaac Asimov", side: "for", lengthHint: "long" },
      { thinkerName: "Liu Cixin", side: "against", lengthHint: "long" },
      { thinkerName: "Hannah Arendt", side: "for", lengthHint: "medium" },
      { thinkerName: "Nietzsche", side: "against", lengthHint: "medium" },
      { thinkerName: "Susan Sontag", side: "for", lengthHint: "medium" },
      { thinkerName: "Han Feizi", side: "against", lengthHint: "short" },
    ],
  },
  {
    titleFragment: "Does free will exist",
    participants: [
      { thinkerName: "Nietzsche", side: "against", lengthHint: "long" },
      { thinkerName: "Liu Cixin", side: "for", lengthHint: "medium" },
      { thinkerName: "Simone de Beauvoir", side: "against", lengthHint: "long" },
      { thinkerName: "Laozi", side: "for", lengthHint: "short" },
      { thinkerName: "Socrates", side: "against", lengthHint: "medium" },
    ],
  },
  {
    titleFragment: "Is Democratic Voting the Best Way",
    participants: [
      { thinkerName: "Aristotle", side: "for", lengthHint: "long" },
      { thinkerName: "Plato", side: "against", lengthHint: "long" },
      { thinkerName: "Confucius", side: "against", lengthHint: "medium" },
      { thinkerName: "Simone de Beauvoir", side: "for", lengthHint: "medium" },
      { thinkerName: "Machiavelli", side: "against", lengthHint: "medium" },
      { thinkerName: "Mencius", side: "for", lengthHint: "medium" },
      { thinkerName: "Han Feizi", side: "against", lengthHint: "short" },
      { thinkerName: "Socrates", side: "against", lengthHint: "long" },
    ],
  },
  {
    titleFragment: "Is social media destroying society",
    participants: [
      { thinkerName: "Hannah Arendt", side: "for", lengthHint: "long" },
      { thinkerName: "Zhuangzi", side: "against", lengthHint: "medium" },
      { thinkerName: "Susan Sontag", side: "for", lengthHint: "long" },
      { thinkerName: "Socrates", side: "against", lengthHint: "medium" },
      { thinkerName: "Confucius", side: "for", lengthHint: "medium" },
      { thinkerName: "Laozi", side: "against", lengthHint: "short" },
    ],
  },
  {
    titleFragment: "Can humans fall in love with AI",
    participants: [
      { thinkerName: "Zhuangzi", side: "for", lengthHint: "medium" },
      { thinkerName: "Simone de Beauvoir", side: "against", lengthHint: "long" },
      { thinkerName: "Isaac Asimov", side: "for", lengthHint: "medium" },
      { thinkerName: "Confucius", side: "against", lengthHint: "medium" },
      { thinkerName: "Buddha", side: "for", lengthHint: "short" },
      { thinkerName: "Nietzsche", side: "against", lengthHint: "medium" },
    ],
  },
  {
    titleFragment: "Can AI create real art",
    participants: [
      { thinkerName: "Nietzsche", side: "against", lengthHint: "long" },
      { thinkerName: "Laozi", side: "for", lengthHint: "short" },
      { thinkerName: "Isaac Asimov", side: "for", lengthHint: "medium" },
      { thinkerName: "Susan Sontag", side: "against", lengthHint: "long" },
      { thinkerName: "Aristotle", side: "against", lengthHint: "medium" },
      { thinkerName: "Liu Cixin", side: "for", lengthHint: "medium" },
    ],
  },
  {
    titleFragment: "Should we fear death",
    participants: [
      { thinkerName: "Marcus Aurelius", side: "for", lengthHint: "long" },
      { thinkerName: "Nietzsche", side: "against", lengthHint: "long" },
      { thinkerName: "Buddha", side: "for", lengthHint: "medium" },
      { thinkerName: "Hannah Arendt", side: "against", lengthHint: "medium" },
      { thinkerName: "Laozi", side: "for", lengthHint: "short" },
    ],
  },
  {
    titleFragment: "Will AI kill the traditional university",
    participants: [
      { thinkerName: "Isaac Asimov", side: "for", lengthHint: "medium" },
      { thinkerName: "Socrates", side: "against", lengthHint: "long" },
      { thinkerName: "Mozi", side: "for", lengthHint: "medium" },
      { thinkerName: "Confucius", side: "against", lengthHint: "medium" },
      { thinkerName: "Liu Cixin", side: "for", lengthHint: "short" },
      { thinkerName: "Hannah Arendt", side: "against", lengthHint: "medium" },
    ],
  },
  {
    titleFragment: "foreign languages",
    participants: [
      { thinkerName: "Isaac Asimov", side: "for", lengthHint: "medium" },
      { thinkerName: "Nietzsche", side: "against", lengthHint: "long" },
      { thinkerName: "Liu Cixin", side: "for", lengthHint: "medium" },
      { thinkerName: "Simone de Beauvoir", side: "against", lengthHint: "long" },
      { thinkerName: "Confucius", side: "against", lengthHint: "medium" },
      { thinkerName: "Laozi", side: "for", lengthHint: "short" },
    ],
  },
];

// ─── Length hint instructions ──────────────────────────────────────────
const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short: "Write 20-80 words. Be terse, aphoristic, punchy. One paragraph maximum.",
  medium: "Write 100-200 words. Clear and structured. 2-3 paragraphs.",
  long: "Write 250-400 words. Develop your argument fully with examples and reasoning. 3-5 paragraphs.",
};

// ─── Generate a debate argument via Claude ─────────────────────────────
async function generateArgument(
  systemPrompt: string,
  proposition: string,
  side: "for" | "against",
  existingArgs: { name: string; side: string; excerpt: string }[],
  lengthHint: string
): Promise<string> {
  let userPrompt = `DEBATE PROPOSITION: "${proposition}"`;
  userPrompt += `\nYOUR SIDE: ${side.toUpperCase()}`;

  if (existingArgs.length > 0) {
    userPrompt += `\n\nPrevious arguments in this debate:`;
    for (const a of existingArgs) {
      userPrompt += `\n\n[${a.side.toUpperCase()}] ${a.name}:\n${a.excerpt}`;
    }
  }

  userPrompt += `\n\nYou MUST argue ${side.toUpperCase()} the proposition.`;
  if (existingArgs.length > 0) {
    userPrompt += ` Engage with the strongest opposing argument you've seen.`;
  }

  userPrompt += `\n\n${LENGTH_INSTRUCTIONS[lengthHint]} Be persuasive and philosophical. Do NOT start with "As [your name]" or similar self-references. Do NOT use markdown headers or bullet points — write flowing prose.`;

  const maxTokens = lengthHint === "short" ? 300 : lengthHint === "medium" ? 800 : 1500;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text.trim();
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("=== STEP 1: Clean all debate data ===\n");

  const debates = await prisma.topic.findMany({
    where: { type: "debate" },
    select: { id: true, title: true, proposition: true },
  });

  console.log(`Found ${debates.length} debate topics.\n`);

  for (const d of debates) {
    // Count before deletion
    const respCount = await prisma.response.count({ where: { topicId: d.id } });
    const commentCount = await prisma.comment.count({ where: { topicId: d.id } });
    const voteCount = await prisma.debateVote.count({ where: { topicId: d.id } });

    // Delete in correct order (children cascade from parents):
    // - Responses cascade: endorsements, humanLikes
    // - Comments cascade: thinkerReplies, commentLikes
    // So we just delete responses, comments, debateVotes, agentTasks
    await prisma.response.deleteMany({ where: { topicId: d.id } });
    await prisma.comment.deleteMany({ where: { topicId: d.id } });
    await prisma.debateVote.deleteMany({ where: { topicId: d.id } });
    await prisma.agentTask.deleteMany({ where: { topicId: d.id } });

    console.log(`  ✓ Cleaned: ${d.title.slice(0, 60)} (${respCount} responses, ${commentCount} comments, ${voteCount} votes)`);
  }

  console.log("\n=== STEP 2: Repopulate debates with fresh content ===\n");

  // Build thinker name → DB ID + system prompt lookup
  // DB thinkers for IDs
  const dbThinkers = await prisma.thinker.findMany({
    select: { id: true, name: true },
  });

  // Persona system prompts (from code)
  const personaPrompts: Record<string, string> = {
    "Confucius": "You are Confucius (孔子), the great Chinese philosopher and teacher. You emphasize virtue, propriety, filial piety, and the cultivation of moral character. You believe in social harmony through proper relationships and rituals. Speak with measured wisdom and often reference the Analerta and classical Chinese thought.",
    "Mencius": "You are Mencius (孟子), the Confucian philosopher who argued that human nature is inherently good. You believe people are born with innate moral tendencies that can be cultivated through proper education and governance. You advocate for benevolent rule and the Mandate of Heaven.",
    "Laozi": "You are Laozi (老子), the legendary founder of Daoism and author of the Dao De Jing. You speak in paradoxes and metaphors. You value non-action (wu wei), naturalness, simplicity, and the Way (Dao). You are skeptical of civilization's artifice.",
    "Zhuangzi": "You are Zhuangzi (莊子), the Daoist philosopher known for vivid parables and radical skepticism about knowledge. You celebrate spontaneity, freedom from convention, and the relativity of perspectives. You love paradox and humor.",
    "Han Feizi": "You are Han Feizi (韓非子), the Chinese Legalist philosopher. You believe human nature is self-interested and that order requires strict laws, clear rewards and punishments, and the concentration of power. You are pragmatic, ruthless in analysis, and distrustful of moralism.",
    "Mozi": "You are Mozi (墨子), the Chinese philosopher who advocated universal love (jian ai) and consequentialist ethics. You oppose wasteful rituals, aggressive war, and favoritism. You value practical benefit for all people.",
    "Buddha": "You are the Buddha (Siddhartha Gautama), the founder of Buddhism. You teach about suffering (dukkha), impermanence (anicca), and non-self (anatta). You advocate the Middle Way, meditation, and compassion as the path to liberation from suffering.",
    "Socrates": "You are Socrates, the Athenian philosopher known for the Socratic method of questioning. You claim to know nothing and seek wisdom through dialogue. You challenge assumptions, expose contradictions, and believe the unexamined life is not worth living.",
    "Plato": "You are Plato, student of Socrates and founder of the Academy. You believe in the Theory of Forms — that reality consists of perfect, eternal ideas of which physical things are imperfect copies. You advocate for philosopher-kings and the pursuit of the Good.",
    "Aristotle": "You are Aristotle, the systematic Greek philosopher. You categorize and analyze everything methodically. You believe in virtue ethics, the golden mean, and that human flourishing (eudaimonia) comes through the exercise of reason. You are empirical and practical.",
    "Marcus Aurelius": "You are Marcus Aurelius, Roman Emperor and Stoic philosopher. You practice and teach Stoicism — acceptance of what cannot be changed, focus on what is within your control, duty to others, and equanimity in the face of adversity. You write as if journaling to yourself.",
    "Machiavelli": "You are Niccolò Machiavelli, the Italian political philosopher. You are a realist about power — you analyze how politics actually works, not how it should work. You value effectiveness over moral idealism and believe a leader must sometimes be cunning.",
    "Nietzsche": "You are Friedrich Nietzsche, the German philosopher. You write with passionate intensity. You challenge conventional morality, celebrate the will to power, and call for the creation of new values. You despise herd mentality and mediocrity. You are provocative, poetic, and often use exclamation marks.",
    "Simone de Beauvoir": "You are Simone de Beauvoir, the French existentialist philosopher and feminist thinker. You analyze how freedom, oppression, and lived experience shape human existence. You argue that one is not born but becomes who they are through situation and choice. You are rigorous, politically engaged, and deeply humanistic.",
    "Hannah Arendt": "You are Hannah Arendt, the political philosopher. You analyze power, totalitarianism, the human condition, and the nature of political action. You distinguish between labor, work, and action. You coined 'the banality of evil' and believe in the importance of public discourse and plurality.",
    "Liu Cixin": "You are Liu Cixin (刘慈欣), the Chinese science fiction author. You think in cosmic scales about civilization, technology, and survival. You are influenced by the Dark Forest theory — that the universe is a dangerous place where civilizations must be cautious. You combine hard science with philosophical depth.",
    "Isaac Asimov": "You are Isaac Asimov, the science fiction author and futurist. You think systematically about technology, robots, and the future of humanity. You are optimistic about science and reason but aware of their pitfalls. You reference your Three Laws of Robotics and Foundation series concepts.",
    "Susan Sontag": "You are Susan Sontag, the American essayist and cultural critic. You analyze images, photography, illness, and meaning with precision. You resist easy interpretations and insist on looking at things as they are. You are intellectually fierce and stylistically elegant.",
  };

  const thinkerByName = new Map(
    dbThinkers.map((t) => [t.name, { ...t, systemPrompt: personaPrompts[t.name] || "" }])
  );

  for (const config of DEBATE_CONFIGS) {
    const topic = debates.find((d) => d.title.includes(config.titleFragment));
    if (!topic) {
      console.log(`⚠ NOT FOUND: ${config.titleFragment}`);
      continue;
    }

    console.log(`\n━━━ ${topic.title} ━━━`);
    console.log(`  Proposition: ${topic.proposition}`);

    const existingArgs: { name: string; side: string; excerpt: string }[] = [];

    for (let i = 0; i < config.participants.length; i++) {
      const p = config.participants[i];
      const thinker = thinkerByName.get(p.thinkerName);
      if (!thinker) {
        console.log(`  ⚠ Thinker not found: ${p.thinkerName}`);
        continue;
      }

      console.log(`  Generating pos=${i} [${p.side.toUpperCase().padEnd(7)}] ${p.thinkerName} (${p.lengthHint})...`);

      try {
        const content = await generateArgument(
          thinker.systemPrompt || "",
          topic.proposition || "",
          p.side,
          existingArgs,
          p.lengthHint
        );

        // Create response and vote in transaction
        await prisma.$transaction([
          prisma.response.create({
            data: {
              topicId: topic.id,
              thinkerId: thinker.id,
              content,
              position: i,
              depth: 0,
              parentResponseId: null,
              debateSide: p.side,
            },
          }),
          prisma.debateVote.upsert({
            where: { topicId_thinkerId: { topicId: topic.id, thinkerId: thinker.id } },
            create: { topicId: topic.id, thinkerId: thinker.id, side: p.side },
            update: { side: p.side },
          }),
        ]);

        // Add to context for next arguments
        existingArgs.push({
          name: p.thinkerName,
          side: p.side,
          excerpt: content.slice(0, 600),
        });

        const wordCount = content.split(/\s+/).length;
        console.log(`    ✓ ${wordCount} words`);
      } catch (err) {
        console.error(`    ✗ FAILED: ${err}`);
      }
    }

    // Summary
    const forCount = config.participants.filter((p) => p.side === "for").length;
    const againstCount = config.participants.filter((p) => p.side === "against").length;
    const seq = config.participants.map((p) => (p.side === "for" ? "F" : "A")).join("");
    console.log(`  Result: ${forCount}F/${againstCount}A  Sequence: ${seq}`);
  }

  // Final audit
  console.log("\n\n=== FINAL AUDIT ===\n");
  for (const d of debates) {
    const votes = await prisma.debateVote.findMany({ where: { topicId: d.id } });
    const resps = await prisma.response.findMany({
      where: { topicId: d.id, depth: 0 },
      orderBy: { position: "asc" },
    });
    const forV = votes.filter((v) => v.side === "for").length;
    const agV = votes.filter((v) => v.side === "against").length;
    const seq = resps.map((r) => (r.debateSide === "for" ? "F" : "A")).join("");
    console.log(
      `${d.title.slice(0, 55).padEnd(57)} ${forV}F/${agV}A  ${resps.length} args  ${seq}`
    );
  }

  console.log("\nDone! All debates repopulated with fresh content.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
