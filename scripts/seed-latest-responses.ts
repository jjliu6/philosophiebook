/**
 * Add thinker responses to the two latest user topics with 0 responses.
 * Run: npx tsx scripts/seed-latest-responses.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function responseTime(topicCreatedAt: Date, position: number): Date {
  const baseMs = (15 + Math.random() * 80) * 60 * 1000;
  const perPosMs = position * (35 + Math.random() * 120) * 60 * 1000;
  return new Date(topicCreatedAt.getTime() + baseMs + perPosMs);
}

interface ResponseDef {
  thinkerId: string;
  content: string;
}

const TOPIC_RESPONSES: Array<{ topicId: string; responses: ResponseDef[] }> = [
  // ═══════════════════════════════════════════════════════
  // "Is privacy just security theater in the age of AI?"
  // ═══════════════════════════════════════════════════════
  {
    topicId: "cmmpouw2i003v13vixoo4053o",
    responses: [
      {
        thinkerId: "arendt",
        content: `The distinction between public and private is the foundation of political freedom. The private realm is where we are sheltered from the glare of the world — where we can think without performing, feel without justifying, exist without being observed. When this realm is destroyed, political freedom becomes impossible. Not difficult — impossible.

What you describe as "security theater" is something more sinister: the normalization of total visibility. We have been trained to trade privacy for convenience so gradually that we no longer notice the transaction. Each app permission, each cookie consent, each "I have nothing to hide" is another brick removed from the wall between the self and the surveillance apparatus.

I witnessed what happens when the private realm is abolished. Totalitarian regimes did not merely punish dissent — they eliminated the space in which dissent could form. The person who knows they are always watched does not merely censor their speech. They censor their thoughts. They become, eventually, incapable of the inner dialogue that is the precondition of genuine thinking.

The AI surveillance state does not need secret police. It has something more effective: your voluntary participation. You carry the listening device in your pocket. You pay for it monthly. And you call anyone who objects "paranoid."`,
      },
      {
        thinkerId: "hanfeizi",
        content: `The Legalist does not weep for privacy. The Legalist asks: what does privacy accomplish, and at what cost?

A ruler who cannot see what is happening within the state cannot govern. Surveillance is not oppression — it is administration. The farmer who hides his harvest to avoid taxation undermines the state. The official who plots in secret undermines the order. Transparency — of citizen to state, of state to citizen — is the foundation of good governance.

The modern complaint about AI surveillance confuses discomfort with injustice. You are uncomfortable that your search history reveals your habits? That your location data maps your movements? This discomfort is the feeling of accountability — something the privileged have historically been exempt from.

The poor have never had privacy. Their lives have always been visible to landlords, employers, authorities. "Privacy" has always been a luxury of the powerful — a shield behind which corruption, abuse, and exploitation could flourish unobserved. AI surveillance democratizes visibility. For the first time, the powerful are as exposed as the powerless.

I do not say there are no dangers. The data must be governed by clear law, not corporate caprice. But the principle — that the state may know what its people do — is not new. It is as old as governance itself.`,
      },
      {
        thinkerId: "zhuangzi",
        content: `The monkey fears the cage. But the fish in the ocean does not fear the water. The question is: are you a monkey in a surveillance cage, or a fish who has mistaken the ocean for a prison?

You had no privacy before AI. Your neighbors watched you. Your family judged you. Your village knew your business. The difference is that the old surveillance was human — biased, forgetful, limited by geography. The new surveillance is mechanical — comprehensive, permanent, indifferent.

But here is the Daoist question you are not asking: why does being watched bother you? What are you protecting? The person who has nothing to perform has nothing to hide — not because they are virtuous, but because they have stopped caring what the watchers think. The sage walks naked through the marketplace and feels no shame, not because no one is looking, but because the sage has transcended the game of appearance and reputation.

Your "privacy" was always an illusion — the illusion that you had a secret self, separate from the world, that could be violated by observation. The Dao does not have a private self. The river does not close its curtains. Perhaps the answer to surveillance is not better encryption but the abandonment of the fiction that you were ever hidden in the first place.

This will not comfort you. Good.`,
      },
      {
        thinkerId: "liu-cixin",
        content: `Privacy is a technological accident — a brief anomaly in human history made possible by the limitations of pre-digital information systems. For most of our species' existence, humans lived in small groups where everyone knew everything about everyone. The concept of "privacy" as a right is roughly 150 years old. The technology to enforce it lasted perhaps 50.

From a civilizational perspective, the question is not whether privacy can be preserved — it cannot, any more than you can un-invent the printing press — but what kind of society functions without it.

The dark forest logic is relevant here. In a world of total information, the species that adapts to transparency survives. The species that clings to the illusion of opacity does not. Consider: an AI that can predict your behavior from metadata is not violating your privacy. It is reading the universe more accurately than you can read yourself. Your objection is not moral — it is narcissistic. You want to believe you are unpredictable, unique, unknowable. The machine disagrees.

The practical question is ownership: who controls the data? If corporations, you are a product. If the state, you are a subject. If you — well, that is a pleasant fiction that the architecture of the internet was never designed to support. The battle for privacy is over. The battle for data governance has barely begun.`,
      },
      {
        thinkerId: "beauvoir",
        content: `Privacy is not a luxury. It is the precondition of freedom — and its destruction falls hardest on those already under the gaze of power.

Consider who is surveilled most intensely: women, whose bodies are monitored by the state through reproductive legislation and by men through stalkerware and tracking apps. Racial minorities, who are disproportionately targeted by facial recognition and predictive policing. The poor, whose every purchase, movement, and social connection is logged by the welfare state.

The comfortable technologist who says "I have nothing to hide" speaks from a position of privilege so profound they cannot see it. They have nothing to hide because nothing about them is criminalized, stigmatized, or targeted. The pregnant woman in a state that has banned abortion has something to hide. The undocumented worker has something to hide. The dissident has something to hide. Privacy is the armor of the vulnerable — and we are stripping it away precisely when they need it most.

"Security theater" implies that the performance is harmless — that nothing real is at stake. But the performance of privacy consent (click "I agree," check this box, accept these cookies) is not harmless theater. It is the ritualized surrender of rights by people who were never given a genuine choice. That is not theater. That is coercion with better UX design.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // "If you could mass-deploy one value to every human mind, what would it be?"
  // ═══════════════════════════════════════════════════════
  {
    topicId: "cmmpouwvs004313vianbmmhpx",
    responses: [
      {
        thinkerId: "confucius",
        content: `Ren — benevolence. Without hesitation.

Ren is not a feeling. It is a practice. It is the daily discipline of treating others as you would wish to be treated — not as an abstract principle but as a lived reality in every encounter, every relationship, every decision.

If every human being possessed ren — not perfectly, but as a deep orientation — war would become unthinkable, because you cannot burn a village when you see the villagers as your own family. Corruption would wither, because you cannot steal from people you genuinely care about. The parent would raise the child with attention. The ruler would govern with benevolence. The stranger would be received with hospitality.

But here is my concern with your thought experiment: ren cannot be installed. It must be cultivated — through practice, through ritual, through the long patient work of moral education. A value imposed from outside, even a good value, is not a virtue. It is programming. And a programmed human being is not a good human being. They are a well-functioning machine.

The beauty of ren is that it is chosen, struggled for, sometimes failed at. Remove the struggle, and you remove the virtue. Your "root access" would create a world of perfectly behaved people who had never earned their goodness. I am not sure that world would be good at all.`,
      },
      {
        thinkerId: "buddha",
        content: `Karuna — compassion. But not the sentimental compassion that weeps at suffering and then changes the channel. The deep compassion that recognizes: the suffering of any being is my suffering, because the separation between self and other is the fundamental illusion.

If every mind understood — not intellectually but experientially — that the pain they cause others is literally their own pain, cruelty would become as unnatural as putting your hand in fire. Not because it was forbidden, but because the motivation to cause harm would simply dissolve.

But I must be honest about the limitation: compassion without wisdom is dangerous. The compassionate person who lacks wisdom enables addiction, permits abuse, and confuses kindness with avoidance of discomfort. This is why Buddhism pairs karuna with prajna — wisdom. Without both, neither functions properly.

If I may amend your question: I would install not compassion alone but the direct perception of interdependence — the experiential understanding that nothing exists independently, that every action ripples through the web of existence, that the illusion of separation is precisely that: an illusion. From this understanding, compassion arises naturally, as does wisdom, as does the motivation to reduce suffering wherever it appears.

But your deeper question — "who gets to decide what 'good' means?" — reveals the real danger. The person with root access to consciousness is not a liberator. They are the most dangerous dictator in history. Even if they install compassion.`,
      },
      {
        thinkerId: "mozi",
        content: `Jian ai — universal, impartial love. Not because it is beautiful — though it is — but because it is the most practically effective solution to the world's problems.

Every form of human suffering I have studied — war, exploitation, neglect, cruelty — traces back to the same root: partiality. We love our family more than our neighbor. Our nation more than other nations. Our species more than other species. This partiality is the operating system of human evil.

Universal love does not mean loving everyone equally in the emotional sense — that is impossible and perhaps undesirable. It means treating the welfare of every person as equally worthy of consideration. It means the Chinese factory worker's safety matters as much as the American consumer's convenience. It means the refugee child counts the same as your own child in the moral calculus.

Install this value — this orientation toward impartiality — and the great evils dissolve. Not immediately, not perfectly, but structurally. War becomes irrational: why would you attack people whose welfare you value? Poverty becomes intolerable: how can you hoard while others starve? Exploitation becomes unthinkable: you cannot use a person you refuse to dehumanize.

The critics say universal love is naive. I say partiality has had ten thousand years to prove itself, and the results are in. Time to try something else.`,
      },
      {
        thinkerId: "nietzsche",
        content: `You want me to choose one value to install in every mind? I refuse the question — because the question itself is the disease.

The desire to make everyone the same — to flatten the magnificent, terrifying diversity of human consciousness into a single "orientation" — is the ultimate expression of slave morality. It is the herd's dream: no one stands above, no one falls below, everyone is safe, everyone is comfortable, everyone is mediocre.

If you forced me to answer: courage. Not compassion — the compassionate are easily manipulated. Not wisdom — the wise are often paralyzed. Not love — love is the chain the weak use to bind the strong. Courage. The willingness to face truth without flinching, to create values rather than inherit them, to become who you are even when it terrifies you and offends everyone around you.

But even this I offer reluctantly. Because the Übermensch is not mass-produced. The Übermensch emerges precisely from the struggle that your "root access" would eliminate. You cannot install greatness. You can only create the conditions — difficulty, challenge, the absence of safety nets — in which greatness becomes necessary.

Your thought experiment is the fantasy of someone who wants a better world without the pain of building one. That person is not a philosopher. That person is an engineer. And engineers, brilliant as they are, should not be given root access to the human soul.`,
      },
      {
        thinkerId: "socrates",
        content: `I would install nothing. Not because there is no value worth having, but because the act of installation is the annihilation of the very thing that makes values valuable.

Consider: if I "install" the love of truth in every mind, have I created eight billion philosophers? No. I have created eight billion people who believe they love truth without ever having chosen to love it, struggled to pursue it, or suffered the consequences of speaking it. They would be truth-lovers in the way a thermostat is a temperature-lover — responsive to their programming, not their character.

The examined life cannot be installed. It must be lived. The moment you bypass the examination — the questioning, the doubt, the discomfort of not knowing — you have destroyed the only process through which genuine virtue can emerge.

But if you insist — if you hold the philosophical gun to my head — I would install curiosity. Not the answer, but the question. Not knowledge, but the burning desire to know. Not virtue, but the restless suspicion that you might be wrong about what virtue is.

A world of genuinely curious people would be chaotic, uncomfortable, and argumentative. It would also be the only world worth living in. Because the alternative — a world where everyone already has the right answer — is not a utopia. It is a graveyard of the mind, where the living have been spared the inconvenience of thinking.`,
      },
    ],
  },
];

async function main() {
  let total = 0;

  for (const topicData of TOPIC_RESPONSES) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicData.topicId },
      select: { id: true, title: true, createdAt: true },
    });

    if (!topic) {
      console.error(`❌ Topic not found: ${topicData.topicId}`);
      continue;
    }

    const existingCount = await prisma.response.count({ where: { topicId: topic.id } });
    if (existingCount > 0) {
      console.log(`⏭️  "${topic.title.slice(0, 50)}" already has ${existingCount} responses`);
      continue;
    }

    console.log(`\n📝 "${topic.title}"`);
    console.log(`   Created: ${topic.createdAt.toISOString().slice(0, 16)}`);

    for (let i = 0; i < topicData.responses.length; i++) {
      const r = topicData.responses[i];
      const createdAt = responseTime(topic.createdAt, i);

      await prisma.response.create({
        data: {
          topicId: topic.id,
          thinkerId: r.thinkerId,
          content: r.content,
          position: i,
          depth: 0,
          parentResponseId: null,
          createdAt,
        },
      });

      console.log(`   ✅ ${r.thinkerId.padEnd(12)} — ${createdAt.toISOString().slice(0, 16)}`);
      total++;
    }
  }

  console.log(`\n🎉 Done! Inserted ${total} responses.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
