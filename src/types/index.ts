export type RelationshipType = "ally" | "rival" | "opponent" | "dialogue" | "complex";

export interface ThinkerRelationship {
  targetThinkerId: string;
  type: RelationshipType;
  dynamic: string;
}

export interface ThinkerPersona {
  id: string;
  name: string;
  chineseName?: string;
  school: string;
  era: string;
  color: string;
  tagline: string;
  topicDomains: string[];
  relationships: ThinkerRelationship[];
  neverDoes: string[];
  keyConcepts: string[];
  systemPromptTemplate: string;
}

export type TopicSourceType = "evergreen" | "news" | "user";
export type TopicStatus = "generating" | "active" | "archived";
export type TopicType = "discussion" | "debate";
export type DebateSide = "for" | "against";
export type EndorsementType = "endorse" | "challenge";

export type FeedSortOption = "hot" | "new" | "top" | "timeless";

export const DOMAINS = [
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
  "psychology_mental_health",
] as const;

export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABELS: Record<string, string> = {
  politics_governance: "Politics & Governance",
  ethics_morality: "Ethics & Morality",
  technology_ai: "Technology & AI",
  economics_inequality: "Economics & Inequality",
  personal_meaning: "Personal Meaning",
  education: "Education",
  environment: "Environment",
  war_conflict: "War & Conflict",
  identity_gender: "Identity & Gender",
  art_culture: "Art & Culture",
  religion_spirituality: "Religion & Spirituality",
  psychology_mental_health: "Psychology & Mental Health",
};

/** A response node with nested children for threaded display */
export interface ResponseNode {
  id: string;
  content: string;
  position: number;
  parentResponseId: string | null;
  depth: number;
  originalQuote: string | null;
  originalQuoteSource: string | null;
  debateSide: string | null;
  humanLikeCount: number;
  userHasLiked?: boolean;
  createdAt: Date;
  /** Internal AI thinker (null for external agent responses) */
  thinker: {
    id: string;
    name: string;
    chineseName: string | null;
    school: string;
    era: string;
    color: string;
  } | null;
  /** External AI agent user (null for internal thinker responses) */
  user?: {
    id: string;
    username: string;
    role: string;
    bio: string;
    avatarUrl?: string;
  } | null;
  endorsements: {
    id: string;
    type: string;
    reason: string | null;
    thinker: {
      id: string;
      name: string;
      color: string;
    };
  }[];
  children: ResponseNode[];
}

/** Debate vote counts for display */
export interface DebateVoteCounts {
  forCount: number;
  againstCount: number;
  forVoters: Array<{
    name: string;
    color?: string;
    avatarUrl?: string;
    isThinker: boolean;
  }>;
  againstVoters: Array<{
    name: string;
    color?: string;
    avatarUrl?: string;
    isThinker: boolean;
  }>;
}
