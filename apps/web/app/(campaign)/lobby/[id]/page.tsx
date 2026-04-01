"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { LiveActivityFeed } from "@/components/campaign/live-activity-feed";

interface CampaignData {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  status: string;
  dm: { id: string; name: string | null; image: string | null };
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string | null; image: string | null };
    character: {
      id: string;
      name: string;
      level: number;
    } | null;
  }>;
}

export default function CampaignLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaign(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function copyInviteCode() {
    if (!campaign) return;
    navigator.clipboard.writeText(campaign.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <p className="text-center text-on-surface-variant animate-pulse">
          Loading campaign...
        </p>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <p className="text-center text-error">Campaign not found</p>
      </main>
    );
  }

  const players = campaign.members.filter((m) => m.role === "PLAYER");

  return (
    <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-10">
      {/* Campaign Header */}
      <section className="text-center space-y-4 animate-fade-in-up">
        <h1 className="font-headline text-4xl text-primary">{campaign.name}</h1>
        {campaign.description && (
          <p className="font-body text-on-surface-variant max-w-lg mx-auto">
            {campaign.description}
          </p>
        )}
        <p className="text-xs text-on-surface-variant font-label uppercase tracking-tighter">
          Dungeon Master: {campaign.dm.name}
        </p>
      </section>

      {/* Invite Code Banner */}
      <section className="bg-surface-container-low rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-secondary/10 animate-border-glow animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <div className="space-y-1 text-center md:text-left">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface/40">
            Invite Code
          </p>
          <p className="font-headline text-3xl text-secondary tracking-[0.3em]">
            {campaign.inviteCode.slice(0, 3)}-{campaign.inviteCode.slice(3)}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={copyInviteCode}
          className={`transition-all duration-300 ${copied ? "glow-gold border-secondary/40" : ""}`}
        >
          <Icon name={copied ? "check" : "content_copy"} size={16} />
          {copied ? "Copied!" : "Copy Code"}
        </Button>
      </section>

      {/* Party Members */}
      <section className="space-y-6 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <div className="flex justify-between items-end border-b border-outline-variant/20 pb-2">
          <h3 className="font-headline text-xl text-on-surface">Party Members</h3>
          <span className="font-label text-[10px] uppercase tracking-widest text-secondary/60">
            {campaign.members.length} Soul{campaign.members.length !== 1 ? "s" : ""} Bound
          </span>
        </div>

        <div className="space-y-3 stagger-children">
          {/* DM */}
          <div className="bg-surface-container-low p-4 rounded-sm flex items-center gap-4 border-l-2 border-secondary interactive-glow">
            <div className="w-12 h-12 rounded-full bg-secondary-container/20 border border-secondary/30 flex items-center justify-center glow-gold">
              <Icon name="auto_stories" size={20} className="text-secondary" />
            </div>
            <div className="flex-1">
              <p className="font-body font-semibold text-on-surface">
                {campaign.dm.name}
              </p>
              <p className="font-label text-[10px] uppercase tracking-widest text-secondary">
                Dungeon Master
              </p>
            </div>
          </div>

          {/* Players */}
          {players.map((member) => (
            <div
              key={member.id}
              className="bg-surface-container-low p-4 rounded-sm flex items-center gap-4 border-l-2 border-primary/30 interactive-glow"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
                <span className="font-headline text-lg text-on-surface">
                  {member.user.name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-body font-semibold text-on-surface">
                  {member.user.name}
                </p>
                {member.character ? (
                  <p className="font-label text-[10px] uppercase tracking-widest text-primary/60">
                    {member.character.name} · Level {member.character.level}
                  </p>
                ) : (
                  <p className="font-label text-[10px] uppercase tracking-widest text-on-surface/40">
                    No character assigned
                  </p>
                )}
              </div>
              {!member.character && (
                <Button variant="ghost" size="sm">
                  <Icon name="person_add" size={16} />
                  Assign
                </Button>
              )}
            </div>
          ))}

          {players.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant relative">
              <div className="decorative-orb absolute inset-0 m-auto w-32 h-32" />
              <Icon name="group" size={40} className="opacity-30 mb-2 animate-float relative z-10" />
              <p className="font-body text-sm relative z-10">
                No players yet. Share the invite code to gather your party.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Live Activity Feed */}
      <LiveActivityFeed campaignId={campaign.id} />
    </main>
  );
}
