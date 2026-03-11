import TopicCard from "./TopicCard";

interface TopicWithMetrics {
  id: string;
  title: string;
  description: string | null;
  sourceType: string;
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
}

interface TopicFeedProps {
  topics: TopicWithMetrics[];
}

export default function TopicFeed({ topics }: TopicFeedProps) {
  if (topics.length === 0) {
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
    </div>
  );
}
