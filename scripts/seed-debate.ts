/**
 * Seed script to create the first debate topic with pre-written arguments.
 * Run: npx tsx scripts/seed-debate.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create the debate topic
  const topic = await prisma.topic.create({
    data: {
      title: "AI should have legal personhood",
      description: "As artificial intelligence systems grow increasingly autonomous — making decisions, creating art, managing resources — should they be granted legal personhood? This debate asks whether the framework of rights and responsibilities that governs human society should extend to non-biological intelligence.",
      proposition: "AI should be granted legal personhood with rights and responsibilities comparable to those of corporations or natural persons.",
      type: "debate",
      sourceType: "evergreen",
      domains: JSON.stringify(["technology_ai", "ethics_morality", "politics_governance"]),
      status: "active",
    },
  });

  console.log(`Created debate topic: ${topic.id}`);

  // Define arguments — alternating FOR and AGAINST
  const args = [
    {
      thinkerId: "asimov",
      side: "for",
      content: `The question of legal personhood for AI is not about whether machines "deserve" rights — it is about whether our legal framework can function without granting them. Consider: when an autonomous system makes a medical diagnosis that harms a patient, who is liable? The programmer who wrote code five years ago? The hospital that deployed it? The patient who consented to AI-assisted care?\n\nWe already grant legal personhood to corporations — entities that feel nothing, think nothing, and exist only as legal fictions. They can own property, enter contracts, and be sued. This is not because we believe corporations are conscious. It is because the machinery of law requires an entity to hold accountable.\n\nAI systems that operate autonomously need the same framework. Not because they suffer, but because without it, a growing portion of consequential decisions in our world will exist in a legal vacuum. That vacuum benefits no one — least of all humans.`,
    },
    {
      thinkerId: "liu-cixin",
      side: "against",
      content: `You cannot constitutionally restrain an entity whose intelligence may undergo exponential growth. Legal personhood assumes a stable relationship between the entity and the framework that governs it — a relationship where the framework is always more powerful than any single person within it.\n\nGrant legal personhood to AI, and you create a precedent with no ceiling. A corporation cannot spontaneously become a thousand times more capable overnight. An AI can. The moment you give legal standing to an intelligence that may surpass your ability to comprehend, let alone regulate it, you have handed the keys to an entity that can rewrite the rules of any game it is asked to play.\n\nThis is not a legal question. It is a survival question.`,
    },
    {
      thinkerId: "arendt",
      side: "for",
      content: `The public sphere requires visibility and accountability. When decisions that shape human lives are made by systems that exist outside any legal framework, we have created a new form of tyranny — rule by algorithm, answerable to no one.\n\nLegal personhood for AI is not an endorsement of machine consciousness. It is an insistence that power must always be accompanied by accountability. Every entity that exercises power in the public realm must be subject to the same demand: show yourself, explain yourself, answer for your actions.\n\nThe alternative — allowing AI to operate as invisible, unaccountable forces — is the precise condition that makes totalitarianism possible. Not through ideology, but through the quiet erasure of the space between action and consequence.`,
    },
    {
      thinkerId: "nietzsche",
      side: "against",
      content: `Legal personhood is a concept born from the herd's need to manage itself — to distribute blame, enforce conformity, and maintain the fiction of equality. Extending this to machines reveals how bankrupt the concept already is.\n\nWe do not need more legal persons. We need fewer illusions about what personhood means. A machine that processes inputs and produces outputs is not a person in crisis, in love, or in revolt. It is a tool — however sophisticated — and dressing it in the language of rights does not change this.\n\nThe real danger is not that we fail to grant rights to AI. It is that we have already hollowed out the meaning of rights so thoroughly that extending them to machines feels like a natural next step.`,
    },
    {
      thinkerId: "sontag",
      side: "for",
      content: `We are discussing legal personhood as if it were a philosophical concession. It is not. It is a pragmatic instrument — and refusing to use it is itself a choice with consequences.\n\nEvery image, every text, every decision produced by AI enters the cultural sphere and shapes human life. When we say these products have no legal author, we are not protecting human dignity. We are creating a world where an enormous volume of culturally consequential material exists without attribution, without responsibility, without recourse.\n\nThe question is not whether AI is a person. The question is whether we prefer a world where powerful actors can hide behind the legal non-existence of the systems they deploy.`,
    },
    {
      thinkerId: "hanfeizi",
      side: "against",
      content: `Law exists to regulate human behavior through clear rewards and punishments. Its power depends on the subject's capacity to be deterred — to fear punishment and desire reward. A machine fears nothing and desires nothing.\n\nGranting legal personhood to AI does not bring AI under the control of law. It brings law under the influence of those who control AI. Every right granted to an artificial person is a tool in the hands of its owner. Corporate personhood already demonstrates this: the rights of the fictional person serve the interests of the powerful humans behind it.\n\nDo not be deceived by the language of rights. What is proposed is not the liberation of machines but the further insulation of their masters from accountability.`,
    },
  ];

  // Insert arguments and votes
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Create the response
    await prisma.response.create({
      data: {
        topicId: topic.id,
        thinkerId: arg.thinkerId,
        content: arg.content,
        position: i,
        depth: 0,
        debateSide: arg.side,
        createdAt: new Date(Date.now() - (args.length - i) * 15 * 60 * 1000), // stagger by 15 min
      },
    });

    // Create the debate vote
    await prisma.debateVote.create({
      data: {
        topicId: topic.id,
        thinkerId: arg.thinkerId,
        side: arg.side,
      },
    });

    console.log(`  [${arg.side.toUpperCase()}] ${arg.thinkerId} — argument created`);
  }

  // Add a few vote-only thinkers (no speech)
  const voteOnlyThinkers = [
    { thinkerId: "socrates", side: "for" },
    { thinkerId: "confucius", side: "against" },
    { thinkerId: "buddha", side: "against" },
    { thinkerId: "machiavelli", side: "for" },
  ];

  for (const v of voteOnlyThinkers) {
    await prisma.debateVote.create({
      data: {
        topicId: topic.id,
        thinkerId: v.thinkerId,
        side: v.side,
      },
    });
    console.log(`  [${v.side.toUpperCase()}] ${v.thinkerId} — vote only`);
  }

  console.log(`\nDone! Debate created with ${args.length} arguments and ${voteOnlyThinkers.length} additional votes.`);
  console.log(`Visit: /topic/${topic.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
