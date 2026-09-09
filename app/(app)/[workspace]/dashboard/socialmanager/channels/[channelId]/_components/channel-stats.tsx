import { CheckCircle2, Clock, PenLine, Users } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";

interface ChannelStatsProps {
  followerCount: number;
  published: number;
  scheduled: number;
  drafts: number;
}

export function ChannelStats({ followerCount, published, scheduled, drafts }: ChannelStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Followers"
        value={followerCount ? followerCount.toLocaleString() : "—"}
        icon={<Users className="size-5" />}
        accent="info"
      />
      <StatCard
        title="Published"
        value={published}
        icon={<CheckCircle2 className="size-5" />}
        accent="success"
      />
      <StatCard
        title="Scheduled"
        value={scheduled}
        icon={<Clock className="size-5" />}
        accent="primary"
      />
      <StatCard
        title="Drafts"
        value={drafts}
        icon={<PenLine className="size-5" />}
        accent="warning"
      />
    </div>
  );
}