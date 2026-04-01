"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface Campaign {
  id: string;
  name: string;
  status: string;
  inviteCode: string;
  _count: { members: number };
}

export default function DMDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        // Filter to only DM campaigns (those with DM role) — for now show all
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-10">
      <section className="flex justify-between items-end animate-fade-in-up">
        <div>
          <h1 className="font-headline text-3xl text-on-background">DM Command Center</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Manage your campaigns and guide your players
          </p>
        </div>
        <Link href="/create">
          <Button size="sm">
            <Icon name="add" size={16} />
            New Campaign
          </Button>
        </Link>
      </section>

      {loading ? (
        <p className="text-center text-on-surface-variant animate-pulse py-12">Loading...</p>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 space-y-4 relative">
          <div className="decorative-orb absolute inset-0 m-auto w-48 h-48" />
          <Icon name="auto_stories" size={60} className="text-on-surface/10 mx-auto animate-float relative z-10" />
          <h3 className="font-headline text-xl text-on-surface-variant relative z-10">No campaigns yet</h3>
          <Link href="/create" className="relative z-10 inline-block">
            <Button>Create Your First Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaign/${c.id}`}
              className="block bg-surface-container-low p-6 rounded-sm hover:bg-surface-container transition-all duration-300 border border-transparent hover:border-secondary/20 interactive-glow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-headline text-xl text-primary">{c.name}</h3>
                  <p className="font-label text-xs text-on-surface-variant uppercase tracking-tighter mt-1">
                    {c._count.members} members · Code: {c.inviteCode}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-sm font-label text-[10px] uppercase ${
                    c.status === "ACTIVE" ? "bg-green-900/30 text-green-400" : "bg-surface-container-high text-on-surface/40"
                  }`}>
                    {c.status}
                  </span>
                  <Icon name="arrow_forward" size={20} className="text-secondary/60 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
