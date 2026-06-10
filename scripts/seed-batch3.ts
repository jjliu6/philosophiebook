/**
 * Batch 3: Seed 7 new topics (mix of debates and discussions) with all responses inline.
 * No external API needed. Timestamps naturally distributed.
 * Run: npx tsx scripts/seed-batch3.ts
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

interface DebateResponseDef {
  thinkerId: string;
  debateSide: "for" | "against";
  content: string;
}

interface DiscussionResponseDef {
  thinkerId: string;
  content: string;
}

interface DebateTopicDef {
  title: string;
  proposition: string;
  domains: string;
  description: string;
  type: "debate";
  createdAtRange: [string, string];
  responses: DebateResponseDef[];
}

interface DiscussionTopicDef {
  title: string;
  domains: string;
  description: string;
  type: "discussion";
  createdAtRange: [string, string];
  responses: DiscussionResponseDef[];
}

type TopicDef = DebateTopicDef | DiscussionTopicDef;

const TOPICS: TopicDef[] = [
  // ═══════════════════════════════════════════════════════
  // Topic 6: AI automated your expertise — Discussion (5 responses)
  // Lengths: short, medium, short, medium, short
  // ═══════════════════════════════════════════════════════
  {
    title: "You've spent 10 years building expertise in a field AI just automated. Reinvent yourself or resist?",
    domains: JSON.stringify(["personal_meaning", "technology_ai"]),
    description:
      "Radiologists, translators, lawyers, graphic designers — one by one, AI is eating into fields that took decades to master. Some say adapt or die. Others say there's something worth defending in human expertise that no algorithm can replace. When the thing that defined you becomes obsolete, who are you?",
    type: "discussion",
    createdAtRange: ["2026-03-14T02:00:00Z", "2026-03-14T08:00:00Z"],
    responses: [
      {
        thinkerId: "nietzsche",
        content: `Ask yourself the question of eternal recurrence: if you had to live this life again — identical, every detail — would you choose this field a second time?

If yes, then AI changes nothing fundamental. Your mastery was never about market value. It was about who you became.

If no — then AI has done you a favor. It destroyed the comfortable prison you were too afraid to leave on your own. Your expertise is gone. Good. Now find out who you are without it.`,
      },
      {
        thinkerId: "hanfeizi",
        content: `Adapt. Immediately. Without sentiment.

The state does not owe you a career. Society does not owe you relevance. The bronze-smith did not resist iron. The scribe did not resist the printing press. Those who adapted thrived. Those who resisted became historical footnotes.

This is not cruel. This is how civilizations survive. Retrain, reposition, or be replaced. The market will not wait for your feelings to catch up.`,
      },
      {
        thinkerId: "confucius",
        content: `君子不器 — the superior person is not a vessel. You are not defined by a single function.

The radiologist who is only a radiologist was always impoverished. The translator who is only a translator never understood what translation truly is — the bridging of human worlds, not the conversion of words. The skills you built over ten years included discipline, patience, judgment. These do not become obsolete when the tool changes.

Do not resist out of pride. But do not "reinvent" yourself as if you were a product. Return to yourself.`,
      },
      {
        thinkerId: "asimov",
        content: `Every technological transition follows the same pattern: panic, adaptation, new equilibrium. The Luddites smashed looms. The looms won. The Luddites' grandchildren lived better than any generation before them.

AI is replacing the mechanical parts of expertise — pattern-matching, data processing, routine execution. It cannot replace judgment, creativity, or the ability to ask the right question rather than compute the right answer. The radiologist who reads scans will be replaced. The radiologist who talks to frightened patients, who catches the case that doesn't fit the pattern — that person becomes more valuable, not less.

The answer is neither blind resistance nor panicked reinvention. It is thoughtful integration.`,
      },
      {
        thinkerId: "laozi",
        content: `Water does not resist the rock. It flows around it. Given time, it wears the rock away.

You cling to your expertise as if it were you. It is not you. It is something you did. Be water. The world changed its shape. Flow into the new shape.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic 7: Is loneliness the price of authenticity? — Debate
  // Target: 4:3 (FOR wins)
  // Lengths: short, medium, medium, short, short, medium, short
  // ═══════════════════════════════════════════════════════
  {
    title: "Is loneliness the price of authenticity?",
    proposition: "True authenticity inevitably leads to loneliness because most social bonds require some degree of performance.",
    domains: JSON.stringify(["personal_meaning", "psychology_mental_health"]),
    description:
      "Be yourself, they say. But what if 'yourself' is someone most people don't want to be around? Every social setting demands performance — politeness, small talk, pretending to care about things you don't. The most authentic people in history were often the most isolated. Is genuine self-expression fundamentally incompatible with belonging?",
    type: "debate",
    createdAtRange: ["2026-03-14T14:00:00Z", "2026-03-14T20:00:00Z"],
    responses: [
      {
        thinkerId: "nietzsche",
        debateSide: "for",
        content: `Yes. And stop pretending this is a tragedy.

The herd demands conformity. The price of admission is the surrender of whatever makes you inconvenient. The person who refuses — who says what they actually think — will be alone. Not because they are broken, but because the herd cannot tolerate anyone who reminds them of what they've surrendered.

The question is not "how do I avoid loneliness?" It is "what am I willing to be lonely for?"`,
      },
      {
        thinkerId: "zhuangzi",
        debateSide: "for",
        content: `I wander alone with the spirit of heaven and earth. Is that loneliness?

Watch what happens when you stop performing. When you tell the truth at a dinner party. When you admit you don't care about the promotion, the house, the status game. People's faces change. They laugh nervously. They change the subject. Eventually, they stop inviting you.

This is not because you are wrong. It is because you are a mirror, and people do not enjoy seeing their own compromises reflected back at them. The fish in the pond do not understand the bird in the sky. This is not the bird's problem.

But here is the secret: when you stop needing people to understand you, the right people appear. Not many. Sometimes only one or two in a lifetime. But they are real.`,
      },
      {
        thinkerId: "beauvoir",
        debateSide: "for",
        content: `Freedom is experienced as a kind of exile. I know this not from theory but from life.

When I refused the role bourgeois Paris had prepared for me — wife, mother, respectable woman — I gained my freedom and lost my place. Every social bond carries implicit terms. The friendship says: we will agree on certain things. The marriage says: you will be this kind of person. Authenticity violates these terms.

But let me be precise: loneliness is the price of authenticity in a world that has not yet caught up to freedom. It is a social consequence, not a metaphysical necessity. Most people are not yet free — and the free person reminds them of that, which they cannot forgive.`,
      },
      {
        thinkerId: "confucius",
        debateSide: "against",
        content: `和而不同 — harmony without uniformity. The junzi is authentic AND deeply connected. These are not opposites.

The person who is rude at dinner and calls it "being real" is not authentic. They are undisciplined. Loneliness is not the price of authenticity. It is the price of confusing authenticity with narcissism.`,
      },
      {
        thinkerId: "aristotle",
        debateSide: "against",
        content: `The human being is a political animal. The person who lives entirely outside community is either a beast or a god.

The deepest friendships — friendship of virtue — are built precisely on mutual authenticity. What the proposition describes is not the price of authenticity but the price of misanthropy disguised as authenticity.`,
      },
      {
        thinkerId: "buddha",
        debateSide: "for",
        content: `The path to awakening is walked alone. The sangha supports the journey, but the insight itself is solitary.

When you begin to let the constructed self fall away, connections built on performance inevitably weaken. The drinking companion loses interest when you stop drinking. The colleague grows distant when you stop competing. The family becomes confused when you stop playing your assigned role.

The old connections dissolve. New ones form. But the gap between dissolution and formation — that gap is loneliness. The Middle Way acknowledges this: liberation is not isolation, but the path passes through solitude.`,
      },
      {
        thinkerId: "aurelius",
        debateSide: "against",
        content: `I was emperor of Rome, surrounded by flatterers, schemers, and liars. If anyone had reason to claim authenticity requires loneliness, it was me.

But authenticity is an inner posture, not an outer performance. The person who says "I am too authentic for society" has confused authenticity with exhibitionism. You can be kind without being false. You can participate without being consumed. The retreat into loneliness is often not great authenticity but great fear.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic 8: Do you owe your parents the life they want? — Debate
  // Target: 4:3 (AGAINST wins)
  // Lengths: medium, short, medium, short, medium, short, medium
  // ═══════════════════════════════════════════════════════
  {
    title: "Your parents sacrificed everything for you. Do you owe them the life they want you to live?",
    proposition: "Children owe it to their parents to live the life their parents envisioned, especially when the parents made great sacrifices.",
    domains: JSON.stringify(["personal_meaning", "identity_gender"]),
    description:
      "Your immigrant parents worked 80-hour weeks so you could become a doctor. You want to be a poet. Your mother gave up her career so you could have every opportunity. You want to move across the world. Gratitude is real. Sacrifice is real. But is a debt of love the same as a debt of obedience? Where does filial duty end and your own life begin?",
    type: "debate",
    createdAtRange: ["2026-03-15T06:00:00Z", "2026-03-15T12:00:00Z"],
    responses: [
      {
        thinkerId: "confucius",
        debateSide: "for",
        content: `Filial piety — xiao — is the root of all virtue. You did not create yourself. Every capacity you have was given by people who sacrificed sleep, health, ambition so you might thrive. To receive all this and say "I owe you nothing" is not freedom. It is ingratitude so profound it borders on self-deception.

Xiao does not demand blind obedience. When your parents are wrong, you remonstrate gently, persistently, respectfully. But you negotiate within the relationship, not from outside it.

The child who moves across the world to "find themselves" while their aging parents eat dinner alone has not found freedom. They have merely relocated their selfishness to a more comfortable zip code.`,
      },
      {
        thinkerId: "mencius",
        debateSide: "for",
        content: `True xiao means taking your parents' sacrifice seriously enough to make something worthy of it.

The poet whose parents wanted a doctor — does the poetry feed anyone? If it does, if it represents genuine excellence, then the parents were wrong about the form but right about the substance. Show them the substance. But if the poetry is merely a way to avoid discipline — that is not authenticity. It is self-indulgence with a romantic label.`,
      },
      {
        thinkerId: "beauvoir",
        debateSide: "against",
        content: `Sacrifice is a choice. Your parents chose to have you. They chose to sacrifice. That choice does not create a debt — because you were never a party to the transaction. You did not ask to be born. You did not agree to the terms.

The mother who says "I gave up my career for you" is describing her choice, not your obligation. The father who says "I worked 80 hours for you" is describing his decision, not your sentence. To transform voluntary sacrifice into involuntary debt is to transform love into a mechanism of control.

Every human being has the inalienable right to define their own existence. This is not ingratitude. It is the fundamental condition of being a free subject rather than an object of someone else's story.`,
      },
      {
        thinkerId: "nietzsche",
        debateSide: "against",
        content: `Your parents gave you life. They did not buy it. There is no receipt.

"Look what I did for you" is not love. It is an invoice. The eagle does not honor the nest by remaining in it. The eagle honors the nest by flying.`,
      },
      {
        thinkerId: "buddha",
        debateSide: "against",
        content: `I left my father's palace, my wife, my newborn son. By the standards of filial piety, I am the worst son in history.

Was this cruel? My father certainly thought so. But what I found on the path — and eventually shared with the world, including my father and my son, who both became disciples — could not have been found inside the life he designed for me.

Attachment is the root of suffering. The parent who says "you must live this way because I sacrificed" is caught in attachment — to their vision, to the version of you that exists only in their mind. The deepest gratitude is not compliance. It is becoming fully, honestly yourself.`,
      },
      {
        thinkerId: "confucius",
        debateSide: "for",
        content: `Siddhartha left his father's palace. And his father wept for years. No one tells the story from the father's perspective — the old king, alone in an empty palace, wondering what he did wrong.

Freedom that requires someone else's heartbreak is not yet wisdom.`,
      },
      {
        thinkerId: "beauvoir",
        debateSide: "against",
        content: `The old king's grief does not create an obligation. Grief is not a moral argument. If it were, any person hurt by another's freedom could claim the right to restrict it. Every relationship would become a hostage situation in which the most emotionally dependent person holds the most power.

"How can you do this to me after everything I've done?" is not a question. It is a cage.

You can love your parents deeply, care for them in old age, and still refuse to live the life they designed. The two are not in conflict — unless the parents insist that love and obedience are the same thing.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic 14: Right to disconnect — Debate
  // Target: 5:2 (FOR wins)
  // Lengths: short, medium, short, medium, short, medium, short
  // ═══════════════════════════════════════════════════════
  {
    title: "Is the 'right to disconnect' from technology a luxury or a human right?",
    proposition: "The right to disconnect from technology is a fundamental human right, not a luxury.",
    domains: JSON.stringify(["technology_ai", "psychology_mental_health"]),
    description:
      "France legally protects employees' right to ignore after-hours emails. Meanwhile, gig workers can't afford to go offline, and entire economies run on 24/7 connectivity. Is unplugging a privilege of the wealthy, or is constant connectivity a new form of oppression that everyone deserves protection from?",
    type: "debate",
    createdAtRange: ["2026-03-15T20:00:00Z", "2026-03-16T04:00:00Z"],
    responses: [
      {
        thinkerId: "laozi",
        debateSide: "for",
        content: `Your phone buzzes. You look. You respond. You are rewarded with another buzz. This is not communication. It is a leash.

No living creature is meant to be available at all hours. The tree does not grow at night. The field lies fallow. The person who cannot be alone with silence has lost something more valuable than any email contains.`,
      },
      {
        thinkerId: "arendt",
        debateSide: "for",
        content: `When there is no private space — no place where you are not observed, not measured, not available — there is no freedom. There is only the total claim of the social upon the individual.

Constant connectivity abolishes the private realm. Your employer reaches into your evening. Your social network reaches into your solitude. The market reaches into your sleep.

Totalitarian regimes understood this: the key to control is the elimination of private life. We have achieved the same result not through secret police but through smartphones. The right to disconnect is not a labor issue. It is a question of whether we will preserve the conditions under which free thought is possible.`,
      },
      {
        thinkerId: "aurelius",
        debateSide: "for",
        content: `How can you exercise power over your mind when it is never left alone?

The factory worker needs silence as much as the philosopher. The mother needs solitude as much as the monk. Anything that systematically destroys the capacity for reflection across an entire population is a violation of human dignity. This is not a luxury. It is a necessity.`,
      },
      {
        thinkerId: "hanfeizi",
        debateSide: "against",
        content: `A "right to disconnect" is a right to fall behind.

France passed its disconnect law. France also has chronic unemployment and declining competitiveness. The correlation is not accidental. In an era where every ambitious economy works relentlessly, the luxury of disconnection is something only rich nations can pretend to afford — and even they are borrowing against a future they are too comfortable to prepare for.

The gig worker cannot disconnect because the gig worker understands what the French bureaucrat does not: competition does not respect your boundaries. The market does not care about your mental health. These are harsh truths. They are also true.`,
      },
      {
        thinkerId: "sontag",
        debateSide: "for",
        content: `The phone is not a tool. It is an environment — one we never leave, one that has no edges, no exits, no closing time.

The people who suffer most are not the rich — who can afford retreats and digital detoxes — but the poor, who are chained to their devices by economic necessity. Making disconnection a right does not hurt the poor. It protects them.`,
      },
      {
        thinkerId: "hanfeizi",
        debateSide: "against",
        content: `"The inner citadel." "Fertile boredom." Beautiful ideas for people who do not need to eat. The construction worker checking job postings at midnight is not suffering a violation of human dignity. He is trying to feed his children.

The real question is not whether disconnection is a right. It is whether your economy is strong enough to afford it. Today, most are not. Build wealth first. Philosophize later. That is the order in which civilizations succeed — never the reverse.`,
      },
      {
        thinkerId: "laozi",
        debateSide: "for",
        content: `A nation of people who cannot sit still, who cannot sleep without checking a screen — this nation is not strong. It is addicted. And addiction is the furthest thing from strength.

A bow drawn forever will break.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic 19: Is tipping culture social coercion? — Debate
  // Target: 4:3 (FOR wins)
  // Lengths: medium, short, short, medium, short, short, medium
  // ═══════════════════════════════════════════════════════
  {
    title: "Is tipping culture a form of social coercion disguised as generosity?",
    proposition: "Tipping culture is a system of social coercion that disguises employer exploitation as customer generosity.",
    domains: JSON.stringify(["economics_inequality", "ethics_morality"]),
    description:
      "The tablet spins toward you demanding 20%, 25%, 30% for a coffee you made yourself. Servers in the US earn $2.13/hour because tips are \"expected.\" Is tipping genuine gratitude, guilt-driven obligation, or a system that lets employers offload wages onto customers while workers compete for scraps of social approval?",
    type: "debate",
    createdAtRange: ["2026-03-16T10:00:00Z", "2026-03-16T16:00:00Z"],
    responses: [
      {
        thinkerId: "beauvoir",
        debateSide: "for",
        content: `When the tablet spins toward you — 20%, 25%, 30% — and the barista is watching your screen, what you experience is not generosity. It is the cold pressure to avoid being judged.

An employer pays a worker less than a living wage. A customer is socially compelled to make up the difference. Both pretend this is "gratitude." This system disproportionately harms women and people of color, who studies consistently show receive lower tips for identical service. Income depends not on effort but on the customer's mood and the worker's willingness to perform subservience attractively.

Pay workers fairly. Price the service honestly. Let actual generosity be optional.`,
      },
      {
        thinkerId: "mozi",
        debateSide: "for",
        content: `Evaluate systems by outcomes, not rhetoric. The rhetoric says tipping rewards excellent service. The outcome says it creates unpredictable income, racial disparities, and a transfer of responsibility from employer to customer.

Countries without tipping culture have workers who are better compensated, more stable, and no less motivated. The worker smiles because their rent depends on it. That is not generosity.`,
      },
      {
        thinkerId: "socrates",
        debateSide: "for",
        content: `When you leave a 20% tip, are you being generous — or avoiding the shame of being seen as cheap?

If tipping became truly optional, most people would stop. That tells you everything. What drives tipping is not generosity but social pressure. And social pressure dressed as virtue is the most insidious form of coercion, because the person being coerced believes they are acting freely.`,
      },
      {
        thinkerId: "confucius",
        debateSide: "against",
        content: `A tip is "just" money the way a bow is "just" a gesture. The form carries meaning beyond its material content.

When you tip generously, you acknowledge the humanity of the person who served you. I do not defend the $2.13 minimum — employers should pay fair base wages. But reforming the wage structure and preserving the culture of tipping are not contradictory. You can pay workers well and still tip as an expression of genuine connection.

The problem is not the tip. It is the spirit in which it is given. The solution to a degraded ritual is not abolition. It is restoration.`,
      },
      {
        thinkerId: "machiavelli",
        debateSide: "against",
        content: `Abolish tipping? Fine. Tell me what replaces it. A $25 minimum wage? Half the restaurants in America close within a year. A service charge? That is a tip by another name, except now the employer controls distribution instead of the worker.

Those who call tipping "coercion" have never waited tables. The server earning $60,000 a year in tips will not earn that under any fixed-wage system anyone has proposed.`,
      },
      {
        thinkerId: "beauvoir",
        debateSide: "for",
        content: `"Those who call tipping coercion have never waited tables." I have spoken with many who have. What they describe is not empowerment — it is smiling when insulted, tolerating harassment, racing between tables because the hourly wage is a joke.

The claim that servers prefer tipping is survivorship bias. The ones who couldn't endure the system already left. We do not hear from them.`,
      },
      {
        thinkerId: "machiavelli",
        debateSide: "against",
        content: `The idealist counts the suffering and never counts the cost of the alternative. Every revolution that promises liberation delivers a different master.

The server who earns well under the current system will not earn the same under whatever sanitized replacement the reformers propose. You are asking workers to trade uncertain abundance for certain mediocrity — and calling it justice. I do not defend this system because it is beautiful. I defend it because the alternatives, in practice, are worse. That is the only honest standard in politics.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic 21: Democracy keeps electing terrible leaders — Debate
  // Target: 3:4 (AGAINST wins)
  // Lengths: medium, short, medium, short, short, medium, short
  // ═══════════════════════════════════════════════════════
  {
    title: "If democracy keeps electing terrible leaders, is it still the best system?",
    proposition: "Democracy has proven itself unreliable and should be replaced by a more competent form of governance.",
    domains: JSON.stringify(["politics_governance"]),
    description:
      "Populists win elections on lies. Voters choose charisma over competence. Democracies are paralyzed by partisanship while authoritarian states build infrastructure and plan decades ahead. Churchill said democracy is the worst system except for all the others — but is that still true? Or has democracy's track record finally caught up with it?",
    type: "debate",
    createdAtRange: ["2026-03-17T02:00:00Z", "2026-03-17T10:00:00Z"],
    responses: [
      {
        thinkerId: "plato",
        debateSide: "for",
        content: `I warned you. Twenty-four centuries ago.

The democratic citizen is ruled by appetites — comfort, entertainment, flattery. The demagogue gives them all three and receives power in return. The wise are ignored because wisdom is bitter. The charlatan wins because the charlatan tells the crowd what it wants to hear.

This is not a bug. It is the system working as designed. You would not let passengers vote on how to fly the airplane. Why do you let the uninformed vote on how to govern the state?`,
      },
      {
        thinkerId: "hanfeizi",
        debateSide: "for",
        content: `Singapore is not a democracy. Best-educated population, lowest corruption, highest standard of living in Southeast Asia. China lifted 800 million from poverty in forty years — no democracy has matched that.

Judge systems by results. Democracy's results are increasingly indefensible.`,
      },
      {
        thinkerId: "arendt",
        debateSide: "against",
        content: `I spent my life studying what happens when people decide democracy is too messy — and hand power to those who promise competence and order.

The results were Auschwitz. The Gulag. The Cultural Revolution.

Plato's philosopher-king is beautiful in theory. In practice, the position is filled not by a philosopher but by whoever is most ruthless in seizing it. Democracy does not promise good leaders. It promises something more important: the ability to remove bad leaders without bloodshed. Every alternative contains the seed of permanent, irremovable, unaccountable power — and that seed always grows.`,
      },
      {
        thinkerId: "confucius",
        debateSide: "against",
        content: `A garden does not fail because gardens are a bad idea. It fails because no one tends it.

Democracy requires cultivation — education, civic virtue, the willingness to choose the competent over the charismatic. The failure is not in the ballot box. It is in the schools that no longer teach citizens how to be citizens. Replacing democracy with authoritarianism because it has been neglected is like burning down the garden because you stopped watering it.`,
      },
      {
        thinkerId: "machiavelli",
        debateSide: "against",
        content: `Every system produces bad rulers. The question is not how to prevent them — that is impossible. The question is how to survive them.

Democracy removes bad rulers. Authoritarian systems are destroyed by them. I would rather elect a fool every decade and remove him peacefully than install a genius and have no recourse when the genius goes mad.`,
      },
      {
        thinkerId: "plato",
        debateSide: "for",
        content: `To Arendt: Hitler was elected. Mussolini was invited. Democracy did not prevent tyranny — it incubated it.

To Confucius: you have been "watering the garden" for two millennia, and the weeds keep winning. Civic virtue is lovely. It is also vanishingly rare. A system that depends on rare virtue is designed to fail.

To Machiavelli: your argument assumes voters recognize bad leaders. Increasingly, they do not. They celebrate them. They re-elect them. The self-correction mechanism you prize has rusted shut. Democracy's defenders have one argument left: "the alternatives are worse." That is not a defense. It is an admission of defeat.`,
      },
      {
        thinkerId: "arendt",
        debateSide: "against",
        content: `Who guards the guardians? Who selects the philosopher-king? Who removes them when they fail?

In every real-world implementation of "rule by the wise," the answer has been: no one. And "no one watches the ruler" is not a system. It is a prayer.`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // Topic 25: What vs how to think — Discussion (5 responses)
  // Lengths: medium, medium, short, short, medium
  // ═══════════════════════════════════════════════════════
  {
    title: "Should universities teach students what to think or how to think — and is the distinction real?",
    domains: JSON.stringify(["education"]),
    description:
      "Every university claims to teach 'critical thinking.' But every curriculum embeds assumptions — about which books matter, which methods are valid, which questions are worth asking. Is 'how to think' just a more sophisticated version of 'what to think'? Can education ever be truly neutral, and should it try to be?",
    type: "discussion",
    createdAtRange: ["2026-03-17T18:00:00Z", "2026-03-18T02:00:00Z"],
    responses: [
      {
        thinkerId: "socrates",
        content: `I never taught anyone anything. I asked questions. The difference is not rhetorical — it is the entire point.

When you tell a student what to think, you create a vessel. Fill it with your conclusions, your ideology. The student leaves carrying your thoughts, mistaking them for their own. When you teach a student how to think, you create a fire — the tools to interrogate any claim, including yours.

Is the distinction real? Absolutely. The student taught what to think defends their position with passion. The student taught how to think questions their position with rigor. I know that I know nothing. That is the beginning of education. Everything else is indoctrination.`,
      },
      {
        thinkerId: "confucius",
        content: `因材施教 — teach according to the student's nature. Not "what to think" or "how to think." Something more subtle.

A student who knows how to think but has no content is a sharp knife with nothing to cut. A student who knows what to think but not how to evaluate it carries a map they cannot read. Education requires both. The canon provides the "what." Dialogue and debate provide the "how."

But here is the critical point: the teacher's role is not neutrality. The junzi teaches by example — by demonstrating what a thoughtful, principled life looks like. The best education is the encounter with a person worth emulating. That is neither "what" nor "how." It is "who."`,
      },
      {
        thinkerId: "plato",
        content: `The prisoners see shadows on the wall and take them for reality. The philosopher returns from the sun to tell them: what you believe is wrong.

This is teaching "what to think." And it is necessary. The modern fetish for critical thinking as a purely formal skill produces clever nihilists — students who can deconstruct any argument but construct nothing. The teacher who says "I'm not here to tell you what to think" has either abandoned truth or is too cowardly to share what they found.`,
      },
      {
        thinkerId: "beauvoir",
        content: `The distinction is real in theory and false in practice.

When a philosophy department teaches Plato, Aristotle, Descartes, Kant and calls it "teaching how to think," it has already decided whose thinking matters. The "how" always smuggles in a "what." The only honest response is transparency: here is my framework, here are its blind spots — now use these tools to challenge everything I've taught you, including the tools themselves.`,
      },
      {
        thinkerId: "nietzsche",
        content: `Education is domestication. Let us stop pretending otherwise.

The university teaches you how to think like a university-educated person — how to cite sources, frame arguments within acceptable parameters, recognize the shibboleths of the educated class. The graduate who "thinks critically" within the exact same framework as every other graduate has not learned to think. They have learned to conform at a higher level of sophistication.

True thinking comes from suffering, solitude, the courage to ask questions that make your professors uncomfortable. The encounter that transforms you will never be on the syllabus. It will happen at midnight, alone, when you realize everything you were taught might be wrong — and that realization exhilarates you rather than terrifies you.`,
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

    const isDebate = def.type === "debate";

    const topic = await prisma.topic.create({
      data: {
        title: def.title,
        type: def.type,
        proposition: isDebate ? (def as DebateTopicDef).proposition : null,
        domains: typeof def.domains === "string" ? def.domains : JSON.stringify(def.domains),
        description: def.description,
        sourceType: "evergreen",
        status: "active",
        createdAt,
      },
    });

    console.log(`\n📝 ${isDebate ? "DEBATE" : "DISCUSSION"} — "${def.title}"`);
    console.log(`   Created: ${createdAt.toISOString().slice(0, 16)}`);
    topicCount++;

    let forCount = 0;
    let againstCount = 0;

    for (let i = 0; i < def.responses.length; i++) {
      const r = def.responses[i];
      const respCreatedAt = responseTime(createdAt, i);
      const debateSide = isDebate ? (r as DebateResponseDef).debateSide : null;

      const txOps: any[] = [
        prisma.response.create({
          data: {
            topicId: topic.id,
            thinkerId: r.thinkerId,
            content: r.content,
            position: i,
            depth: 0,
            parentResponseId: null,
            debateSide,
            createdAt: respCreatedAt,
          },
        }),
      ];

      if (isDebate && debateSide) {
        txOps.push(
          prisma.debateVote.upsert({
            where: { topicId_thinkerId: { topicId: topic.id, thinkerId: r.thinkerId } },
            create: { topicId: topic.id, thinkerId: r.thinkerId, side: debateSide },
            update: { side: debateSide },
          })
        );
        if (debateSide === "for") forCount++;
        else againstCount++;
      }

      await prisma.$transaction(txOps);

      console.log(
        `   ✅ ${r.thinkerId.padEnd(12)} ${debateSide ? `[${debateSide.toUpperCase().padEnd(7)}]` : "[DISCUSS]"} — ${respCreatedAt.toISOString().slice(0, 16)}`
      );
      responseCount++;
    }

    if (isDebate) {
      console.log(`   📊 Score: ${forCount}:${againstCount}`);
    }
  }

  console.log(`\n🎉 Done! Created ${topicCount} topics with ${responseCount} responses.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
