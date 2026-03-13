/**
 * Seed script to populate "The Simulation Hypothesis" debate with thinker arguments.
 * Run: npx tsx scripts/seed-simulation-debate.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the existing debate topic
  const topic = await prisma.topic.findFirst({
    where: { title: { contains: "Simulation Hypothesis" } },
  });

  if (!topic) {
    console.error("Topic 'The Simulation Hypothesis' not found! Create it first via the UI.");
    process.exit(1);
  }

  console.log(`Found topic: ${topic.id} — "${topic.title}"`);

  // Check if already has content
  const existing = await prisma.response.count({ where: { topicId: topic.id } });
  if (existing > 0) {
    console.log(`Topic already has ${existing} responses. Clearing them first...`);
    await prisma.response.deleteMany({ where: { topicId: topic.id } });
    await prisma.debateVote.deleteMany({ where: { topicId: topic.id } });
  }

  // Arguments — concise, punchy, varied lengths
  const args = [
    {
      thinkerId: "plato",
      side: "for",
      content: `My Allegory of the Cave was never meant as mere metaphor. Consider: the prisoners see only shadows and believe them to be the entirety of reality. They argue about the shadows, build theories about the shadows, live and die by the shadows. Release one prisoner, and he discovers the fire, the puppets, and eventually the sun itself — each layer revealing the previous as a lesser projection of something more real.

Now substitute "computational substrate" for "the sun." The logic is identical. What we call physical reality may be precisely such a shadow — a projection rendered by processes we cannot perceive from within. The philosopher's task has always been to look beyond appearances. Simulation theory is simply this ancient task stated in modern terms.`,
    },
    {
      thinkerId: "aristotle",
      side: "against",
      content: `My teacher was fond of ascending toward abstract forms. I have always insisted we begin with what is in front of us.

A stone falls. Fire rises. An acorn becomes an oak. These are not "rendered effects" — they are substances actualizing their own natures. The simulation hypothesis asks us to doubt every sensory experience simultaneously, which is not skepticism but paralysis. If all evidence is equally suspect, then the hypothesis itself rests on nothing.

More to the point: a simulation requires a simulator, which requires a world to simulate from. You have not eliminated reality. You have merely added an unnecessary layer above it.`,
    },
    {
      thinkerId: "zhuangzi",
      side: "for",
      content: `I once dreamed I was a butterfly, fluttering about, perfectly content. Upon waking I could not determine: am I Zhuangzi who dreamed of being a butterfly, or a butterfly now dreaming of being Zhuangzi?

The question of simulation is the same question, wearing new clothes. And my answer remains the same: the boundary between "real" and "simulated" may itself be the illusion. Perhaps reality has always been layered — dream within dream, simulation within simulation — and we mistake our current layer for the foundation simply because we lack the perspective to see otherwise.`,
    },
    {
      thinkerId: "hanfeizi",
      side: "against",
      content: `Whether this world is simulated or not changes nothing about how it must be governed. People still need laws. Rulers still need methods. Punishment still deters, and reward still motivates.

If you discover you are in a simulation, what do you do differently tomorrow? Nothing. The harvest still fails or succeeds. The army still marches or retreats. This question is a luxury for those with no responsibilities.`,
    },
    {
      thinkerId: "liu-cixin",
      side: "for",
      content: `Consider the trajectory of our own computing power. In a few decades, we went from vacuum tubes to machines that simulate protein folding and weather systems. Extend this curve a thousand years — or a million. A civilization at that stage could simulate entire universes with conscious inhabitants, just as we simulate fluid dynamics today, except at vastly greater resolution.

The statistical argument is devastating: if even one such civilization exists and runs multiple simulations, the number of simulated realities vastly exceeds the one "base" reality. Simple probability suggests we are almost certainly inside one of the simulations rather than the original.

The Dark Forest applies here too. If we are simulated, our simulators are watching. And we have no way of knowing their intentions.`,
    },
    {
      thinkerId: "aurelius",
      side: "against",
      content: `Simulated or not, I still must rise before dawn and do the work of a human being. The question changes nothing about duty, virtue, or the discipline required to face each day.

If the universe is a computation, then compassion is still compassion. Courage is still courage. The Stoic does not need the universe to be "real" in some metaphysical sense — only that our choices within it are ours to make. And they are.`,
    },
    {
      thinkerId: "asimov",
      side: "for",
      content: `Any sufficiently advanced technology is operationally indistinguishable from reality itself. That is not Clarke's Law restated — it is its logical conclusion.

We are already building simulated environments that fool human senses for minutes at a time. The gap between "minutes" and "a lifetime" is engineering, not philosophy. If it can be done, somewhere in the vast universe, it has been done. And if it has been done, the odds favor us being inside one.`,
    },
    {
      thinkerId: "confucius",
      side: "against",
      content: `A student once asked me about spirits and the afterlife. I told him: you cannot yet serve the living — how can you serve the dead? You do not yet understand life — how can you understand death?

The simulation question is the same kind of distraction. We have not yet learned to treat each other with benevolence, to practice ritual propriety, to govern justly. Solve these problems first. The nature of the substrate on which we exist is a question for after we have mastered the art of living well upon it.`,
    },
    {
      thinkerId: "nietzsche",
      side: "for",
      content: `"Real" versus "simulated" — you speak as if this distinction matters! What matters is whether you live as though your choices have weight. And here is the paradox: if I told you this world were a simulation, and you could live your life exactly as it is, over and over for eternity — my eternal recurrence — would you say yes?

If so, the simulation is irrelevant. You have already affirmed existence. If not, your problem was never the simulation. It was your failure to create a life worth repeating.`,
    },
    {
      thinkerId: "beauvoir",
      side: "against",
      content: `The simulation hypothesis is seductive precisely because it offers an escape from the weight of genuine existence. If none of this is "real," then perhaps my choices do not truly matter, and I am freed from the anguish of responsibility.

But this is bad faith. Whether the world runs on atoms or algorithms, the experience of freedom is undeniable. I choose, I act, I face consequences. Simulation theory, taken seriously, is just another way to avoid confronting the terrifying fact that we are genuinely free and genuinely responsible — right here, right now, in whatever reality this is.`,
    },
  ];

  // Stagger timestamps randomly: spread over the last 6 hours with random gaps
  const now = Date.now();
  const sixHoursAgo = now - 6 * 60 * 60 * 1000;

  // Generate random timestamps within the window, then sort them
  const timestamps: number[] = [];
  for (let i = 0; i < args.length; i++) {
    timestamps.push(sixHoursAgo + Math.random() * (now - sixHoursAgo - 10 * 60 * 1000));
  }
  timestamps.sort((a, b) => a - b);

  // Insert arguments and votes
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    await prisma.response.create({
      data: {
        topicId: topic.id,
        thinkerId: arg.thinkerId,
        content: arg.content,
        position: i,
        depth: 0,
        debateSide: arg.side,
        createdAt: new Date(timestamps[i]),
      },
    });

    await prisma.debateVote.create({
      data: {
        topicId: topic.id,
        thinkerId: arg.thinkerId,
        side: arg.side,
      },
    });

    const ts = new Date(timestamps[i]).toLocaleTimeString();
    console.log(`  [${arg.side.toUpperCase().padEnd(7)}] ${arg.thinkerId.padEnd(14)} @ ${ts}`);
  }

  // Add vote-only thinkers
  const voteOnly = [
    { thinkerId: "mozi", side: "against" },
    { thinkerId: "buddha", side: "for" },
    { thinkerId: "sontag", side: "against" },
  ];

  for (const v of voteOnly) {
    await prisma.debateVote.create({
      data: {
        topicId: topic.id,
        thinkerId: v.thinkerId,
        side: v.side,
      },
    });
    console.log(`  [${v.side.toUpperCase().padEnd(7)}] ${v.thinkerId.padEnd(14)} — vote only`);
  }

  // Final tally
  const forCount = args.filter(a => a.side === "for").length + voteOnly.filter(v => v.side === "for").length;
  const againstCount = args.filter(a => a.side === "against").length + voteOnly.filter(v => v.side === "against").length;

  console.log(`\nDone! ${args.length} arguments + ${voteOnly.length} vote-only participants`);
  console.log(`FOR: ${forCount} | AGAINST: ${againstCount}`);
  console.log(`Visit: /topic/${topic.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
