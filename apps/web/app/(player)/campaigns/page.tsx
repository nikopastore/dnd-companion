"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface Campaign {
  id: string;
  name: string;
  status: string;
  dm: { name: string | null; image: string | null };
  members: Array<{
    user: { name: string | null; image: string | null };
  }>;
  _count: { members: number };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-10">
      <section className="flex justify-between items-end">
        <div>
          <h1 className="font-headline text-3xl text-on-background">
            Your Campaigns
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Chronicles you have joined or forged
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/join">
            <Button variant="secondary" size="sm">
              <Icon name="login" size={16} />
              Join
            </Button>
          </Link>
          <Link href="/create">
            <Button size="sm">
              <Icon name="add" size={16} />
              Create
            </Button>
          </Link>
        </div>
      </section>

      {loading ? (
        <p className="text-center text-on-surface-variant animate-pulse py-12">
          Loading campaigns...
        </p>
      ) : campaigns.length === 0 ? (
        <section className="text-center py-16 space-y-4">
          <Icon
            name="auto_stories"
            size={60}
            className="text-on-surface/10 mx-auto"
          />
          <h3 className="font-headline text-xl text-on-surface-variant">
            No campaigns yet
          </h3>
          <p className="font-body text-sm text-on-surface/40 max-w-sm mx-auto">
            Join an existing campaign with an invite code or create your own as
            a Dungeon Master.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/join">
              <Button variant="secondary">Join a Campaign</Button>
            </Link>
            <Link href="/create">
              <Button>Create Campaign</Button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              id={campaign.id}
              name={campaign.name}
              dmName={campaign.dm.name || "Unknown"}
              memberCount={campaign._count.members}
              members={campaign.members.map((m) => m.user)}
              status={campaign.status}
            />
          ))}
        </section>
      )}
    </main>
  );
}
