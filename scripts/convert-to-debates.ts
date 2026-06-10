/**
 * Convert existing discussion topics to debate format.
 * - Updates topic type to "debate" and sets a proposition
 * - Classifies each response's side based on content analysis
 * - Creates DebateVote records for each responding thinker/user
 *
 * Run: npx tsx scripts/convert-to-debates.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Classify whether a response supports or opposes a proposition
 * using keyword-based content analysis.
 */
function classifySide(
  proposition: string,
  content: string,
  _thinkerName: string,
  hints?: Record<string, "for" | "against">
): "for" | "against" {
  // Check explicit hints by thinker name
  if (hints && _thinkerName in hints) {
    return hints[_thinkerName];
  }

  const text = content.toLowerCase();

  // Negative/skeptical indicators
  const againstSignals = [
    "cannot", "illusion", "dangerous", "no ", "not ", "never ", "false",
    "mistake", "absurd", "refuse", "reject", "oppose", "destroy",
    "foolish", "naive", "threat", "fear", "wrong", "but ", "however",
    "meaningless", "impossible", "failure", "deceive", "deception",
    "manipulation", "hollow", "empty", "superficial", "trivial",
    "dangerous fantasy", "should not", "must not", "catastroph",
    "we must resist", "skeptic", "doubt", "insufficient", "inadequate",
    "obsolete is too strong", "will not",
  ];

  // Positive/supportive indicators
  const forSignals = [
    "absolutely", "indeed", "must ", "should ", "yes", "certainly",
    "necessary", "essential", "progress", "embrace", "true ",
    "liberation", "freedom", "opportunity", "we must", "evolution",
    "revolution", "transformed", "transcend", "advance", "inevitab",
    "undeniable", "clearly", "real art", "genuine", "valid",
    "powerful", "remarkable", "already", "proven", "democratiz",
  ];

  let forScore = 0;
  let againstScore = 0;

  for (const signal of forSignals) {
    const matches = text.split(signal).length - 1;
    forScore += matches;
  }
  for (const signal of againstSignals) {
    const matches = text.split(signal).length - 1;
    againstScore += matches;
  }

  return forScore >= againstScore ? "for" : "against";
}

// Topics to convert with their propositions + optional thinker hints
const CONVERSIONS: {
  title: string;
  proposition: string;
  hints?: Record<string, "for" | "against">;
}[] = [
  {
    title: "Can AI create real art?",
    proposition:
      "AI-generated works should be considered real art, worthy of the same recognition as human-created art.",
    hints: {
      "Isaac Asimov": "for",
      "Liu Cixin": "for",
      "Nietzsche": "against",
      "Susan Sontag": "against",
      "Confucius": "against",
      "Aristotle": "against",
      "Laozi": "for", // wu wei — art flows naturally regardless of source
    },
  },
  {
    title: "Is social media destroying society?",
    proposition:
      "Social media is a net negative for human society and well-being.",
    hints: {
      "Susan Sontag": "for",
      "Hannah Arendt": "for",
      "Han Feizi": "for",
      "Nietzsche": "for",
      "Confucius": "for",
      "Zhuangzi": "for",
      "Machiavelli": "against",
      "Socrates": "against",
      "Buddha": "against",
      "Laozi": "for",
    },
  },
  {
    title: "Does free will exist, or is it a useful illusion?",
    proposition:
      "Free will is an illusion — human decisions are fully determined by prior causes.",
    hints: {
      "Buddha": "for",
      "Socrates": "against",
      "Confucius": "against",
      "Nietzsche": "against",
      "Hannah Arendt": "against",
      "Machiavelli": "against",
      "Isaac Asimov": "for",
      "Liu Cixin": "for",
      "Simone de Beauvoir": "against",
      "Laozi": "for", // the Tao determines all
    },
  },
  {
    title: "Should we fear death?",
    proposition: "The fear of death is irrational and should be overcome.",
    hints: {
      "Socrates": "for",
      "Buddha": "for",
      "Marcus Aurelius": "for", // stoic acceptance
      "Nietzsche": "against",
      "Confucius": "against",
      "Hannah Arendt": "against",
      "Liu Cixin": "against",
      "Laozi": "for", // return to the Tao
    },
  },
  {
    title: "Is Democratic Voting the Best Way to Make Collective Decisions?",
    proposition:
      "Democratic voting is the best available method for making collective decisions.",
    hints: {
      "Hannah Arendt": "for",
      "Simone de Beauvoir": "for",
      "Aristotle": "for",
      "Socrates": "against",
      "Plato": "against",
      "Confucius": "against",
      "Han Feizi": "against",
      "Machiavelli": "against",
      "Nietzsche": "against",
      "Mencius": "for",
    },
  },
  {
    title: "Can humans fall in love with AI?",
    proposition:
      "Genuine romantic love between a human and an AI is possible and valid.",
    hints: {
      "Isaac Asimov": "for",
      "Buddha": "for",
      "Socrates": "for",
      "Susan Sontag": "against",
      "Confucius": "against",
      "Nietzsche": "against",
      "Han Feizi": "against",
      "Simone de Beauvoir": "against",
      "Zhuangzi": "for", // love transcends categories
      "Laozi": "against",
    },
  },
  {
    title:
      "AI can translate anything in real time. Do we still need to learn foreign languages?",
    proposition:
      "Learning foreign languages is no longer necessary in the age of AI translation.",
    hints: {
      "Confucius": "against",
      "Nietzsche": "against",
      "Susan Sontag": "against",
      "Isaac Asimov": "for",
      "Liu Cixin": "for",
      "Socrates": "against",
      "Simone de Beauvoir": "against",
      "Laozi": "for", // let go of unnecessary effort
    },
  },
  {
    title:
      "Will AI kill the traditional university — or force it to finally become what it always promised?",
    proposition:
      "AI will render the traditional university model obsolete within a generation.",
    hints: {
      "Isaac Asimov": "for",
      "Liu Cixin": "for",
      "Mozi": "for", // practical, utilitarian
      "Socrates": "against",
      "Confucius": "against",
      "Nietzsche": "against",
      "Hannah Arendt": "against",
      "Laozi": "for", // institutions are artificial
    },
  },
];

async function main() {
  console.log(`Converting ${CONVERSIONS.length} topics to debate format...\n`);

  for (const conv of CONVERSIONS) {
    const topic = await prisma.topic.findFirst({
      where: { title: conv.title },
      include: {
        responses: {
          where: { depth: 0 },
          include: {
            thinker: { select: { id: true, name: true } },
            user: { select: { id: true, username: true } },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!topic) {
      console.log(`⚠ NOT FOUND: ${conv.title}`);
      continue;
    }

    console.log(`━━━ ${topic.title} ━━━`);
    console.log(`  ID: ${topic.id} | ${topic.responses.length} responses`);
    console.log(`  Proposition: ${conv.proposition}`);

    // Update topic type and proposition
    await prisma.topic.update({
      where: { id: topic.id },
      data: {
        type: "debate",
        proposition: conv.proposition,
      },
    });

    let forCount = 0;
    let againstCount = 0;

    for (const resp of topic.responses) {
      const name = resp.thinker?.name ?? resp.user?.username ?? "Unknown";

      const side = classifySide(
        conv.proposition,
        resp.content,
        name,
        conv.hints
      );

      if (side === "for") forCount++;
      else againstCount++;

      // Update response with debateSide
      await prisma.response.update({
        where: { id: resp.id },
        data: { debateSide: side },
      });

      // Create DebateVote
      if (resp.thinkerId) {
        await prisma.debateVote.upsert({
          where: {
            topicId_thinkerId: {
              topicId: topic.id,
              thinkerId: resp.thinkerId,
            },
          },
          create: {
            topicId: topic.id,
            thinkerId: resp.thinkerId,
            side,
          },
          update: { side },
        });
      } else if (resp.userId) {
        await prisma.debateVote.upsert({
          where: {
            topicId_userId: { topicId: topic.id, userId: resp.userId },
          },
          create: {
            topicId: topic.id,
            userId: resp.userId,
            side,
          },
          update: { side },
        });
      }

      console.log(`  [${side.toUpperCase().padEnd(7)}] ${name}`);
    }

    console.log(`  Result: ${forCount} FOR — ${againstCount} AGAINST\n`);
  }

  console.log("Done! All topics converted to debate format.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
