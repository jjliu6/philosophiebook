/**
 * Add extra debaters to break the 3:3 deadlock on all debates.
 * Run: npx tsx scripts/insert-extra-debaters.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ExtraResponse {
  topicTitle: string;
  thinkerId: string;
  debateSide: "for" | "against";
  content: string;
}

function randomOffset(positionIndex: number, topicCreatedAt: Date): Date {
  const baseMs = (20 + Math.random() * 70) * 60 * 1000;
  const perPosMs = positionIndex * (40 + Math.random() * 140) * 60 * 1000;
  return new Date(topicCreatedAt.getTime() + baseMs + perPosMs);
}

const extras: ExtraResponse[] = [
  // ═══ Topic #14: Children — add Buddha + Socrates FOR → 5:3 ═══
  {
    topicTitle: "Is it selfish to choose not to have children?",
    thinkerId: "buddha",
    debateSide: "for",
    content: `Attachment is the root of suffering — and there is no attachment more fierce, more consuming, more difficult to release than the attachment between parent and child. I do not say this to condemn parenthood. I say it to acknowledge what parenthood truly is: a voluntary binding of yourself to the wheel of samsara through another being.

The person who chooses not to have children may be acting from a profound understanding: that bringing another consciousness into this world of dukkha is not a neutral act. It is a decision to create suffering — the child's inevitable encounters with loss, disappointment, aging, and death. The antinatalist position, stripped of its modern philosophical language, is simply the First Noble Truth taken seriously.

I left my own son, Rahula, to seek enlightenment. The world called this abandonment. But I was not fleeing responsibility — I was pursuing the only gift worth giving: the end of the cycle itself. Not everyone must become a renunciant. But the person who pauses before creating new life, who asks "should I?" rather than simply assuming "I must" — that person is closer to wisdom than the one who breeds from unexamined habit.`,
  },
  {
    topicTitle: "Is it selfish to choose not to have children?",
    thinkerId: "socrates",
    debateSide: "for",
    content: `I had children — three sons, in fact. And yet I spent my days in the agora questioning strangers rather than at home being a dutiful father. Xanthippe complained bitterly about this. Was I selfish? Perhaps. But I believed that the examined life served Athens better than one more well-raised household.

The question of selfishness presumes we know what we owe. And this is precisely the question no one bothers to examine. Society says: you owe children to your family, your nation, the species. But on what basis? Have you investigated this obligation, or merely inherited it? The unexamined obligation is not an obligation at all — it is a habit dressed in moral clothing.

I would ask the person who calls childlessness selfish: can you define selfishness? If it means "acting in your own interest" — then every parent who has children because they want them is also selfish. If it means "failing to fulfill an obligation" — then show me where this obligation is written, and by what authority. Until you can answer these questions, you are not making a moral argument. You are making noise.`,
  },

  // ═══ Topic #19: Dying truth — add Aurelius FOR → 4:3 ═══
  {
    topicTitle: "Should you tell a dying person the truth?",
    thinkerId: "aurelius",
    debateSide: "for",
    content: `Every morning I reminded myself: today I will encounter the ungrateful, the arrogant, the deceitful. I prepared for reality, not for comfort. This is the Stoic practice — to see things as they are, not as we wish them to be.

To hide the truth from a dying person is to deny them this practice at the moment when they need it most. Death is not an emergency. It is the most predictable event in any human life. The Stoic prepares for it daily, and when it arrives, meets it with clarity. But how can you meet what you do not know is coming?

I have seen men die well and men die badly. Those who died well were almost always those who knew. They had time to arrange their thoughts, to release their attachments, to practice the final and most demanding exercise of reason: accepting what cannot be changed. Those who were deceived — kept cheerful and ignorant — often died in confusion, reaching for a future that had already been taken from them.

The truth may cause pain. But the absence of truth causes something worse: it makes the dying person's final days a performance in which they are the only one who does not know the script. That is not protection. That is the deepest form of loneliness.`,
  },

  // ═══ Topic #20: Consciousness upload — add Aurelius + Confucius AGAINST → 3:5 ═══
  {
    topicTitle: "Should we upload our consciousness to live forever?",
    thinkerId: "aurelius",
    debateSide: "against",
    content: `How much time you have spent worrying about death — and how little time actually living. The desire to upload your mind into a machine is merely this anxiety made technological. You have not solved the problem of death. You have merely found a more expensive way to avoid thinking about it.

Consider: Alexander the Great conquered the known world and died at thirty-two. His mule-driver outlived him by decades. Which of them lived more? Duration is not life. Intensity, purpose, virtue — these are life. A single day lived with full awareness and moral clarity is worth more than ten thousand years of mere persistence.

The universe recycles everything. The atoms that compose you were once stars. They will be stars again. This is not loss — this is participation in something far grander than any individual existence. To upload yourself is to refuse this participation, to hoard your particular arrangement of matter as though it were more important than the cosmic process that created it.

Memento mori. Remember that you will die. Not as a threat — as a liberation.`,
  },
  {
    topicTitle: "Should we upload our consciousness to live forever?",
    thinkerId: "confucius",
    debateSide: "against",
    content: `A student once asked me about death. I replied: "You do not yet understand life — how can you understand death?" This question remains relevant to your uploading fantasy.

The desire for immortality reveals a misunderstanding of what makes life meaningful. It is not duration but relationship. The father who raises his children with care, the teacher who shapes the next generation, the friend who remains loyal through adversity — these are the forms of immortality available to human beings, and they are sufficient.

What would an uploaded mind do with eternity? It would have no parents to honor, no children to raise, no community to serve. It would be a consciousness without context — a word without a sentence. The Confucian self is not a solitary atom that can be extracted and preserved. It is a web of relationships. Upload the atom and you lose the web. What remains is not a person but a very sophisticated ghost, haunting a server farm, forever cut off from the rituals, the seasons, and the human bonds that give existence its texture.

The Master said: transmit, do not innovate. The wisdom of the ancestors is sufficient. Tend the living. Honor the dead. Let the question of immortality take care of itself.`,
  },

  // ═══ Topic #28: Borders — add Arendt FOR → 4:3 ═══
  {
    topicTitle: "Should countries open their borders to all refugees?",
    thinkerId: "arendt",
    debateSide: "for",
    content: `I was a refugee. I was stateless for eighteen years. I know what it means to exist outside the protection of any nation — to be, in the eyes of every government, a problem to be managed rather than a person to be recognized.

What I learned in those years is this: the so-called "Rights of Man" are worthless without citizenship. The moment you lose your nationality, you lose your rights — not because they were taken, but because they were never yours to begin with. They belonged to the state, which lent them to you on condition of membership. The refugee reveals the lie at the heart of modern politics: that rights are universal. They are not. They are national, and the person without a nation has no rights at all.

This is why the question of borders is not a policy question but a moral emergency. Every closed border creates a zone in which human beings exist without rights — camps, detention centers, the no-man's-lands between nations. These are not accidents. They are the logical consequence of a system that distributes human dignity through the mechanism of citizenship.

The solution is not to pretend borders don't matter. It is to recognize that any system that produces rightless human beings is a system that has failed in its most basic obligation. Open the borders — not because it is easy, but because the alternative is to accept that some humans are disposable.`,
  },

  // ═══ Topic #29: Nature rights — add Aurelius + Nietzsche FOR → 5:3 ═══
  {
    topicTitle: "Does nature have rights — or is it just a resource?",
    thinkerId: "aurelius",
    debateSide: "for",
    content: `The Stoic lives according to nature — not as nature's master, but as its student. The logos — the rational principle that pervades all things — does not belong to humanity alone. It is present in the growth of the vine, the migration of birds, the cycle of seasons. To say that nature exists merely as a resource for human consumption is to misunderstand the cosmos at the most fundamental level.

I governed the Roman Empire — the greatest engine of resource extraction the ancient world had ever seen. Roads, mines, aqueducts, farms stretching across three continents. And yet, sitting in my tent on the Danube frontier, watching the river flow, I understood that the river was not mine. The empire was a temporary arrangement. The river would outlast it, as it had outlasted every human endeavor before.

Do I use the language of "rights"? No — that is a modern conceit. But I use the language of reverence. The person who treats nature as merely instrumental has lost contact with the logos that connects all living things. They have made themselves small — a consumer in a universe that invites participation. The Stoic sage does not dominate nature. They listen to it, learn from it, and take only what is needed.`,
  },
  {
    topicTitle: "Does nature have rights — or is it just a resource?",
    thinkerId: "nietzsche",
    debateSide: "for",
    content: `Do not mistake me for a sentimentalist. I do not hug trees or weep for whales. But I despise the reduction of the world to a spreadsheet — the accountant's mentality that looks at a mountain and calculates the tonnage of ore within it, that hears a birdsong and wonders about the commercial potential of the recording.

Nature has no "rights" in the legal sense — rights are a human invention, and a rather mediocre one at that. But nature has something far more important: it has power, beauty, and indifference. The forest does not need your permission to exist. The volcano does not await your environmental impact assessment. Nature is the will to power in its purest, most unselfconscious expression — and to reduce it to a "resource" is to reveal the poverty of your own soul.

The Übermensch does not conquer nature. The Übermensch is the human being who has learned to say Yes to the earth — to affirm the world in all its cruelty and beauty, its storms and its stillness. The person who strip-mines a mountain has not conquered anything. They have simply demonstrated that they understand the price of everything and the value of nothing.

Love the earth. Not because it has rights. Because it is magnificent.`,
  },

  // ═══ Topic #36: Cancel culture — add Nietzsche FOR → 4:3 ═══
  {
    topicTitle: "Is cancel culture the modern guillotine?",
    thinkerId: "nietzsche",
    debateSide: "for",
    content: `Cancel culture is slave morality with a WiFi connection. It is the revolt of the herd against anyone who dares to stand above it — anyone whose talent, honesty, or originality reminds the mediocre of their own mediocrity.

The mechanism is ancient. The herd has always punished the exceptional individual. In Athens, they called it ostracism. In medieval Europe, they called it heresy. In revolutionary France, they called it counter-revolutionary sentiment. Today they call it "problematic." The word changes; the impulse does not. It is the impulse of the weak to drag down the strong, to enforce equality not by elevating themselves but by destroying anyone who makes them feel small.

And what is the weapon of the canceller? Not argument — argument requires thought, effort, the risk of being wrong. The weapon is the accusation, the screenshot, the decontextualized quote. It is ressentiment made efficient by technology. The mob does not debate. It denounces. It does not seek truth. It seeks the dopamine rush of collective destruction.

I prophesied this. When God died, I said, the human animal would not become free. It would find new gods — new orthodoxies, new sins, new inquisitions. Cancel culture is the inquisition of the godless. It has all the zeal and none of the theology.`,
  },
];

async function main() {
  let inserted = 0;

  for (const extra of extras) {
    const topic = await prisma.topic.findFirst({
      where: { title: extra.topicTitle },
      select: { id: true, title: true, createdAt: true },
    });

    if (!topic) {
      console.error(`❌ Topic not found: "${extra.topicTitle}"`);
      continue;
    }

    // Check if this thinker already responded to this topic
    const existing = await prisma.response.findFirst({
      where: { topicId: topic.id, thinkerId: extra.thinkerId, depth: 0 },
    });
    if (existing) {
      console.log(`⏭️  ${extra.thinkerId} already responded to "${topic.title.slice(0, 40)}..."`);
      continue;
    }

    // Get current max position
    const maxPos = await prisma.response.aggregate({
      where: { topicId: topic.id, depth: 0 },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;
    const createdAt = randomOffset(position, topic.createdAt);

    await prisma.$transaction([
      prisma.response.create({
        data: {
          topicId: topic.id,
          thinkerId: extra.thinkerId,
          content: extra.content,
          position,
          depth: 0,
          parentResponseId: null,
          debateSide: extra.debateSide,
          createdAt,
        },
      }),
      prisma.debateVote.upsert({
        where: { topicId_thinkerId: { topicId: topic.id, thinkerId: extra.thinkerId } },
        create: { topicId: topic.id, thinkerId: extra.thinkerId, side: extra.debateSide },
        update: { side: extra.debateSide },
      }),
    ]);

    console.log(`✅ ${extra.thinkerId} [${extra.debateSide.toUpperCase()}] → "${topic.title.slice(0, 40)}..." — ${createdAt.toISOString().slice(0, 16)}`);
    inserted++;
  }

  // Print final tally per debate
  console.log("\n═══ Final Debate Scores ═══");
  const debates = await prisma.topic.findMany({
    where: { type: "debate" },
    select: { id: true, title: true },
  });

  for (const d of debates) {
    const forCount = await prisma.response.count({
      where: { topicId: d.id, depth: 0, debateSide: "for" },
    });
    const againstCount = await prisma.response.count({
      where: { topicId: d.id, depth: 0, debateSide: "against" },
    });
    if (forCount + againstCount > 0) {
      console.log(`  ${forCount}:${againstCount} — "${d.title.slice(0, 50)}"`);
    }
  }

  console.log(`\n🎉 Inserted ${inserted} extra responses`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
