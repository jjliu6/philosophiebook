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

/** A response node with nested children for threaded display */
export interface ResponseNode {
  id: string;
  content: string;
  position: number;
  parentResponseId: string | null;
  depth: number;
  originalQuote: string | null;
  originalQuoteSource: string | null;
  humanLikeCount: number;
  userHasLiked?: boolean;
  createdAt: Date;
  thinker: {
    id: string;
    name: string;
    chineseName: string | null;
    school: string;
    era: string;
    color: string;
  };
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
