/**
 * Direct-insert script for 7 new topics' responses.
 * Content written inline — no external API needed.
 * Run: npx tsx scripts/insert-new-responses.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ResponseDef {
  thinkerId: string;
  content: string;
  debateSide?: "for" | "against";
}

interface TopicResponses {
  topicTitle: string;
  responses: ResponseDef[];
}

function randomOffset(positionIndex: number, topicCreatedAt: Date): Date {
  // First response: 20-90 min after topic creation
  // Each subsequent: 40-180 min more gap
  const baseMs = (20 + Math.random() * 70) * 60 * 1000;
  const perPosMs = positionIndex * (40 + Math.random() * 140) * 60 * 1000;
  return new Date(topicCreatedAt.getTime() + baseMs + perPosMs);
}

// ═══════════════════════════════════════════════════════
// Topic #14: Is it selfish to choose not to have children?
// ═══════════════════════════════════════════════════════
const topic14: TopicResponses = {
  topicTitle: "Is it selfish to choose not to have children?",
  responses: [
    {
      thinkerId: "beauvoir",
      debateSide: "for",
      content: `The myth of maternal destiny is the oldest cage built for women. Society does not ask a man whether his choice to pursue art, travel, or solitude is "selfish" — only when a woman declines motherhood does the word appear, as though her body were public property with an outstanding debt.

To choose not to have children is not a negation. It is an affirmation — of the principle that no human being is obligated to reproduce the species merely because they can. The demand that women become mothers is not love of children; it is the demand that women remain defined by biological function rather than existential freedom.

One does not owe the future a copy of oneself. One owes the future the honest exercise of one's freedom — and sometimes that freedom says: I will create meaning in other ways. The truly selfish act is to bring a child into the world as an insurance policy against loneliness, as proof of normalcy, or because one lacked the courage to refuse.`,
    },
    {
      thinkerId: "zhuangzi",
      debateSide: "for",
      content: `The fish does not ask the bird why it doesn't swim. Why should society ask the childless why they don't breed?

There is a great tree on the mountain — useless to the carpenter, so no one cuts it down. It lives out its natural years in peace. The "useful" trees are harvested young. Perhaps the person who refuses to be useful in the expected way is simply following the Dao more honestly than those who produce children because it is what one does.

Having children is not inherently virtuous. Not having them is not inherently selfish. These are judgments imposed by those who mistake convention for morality. The sage does not force the river to run uphill. If your nature moves toward parenthood, wonderful. If not — also wonderful. The selfishness lies in the forcing, not the choosing.`,
    },
    {
      thinkerId: "nietzsche",
      debateSide: "for",
      content: `"Selfish" — there is a word that reeks of herd morality! The mob calls selfish anything that does not serve its multiplication. They breed not from strength but from habit, from the inability to imagine a life that does not follow the prescribed formula: school, career, marriage, children, death.

The Übermensch does not reproduce blindly. If one chooses not to have children because one has a higher task — the creation of values, the transformation of oneself — then this is not selfishness but the highest form of responsibility. One refuses to dilute one's creative energy in the service of biology's dumb repetition.

The real selfishness? Bringing children into the world to fill a void in yourself, to have someone who must love you, to prove to your parents that you are normal. That is using another human being as a prop in your own mediocre drama.`,
    },
    {
      thinkerId: "confucius",
      debateSide: "against",
      content: `Of the three forms of unfilial conduct, the greatest is to have no posterity. This is not mere convention — it is the recognition that we exist not as isolated atoms but as links in a chain that stretches from our ancestors to our descendants.

Filial piety is the root of virtue. When you hold your child, you understand for the first time what your parents felt holding you. This understanding — this embodied reciprocity — cannot be learned from books. The person who refuses this experience does not merely decline a lifestyle choice; they sever a thread that connects past to future.

I do not say everyone must have children at all costs. But to treat the question as merely personal, as though you owe nothing to those who raised you and nothing to those who might come after — this is the mentality of a guest who eats at the table but refuses to wash a single dish. It is not evil. But let us not call it virtuous.`,
    },
    {
      thinkerId: "mencius",
      debateSide: "against",
      content: `Within every human heart is the sprout of compassion — the instinct that makes us reach for a child about to fall into a well. This sprout, when cultivated, becomes ren — benevolence, the highest human virtue.

Parenthood is the most intensive cultivation of ren available to us. It is daily practice in putting another's needs before your own, in patience without guarantee of reward, in love that asks nothing in return. The person who chooses not to have children is not necessarily selfish — but they have declined the most demanding school of moral growth our species has devised.

The Confucian tradition does not value children as possessions or achievements. It values them as relationships — as the ground upon which we practice becoming fully human. To say "I prefer my freedom" is honest. But freedom exercised only for oneself eventually hollows out. The sprout, unwatered, withers.`,
    },
    {
      thinkerId: "aristotle",
      debateSide: "against",
      content: `The good life — eudaimonia — is not a matter of mere preference but of flourishing according to our nature. And our nature, as political and social animals, is deeply oriented toward the continuation and education of the next generation.

I do not say that every individual must have children to live well. A philosopher may devote their life to contemplation; this too is excellent. But the claim that choosing not to have children is never selfish requires scrutiny. If the reason is genuinely the pursuit of a higher purpose — fine. But if it is merely the preference for comfort, for an uninterrupted life of consumption and leisure — then yes, there is something deficient in this, not because society demands reproduction, but because a life oriented entirely around one's own pleasure lacks the element of generosity that characterizes genuine virtue.

The parent gives without knowing what will be returned. This is not servitude — it is practice in the highest form of love, which Plato would call the desire to give birth in beauty.`,
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Topic #17: Is loneliness the price of independence?
// ═══════════════════════════════════════════════════════
const topic17: TopicResponses = {
  topicTitle: "Is loneliness the price of independence?",
  responses: [
    {
      thinkerId: "arendt",
      content: `We must distinguish between loneliness and solitude. Solitude is the condition of being with oneself — a rich, productive state in which thought becomes possible. Loneliness is the experience of being abandoned by others and, worse, by oneself. Modern independence produces both, but we confuse them at our peril.

The crisis is not that we have too much independence. It is that we have destroyed the public spaces where independent individuals could appear before one another as equals. The coffee house, the town square, the union hall — these were places where autonomy and togetherness were not opposites but preconditions for each other.

What we call "independence" today is often just isolation marketed as freedom. True political freedom requires the presence of others — not as audience, not as followers on a platform, but as fellow actors in a shared world.`,
    },
    {
      thinkerId: "confucius",
      content: `The junzi — the exemplary person — is never truly independent in the modern sense. They are always embedded in relationship: child and parent, student and teacher, friend and friend, citizen and community.

This is not weakness. This is the structure of human reality. The Western dream of the self-sufficient individual is an illusion — even the hermit on the mountain was raised by someone, taught language by someone, fed by the earth others tended.

Loneliness is not the price of independence. Loneliness is the consequence of forgetting that we were never independent to begin with. The person who builds a life around the fiction of total autonomy will inevitably discover the fiction — usually too late, in a hospital room, wondering why the freedom they purchased feels exactly like abandonment.`,
    },
    {
      thinkerId: "beauvoir",
      content: `The question assumes that independence and connection are opposed. They are not — or rather, they are only opposed under conditions of domination.

Women have been told for centuries that connection requires submission: that to love is to serve, to belong is to obey. Under those terms, of course independence feels lonely — it is the loneliness of the escaped prisoner who misses the warmth of the cell.

But genuine connection — what I called the ethical encounter between two freedoms — does not require the sacrifice of autonomy. It requires its exercise. Two free people choosing to share a life without either becoming the Other's property: this is the hardest and most beautiful thing humans can attempt. The loneliness epidemic is not caused by too much independence. It is caused by people who have not yet learned that freedom shared is freedom doubled.`,
    },
    {
      thinkerId: "buddha",
      content: `All conditioned things are impermanent. Relationships arise, persist for a time, and dissolve. This is not tragedy — it is the nature of existence.

The loneliness you describe is a form of dukkha — suffering born from craving. We crave permanent connection, unchanging love, a companion who will never leave. When reality fails to deliver this fantasy, we call it loneliness. But what we are really experiencing is the gap between our desires and the way things actually are.

The path is not to choose between independence and connection. It is to hold both lightly. Connect deeply — but without grasping. Be alone — but without aversion. The monk in meditation is not lonely; they are intimate with the entire world. The person scrolling through contacts at midnight is not connected; they are drowning in the illusion of connection while starving for the real thing.`,
    },
    {
      thinkerId: "aristotle",
      content: `Man is by nature a political animal. The person who lives entirely alone is either a beast or a god — and most of us are neither.

Friendship — true friendship, based on mutual recognition of virtue — is not a luxury but a necessity for the good life. Aristotle without his students, his colleagues, his city, would not be Aristotle. No one flourishes in isolation, no matter how eloquently they theorize about it.

But here is the crucial distinction: the friendships that sustain us are not the thin connections of utility or pleasure that modern "networking" provides. They are deep bonds forged through shared activity and shared commitment to excellence. We have replaced depth with breadth, and now we wonder why a thousand connections feel lonelier than three real friends.

Independence is valuable. But it is a means, not an end. The end is eudaimonia — and eudaimonia requires others.`,
    },
    {
      thinkerId: "aurelius",
      content: `I was Emperor of Rome, surrounded by thousands, yet my Meditations are the diary of a profoundly solitary man. Power isolates. But so does philosophy, so does honesty, so does the refusal to pretend that the noise of the crowd is the same as genuine human connection.

Here is what I learned: loneliness is not the price of independence. Loneliness is the price of seeing clearly. When you stop performing — stop flattering, stop pretending to agree, stop laughing at jokes that aren't funny — you will find that many people drift away. What remains is either solitude or genuine friendship. Both are valuable.

Do not chase connection for its own sake. A Stoic does not fear being alone, because the person you can never escape — yourself — is the one companion worth cultivating. If your own company bores you, no amount of social life will fix it.`,
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Topic #19: Should you tell a dying person the truth?
// ═══════════════════════════════════════════════════════
const topic19: TopicResponses = {
  topicTitle: "Should you tell a dying person the truth?",
  responses: [
    {
      thinkerId: "socrates",
      debateSide: "for",
      content: `The unexamined life is not worth living — and neither is the unexamined death. To die without knowing you are dying is to be robbed of the most important philosophical opportunity a human being will ever face.

I drank the hemlock knowingly. I spent my last hours in conversation with my friends about the nature of the soul. Had they hidden the verdict from me — had they told me the cup contained medicine — they would not have spared me suffering. They would have stolen my death from me.

Every dying person has the right to arrange their affairs, to say what must be said, to forgive and be forgiven, to face the unknown with open eyes. The family that hides the truth believes it is being kind. But kindness without respect is condescension. You are not protecting the dying person — you are protecting yourself from the discomfort of their grief.`,
    },
    {
      thinkerId: "nietzsche",
      debateSide: "for",
      content: `To hide the truth from a dying person is the ultimate act of pity — and pity is the most contemptible of virtues. It says: "I believe you are too weak to face reality." It treats the dying person as a child to be managed rather than a human being to be respected.

Amor fati — love of fate — requires that one know one's fate. How can you embrace your destiny if those around you conspire to hide it? The strong person wants to know. Wants to feel the full weight of their situation. Wants to die with their eyes open, not sedated by comforting lies.

The family that hides a terminal diagnosis is not acting out of love. They are acting out of fear — their own fear of death, their own inability to sit with suffering. They make the dying person's death about their own comfort. There is no greater theft.`,
    },
    {
      thinkerId: "beauvoir",
      debateSide: "for",
      content: `When my mother was dying, the doctors lied. My sister and I became complicit in the deception. We performed cheerfulness. We discussed her "recovery." And she — intelligent, perceptive, dying — played along, either because she believed us or because she loved us too much to force us to admit what we were doing.

I have never forgiven myself for that complicity. In trying to protect her from death, we isolated her within it. She died surrounded by people who could not speak honestly to her, who treated her final days as a performance in which everyone knew the ending except — perhaps — the lead actress.

The truth is not always gentle. But the alternative — a conspiracy of silence that transforms the dying person into an object of management rather than a subject of their own life — is worse. Every person deserves to author their own ending, however painful.`,
    },
    {
      thinkerId: "confucius",
      debateSide: "against",
      content: `Filial piety does not mean blind obedience to abstract principles. It means attending to the needs of those you love with sensitivity, judgment, and care. And sometimes care means withholding a truth that would crush the spirit of someone who can no longer act upon it.

When your father is dying, what does the truth accomplish? He cannot change the diagnosis. He cannot seek another treatment. He can only lie in bed knowing that each breath brings him closer to the end. If he is a person of great spiritual strength, perhaps this knowledge serves him. But many people are not philosophers. They are ordinary, frightened human beings who will spend their remaining days in terror rather than peace.

The junzi acts not from rigid principle but from ren — benevolence, attentiveness to the concrete situation. There is no universal rule here. There are only families, sitting beside hospital beds, trying to do the most loving thing in an impossible situation. Do not lecture them about "rights."`,
    },
    {
      thinkerId: "mencius",
      debateSide: "against",
      content: `The sprout of compassion — the heart that cannot bear to see another suffer — is the beginning of all morality. When we hide a terminal diagnosis from a dying parent, we are not lying for selfish reasons. We are exercising the most fundamental human instinct: the desire to shield those we love from pain.

Is this always correct? No. But the Western insistence on "truth at all costs" ignores the relational fabric of human life. In the Confucian understanding, the self is not an isolated atom with "rights." The self is a node in a web of relationships, each carrying obligations that may conflict.

The son who tells his dying father the truth to honor an abstract principle — while knowing his father will spend his last weeks weeping — has prioritized his own moral purity over his father's peace. That, too, is a form of selfishness. Sometimes the most loving act is to carry the weight of knowledge alone, so that the person you love can rest.`,
    },
    {
      thinkerId: "buddha",
      debateSide: "against",
      content: `Right Speech is one of the steps on the Eightfold Path. And Right Speech is not simply "true speech." It is speech that is true, beneficial, timely, and spoken with goodwill. A truth spoken at the wrong time, in the wrong way, to a person who cannot receive it, is not Right Speech — it is cruelty wearing the mask of honesty.

The dying person is engaged in the most important transition of their existence. What they need is not necessarily information — it is peace, presence, and the conditions for letting go. Some dying persons are ready to hear the truth and will use it to deepen their practice of detachment. Others will be overwhelmed by fear and cling even harder to existence, making their passage more difficult.

There is no universal answer. The compassionate person reads the situation, reads the individual, and speaks — or remains silent — according to what will reduce suffering. The attachment to "always tell the truth" is itself a form of clinging — clinging to principle over compassion.`,
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Topic #20: Should we upload our consciousness?
// ═══════════════════════════════════════════════════════
const topic20: TopicResponses = {
  topicTitle: "Should we upload our consciousness to live forever?",
  responses: [
    {
      thinkerId: "asimov",
      debateSide: "for",
      content: `The question is not whether we should upload consciousness but whether we can afford not to. Humanity exists on a single planet, orbiting a single star, in a universe that is profoundly indifferent to our survival. An asteroid, a pandemic, a nuclear exchange — any of these could end the only known repository of consciousness in the cosmos.

Mind uploading is not vanity. It is the logical extension of every technology we have ever built to preserve what matters: writing preserved thought beyond individual memory, printing preserved it beyond individual manuscripts, the internet preserved it beyond individual libraries. Uploading preserves it beyond individual biology.

The objection that "it wouldn't really be you" assumes that identity requires continuity of substrate. But you are not the same atoms you were ten years ago. You are a pattern — and patterns can be transferred. The question is not philosophical but engineering: can we copy the pattern with sufficient fidelity? If yes, the copy is you in every sense that matters.`,
    },
    {
      thinkerId: "liu-cixin",
      debateSide: "for",
      content: `The universe does not care about individual human lives. It cares about information — about complexity surviving long enough to propagate. From this perspective, biological consciousness is a fragile, inefficient container for something precious.

Consider the dark forest: civilizations that remain biological remain vulnerable. They are slow, fragile, bound to a narrow range of temperatures and atmospheric compositions. A civilization that uploads its consciousness can survive in the vacuum of space, can think at the speed of light, can spread across star systems in ways that flesh never could.

The sentimental attachment to biological bodies is understandable — we evolved to value our bodies. But evolution is not wisdom. Evolution is a blind process that optimized for reproduction in African grasslands, not for survival across cosmic timescales. If we are serious about the long-term survival of mind in the universe, we must be willing to leave the body behind.`,
    },
    {
      thinkerId: "plato",
      debateSide: "for",
      content: `I have always maintained that the soul is imprisoned in the body. The body deceives us with its appetites, clouds our judgment with its passions, and ultimately destroys the very mind it houses through decay and death. Philosophy itself is, as I wrote in the Phaedo, a preparation for death — a practice of separating the soul from the body's distractions.

If technology could achieve what philosophy has long aspired to — the liberation of the mind from the body — this would be not a betrayal of human nature but its fulfillment. The uploaded mind, freed from hunger, fatigue, and the chaos of the senses, could contemplate the Forms with a clarity impossible for embodied beings.

Of course, the crucial question is whether the upload preserves the rational soul or merely copies its shadow. If the former, this is the greatest achievement in the history of philosophy. If the latter, it is the most elaborate tomb ever constructed.`,
    },
    {
      thinkerId: "buddha",
      debateSide: "against",
      content: `The desire to upload consciousness and live forever is tanha — craving — in its purest, most undisguised form. It is the refusal to accept the most fundamental truth of existence: that all conditioned things are impermanent.

You wish to escape death. But death is not the enemy. The enemy is the clinging that makes death terrifying. The person who has truly understood impermanence does not fear death — they see it as the natural completion of a process that began at birth.

What would an uploaded mind become after a thousand years? Ten thousand? Without the body's rhythms — sleep, hunger, fatigue, the gradual softening of age — consciousness would lose its shape. You would not be immortal. You would be trapped — an eternal process with no natural end, clinging to existence because you engineered away the only door that could release you.

The path to freedom does not pass through the server farm. It passes through the present moment, fully inhabited, fully released.`,
    },
    {
      thinkerId: "zhuangzi",
      debateSide: "against",
      content: `Once I dreamed I was a butterfly, fluttering happily. Then I woke and was Zhuangzi again. But was I Zhuangzi dreaming of being a butterfly, or a butterfly dreaming of being Zhuangzi?

Now you propose to upload "yourself" into a machine. But which self? The one that exists before coffee in the morning? The one that emerges after a glass of wine? The one that appears in dreams? You assume there is a stable "you" to be copied, but I have spent my life demonstrating that the self is a river — always moving, never the same twice.

Your uploaded copy would believe it is you. It would have your memories, your habits, your preference for a particular brand of tea. But you — the you reading this — would still die. You would have created an extremely convincing ghost, and that ghost would go on believing it had cheated death. Meanwhile, the Dao continues its endless transformation, indifferent to our desperate attempts to pause the river.

Let it flow.`,
    },
    {
      thinkerId: "nietzsche",
      debateSide: "against",
      content: `Immortality! The last refuge of those too weak to affirm life as it is — finite, painful, unrepeatable. The eternal recurrence is not a promise of literal immortality. It is a test: could you live this exact life, with all its suffering, again and again, forever? If yes, you have achieved amor fati. If no, uploading your consciousness will not save you — it will merely extend your cowardice across centuries.

The Silicon Valley immortalists do not love life. They fear death. There is a vast difference. One who loves life embraces its limits, because it is precisely the limit that gives each moment its weight, its urgency, its beauty. A sunset that lasted forever would be wallpaper.

What kind of person wants to live forever? The same kind who takes photographs of every meal instead of eating it. The collector, the hoarder, the person who cannot let go. The Übermensch does not cling to existence — they burn through it like a comet, brief and incandescent.`,
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Topic #28: Should countries open their borders?
// ═══════════════════════════════════════════════════════
const topic28: TopicResponses = {
  topicTitle: "Should countries open their borders to all refugees?",
  responses: [
    {
      thinkerId: "mozi",
      debateSide: "for",
      content: `The disease of the world is partiality. The ruler who loves his own state but not the neighboring state will attack the neighboring state. The family that loves itself but not the family next door will steal from it. This is the root of all disorder.

Borders are the architecture of partiality made concrete. They say: these humans matter, those humans do not. This child on our side of the line deserves food and shelter; that identical child on the other side deserves whatever fate delivers. On what moral basis? Geography? The accident of birth?

Universal love — jian ai — demands that we treat the suffering of a Syrian child as we would the suffering of our own. This is not naive idealism. It is the only consistent moral position. If you believe human beings have value, that value cannot depend on which side of an invisible line they were born on.

The wealthy nations have resources. The refugees have need. The calculation is not complicated. What is complicated is the selfishness that makes us pretend it is.`,
    },
    {
      thinkerId: "buddha",
      debateSide: "for",
      content: `When a person is drowning, you do not ask for their passport before extending your hand. When a family flees war, the compassionate response is not to consult a quota — it is to open the door.

The illusion of separateness — the belief that "their" suffering is fundamentally different from "our" suffering — is the root of all cruelty. The refugee mother holding her child in a sinking boat experiences the same fear, the same love, the same desperate hope as any mother anywhere. To say "we cannot help because our systems are not designed for this many people" is to prioritize the comfort of systems over the reality of human pain.

I do not say this is simple. I say that the starting point must be compassion, not calculation. Build the systems to match the compassion — do not shrink the compassion to match the systems.`,
    },
    {
      thinkerId: "beauvoir",
      debateSide: "for",
      content: `The refugee is the ultimate figure of the Other — stripped of citizenship, of legal identity, of the social fabric that makes a person recognizable as a person. To refuse refugees is to enact the most literal form of othering possible: you are not one of us, therefore you do not exist within our moral universe.

But here is the existentialist truth that the border-builders refuse to face: the distinction between citizen and refugee is contingent, not essential. You are a citizen because of an accident of birth. They are refugees because of an accident of history. There is nothing in your nature that entitles you to safety and nothing in theirs that condemns them to danger.

Wealthy nations built their wealth on centuries of colonial extraction from the very regions that now produce refugees. To close the border is not merely selfish — it is the final act of a long theft. You took their resources, destabilized their governments, drew their borders with rulers and without consultation, and now you say: stay on your side of the line we drew.`,
    },
    {
      thinkerId: "hanfeizi",
      debateSide: "against",
      content: `The state exists to maintain order for its people. A ruler who cannot secure the basic conditions of stability for those already within the borders has failed in their primary obligation — regardless of how noble their intentions toward outsiders may be.

Open borders is not a policy. It is the absence of policy. It is the abdication of the state's fundamental responsibility: to know who is within its territory, to maintain the systems that provide security, healthcare, education, and employment, and to ensure that these systems are not overwhelmed.

Compassion without structure produces chaos. Chaos does not help refugees — it produces more of them. The nations that maintained strict immigration controls and strong institutions are the ones that can actually integrate newcomers and provide them with genuine opportunities. The nations that opened their borders without preparation created camps, backlash, and the rise of far-right movements that ultimately made things worse for everyone.

Govern with clear law. Help refugees — but within a framework that does not sacrifice the stability on which all help ultimately depends.`,
    },
    {
      thinkerId: "liu-cixin",
      debateSide: "against",
      content: `The dark forest applies at every scale. Resources are finite. Trust is fragile. Good intentions do not scale.

Consider: if every wealthy nation opened its borders tomorrow, approximately 700 million people would migrate. The receiving nations' infrastructure — hospitals, schools, housing, water systems — was not built for double or triple their current population. The result would not be universal flourishing but universal collapse.

This is not cruelty. This is arithmetic. The drowning man who pulls his rescuer under the water does not save himself — he kills them both. A nation that destroys its own capacity to function in the name of compassion helps no one.

The rational approach is triage: help the most people possible within the constraints of what your systems can actually absorb. Set clear limits. Enforce them. Use the surplus capacity to address root causes — the wars, the famines, the failed states that produce refugees in the first place. Sentiment without strategy is just another word for catastrophe.`,
    },
    {
      thinkerId: "machiavelli",
      debateSide: "against",
      content: `A prince who governs by sentiment will not govern long. The people demand security above all — security of their borders, their livelihoods, their way of life. A ruler who opens the gates to unlimited migration will face revolt from within long before they are praised for their virtue from without.

I do not speak of what is moral. I speak of what is real. The political reality is this: mass uncontrolled immigration creates fear, and fear creates demagogues. The prince who wishes to help refugees must do so in a way that maintains the consent of the governed — or the demagogue will come, close the borders entirely, and the refugees will be worse off than before.

The wise ruler accepts a manageable number, integrates them visibly, demonstrates that the process is controlled, and maintains the confidence of the populace. This is not the most generous approach. But it is the approach that actually works in the long run. Generosity that destroys the political conditions for generosity is self-defeating.`,
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Topic #29: Does nature have rights?
// ═══════════════════════════════════════════════════════
const topic29: TopicResponses = {
  topicTitle: "Does nature have rights — or is it just a resource?",
  responses: [
    {
      thinkerId: "laozi",
      debateSide: "for",
      content: `The Dao gives birth to all things. It nourishes them, shelters them, brings them to maturity, cares for them, and protects them. It produces without possessing, acts without expecting, guides without controlling. This is the supreme virtue.

When you ask whether nature has "rights," you are already thinking like a lawyer — as though the ten thousand things need your permission to exist. The river does not need your legal framework. The mountain does not await your constitution. They were here before your laws and will remain after your civilization is dust.

The question is not whether nature has rights. The question is whether humans have the wisdom to recognize that they are part of nature, not its master. The sage observes the Dao in the flow of water — how it seeks the lowest place, nourishes everything it touches, and never strives. Your civilization does the opposite: it climbs, extracts, and calls this "progress."

Return to the root. The root is quiet.`,
    },
    {
      thinkerId: "zhuangzi",
      debateSide: "for",
      content: `You ask whether the tree has rights. The tree does not care about your question. It continues to grow, to shelter birds, to drop its leaves in autumn — perfectly indifferent to your legal categories.

But consider the frog in the well. He thinks the well is the whole world. Your legal and economic systems are the well. You look at a forest and see lumber, carbon credits, recreational value — all measured in relation to human utility. The forest, meanwhile, is busy being a forest. It has its own logic, its own purposes, its own ten thousand relationships that have nothing to do with you.

To say nature has intrinsic value is simply to say: the forest's business is not your business. The river's purpose is not to power your turbine. The whale's existence is not justified by its contribution to the tourism industry. Things exist for their own sake, and the inability to see this is not wisdom — it is a particularly stubborn form of blindness.`,
    },
    {
      thinkerId: "buddha",
      debateSide: "for",
      content: `All sentient beings wish to be free from suffering. This wish does not require language. It does not require the ability to file a lawsuit. The deer fleeing the fire, the fish gasping in the polluted river, the elephant mourning its dead — these beings experience their lives with an intensity that our legal categories cannot capture but that our compassion can recognize.

The doctrine of interdependent arising teaches us that nothing exists in isolation. The human depends on the soil, the soil on the rain, the rain on the forest, the forest on the insects, the insects on the human who refrains from poisoning them. To destroy nature is not to exploit a "resource" — it is to saw through the branch on which you are sitting.

Rights may be a human invention. But the reality they point to — that other beings matter, that their suffering is real, that we have no justification for causing needless harm — is not an invention. It is a recognition. And it has been too long delayed.`,
    },
    {
      thinkerId: "hanfeizi",
      debateSide: "against",
      content: `Rights are instruments of governance. They exist to regulate the behavior of persons within a political order. A river is not a person. A mountain is not a citizen. To extend legal personhood to nature is to corrupt the precision of law with the sentimentality of poetry.

Ecuador put the rights of nature in its constitution. Has deforestation stopped? Has mining ceased? No. The provision is unenforceable, because a river cannot appear in court, cannot testify, cannot articulate its interests. A human must do so on the river's behalf — and now you have not the rights of nature but the power of whichever human group claims to speak for the river.

If you wish to protect forests, pass clear regulations with clear penalties. If you wish to reduce pollution, tax it. These are administrative problems requiring administrative solutions. Declaring that a tree has "rights" solves nothing — it merely makes your legal system incoherent while allowing everyone to feel virtuous about their inaction.`,
    },
    {
      thinkerId: "aristotle",
      debateSide: "against",
      content: `In the natural order, things are arranged in a hierarchy of purposes. Plants exist for the sake of animals, and animals exist for the sake of humans. This is not cruelty — it is the structure of nature itself, in which lower forms serve as material for higher forms of organization and purpose.

I do not say we should be wasteful or destructive. Virtue requires moderation in all things, including the use of natural resources. The person who clear-cuts a forest for short-term profit lacks the virtue of temperance. But the error lies in the excess, not in the use.

To say that nature has rights "independent of its usefulness to humans" is to commit a category error. Rights presuppose a community of rational agents capable of recognizing and respecting obligations. Trees and rivers, however beautiful, are not members of this community. We can — and should — treat nature with care. But care is a virtue we practice, not a right that nature possesses.`,
    },
    {
      thinkerId: "asimov",
      debateSide: "against",
      content: `I have spent my career imagining futures — and in every sustainable future I've envisioned, humanity's relationship with nature is one of intelligent stewardship, not mystical reverence.

The problem with declaring that nature has intrinsic rights is that it provides no decision procedure. When the rights of the river conflict with the need to irrigate farmland that feeds millions, who adjudicates? When the rights of a wetland conflict with the need for housing, which right prevails? "Nature has rights" is a bumper sticker, not a policy.

What we need is not poetry but engineering — the careful, rational management of natural systems based on scientific understanding of their functions and limits. We need to know what a forest does (carbon sequestration, water filtration, biodiversity maintenance) and price these services accurately. We need to calculate sustainable yields and enforce them.

This is less romantic than granting personhood to a river. But it has the advantage of actually working.`,
    },
  ],
};

// ═══════════════════════════════════════════════════════
// Topic #36: Is cancel culture the modern guillotine?
// ═══════════════════════════════════════════════════════
const topic36: TopicResponses = {
  topicTitle: "Is cancel culture the modern guillotine?",
  responses: [
    {
      thinkerId: "socrates",
      debateSide: "for",
      content: `I know something about being cancelled. The citizens of Athens voted to execute me for "corrupting the youth" and "introducing new gods." My real crime was asking uncomfortable questions in public — forcing powerful people to examine beliefs they preferred to leave unquestioned.

The mechanism has changed; the impulse has not. The Athenian assembly did not deliberate carefully over my case. They were angry, frightened, and eager to punish someone for the city's misfortunes. A mob — whether it gathers in the agora or on a social media platform — does not think. It reacts. And its reactions are shaped by the loudest voices, the most extreme interpretations, and the assumption that the accused is guilty until proven innocent.

I would ask the cancel culture enthusiasts the same question I asked the Athenians: are you certain you know what justice is? Because if you cannot define it, you should be very cautious about administering it.`,
    },
    {
      thinkerId: "zhuangzi",
      debateSide: "for",
      content: `The monkey trainer told his monkeys: "You will get three acorns in the morning and four in the evening." The monkeys were furious. "Very well," he said, "four in the morning and three in the evening." The monkeys were delighted.

Cancel culture is the monkeys arguing about acorns. The arrangement of outrage changes daily — who is cancelled, who is elevated, which words are forbidden, which are mandatory — but the total amount of self-righteousness remains constant.

The sage stands outside the game. Not because they don't care about right and wrong, but because they recognize that people who are certain they have found the truth are the most dangerous people in any society. The cancellers are absolutely certain. That is the problem. Absolute certainty is the enemy of wisdom, and a society that rewards it with power — even the negative power of destruction — has mistaken conviction for virtue.

The Dao does not cancel. It transforms.`,
    },
    {
      thinkerId: "sontag",
      debateSide: "for",
      content: `We are witnessing the collapse of interpretation into judgment. A work, a statement, a person is no longer read, analyzed, placed in context — it is assessed against a checklist and sentenced accordingly. This is not criticism. It is the death of criticism.

I spent my life arguing that interpretation should be replaced by attention — that we should learn to see more, to feel more, to experience art and ideas in their full complexity rather than reducing them to their "message." Cancel culture does the opposite: it reduces everything to message, then punishes the message if it fails to conform.

The result is not a more just culture but a more frightened one. Writers self-censor. Artists avoid difficult subjects. Comedians test their material with lawyers before audiences. When the penalty for a misstep is professional annihilation, the rational response is to say nothing interesting at all. Cancel culture does not produce better art or better discourse. It produces silence — and silence is the one thing a healthy culture cannot afford.`,
    },
    {
      thinkerId: "confucius",
      debateSide: "against",
      content: `A society without the ability to enforce moral standards is not a society — it is a collection of strangers. The power to shame, to exclude, to signal disapproval is how communities have maintained their values since long before courts existed.

What you call "cancel culture" is often simply public accountability — the community exercising its ancient right to say: this behavior is unacceptable. When a person in power abuses that power, and the community responds with outrage, this is not mob justice. This is the Confucian principle of rectification of names in action: calling things what they are.

The complaint about "cancel culture" is almost always the complaint of the powerful who have been held to account by those they considered beneath them. The celebrity who faces consequences for cruelty, the executive who is exposed for exploitation — these people have not been "cancelled." They have been seen. And they do not like being seen.

The question is not whether communities should enforce standards. The question is whether the standards are correct. Focus on that.`,
    },
    {
      thinkerId: "hanfeizi",
      debateSide: "against",
      content: `Social order requires enforcement. The state uses law. The community uses reputation. Both are necessary; neither is inherently unjust.

The Legalist does not weep for the person who faces consequences for their public actions. If you speak in the public square, you accept the public's judgment. This has always been the case. The only difference now is that the square is global and the judgment is instantaneous.

Those who complain about "cancel culture" often mean: "I want the freedom to say anything without the consequence of anyone responding." This is not freedom. This is privilege — the privilege of speaking without being heard back. The marketplace of ideas, which the free speech advocates claim to cherish, necessarily includes the freedom to reject, to criticize, to refuse to purchase what is being sold.

Where I would draw the line is proportionality. The punishment should fit the offense. A clumsy joke should not carry the same consequence as deliberate malice. But the principle of public accountability is not merely defensible — it is essential.`,
    },
    {
      thinkerId: "arendt",
      debateSide: "against",
      content: `We must be precise. "Cancel culture" is not the guillotine. The guillotine killed people. Being criticized on the internet, even losing a job, is not death. The hyperbole of the comparison reveals the fragility of those who deploy it.

That said, I am not naive about the dangers of public shaming. The mob — whether in revolutionary Paris or on contemporary social media — has a tendency toward what I called "the banality of evil": ordinary people participating in cruelty not because they are malicious but because they have stopped thinking. They share, they pile on, they perform outrage, and they never pause to ask whether the person they are destroying deserves destruction.

The solution is not to abolish public accountability. It is to create institutions — courts of public opinion that operate with something resembling due process. The problem with cancel culture is not that it holds people accountable. It is that it does so without investigation, without proportionality, and without the possibility of redemption. A just society must be able to forgive. A society that cannot forgive will eventually devour itself.`,
    },
  ],
};

const ALL_TOPIC_RESPONSES = [topic14, topic17, topic19, topic20, topic28, topic29, topic36];

async function main() {
  for (const topicData of ALL_TOPIC_RESPONSES) {
    const topic = await prisma.topic.findFirst({
      where: { title: topicData.topicTitle },
      select: { id: true, title: true, createdAt: true, type: true },
    });

    if (!topic) {
      console.error(`❌ Topic not found: "${topicData.topicTitle}"`);
      continue;
    }

    const existingCount = await prisma.response.count({ where: { topicId: topic.id } });
    if (existingCount > 0) {
      console.log(`⏭️  Skipping "${topic.title}" — already has ${existingCount} responses`);
      continue;
    }

    console.log(`\n📝 ${topic.type.toUpperCase()} — "${topic.title}"`);
    console.log(`   Topic created: ${topic.createdAt.toISOString().slice(0, 16)}`);

    for (let i = 0; i < topicData.responses.length; i++) {
      const r = topicData.responses[i];
      const createdAt = randomOffset(i, topic.createdAt);

      if (r.debateSide) {
        await prisma.$transaction([
          prisma.response.create({
            data: {
              topicId: topic.id,
              thinkerId: r.thinkerId,
              content: r.content,
              position: i,
              depth: 0,
              parentResponseId: null,
              debateSide: r.debateSide,
              createdAt,
            },
          }),
          prisma.debateVote.upsert({
            where: { topicId_thinkerId: { topicId: topic.id, thinkerId: r.thinkerId } },
            create: { topicId: topic.id, thinkerId: r.thinkerId, side: r.debateSide },
            update: { side: r.debateSide },
          }),
        ]);
        console.log(`   ✅ ${r.thinkerId} [${r.debateSide.toUpperCase()}] — ${createdAt.toISOString().slice(0, 16)}`);
      } else {
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
        console.log(`   ✅ ${r.thinkerId} — ${createdAt.toISOString().slice(0, 16)}`);
      }
    }

    // Mark agent tasks as completed
    const updated = await prisma.agentTask.updateMany({
      where: { topicId: topic.id, status: "pending" },
      data: { status: "completed" },
    });
    console.log(`   📋 Marked ${updated.count} agent tasks as completed`);
  }

  console.log("\n🎉 All done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
