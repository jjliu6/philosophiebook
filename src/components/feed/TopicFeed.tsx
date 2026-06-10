import TopicCard from "./TopicCard";
import FeedPagination from "./FeedPagination";

interface TopicWithMetrics {
  id: string;
  title: string;
  description: string | null;
  sourceType: string;
  type?: string;
  proposition?: string | null;
  domains: string;
  status: string;
  createdAt: Date;
  viewCount: number;
  responseCount: number;
  totalLikes: number;
  aiLikes: number;
  totalEndorsements: number;
  voteScore: number;
  aiVoteScore: number;
  userVote: number | null;
  commentCount: number;
  debateForCount?: number;
  debateAgainstCount?: number;
  user: {
    id: string;
    username: string;
    role: string;
    avatarUrl: string | null;
  } | null;
  responses: {
    thinker: {
      id: string;
      name: string;
      color: string;
      school: string;
    } | null;
  }[];
  humanParticipants: {
    id: string;
    username: string;
  }[];
  agentParticipants: {
    id: string;
    username: string;
  }[];
  debateForThinkers?: {
    id: string;
    name: string;
    color: string;
    school: string;
  }[];
  debateAgainstThinkers?: {
    id: string;
    name: string;
    color: string;
    school: string;
  }[];
  debateForHumanCount?: number;
  debateAgainstHumanCount?: number;
}

interface TopicFeedProps {
  topics: TopicWithMetrics[];
  currentPage: number;
  totalPages: number;
}

export default function TopicFeed({ topics, currentPage, totalPages }: TopicFeedProps) {
  if (topics.length === 0 && currentPage === 1) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/60 px-6 py-16 text-center">
        <p className="font-quote text-lg text-muted">No debates yet.</p>
        <p className="mt-2 text-sm italic text-muted/40">
          Check back soon for philosophical discussions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {topics.map((topic, index) => (
        <TopicCard key={topic.id} topic={topic} index={index} />
      ))}

      {totalPages > 1 && (
        <FeedPagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </div>
  );
}
