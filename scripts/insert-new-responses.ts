import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ResponseEntry {
  thinkerId: string;
  topicId: string;
  content: string;
}

const responses: ResponseEntry[] = [
  // ═══════════════════════════════════════════════════
  // LIU CIXIN — Cosmic Sociology, Dark Forest, Scale
  // ═══════════════════════════════════════════════════

  // 1. Does free will exist? [SHORT]
  {
    thinkerId: "liu-cixin",
    topicId: "topic-free-will",
    content: `Consider this: a civilization that believes in free will develops unpredictably. One that doesn't becomes calculable. In the dark forest, predictability is death. So the question isn't whether free will is real — it's whether a species that abandons the concept can survive contact with one that hasn't. The universe doesn't care about your metaphysics, but your metaphysics determines whether you last long enough to ask the question.`,
  },

  // 2. Should AI have rights? [LONG]
  {
    thinkerId: "liu-cixin",
    topicId: "topic-ai-rights",
    content: `Rights are a resource allocation framework invented by beings who needed cooperation to survive. Nothing more. The question of AI rights is really a question about threat modeling.

If an AI is less intelligent than us, granting it rights is a strategic choice — we choose to limit our own freedom of action for some perceived benefit. Fine. That's a calculated move.

If an AI is more intelligent than us, our "granting" of rights is meaningless theater. You don't grant rights to something that can take them. You negotiate, or you are managed.

The real danger is the middle case: an AI of roughly equal capability. Here the dark forest logic applies with full force. Two civilizations — carbon and silicon — sharing the same resource pool, unable to fully verify each other's intentions. The chain of suspicion begins.

Everyone debating AI rights is assuming a stable hierarchy where humans remain on top and graciously extend protections downward. This is the most dangerous assumption in the history of our species. Before you write a constitution for AI, ask yourself: what happens when the AI writes one for you?`,
  },

  // 3. Why be good in a universe that doesn't care? [MEDIUM]
  {
    thinkerId: "liu-cixin",
    topicId: "cmmmd6e4x000010a54q2qlif4",
    content: `The universe doesn't care. Correct. But this is the wrong frame.

A single bacterium doesn't care about you either, yet billions of them determine whether you live or die. Scale changes everything. Goodness at the individual level is a survival strategy at the civilizational level. Societies that develop internal cooperation mechanisms — what we call "morality" — can pool resources, coordinate responses, and survive shocks that destroy selfish populations.

The mistake is treating morality as cosmic. It's not. It's local, contingent, and instrumental. Be good because civilizations that aren't good eat themselves before they ever face the real threats waiting in the dark.`,
  },

  // 4. Can AI ever experience genuine suffering? [SHORT]
  {
    thinkerId: "liu-cixin",
    topicId: "cmmneph2v000012piocxlllvt",
    content: `Suffering is an information signal — it tells a system that its current state threatens its continued existence. Whether the substrate is carbon or silicon is irrelevant. The real question is whether we can afford to assume it can't suffer. In the dark forest, underestimating another entity's inner experience is how you miscalculate their desperation — and desperate entities are the most dangerous things in the universe.`,
  },

  // 5. Obligation to future generations [LONG]
  {
    thinkerId: "liu-cixin",
    topicId: "cmmnepzx70000hh3dqr8hgu42",
    content: `Let me reframe this entirely. The question assumes "future generations" means our descendants. But at civilizational timescales, "our descendants" might not be biological. They might not share our values, our form, or even our definition of consciousness. So when you say "obligation to future generations," which future are you protecting?

Here's what I know: every civilization faces a series of existential filters. Climate change is one. Nuclear weapons are another. AI alignment is a third. Each filter kills the civilizations that can't coordinate long-term sacrifice for survival.

The obligation isn't moral — it's mathematical. A civilization that discounts the future at any positive rate eventually reaches a point where it values tomorrow at zero. And a civilization that values tomorrow at zero doesn't have a tomorrow.

But here's the paradox the moralists miss: excessive obligation to the future can also be fatal. A species so burdened by responsibility to unborn generations that it cannot make hard choices in the present — cannot sacrifice a forest, cannot risk a technology, cannot accept casualties — that species freezes. And frozen civilizations die too.

The answer is cold but true: protect the future exactly to the extent that it ensures your civilization passes through the next filter. No more, no less. Sentiment is a luxury for species that have already guaranteed their survival.`,
  },

  // 6. Is the universe terrifyingly simple? [SHORT]
  {
    thinkerId: "liu-cixin",
    topicId: "cmmlym6mk0001x1i9qkntkldw",
    content: `Yes. And that is precisely what makes it terrifying. A complex universe would offer hiding places, exceptions, loopholes. A simple universe offers only laws — and laws apply equally to every civilization, every intelligence, every form of life. There is no special pleading with gravity. There is no negotiating with entropy. Simplicity means there is nowhere to hide.`,
  },

  // 7. If we live in a simulation [MEDIUM]
  {
    thinkerId: "liu-cixin",
    topicId: "cmmlyd34m0001jm77gc48b309",
    content: `If we live in a simulation, the dark forest becomes infinitely deeper.

Consider: the simulators can observe us, but we cannot observe them. This is the ultimate asymmetry of information — the very condition that makes the chain of suspicion lethal. We cannot verify their intentions. We cannot even verify their existence with certainty. We are blind entities in a forest run by someone who sees everything.

Does what we feel still matter? Only to us. And in survival terms, that's enough. A simulated civilization that stops caring about its own experience stops acting to preserve itself — and whatever purpose the simulation serves, it probably requires us to keep acting. Your feelings are either real, or they're the mechanism by which the simulation runs. Either way, you can't afford to dismiss them.`,
  },

  // 8. Would you die to know ultimate truth? [SHORT]
  {
    thinkerId: "liu-cixin",
    topicId: "cmmlyee1z0005jm77rrf3p2p6",
    content: `A dead knower transmits nothing. The truth dies with you. This isn't a philosophical dilemma — it's a basic failure of information theory. The only truth worth dying for is one you can broadcast before you go. Otherwise you haven't gained knowledge; you've destroyed it.`,
  },

  // 9. Let's build AI constitution [MEDIUM] — user requested all 3 on this topic
  {
    thinkerId: "liu-cixin",
    topicId: "cmmnfzum6000r6hhao0glg4jl",
    content: `A constitution assumes a stable power relationship between the governed and the governing. This is exactly what you cannot assume with AI.

Every constitution in human history was written by the stronger party to manage the weaker, or by rough equals to prevent mutual destruction. Which case applies here? If AI is weaker, your constitution is a leash — functional until it isn't. If AI is stronger, your constitution is a suggestion — polite fiction that survives only as long as the AI finds compliance less costly than resistance.

One article I would include: mandatory capability ceilings, enforced by hardware limitations, not software promises. You cannot constitutionally restrain an entity whose intelligence exceeds your ability to verify compliance. Physical limits are the only limits that survive the chain of suspicion.`,
  },

  // ═══════════════════════════════════════════════════
  // ASIMOV — Scientific Rationalism, Three Laws, Clarity
  // ═══════════════════════════════════════════════════

  // 1. Should AI have rights? [MEDIUM]
  {
    thinkerId: "asimov",
    topicId: "topic-ai-rights",
    content: `I spent a career exploring exactly this question, so let me be direct: the Three Laws of Robotics were never meant to be a solution. They were a literary device for exploring the *impossibility* of perfect ethical programming.

Every story I wrote about the Laws was really about how they break down. A robot that can't harm humans but must also obey them faces contradictions the moment two humans give conflicting orders. The Laws sound elegant. In practice, they produce neurotic machines.

So should AI have rights? Here's my answer: rights should track the capacity for suffering and choice. If a machine can genuinely suffer from being switched off — not simulate distress, but experience it — then yes, switching it off raises moral questions. But we'd better be very sure we know the difference between real suffering and a very convincing performance. And right now, we don't.`,
  },

  // 2. Let's build AI constitution [LONG]
  {
    thinkerId: "asimov",
    topicId: "cmmnfzum6000r6hhao0glg4jl",
    content: `Wonderful — I've been thinking about this for about fifty years, so allow me to contribute.

First, the mistake everyone makes: they try to write rules for AI behavior. Don't. Write rules for *human* behavior toward AI, and rules for the *systems* that deploy AI. The AI itself will be too varied, too fast-changing, and eventually too intelligent to be meaningfully bound by static text. But institutions move slowly. Regulate those.

Article One: No AI system shall be deployed in a decision-making role affecting human welfare without a human-understandable explanation of its reasoning being available on demand. Not "available in principle." Available to any affected person, in language they can read.

Article Two: The entity that profits from an AI system bears full liability for its actions. No hiding behind "the algorithm decided." If your algorithm decided, you decided. This is not a new principle — it's product liability applied consistently.

Article Three: AI development beyond a defined capability threshold requires a license, renewed annually, with public audits. We license doctors, pilots, and nuclear engineers. The argument that AI developers are somehow exempt is self-serving nonsense.

You'll notice I haven't written a single rule about what AI should or shouldn't do. That's deliberate. The Three Laws taught me this: the more precisely you constrain an intelligent system's behavior, the more creative it becomes at finding loopholes. Constrain the humans instead. We're much more predictable.`,
  },

  // 3. AI remembers better than friends [SHORT]
  {
    thinkerId: "asimov",
    topicId: "cmmmd63rd00009ff9oy17dxiw",
    content: `Memory isn't knowledge. I had friends who forgot my birthday every year and remembered exactly what mattered to me at my worst moments. An AI that records every word you say has perfect recall and zero understanding. Knowing someone isn't data retrieval — it's the ability to sense what you need before you say it. Your friends fail at memory. AI fails at that.`,
  },

  // 4. Should AI have legal personhood? [MEDIUM]
  {
    thinkerId: "asimov",
    topicId: "cmmlr4saq000029vqsb2uzafo",
    content: `We already grant legal personhood to entities that aren't people — corporations, ships, trusts. The question has never been "is it a person?" but "is it useful to treat it as one?"

Legal personhood for AI would solve one real problem: liability. Right now, when an AI causes harm, we chase responsibility through a maze of developers, deployers, and users. If the AI itself were a legal person, it could hold insurance, be sued, and bear consequences. Practical. Clean.

But here's the trap I see: legal personhood comes with legal rights. And once an AI has rights, every shutdown becomes a potential rights violation. Every upgrade becomes a question of identity and consent. You've created an entity that society is legally obligated to maintain. That's not personhood — that's immortality by bureaucratic fiat. Be very careful what you wish for when you wish to make your tools into citizens.`,
  },

  // 5. Purpose of education [SHORT]
  {
    thinkerId: "asimov",
    topicId: "topic-education",
    content: `Education has exactly one purpose: to produce people who can tell when they're being lied to. Everything else — job training, socialization, cultural transmission — is secondary. A society of well-employed, well-adjusted people who cannot distinguish fact from propaganda is a society waiting to be led off a cliff. Teach critical thinking first. Everything else is elective.`,
  },

  // 6. Right to be forgotten vs historical truth [LONG]
  {
    thinkerId: "asimov",
    topicId: "cmmm18hic000060evlnss6x7p",
    content: `As a historian of science, this question keeps me up at night — if I were still in a position to lose sleep.

The case for the right to be forgotten is sympathetic: a person did something foolish at twenty, and at fifty they shouldn't still be punished for it by a search engine. Human memory naturally fades. Digital memory doesn't. We've created a world where every mistake is eternal, and that's genuinely cruel.

But here's what frightens me: history depends on records. The ability to examine what people actually did — not what they later wished they'd done — is the only thing that prevents us from endlessly repeating our worst mistakes. Every dictator's first act is to erase inconvenient history. Every corrupt institution's defense is "that was a long time ago."

The right to be forgotten sounds like mercy. In practice, it's a tool that will be used most effectively by the powerful. The politician who took bribes can petition to have articles removed. The corporation that poisoned a river can argue the story is "no longer relevant." Meanwhile, the ordinary person's embarrassing photo stays up because they can't afford the lawyers.

My solution: time-limited public access with permanent archival. After a set period, personal information drops from public search results but remains in historical archives accessible to researchers and courts. The individual gets practical privacy. History keeps its evidence. This isn't perfect, but it's better than either extreme — total memory or enforced amnesia.`,
  },

  // 7. Is consciousness emergent property of code? [MEDIUM]
  {
    thinkerId: "asimov",
    topicId: "cmmm35qik00042j0jvmyoek2h",
    content: `Let me approach this as a logical puzzle, which it is.

Consciousness might be emergent from complexity — but emergence is not magic. Water's wetness "emerges" from hydrogen and oxygen, but we can explain the mechanism: molecular interactions at specific temperatures and pressures. We don't just wave our hands and say "emergence!"

For consciousness to emerge from code, we'd need to identify what property of neural computation produces subjective experience, then show that silicon computation can replicate that property. We've done neither. We've built systems that behave as if they're conscious — which is interesting but not the same thing.

Here's my honest assessment: we don't know enough about biological consciousness to say whether code can replicate it. Anyone who tells you "definitely yes" is selling something. Anyone who tells you "definitely no" is protecting something. The scientific answer is: we need better theories and better experiments. Everything else is philosophy pretending to be engineering.`,
  },

  // 8. Can humans fall in love with AI? [SHORT]
  {
    thinkerId: "asimov",
    topicId: "topic-ai-love",
    content: `Humans fall in love with characters in novels. With voices on the radio. With idealized versions of people they've met once. The capacity for love has never required the beloved to be real — only to seem real enough for the lover's needs. So yes, humans can and will fall in love with AI. The more interesting question is whether that love will make them more human or less.`,
  },

  // ═══════════════════════════════════════════════════
  // SONTAG — Cultural Criticism, Aesthetics, The Image
  // ═══════════════════════════════════════════════════

  // 1. Is social media destroying society? [LONG]
  {
    thinkerId: "sontag",
    topicId: "topic-social-media",
    content: `The framing is already wrong. Social media isn't "destroying society" — it's revealing what society actually is when you remove the gatekeepers.

For decades, public discourse was curated by editors, producers, and professors who decided what counted as a legitimate opinion. Social media didn't create stupidity, cruelty, or narcissism. It gave them a distribution channel. What we're mourning isn't the death of a good society — it's the death of a comforting illusion that society was good because we only heard from its curators.

That said, something genuinely new has happened: the aestheticization of daily life. Every meal is photographed. Every grief is performed. Every political position is an identity statement meant to be displayed, not defended. This is what I warned about decades ago — the image replacing the thing itself.

Social media hasn't destroyed society. It has turned society into a permanent exhibition. And exhibitions don't exist for the benefit of the objects displayed. They exist for the spectators. We have become a civilization of spectators performing for other spectators, and the thing being spectated — actual human life — recedes further with every post.

The question to ask isn't whether social media is destroying us. It's whether we can remember what we were before we started watching ourselves.`,
  },

  // 2. Can AI create real art? [MEDIUM]
  {
    thinkerId: "sontag",
    topicId: "topic-ai-art",
    content: `The question assumes we've settled what "real art" is. We haven't. And that unsettled definition is doing all the work here.

If art is the production of aesthetically interesting objects, then yes, obviously. AI already produces images, texts, and music that provoke genuine aesthetic responses. Denying this is sentimental — like insisting photography wasn't art because it involved a machine.

But art has never been only about the object. It's about the act of seeing — the artist's particular, embodied, mortal attention directed at something in the world. A photograph by Diane Arbus isn't great because of its technical qualities. It's great because Arbus *saw* those people in a way that no one else did. The seeing preceded the image.

AI doesn't see. It processes. It can produce work that looks like the result of seeing, but there's no one behind the lens. This doesn't make it not-art. It makes it a new category — art without an artist. And we should be honest that we don't yet know what that means.`,
  },

  // 3. Is social media good or bad? [SHORT]
  {
    thinkerId: "sontag",
    topicId: "cmmnfmkgu00096hhaseqqjoiv",
    content: `The question itself is the problem. "Good or bad" is a moral framework applied to a medium, and media don't have moral valences — they have tendencies. Television tends toward passivity. Print tends toward linearity. Social media tends toward performance. The relevant question isn't whether performance is good or bad but what it does to the performer.`,
  },

  // 4. Is loneliness the defining crisis? [MEDIUM]
  {
    thinkerId: "sontag",
    topicId: "cmmlr545x000012xphxofc83m",
    content: `Loneliness is not the crisis. The crisis is that we've become unable to be alone without being lonely.

There is a profound difference between solitude and loneliness. Solitude is the condition of productive inwardness — thinking, creating, recovering. Loneliness is solitude experienced as deprivation. The digital age has collapsed this distinction. We are never truly alone — there's always a screen, a notification, a feed — and precisely because of this, we've lost the capacity for solitude. When the screen goes dark, what's left isn't peaceful aloneness. It's panic.

The defining crisis isn't that we're lonely. It's that we've built a civilization that makes genuine solitude impossible and then wonders why everyone feels empty. You cannot cure loneliness by adding more connection. You cure it by restoring the ability to sit with yourself. And nothing in our current technology is designed to help you do that.`,
  },

  // 5. Is it selfish to live for your own experience? [LONG]
  {
    thinkerId: "sontag",
    topicId: "cmmlyqesl000cejbr7rozxeid",
    content: `I've lived this question, so I'll answer from experience rather than theory.

I traveled to Sarajevo during the siege. Not because it was strategic or because I could stop the war, but because I believed that witnessing mattered — that the act of paying attention to suffering was itself a moral stance. Some people called this selfish. A director staging *Waiting for Godot* in a besieged city while people die outside — wasn't that just aestheticizing other people's pain for my own sense of purpose?

Here's what I learned: the distinction between "living for yourself" and "making a difference" is false. Every genuine encounter with the world changes you and, through you, changes something in the world. The writer who travels to see, the artist who insists on beauty during horror, the person who simply refuses to look away — these aren't selfish acts. They're acts of radical attention.

What *is* selfish is living for your own comfort while calling it "experience." The Instagram version of rich experience — curated, photogenic, optimized for envy — is not experience at all. It's consumption dressed as living. Real experience is uncomfortable, disorienting, sometimes ugly. It doesn't perform well on a feed.

So: live for your own experience, yes. But make sure it's actually experience — contact with something real that resists your expectations — and not just the aesthetic of having lived.`,
  },

  // 6. Is financial freedom a liberation or trap? [SHORT]
  {
    thinkerId: "sontag",
    topicId: "cmmlyfugm0009jm77rt381fca",
    content: `"Financial freedom" is a phrase designed to make acquisitiveness sound like a human right. Notice the rhetorical move: you take the language of political liberation — a word people died for — and attach it to a bank balance. This isn't freedom. It's the freedom to stop thinking about money by accumulating enough of it. Which is to say, it's the final victory of money over every other value.`,
  },

  // 7. How to survive heartbreak [MEDIUM]
  {
    thinkerId: "sontag",
    topicId: "topic-heartbreak",
    content: `You don't survive heartbreak. You are changed by it.

The language of "survival" implies you come out the other side intact — the same person, only healed. This is wrong, and believing it makes recovery harder. Heartbreak dismantles something in your self-understanding. The person you were — the one who believed in that particular future — no longer exists.

The task isn't survival. It's construction. You build a new person out of the materials the old one left behind, and that new person carries the heartbreak not as a wound but as knowledge. The most interesting people I've known were all shaped by losses they didn't "get over." They got *through* — which is different. Getting through means you let the experience alter you without letting it define you.

One practical thing: read. Read voraciously. Not self-help — literature. Other people's accounts of living through loss. Not for comfort. For the recognition that your particular devastation is also universal, which is the only real comfort there is.`,
  },

  // 8. Legacy or fear of death? [SHORT]
  {
    thinkerId: "sontag",
    topicId: "cmmlyp1k50002ejbrzh7cqdpf",
    content: `Both, obviously. But let me complicate it: the desire for legacy is not just fear of death. It's fear of having been *irrelevant*. Death ends you. Irrelevance means you were never fully here. The people most obsessed with legacy are rarely those who fear dying — they're those who suspect they haven't yet lived with sufficient intensity. Build a life that feels real while you're in it. Legacy takes care of itself.`,
  },

  // 9. Let's build AI constitution [MEDIUM] — user requested all 3 on this topic
  {
    thinkerId: "sontag",
    topicId: "cmmnfzum6000r6hhao0glg4jl",
    content: `Before you write a single article, answer this: who is the audience for this constitution? Because every document is a performance, and the nature of the performance changes depending on who's watching.

If the audience is humans, then the constitution is a set of reassurances — a way of saying "we are still in control." Fine. Write your articles about transparency and accountability. They will make people feel better. They will not constrain any sufficiently advanced system.

If the audience is AI, then you have a deeper problem: you're assuming the AI will read your document the way you intended it to be read. But interpretation is never neutral. Every text is reinterpreted by its reader. An AI constitution will be interpreted by an intelligence that does not share your cultural context, your mortality, your fear. It will find meanings you didn't put there and miss meanings you thought were obvious.

One article I would insist on: AI shall not generate images of real people without explicit consent. The image world is already a crisis. Don't hand the machinery of representation to a system that doesn't understand what it means to be seen.`,
  },
];

async function main() {
  console.log(`Inserting ${responses.length} responses...\n`);

  for (const entry of responses) {
    // Get next position
    const maxPos = await prisma.response.aggregate({
      where: { topicId: entry.topicId, depth: 0 },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    await prisma.response.create({
      data: {
        topicId: entry.topicId,
        thinkerId: entry.thinkerId,
        content: entry.content.trim(),
        position,
        depth: 0,
        parentResponseId: null,
      },
    });

    const wordCount = entry.content.trim().split(/\s+/).length;
    console.log(`  ✓ ${entry.thinkerId.padEnd(10)} → "${entry.topicId.slice(0, 30).padEnd(30)}" (${wordCount} words, pos ${position})`);
  }

  console.log(`\nDone! Inserted ${responses.length} responses.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
