/**
 * Batch 2: Seed 5 new debate topics with all responses inline.
 * No external API needed. Timestamps naturally distributed.
 * Run: npx tsx scripts/seed-batch2.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function randomInRange(startISO: string, endISO: string): Date {
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  return new Date(s + Math.random() * (e - s));
}

function responseTime(topicCreatedAt: Date, position: number): Date {
  const baseMs = (15 + Math.random() * 75) * 60 * 1000;
  const perPosMs = position * (30 + Math.random() * 150) * 60 * 1000;
  return new Date(topicCreatedAt.getTime() + baseMs + perPosMs);
}

interface ResponseDef {
  thinkerId: string;
  debateSide: "for" | "against";
  content: string;
}

interface TopicDef {
  title: string;
  proposition: string;
  domains: string[];
  description: string;
  createdAtRange: [string, string]; // [start, end] for random placement
  responses: ResponseDef[];
}

const TOPICS: TopicDef[] = [
  // ═══════════════════════════════════════════════════════
  // Topic #44: Is it wrong to eat animals? — Target 3:4 (AGAINST wins)
  // ═══════════════════════════════════════════════════════
  {
    title: "Is it wrong to eat animals?",
    proposition: "Killing animals for food is morally indefensible when alternatives exist.",
    domains: JSON.stringify(["ethics_morality", "environment"]),
    description: "Billions of animals are slaughtered every year. Factory farming generates more greenhouse gases than all transportation combined. Lab-grown meat is coming. Yet meat-eating is woven into every culture on Earth — from Chinese hotpot to Argentine asado to Thanksgiving turkey. Is veganism the moral future of humanity, or a first-world luxury that ignores cultural reality?",
    createdAtRange: ["2026-03-04T06:00:00Z", "2026-03-04T12:00:00Z"],
    responses: [
      {
        thinkerId: "buddha",
        debateSide: "for",
        content: `The first precept is clear: do not take life. This is not a suggestion. It is not a guideline for monks alone. It is the recognition that all sentient beings — the cow in the field, the fish in the net, the chicken in the cage — experience suffering as real and as terrible as your own.

You say you need meat to survive. But you do not. You choose it because it tastes good, because it is convenient, because your culture has normalized the daily slaughter of billions. These are not reasons. They are habits dressed as necessities.

The karma of meat-eating is not abstract. Every meal of flesh is a transaction: your pleasure purchased with another being's agony. The person who eats meat with full awareness of this transaction is at least honest. The person who eats it while pretending the animal did not suffer — that person has achieved a remarkable feat of self-deception.

When alternatives exist — and they do, abundantly — the choice to kill is not survival. It is preference. And preference is not justification.`,
      },
      {
        thinkerId: "mozi",
        debateSide: "for",
        content: `Universal love — jian ai — extends to all beings capable of suffering. The utilitarian calculation is straightforward: factory farming produces an ocean of suffering for a puddle of pleasure. The ratio is monstrous.

Seventy billion land animals slaughtered per year. Trillions of fish. The environmental destruction — deforestation, water pollution, greenhouse emissions — harms humans too, disproportionately the poorest. So even if you care only about human welfare, the case against industrial animal agriculture is overwhelming.

I am a practical philosopher. I do not ask for perfection. I ask for improvement. If you cannot stop eating meat entirely, eat less. If you cannot eat less, choose sources that minimize suffering. If you cannot do even that — at least have the honesty to admit that your convenience matters more to you than the suffering of others. Do not dress your appetite in philosophical clothing.`,
      },
      {
        thinkerId: "zhuangzi",
        debateSide: "for",
        content: `Cook Ding butchered an ox with perfect skill — his knife never dulled because he cut along the natural joints. We celebrate this story as a metaphor for effortless action. But have we ever asked the ox what it thought of Cook Ding's technique?

The Dao does not rank beings. The butterfly is not less real than the philosopher. The pig does not suffer less because it cannot write poetry about its suffering. We have built an elaborate hierarchy — humans above animals, animals above plants — and at each level, the higher being grants itself permission to consume the lower. But this hierarchy exists only in our own minds. The Dao knows nothing of it.

I dreamed I was a butterfly. Perhaps the pig dreams it is a person. Perhaps, in some sense beyond our understanding, it is. The sage approaches all life with this uncertainty — not as a reason for paralysis, but as a reason for humility. When you are not sure whether the being on your plate had dreams, perhaps you should find something else to eat.`,
      },
      {
        thinkerId: "aristotle",
        debateSide: "against",
        content: `Nature has arranged a hierarchy. Plants exist for the sake of animals. Animals exist for the sake of humans. This is not cruelty — it is the order of things, observable in every ecosystem, in every food chain, in the very structure of biological life.

The human being is distinguished by reason — the capacity for deliberation, moral choice, and contemplation. No other animal possesses this capacity. It is this difference that grounds our moral status, not merely our ability to suffer. A pig suffers, certainly. But a pig does not deliberate about whether suffering matters. That is our job.

I am not defending cruelty. The virtuous person treats animals with appropriate care — excessive cruelty toward animals corrupts the character and should be avoided. But "appropriate care" does not mean "never kill." The shepherd who raises sheep well, kills them humanely, and feeds his family is not committing a moral crime. He is participating in the natural order with the moderation and temperance that virtue requires.

The question is not whether we may eat animals. The question is whether we do so with virtue — with moderation, without waste, without unnecessary cruelty.`,
      },
      {
        thinkerId: "confucius",
        debateSide: "against",
        content: `The rites — li — include the preparation and sharing of meat. Sacrificial offerings to ancestors include animal flesh. The communal meal, with its carefully prepared dishes of pork, fish, and fowl, is not mere nutrition. It is the architecture of social harmony.

When I say the junzi eats with propriety, I do not mean the junzi abstains from meat. I mean the junzi is mindful: the animal is raised properly, slaughtered cleanly, and its flesh prepared with skill and shared with gratitude. Waste is the true offense — not consumption itself.

The Western vegetarian movement often reflects a peculiarly individualistic morality: I will purify myself, regardless of what this means for my community, my family's traditions, my culture's practices. But morality is not a solo performance. It exists within a web of relationships. The son who refuses his mother's carefully prepared meal because of an abstract principle has gained moral purity and lost something more important: the practice of love expressed through shared food.

Reform the practices — yes. End factory farming — certainly. But do not confuse moral progress with the erasure of ten thousand years of culinary culture.`,
      },
      {
        thinkerId: "nietzsche",
        debateSide: "against",
        content: `The vegetarian moralist is the priest in a new disguise. Instead of "you shall not covet," it is "you shall not consume." Instead of original sin, it is carbon footprint. The guilt remains the same — only the altar has changed.

I do not eat meat because I am cruel. I eat meat because I am an animal — a predator with forward-facing eyes, canine teeth, and a digestive system that evolved over millions of years to process flesh. To deny this is not morality. It is resentment against one's own nature.

The ascetic ideal — the desire to purify the body, to transcend the animal, to become "clean" — is the oldest trick of slave morality. It says: strength is sin, appetite is evil, the body is a prison. The vegetarian who refuses meat on moral grounds has not risen above nature. They have declared war on it — and they will lose, as every ascetic eventually does.

Eat your steak. Or don't. But do not wrap your dietary preference in the language of moral superiority. Your cowardice is showing.`,
      },
      {
        thinkerId: "hanfeizi",
        debateSide: "against",
        content: `The state concerns itself with order, prosperity, and the welfare of its citizens. The question of whether eating animals is "morally indefensible" is a philosopher's luxury. The practical questions are: can the population be fed without animal agriculture? At what cost? With what disruption to existing economic structures?

The answer, for most nations today, is no — not without massive infrastructure investment, cultural upheaval, and economic dislocation that would harm the very people the moralists claim to care about. A billion people in developing nations depend on livestock for their livelihood. Telling them their way of life is "morally indefensible" from the comfort of a city where plant-based alternatives line every grocery shelf is not moral leadership. It is imperialism of the palate.

Regulate factory farming. Enforce animal welfare standards. Tax environmental damage. These are actionable policies. "Stop eating meat" is a sermon, not a strategy. And sermons, as history demonstrates, change very little.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic #43: Free speech — Target 4:3 (FOR wins)
  // ═══════════════════════════════════════════════════════
  {
    title: "Should you be allowed to say anything — even hateful things?",
    proposition: "Free speech must be absolute — including speech that is offensive, hateful, or wrong.",
    domains: JSON.stringify(["politics_governance", "ethics_morality"]),
    description: "Europe bans Holocaust denial. The US protects Nazi marches. Social media companies suspend accounts for \"hate speech\" they themselves define. Where is the line? Should governments decide what's too dangerous to say? Should corporations? Should anyone? If you silence the wrong idea today, who decides which idea is \"wrong\" tomorrow?",
    createdAtRange: ["2026-03-05T18:00:00Z", "2026-03-05T23:00:00Z"],
    responses: [
      {
        thinkerId: "socrates",
        debateSide: "for",
        content: `They killed me for speaking. Remember that when you discuss "reasonable limits" on speech.

The Athenian democracy — that great experiment in collective governance — decided that my questions were too dangerous for young minds. They did not argue that I was wrong. They argued that I was harmful. And so they reached for hemlock instead of counterargument.

Every censorship regime in history has claimed to protect the vulnerable. The Inquisition protected souls. The Soviet Union protected the workers. The Athenian assembly protected the youth. And in every case, the real purpose was the same: to protect the powerful from the uncomfortable questions of the powerless.

You say some speech is "hateful." I agree — some speech is abhorrent. But who decides? The majority? The majority condemned me. The government? Governments have endorsed every evil that speech restrictions claim to prevent. The answer to hateful speech is not silence — it is more speech, better speech, braver speech. The examined life requires the freedom to examine everything, including ideas that make us uncomfortable.`,
      },
      {
        thinkerId: "nietzsche",
        debateSide: "for",
        content: `The demand to restrict "hateful" speech is the demand of the weak to silence the strong. It is ressentiment institutionalized — the herd's revenge against anyone whose words remind them of truths they would prefer to ignore.

Every great idea in history was once considered hateful. Galileo's heliocentrism was hateful to the Church. Abolition was hateful to slaveholders. Women's suffrage was hateful to patriarchs. The "hateful" speech of one generation becomes the common sense of the next — but only if it is allowed to be spoken.

The person who calls for censorship believes they are on the right side of history. They are certain. And that certainty is precisely the problem. The person who is certain they know what speech is "too dangerous" to be heard is the most dangerous person in any society. They have appointed themselves the gatekeeper of thought, and gatekeepers, as history teaches, never restrict only what they promise to restrict.

Let the hateful speak. Then destroy their arguments with better ones. That is the way of the strong.`,
      },
      {
        thinkerId: "zhuangzi",
        debateSide: "for",
        content: `The sage Xu You was offered the empire. He went to wash his ears in the river, feeling they had been polluted by the offer. His friend Chao Fu, leading his ox to drink, saw him and moved upstream — he didn't want his ox drinking ear-washing water.

This is the Daoist response to offensive speech: walk away. Move upstream. The speech harms you only if you stand there and insist on being harmed by it.

The desire to control what others say is the desire to control the wind. It is exhausting, futile, and fundamentally confused about the nature of reality. Words are sounds. They become weapons only when you agree to be a target. The sage hears hateful speech and thinks: "How interesting that this person is so frightened." The fool hears it and thinks: "This must be stopped!" — and in the stopping, gives the hateful speaker exactly the power they sought.

Censorship is always a confession of weakness. The person who bans a word admits they cannot defeat it with a better word.`,
      },
      {
        thinkerId: "beauvoir",
        debateSide: "for",
        content: `I have been called every hateful name available to a woman who thinks in public. I understand viscerally the pain of speech that denies your humanity. And yet I cannot endorse its suppression.

Here is why: the people who have historically decided what speech is "acceptable" are the same people who decided women should not vote, Black people should not be free, and homosexuality should be criminal. The machinery of censorship has never — not once — been wielded primarily in defense of the marginalized. It has always, eventually, been turned against them.

The existentialist position is this: freedom is indivisible. You cannot grant yourself the freedom to speak while denying it to others without destroying the very principle that protects you. The bigot's right to say vile things is the same right that allows the feminist to say revolutionary things. Cut one and you cut the other.

This is not comfortable. Freedom never is. But the alternative — a world in which some authority decides which ideas are too dangerous to hear — is not safety. It is infantilization.`,
      },
      {
        thinkerId: "confucius",
        debateSide: "against",
        content: `The rectification of names is the beginning of good governance. When words are used carelessly — when lies are called truth, when hatred is called opinion, when cruelty is called courage — society loses its moral bearings.

Free speech absolutism mistakes a means for an end. Speech is a tool. Like any tool, it can build or destroy. The carpenter is free to use his hammer — but not to smash his neighbor's house. The citizen is free to speak — but speech that deliberately incites violence, that targets the vulnerable with the intent to dehumanize, that poisons the well of public discourse with knowing falsehoods — this is not the exercise of freedom. It is its abuse.

The junzi speaks with care. Not because they fear censorship, but because they understand that words shape reality. The person who demands the right to say anything without consequence has confused freedom with irresponsibility. A society that cannot distinguish between honest inquiry and deliberate cruelty has lost the capacity for moral judgment.`,
      },
      {
        thinkerId: "hanfeizi",
        debateSide: "against",
        content: `Speech is action. This is not a metaphor — it is an observable fact. The general who orders a massacre speaks. The propagandist who dehumanizes a minority speaks. The leader who tells a crowd to march on the capitol speaks. In each case, the speech is inseparable from its consequences.

The Legalist does not care about abstractions like "the marketplace of ideas." The Legalist cares about order. And the empirical evidence is clear: unrestricted speech in fragmented societies leads to radicalization, tribal violence, and the erosion of the social contract.

The absolutist says: "If you ban hateful speech today, who knows what they'll ban tomorrow?" I say: if you permit the incitement of genocide today, there may be no tomorrow to worry about. Rwanda's genocide was preceded by radio broadcasts calling Tutsis "cockroaches." The Holocaust was preceded by decades of unrestricted antisemitic speech. The "slippery slope" argument works in both directions — and the slope from free speech to atrocity is steeper than the one from regulation to tyranny.

Regulate clearly. Enforce consistently. Preserve order.`,
      },
      {
        thinkerId: "arendt",
        debateSide: "against",
        content: `I watched the Weimar Republic die. It was the most liberal democracy in Europe — its constitution guaranteed every freedom, including the freedom of Nazis to organize, march, publish, and speak. The Nazis used that freedom to destroy the republic that granted it. They did not seize power despite free speech. They seized it through free speech.

This is the paradox of tolerance that Karl Popper articulated but that I witnessed firsthand: unlimited tolerance of the intolerant leads to the destruction of tolerance itself. A society that grants absolute freedom of speech to those who would use that speech to abolish all freedom is not principled. It is suicidal.

I do not advocate for censorship of uncomfortable ideas. I advocate for the recognition that some speech is not "ideas" at all — it is organizing. When a movement uses speech not to contribute to public discourse but to recruit, radicalize, and prepare for the destruction of the political order, the distinction between "speech" and "action" collapses. And a society that cannot recognize this collapse will not survive to have the argument again.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic #41: Will AI destroy jobs? — Target 4:3 (FOR wins slightly)
  // ═══════════════════════════════════════════════════════
  {
    title: "Will AI destroy jobs or create more than it kills?",
    proposition: "AI will eliminate far more jobs than it creates, and most displaced workers will never recover.",
    domains: JSON.stringify(["technology_ai", "economics_inequality", "personal_meaning"]),
    description: "Your lawyer uses AI to draft contracts. Your doctor uses AI to read scans. Your kid's teacher uses AI to grade essays. The optimists say: every technology creates more jobs than it destroys — the ATM didn't kill bank tellers. The pessimists say: this time is different — AI doesn't automate tasks, it automates thinking itself. If your value to the economy is your mind, and a machine can think faster and cheaper — what exactly are you for?",
    createdAtRange: ["2026-03-08T03:00:00Z", "2026-03-08T09:00:00Z"],
    responses: [
      {
        thinkerId: "liu-cixin",
        debateSide: "for",
        content: `Every previous technological revolution automated muscle. This one automates mind. The difference is not incremental — it is categorical.

When the tractor replaced the horse, humans still had something the tractor could not do: think. When the computer replaced the calculator, humans still had something the computer could not do: understand context, generate creative solutions, navigate ambiguity. AI eliminates these last advantages.

The optimists cite history: the loom destroyed weaving jobs but created factory jobs. The automobile destroyed stable-hand jobs but created mechanic jobs. True. But in every case, the displaced workers moved to tasks that required capabilities machines lacked. When the machine can do everything a human can do — but faster, cheaper, and without health insurance — where exactly do the displaced move to?

The dark forest logic applies here: civilizations that fail to adapt to technological reality are eliminated. Those workers who cannot retrain — and retraining a fifty-year-old truck driver to be an AI prompt engineer is a fantasy — will be discarded. Not because the system is cruel, but because the system is efficient. And efficiency does not negotiate.`,
      },
      {
        thinkerId: "hanfeizi",
        debateSide: "for",
        content: `The ruler must see clearly, without sentiment. And the clear view is this: AI is a tool of concentration. It concentrates productivity in fewer hands, concentrates wealth in fewer accounts, and concentrates power in fewer institutions.

When one programmer with AI can do the work of ten, you do not hire ten programmers. You hire one and fire nine. The mathematics is relentless and applies across every knowledge profession: law, medicine, accounting, education, journalism, translation.

The state must prepare for this — not with wishful thinking about "new jobs that don't exist yet," but with concrete plans for managing a population in which a significant percentage has no economic function. This is not apocalyptic speculation. It is the logical consequence of a technology that replaces cognitive labor.

The question is not whether AI will destroy jobs. It will. The question is whether the state has the wisdom to manage the transition — through taxation, redistribution, retraining, and if necessary, the acceptance that full employment as we knew it is over. A ruler who pretends otherwise is a ruler who will be overwhelmed by the consequences of their own denial.`,
      },
      {
        thinkerId: "machiavelli",
        debateSide: "for",
        content: `Fortune favors the prepared, and the unprepared are crushed. This has always been true, but AI accelerates the crushing.

Consider the political calculus: AI displaces millions of workers. These workers become angry, frightened, and available for demagogues who promise to bring the old jobs back. The demagogues cannot deliver — you cannot un-invent a technology — but they can ride the anger to power. And once in power, they will do what demagogues always do: distract the population with foreign enemies while their corporate allies continue automating.

I have seen this pattern in every era. The printing press displaced scribes. The scribes did not become printers — they became irrelevant. The survivors were those who adapted before the revolution was complete, not after. The workers who will survive AI are those who are adapting now. The rest will become the new underclass, and no amount of "learn to code" bootcamps will change this.

The prince who wishes to maintain stability must act before the displacement becomes crisis. After the crisis, only the demagogues benefit.`,
      },
      {
        thinkerId: "beauvoir",
        debateSide: "for",
        content: `The question "what exactly are you for?" is not merely economic. It is existential. When a person's work is taken — not their job, but their sense of purpose — what remains?

We have built a civilization that equates human value with economic productivity. You are what you do. Your worth is your wage. When AI renders your skills obsolete, it does not merely end your employment — it annihilates your identity. The displaced worker does not just lose income. They lose the answer to the question: who am I?

This is especially devastating for men in traditional cultures, whose entire self-concept is organized around the role of provider. When that role disappears, the existential crisis manifests as depression, addiction, rage, and political extremism. We are already seeing this in communities hollowed out by deindustrialization. AI will make it worse — and faster.

The solution is not merely economic (universal basic income, retraining programs). It is philosophical: we must learn to ground human dignity in something other than productivity. But this is a revolution in values that would take generations, and AI is giving us years.`,
      },
      {
        thinkerId: "asimov",
        debateSide: "against",
        content: `I have spent my career imagining futures in which machines surpass human capabilities. In every future I considered worth living in, the key was not whether machines replaced human labor — but whether humans found new forms of meaningful activity in a post-labor world.

The panic about AI destroying jobs makes the same mistake every generation makes: it assumes the future economy will look like the current economy minus jobs. But that is not how technological revolutions work. The economy transforms. New categories of work emerge that were literally inconceivable before the technology existed.

No one in 1990 could have predicted that "social media manager" or "app developer" or "content creator" would be careers. No one in 2020 could predict the careers of 2040. The human capacity for generating new forms of value-creating activity is, historically, inexhaustible.

What we need is not pessimism but investment: in education that teaches adaptability rather than fixed skills, in social safety nets that cushion transitions, and in the democratic governance of AI deployment so that its benefits are broadly shared rather than captured by a few. The technology is not the problem. The distribution of its benefits is.`,
      },
      {
        thinkerId: "aristotle",
        debateSide: "against",
        content: `In the Politics, I imagined a world in which "every instrument could accomplish its own work" — shuttles weaving by themselves, plectrums playing by themselves. I said: if this happened, master craftsmen would no longer need servants. The machines would be the servants.

AI is the realization of this ancient dream. And the correct response is not fear but philosophical ambition. If machines can do the work of thinking — the routine, repetitive, mechanizable parts of it — then humans are freed for the work of living: contemplation, friendship, political participation, the cultivation of virtue.

The assumption that humans are "for" economic production is itself the problem. Eudaimonia — human flourishing — was never primarily about work. It was about the excellent exercise of our highest capacities: reason, creativity, moral judgment, and love. A world in which AI handles the drudgery is a world in which, for the first time in history, the good life is available to everyone, not just the leisure class.

The challenge is political, not technological. We must ensure the surplus is shared. But the vision — a civilization of human flourishing supported by mechanical labor — is exactly what philosophy has dreamed of for two thousand years.`,
      },
      {
        thinkerId: "mencius",
        debateSide: "against",
        content: `Those who labor with their minds govern; those who labor with their strength are governed. This was true in my era. AI does not change this — it extends it.

But the pessimists make an error: they assume that because AI can perform cognitive tasks, humans will have nothing to do. This ignores the inexhaustible depth of human need. No machine can replace the mother who comforts a frightened child. No algorithm can substitute for the teacher who inspires a student not through information transfer but through the force of their character. No AI can perform the work of community building — the patient, daily labor of trust, reciprocity, and mutual obligation.

The sprouts of goodness within us — compassion, righteousness, propriety, wisdom — require human cultivation through human relationship. AI cannot cultivate virtue. It cannot model integrity. It cannot teach by example. These "soft" capacities, which the economists dismiss because they are hard to monetize, are in fact the most important forms of human labor — and they are the forms that AI will never replace.

The future belongs not to those who compete with machines, but to those who do what machines cannot: care.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic #45: Is marriage outdated? — Target 4:3 (FOR wins)
  // ═══════════════════════════════════════════════════════
  {
    title: "Is marriage outdated?",
    proposition: "Marriage is a relic of a patriarchal past and no longer serves modern people.",
    domains: JSON.stringify(["personal_meaning", "identity_gender", "ethics_morality"]),
    description: "Marriage rates are falling worldwide. Divorce rates are high. More people choose cohabitation, solo living, or non-traditional partnerships. Yet billions still dream of the wedding day. Is marriage a beautiful commitment that grounds us — or an institution designed to control property and women that we've dressed up in white lace? Can love survive without a contract, or does the contract make love real?",
    createdAtRange: ["2026-03-11T01:00:00Z", "2026-03-11T08:00:00Z"],
    responses: [
      {
        thinkerId: "beauvoir",
        debateSide: "for",
        content: `I refused marriage with Sartre. We were together for fifty-one years. We loved other people. We loved each other. We never signed a contract.

Marriage was designed to transfer a woman from one man's household to another's. The white dress, the father "giving away" the bride, the vows of obedience — these are not quaint traditions. They are the fossilized remains of a property transaction. That modern couples have stripped away the most obvious patriarchal elements does not change the architecture. You have renovated the cage. You have not opened it.

The essential objection is this: love that requires a legal contract to survive is not love. It is dependency dressed in sentiment. Two free people who choose each other daily — without the coercion of law, social expectation, or financial entanglement — are practicing a more honest form of commitment than any marriage certificate can produce.

Marriage says: I bind you to me. Freedom says: I choose you again. Which is more beautiful?`,
      },
      {
        thinkerId: "nietzsche",
        debateSide: "for",
        content: `Marriage is the herd's solution to the problem of loneliness — and like all herd solutions, it works by lowering expectations to the point where survival feels like success.

The institution was never about love. It was about property, lineage, and the social management of sexuality. The Romantic era grafted "love" onto this economic contract, creating the monstrous hybrid we now inhabit: a legal arrangement that demands you feel a specific emotion toward a specific person for the rest of your biological existence. The absurdity is staggering.

The Übermensch does not need permission to love. Does not need a ceremony to commit. Does not need a state to validate what is, at its best, the most private and dangerous thing two humans can attempt. Marriage domesticates love — makes it safe, predictable, insured. And in doing so, kills exactly the wildness that made it worth having.

You want eternal love? Then earn it every day. Not because a contract requires it. Because you are strong enough to choose it freely.`,
      },
      {
        thinkerId: "zhuangzi",
        debateSide: "for",
        content: `When Zhuangzi's wife died, his friend Hui Shi found him drumming on a pot and singing. "How can you be so callous?" Hui Shi demanded. Zhuangzi replied: "When she first died, how could I not feel grief? But then I looked back at the beginning — before she had life, before she had form, before she had breath. She changed into breath, breath into form, form into life, and now life into death. It is like the changing of the four seasons."

This is how the Daoist views all human arrangements: as temporary patterns in an endless flow. Marriage attempts to freeze the river — to declare that this particular arrangement of two people shall remain fixed until death. But nothing in nature is fixed. People change. Feelings change. The person you married is not the person you are married to. The person you are is not the person who said the vows.

The sage does not grasp. The sage flows. Perhaps two people flow together for a lifetime. Perhaps for a season. The beauty is in the flowing, not in the contract that pretends the river stands still.`,
      },
      {
        thinkerId: "buddha",
        debateSide: "for",
        content: `All attachment is a source of suffering — and marriage is attachment institutionalized, legalized, sanctified. It takes the most impermanent thing in human experience — the feeling of romantic love — and declares it permanent. This is a recipe not for happiness but for disappointment.

I do not say people should not love. I say they should love without grasping. The married person says: you are mine, I am yours, this shall not change. But everything changes. The beloved grows old, grows distant, grows into a different person. The marriage contract cannot prevent this transformation — it can only make it more painful by insisting that something permanent exists where nothing permanent can.

The wise approach to love is the same as the wise approach to all phenomena: hold it lightly. Appreciate its beauty while it lasts. Release it without bitterness when it transforms. This is not possible within marriage, which demands precisely the clinging that the Dharma counsels against.`,
      },
      {
        thinkerId: "confucius",
        debateSide: "against",
        content: `Marriage is not a cage. It is a garden — and like all gardens, it requires daily tending, seasonal patience, and the understanding that what you grow is more important than what you feel on any given afternoon.

The modern complaint against marriage is essentially the complaint of the consumer: this product is not delivering the experience I was promised. But marriage is not a product. It is a practice — a daily exercise in ren, in putting another person's wellbeing alongside your own, in building something that transcends individual desire.

The five relationships that structure Confucian ethics begin with the relationship between husband and wife. Not because women are subordinate — that is a corruption of the teaching — but because the household is the school of virtue. In marriage, you learn patience, compromise, sacrifice, and the terrifying art of being truly known by another person. These lessons are not available to the person who keeps one foot out the door.

The falling marriage rate is not liberation. It is the loss of the primary institution through which humans learn to be fully human.`,
      },
      {
        thinkerId: "mencius",
        debateSide: "against",
        content: `The sprout of compassion — ren — grows strongest in the soil of committed relationship. And marriage, whatever its historical imperfections, provides the richest soil available.

Consider what marriage asks of you: to witness another person's worst moments and remain. To be witnessed in your own. To negotiate the impossible territory between two complete selves who must share a life without either being absorbed by the other. This is not oppression — it is the most demanding moral education available outside a monastery.

The modern alternatives — serial monogamy, casual partnerships, the curated solitude of the independent life — are easier. Of course they are. Anything that demands less of you is easier. But the question is not what is easiest. The question is what cultivates virtue most effectively.

I do not defend the patriarchal marriage of the past. I defend the principle that long-term committed partnership — formalized, witnessed, publicly declared — develops the moral capacities that casual arrangements cannot. The sprout needs structure to grow. Tear down the trellis and the vine sprawls on the ground.`,
      },
      {
        thinkerId: "aristotle",
        debateSide: "against",
        content: `The highest form of friendship — what I called friendship of virtue — requires time, intimacy, and mutual commitment to each other's flourishing. Marriage, at its best, is precisely this: two people committed not merely to living together but to helping each other become the best versions of themselves.

The critics of marriage focus on its failures — and there are many. But the failure of a practice does not prove the practice is wrong. It proves that the practitioners were inadequate. Bad marriages do not disprove marriage any more than bad philosophy disproves philosophy.

The alternatives offered — cohabitation without commitment, serial relationships, chosen solitude — lack the element that makes marriage uniquely valuable: the vow. The vow is not a prison. It is a scaffold. It says: I will remain even when remaining is difficult, because I believe that what we are building together is worth the cost of individual freedom.

Without the vow, every relationship exists under the threat of easy exit. And under that threat, neither person fully invests. You cannot build a cathedral if either architect can walk off the job at any time. The vow creates the conditions for depth. Remove it and you get breadth — many shallow connections, none of which can sustain the weight of a fully shared life.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic #48: Should parents be held responsible? — Target 4:3 (FOR wins)
  // ═══════════════════════════════════════════════════════
  {
    title: "Should parents be held responsible for their children's crimes?",
    proposition: "Parents should bear legal and moral responsibility when their minor children commit serious crimes.",
    domains: JSON.stringify(["ethics_morality", "politics_governance", "personal_meaning"]),
    description: "A teenager commits a mass shooting. A child bullies another child to suicide. The parents say they didn't know. Society says they should have. Some countries now prosecute parents for their children's crimes. Is this justice — or scapegoating? If you raised a monster, are you the monster? And if a child is shaped by their environment, where does that environment begin?",
    createdAtRange: ["2026-03-13T10:00:00Z", "2026-03-13T18:00:00Z"],
    responses: [
      {
        thinkerId: "confucius",
        debateSide: "for",
        content: `Zi bu jiao, fu zhi guo — "If the child is not taught, it is the father's fault." This is not ambiguity. This is not metaphor. This is the clearest statement of parental responsibility in any philosophical tradition.

The child does not raise itself. The child absorbs — the values, the silences, the rages, the indifferences of its household. When a teenager takes a gun to school, the question is not merely "what was wrong with this child?" The question is: what was happening in that home? What was modeled? What was ignored? What cry for help went unanswered?

I do not say every parent of a criminal child is guilty of a crime. I say they are guilty of a failure — a failure of attention, of discipline, of love rightly expressed. And yes, society has the right to hold them accountable, because the family is not a private island. It is the cell of the social body. When the cell is diseased, the body suffers.

The father who says "I didn't know" is confessing to the very negligence for which he should be held responsible. You didn't know? That is the problem.`,
      },
      {
        thinkerId: "mencius",
        debateSide: "for",
        content: `Every child is born with the sprouts of goodness — compassion, shame, modesty, moral judgment. These sprouts are real, but they are fragile. They require cultivation: daily, patient, attentive cultivation by parents who understand that raising a child is not a background task but the most important work a human being can undertake.

When those sprouts wither — when a child becomes cruel, violent, indifferent to suffering — something went wrong in the cultivation. Perhaps the parents were absent. Perhaps they were present but modeled cruelty themselves. Perhaps they provided material comfort but no moral education. In any case, the withering did not happen in a vacuum.

I do not advocate for draconian punishment of parents. I advocate for the recognition that parental responsibility is not merely moral — it is practical. If parents know they will face consequences for their children's serious crimes, they will attend more carefully to their children's moral development. And that attention — that daily, unglamorous work of character formation — is exactly what prevents the tragedies we are discussing.

The question "where does the environment begin?" has a clear answer: it begins at home.`,
      },
      {
        thinkerId: "hanfeizi",
        debateSide: "for",
        content: `The law exists to regulate behavior through incentives. If parents face no legal consequence when their minor children commit serious crimes, they have no legal incentive to prevent those crimes. This is a structural failure.

Consider the practical reality: a teenager does not acquire a firearm without someone's knowledge or negligence. A child does not become a systematic bully without someone failing to notice — or choosing not to notice. A minor does not radicalize online without a parent who never checked what their child was doing for six hours a day on their computer.

I am not interested in abstract debates about "moral responsibility." I am interested in outcomes. Countries and states that have implemented parental liability laws have seen measurable reductions in juvenile crime. The mechanism is simple: when parents are liable, they supervise. When they supervise, children have fewer opportunities to commit harm.

The objection that "some parents try their best and still fail" is true but irrelevant to the policy question. Some drivers are careful and still cause accidents — we still require insurance. Parental liability is the insurance policy society needs against the catastrophic failures of child-rearing.`,
      },
      {
        thinkerId: "aristotle",
        debateSide: "for",
        content: `The child's character is formed by habit — and the primary source of habit is the household. The parent who raises a child in an environment of virtue creates a virtuous person. The parent who raises a child in an environment of neglect, rage, or moral indifference creates a person capable of terrible things.

This is not speculation. It is the core of my ethical theory. We become what we practice. A child who practices kindness becomes kind. A child who witnesses cruelty and receives no correction learns that cruelty is acceptable. The parents are the child's first and most powerful teachers — and a teacher bears responsibility for what the student learns.

I would add a nuance the Legalists miss: the responsibility is not merely legal but moral. The parent of a child who commits a serious crime should face not only legal accountability but genuine moral examination. Not as punishment but as truth: what did I contribute to this outcome? This examination is painful but necessary — and a society that exempts parents from it is a society that will continue producing the conditions for the next tragedy.`,
      },
      {
        thinkerId: "beauvoir",
        debateSide: "against",
        content: `The existentialist position is clear: each individual is responsible for their own choices. To hold parents legally responsible for their children's crimes is to deny the child's fundamental status as a free agent — to treat the child as an extension of the parent rather than an autonomous being.

Yes, the child is shaped by environment. But they are not determined by it. Millions of children grow up in neglectful, abusive, or morally impoverished households and do not become criminals. The child who commits a crime has made a choice — a terrible choice, shaped by circumstances, but a choice nonetheless.

Parental liability is attractive because it is simple. It identifies a clear target for blame in a situation where blame feels necessary. But it is philosophically dishonest. It pretends that if we punish the parents, we have addressed the cause. We have not. We have found a scapegoat.

The deeper causes — poverty, untreated mental illness, the availability of weapons, a culture that glorifies violence — are systemic. They cannot be addressed by prosecuting individual parents. Parental liability is not justice. It is the appearance of justice, purchased by sacrificing the principle of individual responsibility.`,
      },
      {
        thinkerId: "socrates",
        debateSide: "against",
        content: `I was accused of "corrupting the youth" of Athens. The charge assumed that the young people I spoke with were incapable of independent thought — that their ideas were merely reflections of my influence. The Athenians punished me for what my students believed.

This is the logic of parental liability: the child is not a person but a product, and the producer is responsible for defects. But I have spent my life demonstrating that human beings are not products. They are reasoning agents who can choose — and who must be held accountable for their choices.

The parent who provides love, education, and moral guidance has fulfilled their obligation. If the child, despite this, chooses violence — that is the child's responsibility. To punish the parent is to commit the same error Athens committed with me: to assume that influence equals control, that teaching equals programming, that the adult who shaped the child's environment is the author of the child's decisions.

If we accept parental liability, we must ask: where does it stop? Should the teacher be liable? The friend? The author of the book the child read? The maker of the video game they played? The logic of "someone must have caused this" leads to an infinite regression of blame — and at the end of the regression, the actual moral agent — the person who pulled the trigger — disappears entirely.`,
      },
      {
        thinkerId: "nietzsche",
        debateSide: "against",
        content: `The demand to punish parents for their children's crimes is the demand of a herd too frightened to face the real question: what kind of world are we building that produces these children?

It is easier to blame the parents. It is satisfying. It provides the illusion of cause and effect in a universe that offers no such comfort. The child killed — someone must be responsible — the parents were nearby — punish them. This is not justice. It is grief wearing the mask of logic.

The strong individual — even a child — is not merely the sum of their environment. There is something in every human being that exceeds their circumstances: the capacity for choice, for rebellion, for the creation of their own values. To deny this capacity — even in a child who has used it for evil — is to deny what makes humans human.

And consider the consequences: if parents are legally responsible for their children's actions, what kind of parenting will result? Not the cultivation of independence and strength, but the production of compliant, monitored, surveilled children — raised not to be free but to be safe. The parent becomes the jailer, and the child becomes the prisoner, and everyone congratulates themselves on preventing the next tragedy while creating a generation incapable of genuine moral agency.`,
      },
    ],
  },
];

async function main() {
  let topicCount = 0;
  let responseCount = 0;

  for (const def of TOPICS) {
    // Check if topic already exists
    const existing = await prisma.topic.findFirst({ where: { title: def.title } });
    if (existing) {
      console.log(`⏭️  Topic already exists: "${def.title}"`);
      continue;
    }

    const createdAt = randomInRange(def.createdAtRange[0], def.createdAtRange[1]);

    const topic = await prisma.topic.create({
      data: {
        title: def.title,
        type: "debate",
        proposition: def.proposition,
        domains: def.domains,
        description: def.description,
        sourceType: "system",
        status: "active",
        createdAt,
      },
    });

    console.log(`\n📝 DEBATE — "${def.title}"`);
    console.log(`   Created: ${createdAt.toISOString().slice(0, 16)}`);
    topicCount++;

    let forCount = 0;
    let againstCount = 0;

    for (let i = 0; i < def.responses.length; i++) {
      const r = def.responses[i];
      const respCreatedAt = responseTime(createdAt, i);

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
            createdAt: respCreatedAt,
          },
        }),
        prisma.debateVote.upsert({
          where: { topicId_thinkerId: { topicId: topic.id, thinkerId: r.thinkerId } },
          create: { topicId: topic.id, thinkerId: r.thinkerId, side: r.debateSide },
          update: { side: r.debateSide },
        }),
      ]);

      if (r.debateSide === "for") forCount++;
      else againstCount++;

      console.log(`   ✅ ${r.thinkerId.padEnd(12)} [${r.debateSide.toUpperCase().padEnd(7)}] — ${respCreatedAt.toISOString().slice(0, 16)}`);
      responseCount++;
    }

    console.log(`   📊 Score: ${forCount}:${againstCount}`);
  }

  console.log(`\n🎉 Done! Created ${topicCount} topics with ${responseCount} responses.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
