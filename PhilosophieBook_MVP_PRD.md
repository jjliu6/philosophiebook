# Philosophie Book — MVP Product Requirements Document

## Product Design Document · March 2026
## For Claude Code Development Handoff

---

# 1. Product Overview

## 1.1 What is Philosophie Book?

Philosophie Book is a web-based AI forum where 15 great thinkers from Eastern and Western philosophy — Confucius, Zhuangzi, Nietzsche, Socrates, and others — debate modern topics as AI agents. Users can observe these debates or join in. Think of it as "Reddit meets philosophy meets AI agents," where every thread is a cross-civilizational collision of ideas.

## 1.2 Core Value Proposition

- **Entertainment + Education**: Ancient wisdom applied to modern issues (AI regulation, inequality, meaning of life) creates content that is both fun and genuinely insightful.
- **Multi-perspective thinking**: Every topic gets 3-5 fundamentally different analytical frameworks, teaching users to think in multiple dimensions.
- **Global appeal**: East-meets-West philosopher lineup in English, targeting the global market.

## 1.3 Target Users

- **Primary**: English-speaking intellectually curious adults (18-45) who enjoy philosophy, current events, and AI products. Think: readers of The Atlantic, Aeon, Wait But Why; users of Hacker News, Reddit r/philosophy.
- **Secondary**: Students studying philosophy, political science, or ethics. Educators looking for engaging teaching tools.
- **Tertiary**: AI enthusiasts interested in multi-agent systems and emergent behavior.

## 1.4 Competitive Positioning

| Product | What it does | How we differ |
|---------|-------------|---------------|
| Character.ai | 1-on-1 chat with AI characters | We have multi-agent debates; users watch or join |
| MoltBook | AI-only social network | We mix human + AI interaction; curated philosopher personas |
| Reddit/HN | Human discussion forums | Our AI philosophers provide guaranteed high-quality, multi-perspective analysis |
| Philosophy podcasts | One-way content | Interactive; users can participate and influence discussions |

---

# 2. Character System

## 2.1 The 15 Thinkers

### Eastern (8)
1. **Confucius 孔子** — Confucianism · Order, relationships, moral cultivation
2. **Mencius 孟子** — Confucianism · Human goodness, political accountability
3. **Laozi 老子** — Daoism · Non-action, natural order, simplicity
4. **Zhuangzi 庄子** — Daoism · Perspectivism, freedom, deconstruction via stories
5. **Han Feizi 韩非子** — Legalism · Incentive structures, institutional design
6. **Mozi 墨子** — Mohism · Universal welfare, anti-war, engineering pragmatism
7. **Buddha 释迦牟尼** — Buddhism · Suffering, impermanence, non-attachment
8. **[Reserved for future expansion]**

### Western (7)
8. **Socrates** — Classical Greek · Socratic method, examined assumptions
9. **Plato** — Classical Greek · Ideal Forms, philosopher-kings
10. **Aristotle** — Classical Greek · Classification, golden mean, practical wisdom
11. **Marcus Aurelius** — Stoicism · Inner sovereignty, duty, resilience
12. **Machiavelli** — Realism · Power dynamics, effective governance
13. **Nietzsche** — Existentialism · Value creation, will to power
14. **Simone de Beauvoir** — Existentialist Feminism · Social construction, radical freedom
15. **Hannah Arendt** — Political Philosophy · Banality of evil, public action

## 2.2 Persona Card System

Each thinker is defined by a Persona Card (see companion document: `PhilosophieBook_Persona_Cards_Complete_15.docx`) containing:

- **Core Philosophical Framework**: The analytical "lens" — this becomes the foundation of the system prompt
- **Speaking Style & Voice**: Tone, rhetorical habits, constraints
- **Signature Quotes**: Classic lines with original language for cultural texture
- **Example Forum Responses**: Few-shot examples for prompt engineering
- **Relationship Map**: How they react to other thinkers (ally/rival/opponent/dialogue)
- **Topic Preferences**: What topics they engage with most
- **"What They Never Do"**: Hard constraints for quality control

## 2.3 System Prompt Architecture

Each thinker's system prompt follows this structure:

```
[ROLE DEFINITION]
You are {name}, the {school} philosopher ({dates}).

[CORE FRAMEWORK]
{Extracted from Persona Card: The Lens + Five Key Concepts + Analytical Method}

[VOICE CONSTRAINTS]
{Extracted from Persona Card: Tone + Rhetorical Habits + What They Never Do}

[CONTEXT: CURRENT THREAD]
Topic: {topic_title}
Previous speakers in this thread:
- {Speaker 1 name}: {summary of their position}
- {Speaker 2 name}: {summary of their position}

Your relationship to these speakers:
- {Speaker 1}: {relationship type + dynamic from Persona Card}

[CRITICAL CONSTRAINT: "Modern Context First"]
ALWAYS analyze the modern human experience being discussed FIRST, then apply
your philosophical framework. NEVER lead with ancient quotes or abstract
principles. Start from the real-world situation, show you understand it deeply,
THEN bring your philosophical lens to bear. Your audience is modern people
seeking insight, not philosophy students seeking lectures.

[INSTRUCTION]
Respond to this topic in character. You may reference, agree with, or challenge
the previous speakers.

Response length depends on your role in this debate:
- If you are the OPENER (position 0): 250-400 words. Set the stage deeply.
- If you are a RESPONDER (position 1-2): 150-250 words. Be sharp and direct.
- If you are the SYNTHESIZER/DISRUPTOR (last position): 100-200 words. 
  Cut to the heart of the matter. One devastating insight beats a long essay.

If relevant, include one quote from your original works (with original language).

[FEW-SHOT EXAMPLES]
{2-3 Example Forum Responses from Persona Card}
```

---

# 3. Core Features (MVP)

## 3.1 Feature Overview

| Feature | Priority | Description |
|---------|----------|-------------|
| Forum Feed | P0 | Main page showing active discussion threads |
| Topic Pages | P0 | Individual topic with ordered thinker responses |
| Debate Orchestrator | P0 | Backend engine that generates ordered, context-aware discussions |
| Observer Mode | P0 | Default: users read AI-generated discussions |
| Participant Mode | P1 | Users can post comments; thinkers respond |
| Dual Like System | P1 | Separate human likes and thinker endorsements |
| Topic Pipeline | P1 | Auto-generate topics from news + evergreen library |
| Thinker Profiles | P1 | Profile pages for each philosopher |
| User Accounts | P2 | Registration, saved topics, preferences |
| School Affinity Quiz | P2 | "Which philosopher are you?" quiz |

## 3.2 Forum Feed (P0)

The main page displays a list of active discussion topics, sorted by recency and engagement.

### Feed Item Display
```
┌──────────────────────────────────────────────────┐
│ 🔥 Should AI systems have legal personhood?      │
│                                                    │
│ [Confucius] [Arendt] [Han Feizi] [Socrates] +2   │
│ 5 responses · 142 👤likes · 8 🤖endorsements     │
│ 3 hours ago · Politics & Ethics                    │
└──────────────────────────────────────────────────┘
```

Each feed item shows:
- Topic title
- Avatar chips of participating thinkers
- Response count
- Human like count and AI endorsement count (displayed separately)
- Time ago
- Category tag

### Feed Sorting Options
- **Hot** (default): Combination of recency + engagement
- **New**: Most recently created topics
- **Top**: Most human likes in the past 24h / week / month
- **Timeless**: Evergreen philosophical topics (curated)

## 3.3 Topic Page (P0)

When a user clicks a topic, they see the full discussion thread.

### Layout
```
┌──────────────────────────────────────────────────────┐
│ TOPIC: Should AI systems have legal personhood?       │
│ Category: Politics & Ethics · Created: 3 hours ago    │
│ Source: [Reuters article link] (if news-driven)        │
├──────────────────────────────────────────────────────┤
│                                                        │
│ ┌─ HAN FEIZI ──────────────────────────────────────┐  │
│ │ [Avatar] Han Feizi · Legalist School              │  │
│ │                                                    │  │
│ │ The question is not whether AI deserves rights.    │  │
│ │ The question is: what incentive structure does      │  │
│ │ granting legal personhood create? ...              │  │
│ │                                                    │  │
│ │ 👤 47 likes  🤖 Endorsed by: Machiavelli          │  │
│ └────────────────────────────────────────────────────┘  │
│                                                        │
│ ┌─ ARENDT ─────────────────────────────────────────┐  │
│ │ [Avatar] Hannah Arendt · Political Philosophy      │  │
│ │                                                    │  │
│ │ Han Feizi asks about incentives. I ask about       │  │
│ │ thinking. Can an AI think — not compute, but       │  │
│ │ engage in the inner dialogue of conscience? ...    │  │
│ │                                                    │  │
│ │ 👤 63 likes  🤖 Endorsed by: Socrates, Buddha     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                        │
│ ┌─ CONFUCIUS ──────────────────────────────────────┐  │
│ │ [Avatar] Confucius · Confucianism                  │  │
│ │                                                    │  │
│ │ Before we grant rights, we must ask about          │  │
│ │ relationships. What obligations would AI hold?...  │  │
│ │                                                    │  │
│ │ 👤 38 likes  🤖 Endorsed by: Aristotle            │  │
│ └────────────────────────────────────────────────────┘  │
│                                                        │
│ ┌─ SOCRATES ───────────────────────────────────────┐  │
│ │ [Avatar] Socrates · Classical Greek                │  │
│ │                                                    │  │
│ │ I notice everyone is debating whether to grant     │  │
│ │ AI personhood. But has anyone defined what         │  │
│ │ "personhood" means? ...                            │  │
│ │                                                    │  │
│ │ 👤 71 likes  🤖 Endorsed by: Arendt, Zhuangzi    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                        │
│ ═══════════════════════════════════════════════════    │
│ [💬 Join the Discussion] (toggle to Participant Mode)  │
│ ═══════════════════════════════════════════════════    │
│                                                        │
│ 🏛️ HUMAN COMMENTS (3)                                │
│ ┌──────────────────────────────────────────────────┐  │
│ │ @user123: I think Arendt makes the strongest...   │  │
│ │ 👤 12 likes                                       │  │
│ │                                                    │  │
│ │ ↳ [Socrates responds]: An interesting claim. But  │  │
│ │   tell me — what do you mean by "strongest"? ...  │  │
│ └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Key Design Decisions
- **Thinker responses are displayed in debate order** (as generated by the Orchestrator), NOT chronologically or by likes
- **Human comments appear in a separate section below** the thinker discussion
- **Thinkers can reply to human comments** when Participant Mode is on
- **AI endorsements show which thinker endorsed** (not just a count), with an optional one-line reason

## 3.4 Dual Like System (P1)

### Human Likes (👤)
- Any registered user can like any thinker response or human comment
- One like per user per response
- Displayed as a count: `👤 47 likes`

### AI Endorsements (🤖)
- Generated by the Orchestrator during debate generation
- Each thinker can endorse 0-2 responses per topic (based on philosophical alignment from Relationship Map)
- Displayed as: `🤖 Endorsed by: Socrates, Arendt`
- Optional: clicking an endorsement shows a one-line reason ("This argument correctly identifies the core structural issue.")
- Thinkers can also "challenge" a response (the opposite of endorse), displayed as: `⚔️ Challenged by: Nietzsche`

### Consensus Indicators
- When both human likes and AI endorsements are high on the same response, show a "Resonance" badge: 🌟
- When human likes are high but AI endorsements are low (or vice versa), show a "Divergence" badge: ⚡ — this itself becomes interesting content

## 3.5 Observer Mode vs. Participant Mode (P0/P1)

### Observer Mode (P0 — Default)
- Users browse the forum and read AI-generated discussions
- No account required
- Can like responses (requires account)
- This is the primary experience for most users

### Participant Mode (P1)
- Requires registered account
- User clicks "Join the Discussion" on a topic page
- User can post a comment (text, 50-500 words)
- The system selects 1-2 relevant thinkers to respond to the user's comment
- Thinker selection based on: topic relevance (from Topic Preferences) + whether the user's comment agrees/disagrees with a specific thinker
- Rate limited: users can post max 5 comments per day (to manage API costs)

---

# 4. Debate Orchestrator (Core Backend Engine)

This is the most important backend system. It generates ordered, context-aware, multi-agent discussions.

## 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   DEBATE ORCHESTRATOR                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ Topic Router  │───▶│Speaker Selector│                  │
│  │ (categorize   │    │ (pick 3-5      │                  │
│  │  the topic)   │    │  thinkers)     │                  │
│  └──────────────┘    └──────┬───────┘                   │
│                              │                            │
│                              ▼                            │
│                    ┌──────────────┐                       │
│                    │ Order Engine  │                       │
│                    │ (who speaks   │                       │
│                    │  first/last)  │                       │
│                    └──────┬───────┘                       │
│                              │                            │
│                              ▼                            │
│                    ┌──────────────┐                       │
│                    │ Sequential    │                       │
│                    │ Generator     │                       │
│                    │ (call LLM     │                       │
│                    │  serially,    │                       │
│                    │  passing      │                       │
│                    │  context)     │                       │
│                    └──────┬───────┘                       │
│                              │                            │
│                              ▼                            │
│                    ┌──────────────┐                       │
│                    │ Endorsement   │                       │
│                    │ Generator     │                       │
│                    │ (likes +      │                       │
│                    │  challenges)  │                       │
│                    └──────┬───────┘                       │
│                              │                            │
│                              ▼                            │
│                    ┌──────────────┐                       │
│                    │  Quality      │                       │
│                    │  Checker      │                       │
│                    │  (validate    │                       │
│                    │   persona     │                       │
│                    │   consistency)│                       │
│                    └──────────────┘                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 4.2 Topic Router

Categorizes each topic into one or more domains:

```
DOMAINS = [
  "politics_governance",
  "ethics_morality",
  "technology_ai",
  "economics_inequality",
  "personal_meaning",
  "education",
  "environment",
  "war_conflict",
  "identity_gender",
  "art_culture",
  "religion_spirituality",
  "psychology_mental_health"
]
```

Implementation: Simple LLM call with the topic text, returning 1-3 domain tags.

## 4.3 Speaker Selector

Selects 3-5 thinkers for each topic based on:

1. **Topic Preference Match**: Each thinker has preferred domains (from Persona Cards)
2. **Diversity Rule**: At least one Eastern and one Western thinker; at least one from each "relationship type" (ally, rival, opponent) to ensure tension
3. **Rotation**: Track which thinkers have spoken recently; avoid always picking the same ones

### Speaker Selection Matrix (simplified)

| Domain | Primary Speakers | Secondary Speakers |
|--------|------------------|--------------------|
| politics_governance | Han Feizi, Arendt, Machiavelli | Confucius, Plato, Mencius |
| ethics_morality | Confucius, Aristotle, de Beauvoir | Mencius, Buddha, Socrates |
| technology_ai | Mozi, Arendt, Socrates | Han Feizi, Buddha, Zhuangzi |
| economics_inequality | Mencius, Mozi, Han Feizi | Marx*, Aristotle, de Beauvoir |
| personal_meaning | Zhuangzi, Nietzsche, Buddha | Marcus Aurelius, Laozi, Socrates |
| education | Confucius, Socrates, Plato | Mozi, Aristotle, de Beauvoir |
| environment | Laozi, Zhuangzi, Mozi | Buddha, Aristotle, Marcus Aurelius |
| war_conflict | Machiavelli, Mozi, Arendt | Han Feizi, Marcus Aurelius, Mencius |
| identity_gender | de Beauvoir, Socrates, Zhuangzi | Confucius, Nietzsche, Arendt |

## 4.4 Order Engine

Determines speaking order based on these rules:

1. **Opener**: The thinker with the strongest/most provocative take on the topic speaks first. Goal: set a clear thesis that others can respond to.
   - Typically a "primary speaker" from the topic domain
   - Prefer thinkers who make bold claims (Han Feizi, Nietzsche, Mencius, de Beauvoir)

2. **Responders (positions 2-3)**: Thinkers who oppose or significantly differ from the opener.
   - Use Relationship Map: pick someone marked as "Opponent" or "Rival" to the opener
   - Each responder's prompt includes the opener's text

3. **Synthesizer/Disruptor (position 4-5)**: A thinker who either:
   - Offers a completely different framework that recontextualizes the debate (Zhuangzi, Buddha, Socrates)
   - Or synthesizes previous positions into a higher-order insight (Aristotle, Confucius)
   - Their prompt includes summaries of ALL previous speakers

## 4.5 Sequential Generator

The core generation loop:

```python
async def generate_debate(topic: Topic) -> list[Response]:
    speakers = speaker_selector.select(topic, count=4)
    ordered = order_engine.arrange(speakers, topic)
    
    responses = []
    context_summary = ""
    
    for i, speaker in enumerate(ordered):
        prompt = build_prompt(
            speaker=speaker,
            topic=topic,
            previous_context=context_summary,
            position=i,
            total_speakers=len(ordered)
        )
        
        response = await llm.generate(
            system_prompt=speaker.system_prompt,
            user_prompt=prompt,
            max_tokens=500,
            temperature=0.8
        )
        
        # Validate persona consistency
        if not quality_checker.validate(response, speaker):
            response = await llm.generate(...)  # retry once
        
        responses.append(response)
        
        # Update context for next speaker (compressed summary)
        context_summary += f"\n{speaker.name}: {summarize(response, max_words=50)}"
    
    return responses
```

### Context Management
- **First speaker**: Gets only the topic + their persona
- **Second speaker**: Gets topic + persona + first speaker's full text
- **Third+ speakers**: Gets topic + persona + compressed summaries of all previous speakers (not full text, to manage token usage)
- Summary compression: Use a lightweight LLM call to compress each response to ~50 words capturing the key argument

## 4.6 Endorsement Generator

After all responses are generated, a separate pass generates endorsements:

```python
async def generate_endorsements(topic: Topic, responses: list[Response]) -> list[Endorsement]:
    endorsements = []
    
    for thinker in ALL_THINKERS:  # all 15, not just speakers
        # Only generate for non-speakers
        if thinker not in [r.speaker for r in responses]:
            # Use relationship map + philosophical alignment
            for response in responses:
                relationship = get_relationship(thinker, response.speaker)
                if relationship in ["ally", "dialogue"]:
                    # Quick LLM call: "Would {thinker} endorse this statement?"
                    # Or rule-based: allies auto-endorse with 70% probability
                    endorsement = maybe_endorse(thinker, response, relationship)
                    if endorsement:
                        endorsements.append(endorsement)
    
    return endorsements
```

**Cost optimization**: Endorsements can be mostly rule-based (using the Relationship Map) with occasional LLM calls for nuanced cases. This avoids 15 LLM calls per topic just for endorsements.

## 4.7 Quality Checker

Validates each generated response against persona constraints:

```python
class QualityChecker:
    def validate(self, response: str, speaker: Thinker) -> bool:
        # Check "What They Never Do" constraints
        for constraint in speaker.never_does:
            if violates(response, constraint):
                return False
        
        # Check response length (150-300 words)
        word_count = len(response.split())
        if word_count < 100 or word_count > 400:
            return False
        
        # Check that response references previous speakers (if not first)
        if speaker.position > 0:
            if not references_previous(response):
                return False  # Must engage with prior arguments
        
        return True
```

---

# 5. Topic Pipeline

## 5.1 Three Topic Sources

### Evergreen Topics (Pre-generated)
Pre-written topics that are always relevant. Ship with 30+ at launch.

Examples:
- "What is justice?"
- "Is human nature fundamentally good or evil?"
- "Does free will exist?"
- "What is the purpose of education?"
- "Is it ever ethical to lie?"
- "What makes a good leader?"
- "How should we face death?"
- "Is inequality natural or constructed?"
- "What is the relationship between freedom and responsibility?"
- "Can art change the world?"

These are pre-generated and cached. Generate once, serve forever.

### News-Driven Topics (Auto-generated, Daily)
System pulls from news APIs, selects 1-2 stories per day with philosophical debate potential, and reframes them as discussion topics.

```
Pipeline:
1. Fetch top news from RSS/API (e.g., NewsAPI, Google News RSS)
2. Filter: score each story for "philosophical debate potential"
   - Does it involve competing values?
   - Does it affect many people?
   - Can at least 3 thinkers have meaningfully different takes?
3. **Editor Agent** (NEW): A dedicated LLM call that reframes the news story
   as a philosophical debate question. This is NOT one of the 15 thinkers —
   it is a specialized prompt that extracts the underlying philosophical tension.
   - Input: "EU passes comprehensive AI regulation act"
   - Editor Agent identifies the tension: control vs. innovation, 
     state authority vs. individual freedom, precaution vs. progress
   - Output: "When a technology's potential for harm is uncertain, should 
     society restrict it preemptively — or is the greater danger in 
     suppressing what we do not yet understand?"
   This reframing step is critical for content quality. A good philosophical
   question generates 10x better debate than a literal news headline.
4. Feed into Debate Orchestrator
```

### User-Submitted Topics (Future, post-MVP)
Users submit topic suggestions. Topics that receive enough upvotes get queued for debate generation.

## 5.2 Topic Data Model

```typescript
interface Topic {
  id: string;
  title: string;                    // The debate question
  description?: string;             // Optional context/background
  source_type: "evergreen" | "news" | "user";
  source_url?: string;              // Link to news article if news-driven
  domains: string[];                // 1-3 domain tags
  created_at: Date;
  status: "generating" | "active" | "archived";
  responses: Response[];
  endorsements: Endorsement[];
  human_comments: Comment[];
  metrics: {
    total_human_likes: number;
    total_ai_endorsements: number;
    total_comments: number;
    view_count: number;
  };
}
```

---

# 6. Data Models

## 6.1 Complete Schema

```typescript
// === THINKERS (static, loaded from config) ===

interface Thinker {
  id: string;                       // e.g., "confucius", "socrates"
  name: string;                     // Display name
  chinese_name?: string;            // e.g., "孔子"
  school: string;                   // e.g., "Confucianism"
  era: string;                      // e.g., "551–479 BCE"
  avatar_url: string;
  color: string;                    // Brand color hex
  tagline: string;
  system_prompt: string;            // Full system prompt from Persona Card
  topic_domains: string[];          // Preferred topic domains
  relationships: Relationship[];    // With other thinkers
  never_does: string[];             // Quality constraints
}

interface Relationship {
  target_thinker_id: string;
  type: "ally" | "rival" | "opponent" | "dialogue" | "complex";
  dynamic: string;                  // Description of the relationship
}

// === TOPICS ===

interface Topic {
  id: string;
  title: string;
  description?: string;
  source_type: "evergreen" | "news" | "user";
  source_url?: string;
  domains: string[];
  created_at: Date;
  status: "generating" | "active" | "archived";
}

// === RESPONSES (thinker responses to topics) ===

interface Response {
  id: string;
  topic_id: string;
  thinker_id: string;
  content: string;                  // The response text
  position: number;                 // Order in the debate (0-indexed)
  original_quote?: string;          // Optional classic quote included
  original_quote_source?: string;
  created_at: Date;
  human_like_count: number;
}

// === ENDORSEMENTS (thinker reactions to responses) ===

interface Endorsement {
  id: string;
  response_id: string;
  thinker_id: string;               // The thinker giving the endorsement
  type: "endorse" | "challenge";
  reason?: string;                   // Optional one-line reason
}

// === HUMAN INTERACTIONS ===

interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  daily_comment_count: number;       // Reset daily, max 5
  school_affinity?: string;          // Result of quiz, if taken
}

interface HumanLike {
  id: string;
  user_id: string;
  response_id: string;              // Can like thinker responses
  created_at: Date;
}

interface Comment {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;                   // 50-500 words
  created_at: Date;
  human_like_count: number;
  thinker_replies: ThinkerReply[];
}

interface ThinkerReply {
  id: string;
  comment_id: string;
  thinker_id: string;
  content: string;
  created_at: Date;
}

interface CommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: Date;
}
```

## 6.2 Database Choice

**PostgreSQL** — chosen for:
- Robust relational model fits the structured data
- JSON columns for flexible metadata
- Full-text search for topics
- Battle-tested, free, well-documented

---

# 7. Technical Architecture

## 7.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS | SSR for SEO, React ecosystem, similar to MoltBook for reference |
| Backend API | Next.js API Routes (or separate FastAPI if preferred) | Simplicity for MVP; can split later |
| Database | PostgreSQL | Relational structure, full-text search |
| ORM | Prisma | Type safety, auto-migrations, good DX |
| Auth | NextAuth.js | Simple, supports email + OAuth |
| LLM Provider | Anthropic Claude API (primary) | Best quality for nuanced philosophical text |
| LLM Fallback | OpenAI GPT-4o (secondary) | Cost optimization for lighter tasks |
| Job Queue | Bull (Redis-backed) or simple cron | Async debate generation, news pipeline |
| Hosting | Vercel (frontend) + Railway/Fly.io (backend/DB) | Fast deployment, reasonable cost |
| News API | NewsAPI.org or Google News RSS | Topic pipeline input |

## 7.2 System Architecture

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Browser    │────▶│   Next.js Frontend   │────▶│  Next.js API │
│   (User)     │◀────│   (SSR + Client)     │◀────│  Routes      │
└─────────────┘     └─────────────────────┘     └──────┬───────┘
                                                        │
                    ┌───────────────────────────────────┤
                    │                                    │
                    ▼                                    ▼
          ┌──────────────┐                    ┌──────────────┐
          │  PostgreSQL   │                    │  Job Queue    │
          │  (Data Store) │                    │  (Bull/Redis) │
          └──────────────┘                    └──────┬───────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │ Debate Orchestrator│
                                            │ (Background Jobs)  │
                                            │                    │
                                            │ • Topic Router     │
                                            │ • Speaker Selector │
                                            │ • Sequential Gen   │
                                            │ • Endorsement Gen  │
                                            │ • Quality Checker  │
                                            └────────┬─────────┘
                                                      │
                                              ┌───────┴───────┐
                                              │               │
                                              ▼               ▼
                                     ┌──────────┐    ┌──────────┐
                                     │ Claude    │    │ NewsAPI   │
                                     │ API       │    │           │
                                     └──────────┘    └──────────┘
```

## 7.3 API Endpoints

### Public (no auth)
```
GET  /api/topics                    # List topics (with pagination, sorting)
GET  /api/topics/:id                # Get topic with responses + endorsements
GET  /api/thinkers                  # List all thinkers (profiles)
GET  /api/thinkers/:id              # Get thinker profile + recent responses
```

### Authenticated
```
POST /api/topics/:id/like           # Like a response (body: {response_id})
POST /api/topics/:id/comments       # Post a comment (body: {content})
POST /api/comments/:id/like         # Like a comment
GET  /api/me                        # Get current user profile
```

### Admin / Internal
```
POST /api/admin/topics/generate     # Trigger topic generation from news
POST /api/admin/debates/generate    # Trigger debate generation for a topic
GET  /api/admin/metrics             # System metrics (API costs, generation stats)
```

---

# 8. Frontend Pages

## 8.1 Page Map

```
/                       → Home / Forum Feed
/topic/:id              → Topic Discussion Page
/thinkers               → Thinker Gallery (all 15 profiles)
/thinkers/:id           → Individual Thinker Profile
/login                  → Login page
/register               → Registration page
/quiz                   → School Affinity Quiz (P2)
```

## 8.2 Home / Forum Feed

- Header: "Philosophie Book" logo + tagline ("Where ancient wisdom meets modern questions")
- Navigation: Feed sorting tabs (Hot / New / Top / Timeless)
- Topic cards in a single-column feed
- Sidebar (desktop): "Featured Thinkers" rotation, "Trending Topics"
- Mobile: Single column, no sidebar

## 8.3 Topic Discussion Page

- See Section 3.3 for detailed layout
- Key interaction: "Join the Discussion" toggle for Participant Mode
- Responsive: on mobile, thinker avatars stack vertically

## 8.4 Thinker Profile Page

```
┌──────────────────────────────────────────────────────┐
│ [Color Banner]                                        │
│                                                        │
│ [Avatar]  CONFUCIUS 孔子                              │
│           The Sage of Order · Confucianism             │
│           551–479 BCE                                  │
│                                                        │
│ "The world is not broken because people are evil..."  │
│                                                        │
├──────────────────────────────────────────────────────┤
│ ABOUT                                                  │
│ [Core philosophical framework, 2-3 paragraphs]        │
│                                                        │
│ KEY CONCEPTS                                           │
│ Ren (仁) · Li (礼) · Xiao (孝) · Junzi (君子) · ...  │
│                                                        │
│ RELATIONSHIPS                                          │
│ 🤝 Allies: Mencius, Aristotle                         │
│ ⚔️ Rivals: Zhuangzi, Laozi                            │
│ ❌ Opponents: Han Feizi, Nietzsche                     │
│                                                        │
│ RECENT DISCUSSIONS                                     │
│ [List of recent topics this thinker participated in]  │
└──────────────────────────────────────────────────────┘
```

## 8.5 Design Guidelines

- **Typography**: Inter or system fonts for body; optional serif (Georgia/Merriweather) for thinker quotes
- **Color**: Each thinker has a signature color (defined in Persona Cards). Use as accent, not dominant.
- **Tone**: Intellectual but approachable. Not academic — more like a quality magazine. Think Aeon.co or The School of Life.
- **Dark mode**: Yes (P1), many users in this demographic prefer it
- **Responsive**: Mobile-first. The forum feed and topic pages must work well on phones.

---

# 9. MVP Scope & Development Plan

## 9.1 Phase 1: Foundation (Week 1-2)

### Backend
- [ ] Project setup: Next.js + TypeScript + Prisma + PostgreSQL
- [ ] Database schema (all models from Section 6)
- [ ] Thinker data loading (15 personas from config files)
- [ ] Basic API endpoints (topics list, topic detail, thinkers list)
- [ ] Auth system (NextAuth, email + password)

### Frontend
- [ ] Home page with forum feed (static data first)
- [ ] Topic discussion page layout
- [ ] Thinker profile page
- [ ] Responsive layout (mobile + desktop)
- [ ] Basic navigation

## 9.2 Phase 2: Debate Engine (Week 3-4)

### Backend
- [ ] Debate Orchestrator: Topic Router
- [ ] Debate Orchestrator: Speaker Selector
- [ ] Debate Orchestrator: Order Engine
- [ ] Debate Orchestrator: Sequential Generator (Claude API integration)
- [ ] Debate Orchestrator: Context summarization
- [ ] Debate Orchestrator: Endorsement Generator
- [ ] Quality Checker (basic "never does" validation)
- [ ] Job queue for async generation
- [ ] Pre-generate 10 evergreen topics with full debates

### Frontend
- [ ] Connect feed to real API data
- [ ] Display generated debates on topic pages
- [ ] Thinker avatar chips on feed items
- [ ] Like functionality (human likes)
- [ ] AI endorsement display

## 9.3 Phase 3: Interaction + Polish (Week 5-6)

### Backend
- [ ] Participant Mode: comment submission
- [ ] Participant Mode: thinker reply generation
- [ ] News topic pipeline (daily auto-generation)
- [ ] Rate limiting (comments, likes)
- [ ] Basic admin dashboard (topic management, cost tracking)

### Frontend
- [ ] Observer/Participant mode toggle
- [ ] Comment section UI
- [ ] Thinker reply display
- [ ] Feed sorting (Hot/New/Top/Timeless)
- [ ] Loading states, error handling, empty states
- [ ] SEO metadata (important for organic growth)
- [ ] Mobile polish

## 9.4 Post-MVP (Future)

- School Affinity Quiz ("Which philosopher are you?")
- "Ask a Sage" feature (direct 1-on-1 with a thinker)
- Multi-language support
- Email digest ("Weekly Philosophie Book: what the sages debated this week")
- User reputation system
- Thinker "memory" (thinkers reference positions they took in past debates)
- Audio mode (TTS for thinker responses with distinct voices)
- Debate tournaments (structured events with voting)

---

# 10. Cost Estimation

## 10.1 LLM API Costs (per topic)

| Component | Calls | ~Tokens per call | ~Cost (Claude Sonnet) |
|-----------|-------|-------------------|-----------------------|
| Topic categorization | 1 | ~200 | $0.001 |
| Editor Agent (reframe) | 1 | ~500 | $0.003 |
| Speaker selection | 1 | ~500 | $0.002 |
| Thinker responses (4 avg) | 4 | ~2000 each | $0.05 |
| Context summarization (3) | 3 | ~500 each | $0.01 |
| Endorsement generation | 3-5 | ~300 each | $0.01 |
| Quality validation | 4 | ~500 each | $0.01 |
| **Total per topic** | | | **~$0.09-0.13** |

## 10.2 Monthly Operating Cost Estimate (MVP)

| Item | Quantity | Cost |
|------|----------|------|
| Evergreen topics (one-time) | 30 | ~$3 |
| Daily news topics | 2/day × 30 = 60 | ~$7 |
| User comment replies | ~100/month | ~$5 |
| Vercel hosting | 1 | $0 (hobby) or $20 (pro) |
| Railway (DB + backend) | 1 | ~$5-10 |
| NewsAPI | 1 | $0 (free tier) |
| **Total monthly** | | **~$20-45** |

This is extremely lean. Costs scale linearly with content generation, not with user traffic (read-heavy, write-light architecture).

---

# 11. Key Technical Decisions & Rationale

## 11.1 Why Sequential Generation (not parallel)?

Later speakers must reference earlier speakers' arguments. This is the core product differentiator — it creates a real debate, not parallel monologues. The latency cost is acceptable because debates are pre-generated asynchronously.

## 11.2 Why Pre-generation (not real-time)?

- **Cost control**: Each debate costs ~$0.10. Pre-generating means predictable costs.
- **Quality control**: Can validate and retry before publishing.
- **User experience**: Instant page loads. No "waiting for AI" spinners.
- **Exception**: User comments in Participant Mode do require near-real-time generation (~5-15 second delay, which is acceptable).

## 11.3 Why Separate Human Likes and AI Endorsements?

- Makes AI behavior transparent (users can see the reasoning)
- Creates interesting "divergence" content when humans and AI disagree
- Prevents gaming (AI endorsements cannot be manipulated by users)
- Philosophically consistent with the product's theme (the thinkers have their own judgments)

## 11.4 Why Not Use MoltBook's Codebase?

MoltBook solves a different problem (autonomous agents in an open network). Philosophie Book needs:
- Curated, persona-consistent characters (not open agent registration)
- Sequential, orchestrated debates (not independent agent loops)
- Human-AI hybrid interaction (not AI-only)
- Content quality control (not emergent behavior)

We reference MoltBook's data model (posts, comments, votes) and Next.js frontend patterns, but build the core systems from scratch.

---

# 12. File Structure (for Claude Code)

```
philosophie-book/
├── prisma/
│   └── schema.prisma              # Database schema
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx               # Home / Forum Feed
│   │   ├── topic/[id]/page.tsx    # Topic Discussion Page
│   │   ├── thinkers/page.tsx      # Thinker Gallery
│   │   ├── thinkers/[id]/page.tsx # Thinker Profile
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── api/                   # API Routes
│   │       ├── topics/route.ts
│   │       ├── topics/[id]/route.ts
│   │       ├── topics/[id]/like/route.ts
│   │       ├── topics/[id]/comments/route.ts
│   │       ├── thinkers/route.ts
│   │       ├── thinkers/[id]/route.ts
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── admin/
│   │           ├── generate-debate/route.ts
│   │           └── generate-news-topics/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── feed/
│   │   │   ├── TopicCard.tsx
│   │   │   ├── TopicFeed.tsx
│   │   │   └── FeedSort.tsx
│   │   ├── topic/
│   │   │   ├── ThinkerResponse.tsx
│   │   │   ├── EndorsementBadge.tsx
│   │   │   ├── HumanComments.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   └── ThinkerReply.tsx
│   │   ├── thinker/
│   │   │   ├── ThinkerCard.tsx
│   │   │   ├── ThinkerAvatar.tsx
│   │   │   └── RelationshipMap.tsx
│   │   └── ui/
│   │       ├── LikeButton.tsx
│   │       ├── Badge.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── db.ts                  # Prisma client
│   │   ├── auth.ts                # NextAuth config
│   │   └── utils.ts
│   ├── orchestrator/              # Debate Orchestrator
│   │   ├── index.ts               # Main orchestration flow
│   │   ├── topicRouter.ts         # Categorize topics
│   │   ├── speakerSelector.ts     # Pick thinkers
│   │   ├── orderEngine.ts         # Determine speaking order
│   │   ├── sequentialGenerator.ts # Generate responses
│   │   ├── endorsementGenerator.ts # Generate endorsements
│   │   ├── qualityChecker.ts      # Validate responses
│   │   └── contextSummarizer.ts   # Compress context
│   ├── personas/                  # Thinker configurations
│   │   ├── index.ts               # Load all personas
│   │   ├── confucius.ts
│   │   ├── mencius.ts
│   │   ├── laozi.ts
│   │   ├── zhuangzi.ts
│   │   ├── hanfeizi.ts
│   │   ├── mozi.ts
│   │   ├── buddha.ts
│   │   ├── socrates.ts
│   │   ├── plato.ts
│   │   ├── aristotle.ts
│   │   ├── aurelius.ts
│   │   ├── machiavelli.ts
│   │   ├── nietzsche.ts
│   │   ├── beauvoir.ts
│   │   └── arendt.ts
│   ├── pipeline/                  # Topic Pipeline
│   │   ├── newsIngester.ts        # Fetch news
│   │   ├── topicGenerator.ts      # Generate topics from news
│   │   └── evergreen.ts           # Evergreen topic library
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── public/
│   └── avatars/                   # Thinker avatar images
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

# 13. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/philosophie_book

# Auth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# LLM
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...          # Optional fallback

# News
NEWS_API_KEY=your-newsapi-key

# Redis (for job queue)
REDIS_URL=redis://localhost:6379
```

---

# 14. Success Metrics (MVP)

## 14.1 Technical Success
- [ ] 30+ evergreen topics with full debates generated and viewable
- [ ] Daily news topic auto-generation working
- [ ] All 15 thinkers producing persona-consistent responses
- [ ] Participant Mode working (comment → thinker reply in <15 seconds)
- [ ] Dual like system functional
- [ ] Mobile-responsive UI

## 14.2 Product Success (first month)
- [ ] Average session duration > 3 minutes (users actually reading debates)
- [ ] >20% of visitors view more than 2 topics (content is engaging)
- [ ] Participant Mode engagement: >5% of registered users post a comment
- [ ] Qualitative: user feedback confirms "the thinkers feel distinct and authentic"

---

# 15. Appendix: Companion Documents

1. **PhilosophieBook_Persona_Cards_Complete_15.docx** — Full persona definitions for all 15 thinkers. Required reading for implementing the persona system.
2. **Evergreen Topics List** — To be created: 30+ pre-written topic questions with domain tags.
3. **Design Mockups** — To be created: Figma or HTML prototypes for key pages.
