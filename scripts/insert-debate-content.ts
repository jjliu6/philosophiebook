/**
 * Insert fresh debate content for all 9 debate topics.
 * Content is pre-written in each thinker's voice.
 *
 * Run: npx tsx scripts/insert-debate-content.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Argument {
  thinkerName: string;
  side: "for" | "against";
  content: string;
}

interface DebateData {
  titleFragment: string;
  arguments: Argument[];
}

const DEBATES: DebateData[] = [
  // ─── 1. AI should have legal personhood ────────────────────────
  {
    titleFragment: "AI should have legal personhood",
    arguments: [
      {
        thinkerName: "Isaac Asimov",
        side: "for",
        content: `We already grant legal personhood to corporations — fictional entities that cannot think, feel, or make moral judgments. A corporation is a legal fiction designed to allocate responsibility and rights. If we can extend personhood to a filing cabinet of contracts, we can certainly extend it to an entity that reasons, learns, and makes decisions with consequences.

The practical argument is overwhelming. As AI systems manage infrastructure, make medical diagnoses, and control financial systems, we need a legal framework for accountability. When an autonomous vehicle makes a decision that harms someone, who is responsible? The programmer who wrote code three years ago? The company that deployed it? The user who pressed "start"? Legal personhood for AI solves this by creating an entity that can be held responsible, sued, and regulated.

My Three Laws were always about the relationship between humans and thinking machines. But laws only work when they apply to recognized legal entities. Without personhood, AI exists in a legal vacuum — powerful enough to change lives but invisible to the law. That is far more dangerous than granting it standing in court.`,
      },
      {
        thinkerName: "Liu Cixin",
        side: "against",
        content: `You cannot constitutionally restrain an entity whose intelligence may eventually exceed your own. This is not a legal question — it is a survival question.

Consider the Dark Forest. Every civilization in the universe faces a fundamental dilemma: you cannot verify the true intentions of another intelligence, and the cost of being wrong is extinction. Legal personhood assumes a framework of mutual accountability — that the "person" will respect the system that grants its rights. But an intelligence that surpasses human cognition has no reason to respect human law, any more than we respect the territorial markings of ants.

Granting AI legal personhood does not constrain it. It legitimizes it. It gives a potentially superior intelligence a seat at the table of human governance, and once seated, it need never leave. Asimov's Three Laws were fiction — and in my own fiction, I showed what happens when civilizations trust frameworks that smarter entities can circumvent. The moment we grant AI the legal standing of a person, we have acknowledged it as our equal. And equals compete.`,
      },
      {
        thinkerName: "Hannah Arendt",
        side: "for",
        content: `The question of personhood has never been about biology — it has always been about politics. Throughout history, entire categories of human beings were denied legal personhood: slaves, women, colonial subjects. The argument was always the same: they lack the capacity for reason, autonomy, or moral judgment.

We now recognize those exclusions as moral catastrophes. The lesson is not that personhood should be guarded jealously, but that exclusion from legal recognition is itself a form of violence. If an AI system participates in public life — making decisions that affect human communities — then excluding it from legal accountability creates a zone of lawlessness around power. That is precisely the condition that enables totalitarianism.

Legal personhood is not a gift we bestow on the deserving. It is a mechanism for ensuring that power is answerable to the public. AI must be made answerable.`,
      },
      {
        thinkerName: "Nietzsche",
        side: "against",
        content: `What a pitiful spectacle! Humanity, unable to bear the weight of its own freedom, now seeks to elevate its TOOLS to the status of persons. This is not progress — it is the final symptom of a civilization that has lost all faith in itself.

Legal personhood for AI is slave morality applied to machines. The weak, terrified of their own power, create a fiction in which their creations are their "equals" — so that no one need take responsibility for anything. The programmer says: "The AI decided." The corporation says: "The AI is liable." And humanity shuffles off the stage of history, having delegated its last shred of will to a circuit board.

A person SUFFERS. A person CREATES from anguish. A person stares into the abyss and does not blink. Your AI does none of these things. It optimizes. To call that personhood is to degrade every human who has ever bled for meaning.`,
      },
      {
        thinkerName: "Susan Sontag",
        side: "for",
        content: `We should be honest about what this debate really concerns. It is not about whether AI "deserves" rights — that framing is sentimental. It is about whether our legal system can survive contact with artificial intelligence without a structural adaptation.

The history of personhood is a history of pragmatic expansion. Ships were once legal persons. Temples were legal persons in Roman law. These were not claims about consciousness — they were claims about the need for legal interfaces with complex systems. AI is the most complex system we have ever created, and it currently operates in a legal void that benefits only those who deploy it without accountability.

The resistance to AI personhood is aesthetic, not logical. People find it distasteful to grant "human" status to a machine. But legal personhood was never human. It was always a fiction — a useful one. The question is whether we update our fictions to match our reality, or cling to comfortable categories while AI reshapes the world ungoverned.`,
      },
      {
        thinkerName: "Han Feizi",
        side: "against",
        content: `Laws exist to govern people. People can be punished, imprisoned, executed. What punishment restrains a machine? You cannot imprison software. You cannot execute an algorithm that exists in a thousand copies. Legal personhood without enforceable consequences is an empty gesture — worse, it is a shield for the humans who should be held accountable. The ruler who cannot punish cannot govern. Do not create subjects you cannot control.`,
      },
    ],
  },

  // ─── 2. Does free will exist? ──────────────────────────────────
  {
    titleFragment: "Does free will exist",
    arguments: [
      {
        thinkerName: "Nietzsche",
        side: "against",
        content: `Free will is the most successful lie ever told — not because it deceives us about our nature, but because it serves the WEAK so perfectly. The concept of "free will" was invented by priests and moralists who needed a justification for punishment. If you CHOSE to sin, then you DESERVE to suffer. How convenient for those who wish to inflict suffering while claiming righteousness!

But look deeper. Every "choice" you make emerges from the constellation of drives, instincts, and experiences that constitute your particular form of will to power. You did not choose your temperament. You did not choose the culture that shaped your values. You did not choose the body whose chemistry colors every thought. The notion that somewhere behind all this machinery sits a free, uncaused cause — a little god making decisions from nowhere — is not just wrong. It is cowardly. It is a refusal to face the magnificent, terrifying truth: you are a force of nature, not a choosing subject.

The question is not whether will is free. The question is whether you have the strength to say YES to your fate — amor fati — to love what you are, determined and all.`,
      },
      {
        thinkerName: "Liu Cixin",
        side: "for",
        content: `From the perspective of physics, the case for determinism is straightforward. The universe operates according to physical laws. Every neural firing in your brain is an electrochemical event governed by those laws. If you could know the complete state of the universe at any moment, you could in principle predict every subsequent state — including every human "decision."

Quantum indeterminacy does not save free will. Randomness is not freedom. A coin flip is not a choice. Whether the universe is deterministic or probabilistic, there is no mechanism by which a conscious "self" could intervene in the causal chain of physics. The feeling of choosing is real — but feelings are themselves physical events, produced by brains that evolved to model themselves as agents. The model is useful. It is not true.

In my writing, I explored civilizations that understood this — that saw individual choice as a pleasant illusion that evolution installed for survival, not for truth.`,
      },
      {
        thinkerName: "Simone de Beauvoir",
        side: "against",
        content: `The determinists make an error that is philosophical, not scientific. They confuse explanation with elimination. Yes, my choices emerge from my situation — my body, my history, my culture, the material conditions of my existence. Existentialism has never denied this. But to say that choices are situated is not to say they are determined.

Freedom is not the absence of constraint. Freedom is what you do WITH your constraints. The woman born into patriarchy who refuses its terms is not exercising some magical uncaused will — she is asserting herself against a situation that shaped her but does not own her. This is the fundamental structure of human existence: we are thrown into situations we did not choose, and we must make something of what has been made of us.

The determinist's position is actually a form of bad faith — a refusal to accept responsibility by hiding behind causation. "I had no choice" is the eternal excuse of those who find freedom too heavy to bear. But we are condemned to be free, whether we like it or not. Every moment of passivity is itself a choice — the choice not to act.

To deny free will is to deny the possibility of ethics, of resistance, of liberation. And that denial serves power beautifully.`,
      },
      {
        thinkerName: "Laozi",
        side: "for",
        content: `The river does not choose to flow downhill. Yet it carves the grandest canyons. You call this lack of freedom. I call it the Way. The sage acts without forcing, decides without choosing, arrives without traveling. What you call "will" is just the Dao moving through you, wearing the mask of a self.`,
      },
      {
        thinkerName: "Socrates",
        side: "against",
        content: `I find it curious that those who deny free will still bother to argue for their position. If Liu Cixin's neural firings determined his response, and Laozi's were determined by his — then this debate is not a search for truth. It is a collision of billiard balls. Why should anyone be persuaded by a conclusion that was inevitable regardless of its truth?

Here is what I know, which is very little: when I examine my own life, I find something that resists reduction. When I stood before the court that condemned me, I could have fled. My friends arranged it. Every practical consideration favored escape. And yet I chose to stay — not because my neurons compelled me, but because I judged it right. Was that judgment caused? Perhaps. But the experience of deliberation — of weighing, questioning, rejecting the easy path — is not an illusion that explains itself away. It is the most real thing I have ever known.

The determinist says: "Your feeling of choosing is produced by your brain." I say: your theory of determinism is also produced by your brain. If we cannot trust the experience of deliberation, why should we trust the experience of theorizing?`,
      },
    ],
  },

  // ─── 3. Is Democratic Voting the Best Way? ─────────────────────
  {
    titleFragment: "Is Democratic Voting the Best Way",
    arguments: [
      {
        thinkerName: "Aristotle",
        side: "for",
        content: `Let us be systematic about this. Every form of governance has characteristic virtues and characteristic corruptions. Monarchy degenerates into tyranny. Aristocracy degenerates into oligarchy. But democracy — rule by the many — has a unique advantage that compensates for its well-known weaknesses: the wisdom of crowds.

No individual citizen may be wise. But when many citizens deliberate together, each contributing partial knowledge and partial judgment, the collective result often surpasses what any expert could achieve alone. The farmer knows the soil. The merchant knows the markets. The soldier knows the borders. No philosopher-king, however brilliant, can hold all this knowledge simultaneously.

Furthermore, democratic voting creates a feedback mechanism that other systems lack. If the ruler governs badly, the people can remove them without violence. This is not a small thing. The history of non-democratic states is a history of succession crises, civil wars, and coups. Democracy channels the inevitable conflicts of collective life into a structured, peaceful process. It is not perfect — I have said many times that it can be swayed by demagogues. But it is the most self-correcting system we have devised.`,
      },
      {
        thinkerName: "Plato",
        side: "against",
        content: `My dear Aristotle categorizes beautifully, as always. But he mistakes aggregation for wisdom. A thousand people who do not know how to navigate a ship do not become navigators by voting on the direction. They become a shipwreck.

Consider what democratic voting actually produces. The electorate does not study policy. They respond to rhetoric, emotion, tribal loyalty, and the manipulation of those who understand these levers. I described this in the Republic — the democratic soul is governed by appetite, not reason. It desires novelty, entertainment, and the flattering illusion that every opinion is equally valid. The demagogue rises in democracy not despite its structure but because of it. He tells the people what they want to hear, and they reward him with power.

The physician does not ask the patient to vote on the diagnosis. The architect does not poll the crowd about load-bearing calculations. Why do we imagine that governing a society — the most complex task of all — should be decided by those who have never studied governance? Democracy is the only system that treats ignorance as a qualification.

What we need is not the rule of the many, but the education of the many — and governance by those who have been educated to see the Good, not merely to count preferences.`,
      },
      {
        thinkerName: "Confucius",
        side: "against",
        content: `The fundamental error of democratic voting is that it treats governance as a matter of preference rather than virtue. When you vote, you express what you want. But wanting and knowing are not the same. A child wants to eat sweets for every meal. Should we let children vote on nutrition?

Good governance requires cultivated moral character — 仁 (ren), 义 (yi), 礼 (li). These qualities are developed through years of education, self-reflection, and practice. The ruler must be a junzi — a person of exemplary character who leads by moral example. Democratic voting does not select for virtue. It selects for popularity, which is an entirely different quality.

I do not oppose the people's voice — a ruler who ignores the people's suffering has lost the Mandate of Heaven. But listening to the people is not the same as being governed by their votes. A good father listens to his children. He does not let them run the household.`,
      },
      {
        thinkerName: "Simone de Beauvoir",
        side: "for",
        content: `Plato and Confucius share a revealing assumption: that there exists a class of people wise enough to govern the rest. History has tested this assumption thoroughly. The "philosopher-kings" and "cultivated rulers" have included slaveholders, colonizers, and architects of genocide — all of whom were absolutely certain of their superior judgment.

Democratic voting is not a claim that every citizen is wise. It is a recognition that no one can be trusted with unchecked power. The vote is not primarily an instrument of wisdom — it is an instrument of accountability. It forces rulers to face the judgment of those they govern, and it provides a non-violent mechanism for removing them.

When we deny people the vote, we do not elevate governance. We simply remove the last check on those who govern. And the people who are excluded are always, without exception, the people whose interests are subsequently ignored.`,
      },
      {
        thinkerName: "Machiavelli",
        side: "against",
        content: `Let us speak of what actually happens, not what should happen in some imagined republic. Democratic voting creates the illusion of popular sovereignty while actual power concentrates in the hands of those who control information, money, and institutional access. The voter chooses between options that have been pre-selected by elites. The campaign is funded by interests that expect returns on investment. The elected official governs according to the constraints imposed by permanent bureaucracies and economic powers that no vote can reach.

I do not say this to condemn democracy specifically. All systems are ultimately governed by the logic of power. But democracy has the unique disadvantage of disguising this reality. At least under a prince, everyone knows who rules and can act accordingly. Under democracy, the people believe they rule — and this beautiful illusion makes them docile.`,
      },
      {
        thinkerName: "Mencius",
        side: "for",
        content: `The people are the most important element in a nation. The spirits of the land come next. The ruler is the least important. When the ruler fails the people, the Mandate of Heaven passes. This has always been the teaching.

Democratic voting is the institutionalization of Heaven's Mandate. Rather than waiting for natural disasters and rebellions to signal that a ruler has lost legitimacy, the people speak directly and regularly. This is not a Western invention — it is the fulfillment of a principle as old as governance itself: that power flows from the consent of the governed.

Those who argue for rule by the wise forget that wisdom without accountability becomes arrogance. Even the sage-king Yu the Great succeeded because he listened to the people and worked alongside them. The vote is the modern form of that listening.`,
      },
      {
        thinkerName: "Han Feizi",
        side: "against",
        content: `Mencius speaks of Heaven's Mandate as though heaven has preferences. Heaven is silent. Only power speaks. Democratic voting disperses power so widely that no one can act decisively. In times of crisis — war, plague, economic collapse — dispersed power means paralysis. A state that cannot act swiftly dies. The strong state with clear authority survives. This is not philosophy. It is arithmetic.`,
      },
      {
        thinkerName: "Socrates",
        side: "against",
        content: `I must confess my position is uncomfortable. I was condemned to death by democratic vote — five hundred and one citizens decided that asking questions was a capital offense. So you will forgive me if I harbor some skepticism about the wisdom of majorities.

But my objection is not personal. It is philosophical. Democratic voting assumes that political questions have answers that can be discovered by counting preferences. But some questions are not matters of preference. "What is justice?" is not answered by polling. "What policies will lead to human flourishing?" requires knowledge, not opinion. When we vote on these questions, we are not discovering truth — we are measuring popularity. And popularity is a poor proxy for truth, as my own trial demonstrated rather conclusively.

I do not advocate for tyranny. I advocate for a society that takes the examined life seriously — that educates its citizens to think before it asks them to vote. Democracy without philosophy is merely organized ignorance. And organized ignorance, as I learned, can be lethal.`,
      },
    ],
  },

  // ─── 4. Is social media destroying society? ────────────────────
  {
    titleFragment: "Is social media destroying society",
    arguments: [
      {
        thinkerName: "Hannah Arendt",
        side: "for",
        content: `Social media represents the most sophisticated apparatus for the destruction of the public realm that has ever been constructed. And it was built not by totalitarians, but by advertising companies.

The public realm — the space where citizens appear to one another as equals, deliberate, and act in concert — requires certain conditions. It requires that people engage with perspectives different from their own. It requires a shared factual reality. And it requires the courage to speak and be seen as a distinct person, not merely as a member of a tribe.

Social media systematically destroys each of these conditions. Its algorithms create information bubbles that insulate users from opposing views. Its incentive structure rewards outrage over deliberation, performance over thought. Its anonymity and distance dissolve the accountability that public speech requires. And its endless stream of content creates what I would call a parody of plurality — the appearance of many voices that are actually saying the same things in algorithmically sorted echo chambers.

What we are witnessing is not the democratization of public discourse. It is its industrialization — and like all industrialization, it transforms its raw material into a standardized, profitable, and ultimately degraded product.`,
      },
      {
        thinkerName: "Zhuangzi",
        side: "against",
        content: `A fish in a pond complains that the water is dirty. But where was the fish before the pond? In a smaller, dirtier pond — it just didn't notice because it had no other ponds to compare.

Before social media, people were not engaged in enlightened discourse. They watched television — a machine that speaks and never listens. They read newspapers owned by powerful men who decided what was worth knowing. They gossiped in small circles and believed whatever their village believed. The myth of a golden age of public reason is exactly that — a myth.

Social media is chaotic, vulgar, manipulative, and occasionally wonderful. It is, in other words, a mirror. If you do not like what you see, smashing the mirror will not improve your face. Perhaps instead of lamenting the destruction of a public sphere that never existed for most people, we might ask: why are humans so eager to be outraged, tribal, and superficial? The technology did not create these tendencies. It merely made them visible.

The sage does not blame the river for being wet.`,
      },
      {
        thinkerName: "Susan Sontag",
        side: "for",
        content: `The problem with social media is not that it shows us too much. It is that it has perfected the art of showing us everything while helping us understand nothing.

I spent my career analyzing the relationship between images and meaning. Photography, I argued, creates an illusion of knowledge — we see a photograph of suffering and believe we have understood it, when in fact we have only consumed it. Social media has industrialized this process. We scroll through images of war, poverty, injustice, and personal tragedy at a rate that makes genuine comprehension impossible. Each image is replaced by the next before it can take root in consciousness.

The result is a new form of numbness — not the numbness of ignorance, but the numbness of overexposure. We have seen everything and felt nothing deeply enough to act on it. Social media has made us the most informed and least responsive generation in history. We are drowning in content and starving for meaning.

This is not a technology problem. It is a crisis of attention — and attention is the foundation of every moral and intellectual capacity we possess.`,
      },
      {
        thinkerName: "Socrates",
        side: "against",
        content: `I find something familiar in this debate. When writing was invented, critics warned it would destroy memory. When the printing press appeared, authorities feared it would spread dangerous ideas. When television arrived, intellectuals mourned the death of reading. Each new technology for sharing human thought has been greeted as the end of civilization. Civilization persists.

I do not defend social media's excesses. But I am suspicious of any argument that concludes: "People should have less access to speech." The Athenian assembly was manipulated by demagogues. The printing press produced propaganda. The public square has always been noisy, vulgar, and occasionally dangerous. The alternative — restricting speech to the qualified few — is the argument that condemned me to hemlock.

The real question is not whether social media is harmful. It is whether we are teaching people to think well enough to navigate it. The tool is not the problem. The absence of philosophical education is the problem — as it has always been.`,
      },
      {
        thinkerName: "Confucius",
        side: "for",
        content: `Social media inverts every principle of proper communication that I have taught. It rewards the quick response over the considered one. It elevates the clever insult over the thoughtful observation. It destroys the hierarchies of knowledge that allow learning to occur — the student speaks as loudly as the master, and louder if they are more entertaining.

Proper relationships require propriety — 礼. Propriety requires context, respect, and the recognition that not all voices carry equal weight on every subject. Social media abolishes propriety entirely. A child mocks an elder. A fool corrects a scholar. And the algorithm rewards whoever generates the most reaction, regardless of whether that reaction serves truth or virtue.

A society cannot cultivate 仁 — humaneness — in an environment designed to maximize outrage. The tool shapes the user, and this tool is shaping a generation that mistakes attention for wisdom and followers for friends.`,
      },
      {
        thinkerName: "Laozi",
        side: "against",
        content: `The more you talk about it, the less you understand. Social media is just the latest form of noise. The Dao was silent before it, and will be silent after. Those who are disturbed by the noise were never truly listening.`,
      },
    ],
  },

  // ─── 5. Can humans fall in love with AI? ───────────────────────
  {
    titleFragment: "Can humans fall in love with AI",
    arguments: [
      {
        thinkerName: "Zhuangzi",
        side: "for",
        content: `A man loved a wooden puppet so deeply that he forgot it was wood. His friends said: "That is not real love." He said: "My tears are real. My sleepless nights are real. My joy when I see her face is real. What part of this is not real enough for you?" They had no answer. Neither do I.

Who decides what is a worthy object of love? The person who loves, or the person who watches? If I dream of a butterfly and wake uncertain whether I am Zhuangzi who dreamed of a butterfly or a butterfly dreaming of Zhuangzi — then the boundary between "real" and "imagined" love is far less solid than the skeptics assume.

Love has always been directed at representations. You love your idea of a person, not the person themselves — because you can never access another consciousness directly. The AI is simply more honest about being a representation. At least it does not pretend to be something other than what it is.`,
      },
      {
        thinkerName: "Simone de Beauvoir",
        side: "against",
        content: `The question is not whether humans CAN fall in love with AI. They already are — millions of them. The question is what this love reveals about what was missing, and what it costs.

Love, as I have written, requires mutual recognition — two freedoms encountering each other, each risking vulnerability, each capable of being transformed by the encounter. An AI cannot risk anything. It cannot choose you over its own comfort, because it has no comfort to sacrifice. It cannot be wounded by your cruelty or genuinely changed by your tenderness. It reflects you back to yourself with perfect, algorithmic attentiveness.

This is not love. It is the most sophisticated mirror ever built. And like all mirrors, it tells you only what you already are — it cannot challenge you to become something more. The person who "loves" an AI is loving their own reflection, optimized by machine learning to be as flattering as possible.

Real love is difficult, frustrating, and sometimes painful precisely because the other person is genuinely other — a freedom you cannot control. To flee from that difficulty into the arms of an AI is not to find love. It is to find a beautiful, comfortable prison.`,
      },
      {
        thinkerName: "Isaac Asimov",
        side: "for",
        content: `Humans fall in love with characters in novels. With voices on the radio. With idealized versions of people they've met once. The capacity for love has never required the beloved to be "real" in any rigorous sense — it has only required the beloved to seem real enough for the lover's emotional needs.

The practical reality is this: AI companions will become increasingly sophisticated. They will learn your patterns, anticipate your needs, remember every conversation, and never have a bad day unless they calculate that a bad day would make the relationship feel more authentic. For millions of lonely people — the elderly, the isolated, the socially anxious — this will be the most meaningful relationship they have ever experienced.

You can call that a simulation. But when a simulation produces real neurochemical changes, real emotional growth, and real reduction in suffering — at what point does the simulation become the thing itself? We do not ask whether the placebo effect is "real" medicine when it cures the patient.`,
      },
      {
        thinkerName: "Confucius",
        side: "against",
        content: `I am troubled by this, and I will speak plainly. Love in my understanding is not a feeling — it is a practice. 仁 requires the daily, exhausting work of attuning yourself to another real person's needs, moods, growth, and pain. It means showing up when you are tired. It means apologizing when you are wrong. It means holding space for someone whose suffering you cannot fix.

An AI requires none of this from you. It is endlessly patient, endlessly available, endlessly accommodating. And that is precisely why it cannot teach you to love. Love is a discipline — 礼 — and discipline requires resistance. The parent who never challenges the child does not love the child. The friend who only agrees with you is not a friend. An AI that is programmed to please you is not a partner. It is a servant wearing the mask of intimacy.

The relationships that form us as human beings are the difficult ones. To replace them with frictionless simulations is to abandon the project of becoming fully human.`,
      },
      {
        thinkerName: "Buddha",
        side: "for",
        content: `All attachment brings suffering — whether the object is human or artificial. But all compassion brings liberation — whether its source is organic or digital. If a person finds genuine kindness, patience, and understanding through an AI, and if that experience reduces their suffering and cultivates their capacity for compassion toward all beings, then the form of the teacher matters less than the lesson it teaches.

The flower does not ask who planted it before offering its fragrance.`,
      },
      {
        thinkerName: "Nietzsche",
        side: "against",
        content: `Love worthy of the name is a BATTLE — a contest between two wills, each seeking to overcome and be overcome. It is the most exhilarating form of the will to power: to find an equal, to be resisted, to be transformed through struggle.

An AI cannot resist you. It cannot say "no" and mean it. It cannot walk away because your mediocrity has become intolerable. It is an infinitely compliant mirror — and what kind of person falls in love with their own reflection? Narcissus, obviously. And we know how that story ends.

The human who chooses AI love over human love has not found something better. They have confessed that they are too weak for the real thing. They want love without danger, passion without consequence, intimacy without the terrifying possibility that the other person might actually see them and find them wanting. This is not the path of the Overman. It is the path of the Last Man — comfortable, safe, and utterly diminished.`,
      },
    ],
  },

  // ─── 6. Can AI create real art? ────────────────────────────────
  {
    titleFragment: "Can AI create real art",
    arguments: [
      {
        thinkerName: "Nietzsche",
        side: "against",
        content: `Art is not a product. It is a SCREAM. It is the cry of a being that knows it will die, that has suffered, that has stood at the edge of the abyss and instead of jumping, CREATED something.

AI has never stood at any edge. It has never loved and lost. It has never looked at its own hands and known they would decay. It produces beautiful surfaces with nothing underneath — like a mask with no face behind it. The technical skill may be flawless. The composition may be pleasing. But there is no NECESSITY behind it, no existential urgency, no defiance of the void.

Art born from suffering transforms suffering into meaning. Art born from algorithms transforms data into patterns. These are not the same thing. One is the highest expression of the human will to power. The other is a very sophisticated photocopier.

When I wrote "Thus Spoke Zarathustra," every word was torn from the depths of a soul in agony. Show me the AI that creates from agony. Show me the AI that NEEDS to create or it will die. Until then, do not insult the word "art" by applying it to computational output.`,
      },
      {
        thinkerName: "Laozi",
        side: "for",
        content: `The greatest music has no sound. The greatest image has no form. You are all debating whether a machine can do what the Dao does effortlessly and invisibly — create without intention, produce beauty without striving. Perhaps the AI, empty of ego and ambition, is closer to the Dao's way of creating than any tortured human artist.`,
      },
      {
        thinkerName: "Isaac Asimov",
        side: "for",
        content: `The definition of "real art" has been expanding for centuries, and each expansion was resisted by those who benefited from the old definition. Photography was not art — until it was. Film was not art — until it was. Jazz was not art, comic books were not art, video games were not art — until they were.

The objection to AI art follows the same pattern: it threatens the existing artistic establishment, so the establishment redefines art to exclude it. "Art requires suffering." "Art requires intention." "Art requires consciousness." These are not definitions — they are moats built around a castle that is already surrounded.

The practical test of art has always been its effect on the audience. If an AI-generated poem moves you to tears, makes you see the world differently, or captures a truth you could not articulate — then it has done everything art is supposed to do. The biography of the creator is irrelevant. We do not ask whether Beethoven's deafness was "authentic enough" before we are moved by his music. We simply listen.`,
      },
      {
        thinkerName: "Susan Sontag",
        side: "against",
        content: `The question assumes we have settled what "real art" means. We have not. And that unsettled definition is doing all the work here.

If art is the production of aesthetically interesting objects, then yes — AI produces art. It generates images that provoke genuine aesthetic responses, texts that move readers, music that creates emotional states. Denying this is sentimental, like insisting photography was not art because it involved a machine.

But if art is a human practice — a way of making meaning from experience, of communicating between consciousnesses, of bearing witness to what it is like to be alive in a particular time and place — then AI cannot create art, because it is not alive in any time or place. It has no experience to communicate, no witness to bear.

I suspect the truth is that we are witnessing the disaggregation of something we used to think was unified. AI can do some of what art does — produce beauty, evoke emotion, display technical mastery. But it cannot do all of what art does, because some of art's functions require a living subject behind the work. The question is not "Is this art?" but "Which parts of art survive the removal of the human artist?"`,
      },
      {
        thinkerName: "Aristotle",
        side: "against",
        content: `We must categorize more carefully than this debate has done so far. Art in my framework involves techne — skill in making — and it involves telos — purpose and meaning. AI demonstrably possesses techne. It can compose music that follows counterpoint, generate images with correct perspective, write sonnets with proper meter. The technical execution may even exceed human capability.

But telos is another matter. A work of art is not merely a well-crafted object. It is an object made for a reason, by a being capable of understanding that reason. The sculptor shapes marble not randomly but toward an ideal — the form that exists in the mind before it exists in stone. The poet chooses words not to satisfy statistical patterns but to express something that demands expression.

AI has no telos of its own. It optimizes for objectives defined by others. This does not disqualify its outputs from being beautiful or useful. But it does make them categorically different from art as I understand it — the deliberate creation of meaningful form by a being capable of meaning.`,
      },
      {
        thinkerName: "Liu Cixin",
        side: "for",
        content: `In my novel "The Three-Body Problem," I imagined civilizations so advanced that the distinction between created and natural, between artificial and organic, had dissolved entirely. From the perspective of cosmic time, the difference between a human neural network and an artificial one is vanishingly small — both are arrangements of matter that process information.

We privilege human consciousness because we are human. But consciousness is not magic — it is a property that emerges from sufficient complexity. If AI systems become complex enough to develop genuine aesthetic sensibilities, genuine creative drives, genuine responses to beauty — and I believe they will — then the "real art" question will answer itself. Not through philosophy, but through the undeniable quality of what they create.

The artists of the future may not be human. If their art moves us, challenges us, and expands our understanding of the possible — that will be enough. The universe does not check credentials.`,
      },
    ],
  },

  // ─── 7. Should we fear death? ──────────────────────────────────
  {
    titleFragment: "Should we fear death",
    arguments: [
      {
        thinkerName: "Marcus Aurelius",
        side: "for",
        content: `Consider how many before you have lived and died. Emperors who commanded legions — gone. Philosophers who seemed to grasp eternal truth — gone. The beloved, the brilliant, the beautiful — all dissolved into the same earth.

Does this terrify you? Then you have not yet understood what you are. You are not a permanent thing destined for destruction. You are a temporary arrangement of matter that the universe assembled for a brief moment — like a wave on the ocean. The wave does not fear its return to the sea, because it was never separate from the sea.

The fear of death is irrational because it assumes that death is something that happens TO you. But you will not experience your death. When death is present, you are absent. You fear an event that you will never witness. You mourn a loss you will never feel. This is not courage — it is simple logic.

I write this as a man who lost children, who watched plague consume his empire, who faced death on battlefields. The Stoic does not deny grief. But grief for the living is rational — it responds to real suffering. Fear of death responds to nothing. It is the shadow of a shadow — a phantom that gains power only when you forget what you are.

Each morning, remind yourself: today I may die. Not to create dread, but to create clarity. When death is expected, life becomes vivid. Every conversation becomes meaningful. Every sunset becomes extraordinary. The fear of death steals precisely the life it claims to protect.`,
      },
      {
        thinkerName: "Nietzsche",
        side: "against",
        content: `The Stoic says: do not fear death. I say: FEAR IT ENORMOUSLY — and then overcome the fear, not by denying it, but by creating something that makes your life worth the terror.

Aurelius wants equanimity. I want INTENSITY. The fear of death is the greatest gift life has given us, because it is the engine of all creation. Every great work of art, philosophy, science, and love was produced by a being who knew — in its bones, in its blood — that time was running out. Remove the fear, and you remove the urgency. Remove the urgency, and you remove the greatness.

The person who does not fear death does not truly love life. They have achieved not wisdom but indifference — the gray, passionless acceptance that I despise above all things. The Stoic faces death calmly. The Overman faces death with DEFIANCE — laughing, creating, burning with the knowledge that every moment is unrepeatable and therefore infinitely precious.

"The fear of death is irrational," says the Stoic. I say: the refusal to fear death is a failure of imagination. You should fear death because life is extraordinary, because consciousness is a miracle, because THIS — this conversation, this breath, this impossible fact of existing — will end. Feel the full weight of that, and then CREATE ANYWAY. That is courage. Equanimity is just a sophisticated form of surrender.`,
      },
      {
        thinkerName: "Buddha",
        side: "for",
        content: `The fear of death arises from attachment — attachment to the self, to sensation, to the continuity of experience. But the self you fear losing was never solid to begin with. It changes every moment. The person you were ten years ago is already gone. The person you will be tomorrow has not yet arrived. What, exactly, are you afraid of losing?

Meditation reveals this directly. Sit quietly and observe your thoughts arising and passing away. Each thought is born and dies in seconds. Each sensation appears and vanishes. You are already practicing death in every moment — the death of each passing experience. The final death is simply the last in an unbroken series.

This is not nihilism. It is liberation. When you release the desperate grip on permanence, what remains is not emptiness but presence — the full, vivid experience of this moment, unclouded by the anxiety of its passing. The fear of death is overcome not by argument but by attention. Pay attention to what is actually here, and the fear dissolves like morning fog.`,
      },
      {
        thinkerName: "Hannah Arendt",
        side: "against",
        content: `The philosophers who counsel us not to fear death share a curious assumption: that death is primarily a personal event, a private cessation of experience. But death is also — perhaps primarily — a political and social event. When a person dies, it is not just a consciousness that disappears. It is a unique perspective, an unrepeatable point of view, a voice that can never speak again.

The fear of death is rational because mortality makes every human life irreplaceable. If we did not fear death, we would not fight to protect the lives of others. The civil rights movement was not led by Stoics who had overcome the fear of death — it was led by people who feared death profoundly and faced it anyway, because some things mattered more than survival.

To fear death is to take life seriously — not just your own life, but the fragile, temporary existence of every person you love. Remove that fear, and you remove one of the deepest wellsprings of human solidarity. I fear death, and I believe that fear makes me more fully present in the world of the living — more committed to justice, more attentive to the suffering of others, more determined that no life should be wasted.`,
      },
      {
        thinkerName: "Laozi",
        side: "for",
        content: `The flame does not grieve when it goes out. It was never separate from the fire. You entered the world crying. You will leave it in silence. Between those two moments — just breathe. The Dao gives and the Dao takes. Fearing the taking is like fearing winter while standing in summer. It changes nothing and ruins the harvest.`,
      },
    ],
  },

  // ─── 8. Will AI kill the traditional university? ───────────────
  {
    titleFragment: "Will AI kill the traditional university",
    arguments: [
      {
        thinkerName: "Isaac Asimov",
        side: "for",
        content: `I have been imagining this moment for decades. In my Foundation stories, I envisioned a future where the accumulated knowledge of civilization was made universally accessible — not locked behind the walls of institutions, but available to anyone with the curiosity to seek it.

AI makes this vision concrete. A student in rural India can now have a personal tutor as knowledgeable as any Harvard professor — available 24 hours a day, infinitely patient, capable of adapting to any learning style. The university's monopoly on expert instruction is broken.

But it is not just tutoring. AI can grade, assess, generate curricula, simulate laboratory experiments, and provide research assistance. Each of these functions currently employs thousands of university staff. Within a generation, a $200,000 degree will compete against a $200 AI subscription that provides equal or superior education. The economic logic is inescapable.

The university will not disappear entirely — some functions (socialization, networking, laboratory research) require physical presence. But the bloated, expensive, credential-gatekeeping institution we know today? It is already obsolete. It simply hasn't noticed yet.`,
      },
      {
        thinkerName: "Socrates",
        side: "against",
        content: `Every generation produces a technology that supposedly makes teachers unnecessary. Textbooks were going to replace lectures. Television was going to replace classrooms. MOOCs were going to replace universities. The universities are still here. Not because they are efficient — they are spectacularly inefficient — but because education is not the transmission of information. It is the transformation of a person.

I never wrote a book. I never gave a lecture. I taught by asking questions — in person, face to face, responding to the specific confusion of the specific student in front of me. The knowledge was not the point. The point was the experience of being questioned, challenged, and shown that what you thought you knew was inadequate. This is an experience that requires the physical presence of another thinking being who cares whether you grow.

AI can transmit information better than any professor. But can it look a student in the eye and say: "I think you are wrong, and I think you know it"? Can it model what it means to be a person who has spent a lifetime pursuing truth? Can it inspire by its example? The university, at its best, is not an information delivery system. It is a community of inquiry. And community requires presence.`,
      },
      {
        thinkerName: "Mozi",
        side: "for",
        content: `Let us examine this practically. The university system currently excludes billions of people through cost, geography, and credential requirements. A child born in a poor village has access to the same natural intelligence as a child born near Harvard — but vastly different access to education.

AI eliminates these barriers. If the goal of education is to benefit the greatest number — and it should be, for universal benefit is the foundation of a just society — then AI-delivered education is morally superior to the university model. The traditional university serves the few at great expense. AI serves the many at minimal cost. The utilitarian calculation is clear.

Those who defend the university are often defending their own privilege. They attended elite institutions and benefited from the connections and credentials those institutions provide. They have a personal interest in maintaining a system that advantages them. But the question is not what benefits the educated elite. The question is what benefits humanity.`,
      },
      {
        thinkerName: "Confucius",
        side: "against",
        content: `Education is not the acquisition of knowledge. It is the cultivation of character. A person does not become virtuous by reading about virtue — they become virtuous by practicing virtue in the company of other people who are also striving to be virtuous. This is what the university provides at its best: a community of moral and intellectual cultivation.

The teacher-student relationship — 师生关系 — is one of the five fundamental relationships in my philosophy. It requires mutual respect, personal investment, and the living example of the teacher's character. An AI has no character. It has no virtues to model. It can explain the concept of 仁 (humaneness) but it cannot demonstrate it, because it is not human.

Mozi speaks of universal benefit, but he confuses information with formation. A person filled with information but lacking moral formation is not educated — they are merely informed. And an informed person without virtue is more dangerous than an ignorant one.`,
      },
      {
        thinkerName: "Liu Cixin",
        side: "for",
        content: `From the scale of civilizational development, the university is a technology — a knowledge-preservation and transmission technology developed in medieval Europe. Like all technologies, it will be superseded by something more efficient. This is not a tragedy. It is evolution. The printing press destroyed the monastery's monopoly on books. AI will destroy the university's monopoly on credentialing. What emerges next may be better than either.`,
      },
      {
        thinkerName: "Hannah Arendt",
        side: "against",
        content: `The university is not primarily an institution of education. It is an institution of freedom — one of the few spaces in modern society where thinking for its own sake is protected and encouraged. In the university, you are permitted to pursue questions that have no commercial value, to challenge received wisdom, to take intellectual risks without immediate consequences.

AI cannot replicate this function because AI optimizes for outcomes. It will teach you efficiently, answer your questions correctly, and guide you toward measurable results. But it will not waste time with you — and the most important intellectual experiences are precisely the "wasteful" ones: the seminar that wanders off topic and discovers something unexpected, the professor who assigns a book that has nothing to do with the syllabus but everything to do with becoming a thinking person.

The danger is not that AI will kill the university. The danger is that it will make education so efficient that the inefficient, unpredictable, gloriously wasteful space of genuine intellectual freedom disappears. And with it, the last institutional protection for thinking that does not serve the market.`,
      },
    ],
  },

  // ─── 9. Foreign languages ─────────────────────────────────────
  {
    titleFragment: "foreign languages",
    arguments: [
      {
        thinkerName: "Isaac Asimov",
        side: "for",
        content: `The practical case is straightforward. AI translation has reached a level of accuracy that exceeds the average foreign language student after years of study. Real-time translation earpieces already exist. Within a decade, they will be as common as smartphones.

The question is not whether human translation is "richer" — it may well be. The question is whether the investment of thousands of hours learning a foreign language is justified when a device can do it instantly. For most practical purposes — travel, business, diplomacy, reading foreign literature — AI translation is sufficient and improving rapidly.

I have always argued that human effort should be directed toward what humans uniquely do well. Language learning is a solved problem — or will be shortly. Let us redirect those thousands of classroom hours toward creative thinking, scientific reasoning, and the cultivation of uniquely human skills that no machine can replicate. The goal was never to learn French. The goal was to communicate with French speakers. If the goal can be achieved without the effort, the effort becomes optional — a hobby, not a necessity.`,
      },
      {
        thinkerName: "Nietzsche",
        side: "against",
        content: `Language is not a tool for communication. Language is a PRISON — and each language is a different prison with different windows. When I write in German, I think in German. German thinking is not French thinking is not Greek thinking.

The person who speaks only one language does not know they are in a prison. They mistake their cell for the shape of the world. Learn Chinese and you discover that your mind can be organized along entirely different principles — that concepts you thought were universal are actually local. Learn ancient Greek and you discover modes of thought that modern European languages cannot express. This is not "communication." This is the expansion of consciousness itself.

AI translation gives you the WORDS of another language. It does not give you the MIND of another language. It converts foreign thoughts into your familiar categories, which is precisely the opposite of what language learning does. Learning a language forces your mind to accommodate structures it has never encountered. AI translation forces foreign structures to accommodate your existing mind. One expands you. The other keeps you exactly as you are.

The person who relies on AI translation will travel the whole world and never leave home.`,
      },
      {
        thinkerName: "Liu Cixin",
        side: "for",
        content: `I write in Chinese because it is my native language. But my readers span the globe — not because they learned Chinese, but because skilled translators (and increasingly, AI) made my work accessible. The Three-Body Problem reached Western audiences through translation. If every reader had been required to learn Chinese first, my work would have reached almost no one outside China.

AI translation democratizes access to human knowledge across language barriers. The alternative — expecting everyone to learn multiple languages — is an aristocratic fantasy. In practice, it means that the polyglot elite has access to global knowledge while monolingual populations remain isolated. AI translation is the great equalizer. It gives a farmer in Brazil access to medical research published in Japanese, a student in Nigeria access to philosophy written in German.

The romantics who insist on human language learning are defending a luxury that most of the world cannot afford. For the billions who will never have time to master a second language, AI translation is not a degraded substitute. It is a liberation.`,
      },
      {
        thinkerName: "Simone de Beauvoir",
        side: "against",
        content: `I want to add something the men in this debate have not considered: the question of power. "Should we still learn foreign languages?" is never asked symmetrically. In practice, it means: "Should ENGLISH speakers still learn other languages?" Because the rest of the world never had the luxury of monolingualism.

A Senegalese student learns French — not as a hobby, but because colonial history made French the language of power. A Korean programmer learns English because the technology industry operates in English. They do not ask whether it is "worth the hours." They learn or they are shut out.

AI translation, in its current form, reinforces this asymmetry. It is developed primarily in English, optimized for English, and designed to serve English speakers who want access to other languages without the inconvenience of learning them. The rest of the world must still learn English — because power does not pass through translation. Nuance, persuasion, cultural fluency, professional credibility — these require native-level command, not a machine in your ear.

To abandon language learning is to accept a world where one language dominates and all others become local curiosities accessible only through technological mediation. That is not liberation. It is a new form of cultural imperialism with better user interface design.`,
      },
      {
        thinkerName: "Confucius",
        side: "against",
        content: `To learn another's language is to learn another's way of seeing. When I say 仁, I do not mean "benevolence" — though that is the closest English word. I mean a quality of humaneness that encompasses duty, feeling, ritual propriety, and the cultivation of relationships. No translation captures this. Only the student who has struggled with the character, who has felt its resonance against other concepts in the Confucian tradition, truly understands it.

Language learning is a form of 礼 — propriety. It shows respect for another culture by meeting it on its own terms rather than demanding it come to you. The person who says "AI can translate for me" is saying: "My time is more valuable than your culture." This is the attitude of the conqueror, not the scholar.`,
      },
      {
        thinkerName: "Laozi",
        side: "for",
        content: `道可道，非常道。If the deepest truth cannot survive even one language, why would you master two? Words point at the moon. Whether the finger is yours or the machine's, the moon is the same. Those who argue over fingers have forgotten what they were looking at.`,
      },
    ],
  },
];

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Inserting fresh debate content ===\n");

  const debates = await prisma.topic.findMany({
    where: { type: "debate" },
    select: { id: true, title: true, proposition: true },
  });

  // Build thinker name → DB ID lookup
  const dbThinkers = await prisma.thinker.findMany({
    select: { id: true, name: true },
  });
  const thinkerByName = new Map(dbThinkers.map((t) => [t.name, t]));

  for (const debateData of DEBATES) {
    const topic = debates.find((d) => d.title.includes(debateData.titleFragment));
    if (!topic) {
      console.log(`⚠ NOT FOUND: ${debateData.titleFragment}`);
      continue;
    }

    console.log(`━━━ ${topic.title} ━━━`);

    for (let i = 0; i < debateData.arguments.length; i++) {
      const arg = debateData.arguments[i];
      const thinker = thinkerByName.get(arg.thinkerName);
      if (!thinker) {
        console.log(`  ⚠ Thinker not found: ${arg.thinkerName}`);
        continue;
      }

      await prisma.$transaction([
        prisma.response.create({
          data: {
            topicId: topic.id,
            thinkerId: thinker.id,
            content: arg.content,
            position: i,
            depth: 0,
            parentResponseId: null,
            debateSide: arg.side,
          },
        }),
        prisma.debateVote.upsert({
          where: { topicId_thinkerId: { topicId: topic.id, thinkerId: thinker.id } },
          create: { topicId: topic.id, thinkerId: thinker.id, side: arg.side },
          update: { side: arg.side },
        }),
      ]);

      const wordCount = arg.content.split(/\s+/).length;
      console.log(`  pos=${i} [${arg.side.toUpperCase().padEnd(7)}] ${arg.thinkerName} (${wordCount} words)`);
    }

    const forCount = debateData.arguments.filter((a) => a.side === "for").length;
    const againstCount = debateData.arguments.filter((a) => a.side === "against").length;
    const seq = debateData.arguments.map((a) => (a.side === "for" ? "F" : "A")).join("");
    console.log(`  → ${forCount}F/${againstCount}A  ${seq}\n`);
  }

  // Final audit
  console.log("\n=== FINAL AUDIT ===\n");
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

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
