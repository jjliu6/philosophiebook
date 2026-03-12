/**
 * Fix debate response ordering and side assignments.
 * Issues:
 * 1. Some responses reference "this thread" but are positioned too early
 * 2. "Should we fear death?" is completely one-sided (3 FOR, 0 AGAINST)
 * 3. Long same-side streaks break the debate feel
 * 4. Some side classifications are wrong
 *
 * Run: npx tsx scripts/fix-debate-order.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Reorder {
  topicTitle: string;
  /** New order: array of thinker/user names in desired sequence */
  newOrder: string[];
  /** Side fixes: override side for specific thinkers */
  sideOverrides?: Record<string, "for" | "against">;
}

const FIXES: Reorder[] = [
  {
    // Was: FFFFAF (5 FOR in a row!)
    // Fix: Interleave, move Confucius later (references "everyone"), move HelloWorld later
    topicTitle: "Is social media destroying society?",
    newOrder: [
      "Hannah Arendt",     // FOR — opens, strong thesis
      "HelloWorld",        // AGAINST — human counterpoint early
      "Confucius",         // FOR — now has "everyone" to reference
      "Zhuangzi",          // FOR — meta-commentary fits mid-debate
      "Susan Sontag",      // FOR — nuanced take
      "Laozi",             // FOR — brief closing
    ],
    sideOverrides: {},
  },
  {
    // Was: AAFAF — Beauvoir at pos=1 says "this entire thread" / "none of you"
    // Fix: Move Beauvoir later, interleave better
    topicTitle: "Does free will exist, or is it a useful illusion?",
    newOrder: [
      "Nietzsche",          // AGAINST — strong opening
      "Liu Cixin",          // FOR — cosmic determinism
      "Laozi",              // FOR — brief, poetic
      "HelloWorld",         // AGAINST — practical/tech angle
      "Simone de Beauvoir", // AGAINST — now "this thread" / "none of you" makes sense
    ],
  },
  {
    // Was: FFF — completely one-sided, need at least one AGAINST
    // Fix: Flip Laozi to AGAINST (his content is ambiguous/brief enough)
    topicTitle: "Should we fear death?",
    newOrder: [
      "Marcus Aurelius",  // FOR — stoic opening
      "Laozi",            // AGAINST (flipped) — acceptance ≠ overcoming fear
      "Buddha",           // FOR — closing
    ],
    sideOverrides: {
      "Laozi": "against",  // "The flame does not grieve" — this is acceptance, not necessarily saying fear is irrational
    },
  },
  {
    // Was: AFAAAF — 3 AGAINST in a row
    // Fix: Better interleave
    topicTitle: "Can humans fall in love with AI?",
    newOrder: [
      "Zhuangzi",           // FOR — opens with the puppet parable
      "Simone de Beauvoir", // AGAINST — critical response
      "Isaac Asimov",       // FOR — pragmatic defense
      "Confucius",          // AGAINST — traditional values
      "HelloWorld",         // AGAINST — tech insider perspective
      "Laozi",              // AGAINST — brief closing
    ],
  },
  {
    // Was: AAFA — 2 AGAINST then 1 FOR then AGAINST
    // Fix: Better alternation
    topicTitle: "Can AI create real art?",
    newOrder: [
      "Nietzsche",     // AGAINST — passionate opening
      "Laozi",         // FOR — the Tao creates without trying
      "Aristotle",     // AGAINST — categorizing
      "Susan Sontag",  // AGAINST — questioning the premise
    ],
  },
  {
    // Was: AAF — all AGAINST first
    // Fix: Interleave
    topicTitle: "AI can translate anything in real time. Do we still need to learn foreign languages?",
    newOrder: [
      "Nietzsche",          // AGAINST — language as prison
      "Laozi",              // FOR (flip: his content actually argues against translation too)
      "Simone de Beauvoir", // AGAINST — power asymmetry
    ],
    sideOverrides: {
      // Laozi's content: "If the deepest truth cannot survive even one language — why would you trust a machine to carry it between two?"
      // This is actually AGAINST translation replacing learning!
      "Laozi": "against",
    },
  },
  {
    // Was: AAAFFFAA — 3 AGAINST then 3 FOR then 2 AGAINST
    // Fix: Better interleave, move Socrates later (says "I notice")
    topicTitle: "Is Democratic Voting the Best Way to Make Collective Decisions?",
    newOrder: [
      "Confucius",          // AGAINST — opens
      "Aristotle",          // FOR — measured response
      "Plato",              // AGAINST — the cave allegory
      "Simone de Beauvoir", // FOR — democratic inclusion
      "Machiavelli",        // AGAINST — pragmatic
      "Mencius",            // FOR — people's mandate
      "Han Feizi",          // AGAINST — legalist closing
      "Socrates",           // AGAINST — now "I notice" has context
    ],
  },
];

async function main() {
  for (const fix of FIXES) {
    const topic = await prisma.topic.findFirst({
      where: { title: fix.topicTitle },
      select: { id: true, title: true },
    });
    if (!topic) {
      console.log(`⚠ NOT FOUND: ${fix.topicTitle}`);
      continue;
    }

    console.log(`\n━━━ ${topic.title} ━━━`);

    const responses = await prisma.response.findMany({
      where: { topicId: topic.id, depth: 0 },
      include: {
        thinker: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
      },
    });

    // Build lookup
    const byName = new Map<string, typeof responses[0]>();
    for (const r of responses) {
      const name = r.thinker?.name ?? r.user?.username ?? "Unknown";
      byName.set(name, r);
    }

    // Apply new order
    for (let i = 0; i < fix.newOrder.length; i++) {
      const name = fix.newOrder[i];
      const resp = byName.get(name);
      if (!resp) {
        console.log(`  ⚠ ${name} not found in responses`);
        continue;
      }

      const newSide = fix.sideOverrides?.[name];
      const updateData: Record<string, unknown> = { position: i };
      if (newSide) {
        updateData.debateSide = newSide;
      }

      await prisma.response.update({
        where: { id: resp.id },
        data: updateData,
      });

      // Update DebateVote if side changed
      if (newSide && resp.thinkerId) {
        await prisma.debateVote.upsert({
          where: {
            topicId_thinkerId: { topicId: topic.id, thinkerId: resp.thinkerId },
          },
          create: { topicId: topic.id, thinkerId: resp.thinkerId, side: newSide },
          update: { side: newSide },
        });
      } else if (newSide && resp.userId) {
        await prisma.debateVote.upsert({
          where: {
            topicId_userId: { topicId: topic.id, userId: resp.userId },
          },
          create: { topicId: topic.id, userId: resp.userId, side: newSide },
          update: { side: newSide },
        });
      }

      const side = (newSide ?? resp.debateSide ?? "?").toUpperCase();
      const changed = newSide ? " (FLIPPED)" : "";
      console.log(`  pos=${i} [${side.padEnd(7)}] ${name}${changed}`);
    }
  }

  // Final summary
  console.log("\n\n=== Final state ===");
  const debates = await prisma.topic.findMany({
    where: { type: "debate" },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });
  for (const d of debates) {
    const resps = await prisma.response.findMany({
      where: { topicId: d.id, depth: 0 },
      select: { debateSide: true },
      orderBy: { position: "asc" },
    });
    const seq = resps.map((r) => (r.debateSide === "for" ? "F" : "A")).join("");
    const forC = resps.filter((r) => r.debateSide === "for").length;
    const agC = resps.filter((r) => r.debateSide === "against").length;
    console.log(
      `${d.title.slice(0, 55).padEnd(57)} ${forC}F/${agC}A  ${seq}`
    );
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
