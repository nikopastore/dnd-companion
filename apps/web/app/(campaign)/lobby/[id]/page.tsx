"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { LiveActivityFeed } from "@/components/campaign/live-activity-feed";
import { NPCTracker } from "@/components/dm/npc-tracker";
import { SessionItemTracker } from "@/components/dm/session-item-tracker";

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
  npcs: Array<{ id: string; name: string; description: string | null; isEnemy: boolean; notes: string | null }>;
  sessionItems: Array<{ id: string; name: string; description: string | null; location: string | null; isHidden: boolean; claimedById: string | null }>;
}

export default function CampaignLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const isDM = session?.user?.id === campaign?.dm?.id;

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

  async function updateStatus(newStatus: string) {
    if (!campaign) return;
    setStatusLoading(true);
    const res = await fetch(`/api/campaigns/${campaign.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatusLoading(false);
    if (res.ok) {
      setCampaign((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
  }

  function handleAddNPC(npc: CampaignData["npcs"][0]) {
    setCampaign((prev) => prev ? { ...prev, npcs: [...prev.npcs, npc] } : prev);
  }

  function handleAddItem(item: CampaignData["sessionItems"][0]) {
    setCampaign((prev) => prev ? { ...prev, sessionItems: [...prev.sessionItems, item] } : prev);
  }

  if (loading) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-surface-container-high rounded-sm mx-auto" />
          <div className="h-4 w-32 bg-surface-container-high/60 rounded-sm mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="h-40 bg-surface-container-high/40 rounded-sm" />
            <div className="h-40 bg-surface-container-high/40 rounded-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        <p className="text-center text-error">Campaign not found</p>
      </main>
    );
  }

  const players = campaign.members.filter((m) => m.role === "PLAYER");
  const statusColors: Record<string, string> = {
    LOBBY: "bg-secondary-container/20 text-secondary border-secondary/20",
    ACTIVE: "bg-green-900/30 text-green-400 border-green-500/20",
    ARCHIVED: "bg-surface-container-high text-on-surface/40 border-outline-variant/20",
  };

  return (
    <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-8">
      {/* Campaign Header */}
      <section className="text-center space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-center gap-3">
          <h1 className="font-headline text-4xl text-primary">{campaign.name}</h1>
          <span className={`px-2.5 py-1 rounded-sm font-label text-[10px] uppercase tracking-widest border ${statusColors[campaign.status] || ""}`}>
            {campaign.status}
          </span>
        </div>
        {campaign.description && (
          <p className="font-body text-on-surface-variant max-w-lg mx-auto">
            {campaign.description}
          </p>
        )}
        <p className="text-xs text-on-surface-variant font-label uppercase tracking-tighter">
          Dungeon Master: {campaign.dm.name}
          {isDM && <span className="text-secondary ml-2">(You)</span>}
        </p>
      </section>

      {/* DM Controls */}
      {isDM && (
        <section className="glass rounded-sm p-6 space-y-5 animate-fade-in-up border border-secondary/10" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-2">
            <Icon name="shield_person" size={20} className="text-secondary" />
            <h3 className="font-headline text-lg text-secondary uppercase tracking-widest text-xs">
              DM Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {campaign.status === "LOBBY" && (
              <Button
                onClick={() => updateStatus("ACTIVE")}
                loading={statusLoading}
                className="glow-gold"
              >
                <Icon name="play_arrow" size={18} />
                Start Campaign
              </Button>
            )}
            {campaign.status === "ACTIVE" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => updateStatus("LOBBY")}
                  loading={statusLoading}
                >
                  <Icon name="pause" size={18} />
                  Pause Campaign
                </Button>
                <Button
                  variant="danger"
                  onClick={() => updateStatus("ARCHIVED")}
                  loading={statusLoading}
                >
                  <Icon name="archive" size={18} />
                  Archive
                </Button>
              </>
            )}
            {campaign.status === "ARCHIVED" && (
              <Button
                variant="secondary"
                onClick={() => updateStatus("ACTIVE")}
                loading={statusLoading}
              >
                <Icon name="unarchive" size={18} />
                Reactivate
              </Button>
            )}
            <Link href={`/builder?campaignId=${campaign.id}`}>
              <Button variant="secondary" className="w-full">
                <Icon name="person_add" size={18} />
                Create NPC Character
              </Button>
            </Link>
          </div>

          <div className="decorative-line" />

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="font-headline text-2xl text-on-surface">{players.length}</div>
              <div className="font-label text-[10px] uppercase text-on-surface/40">Players</div>
            </div>
            <div className="text-center">
              <div className="font-headline text-2xl text-on-surface">{campaign.npcs?.length || 0}</div>
              <div className="font-label text-[10px] uppercase text-on-surface/40">NPCs</div>
            </div>
            <div className="text-center">
              <div className="font-headline text-2xl text-on-surface">{campaign.sessionItems?.length || 0}</div>
              <div className="font-label text-[10px] uppercase text-on-surface/40">Items</div>
            </div>
          </div>
        </section>
      )}

      {/* Invite Code Banner */}
      <section className="bg-surface-container-low rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-secondary/10 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <div className="space-y-1 text-center md:text-left">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface/40">
            Invite Code
          </p>
          <p className="font-headline text-3xl text-secondary tracking-[0.3em] tabular-nums">
            {campaign.inviteCode.slice(0, 3)}-{campaign.inviteCode.slice(3)}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={copyInviteCode}
          className={`transition-all duration-300 ${copied ? "glow-gold border-secondary/40" : ""}`}
          aria-label="Copy invite code to clipboard"
        >
          <Icon name={copied ? "check" : "content_copy"} size={16} />
          {copied ? "Copied!" : "Copy Code"}
        </Button>
      </section>

      <div className={`grid grid-cols-1 ${isDM ? "lg:grid-cols-12" : ""} gap-8`}>
        {/* Party Members (left column for DM, full width for players) */}
        <section className={`space-y-6 animate-fade-in-up ${isDM ? "lg:col-span-7" : ""}`} style={{ animationDelay: "200ms" }}>
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
                  <Link href={`/builder?campaignId=${campaign.id}`}>
                    <Button variant="ghost" size="sm" aria-label={`Assign character for ${member.user.name}`}>
                      <Icon name="person_add" size={16} />
                      Assign
                    </Button>
                  </Link>
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

        {/* DM Sidebar: NPCs & Items */}
        {isDM && (
          <aside className="lg:col-span-5 space-y-6 animate-fade-in-up" style={{ animationDelay: "280ms" }}>
            <div className="bg-surface-container-low p-6 rounded-sm border border-secondary/5">
              <NPCTracker
                npcs={campaign.npcs || []}
                campaignId={campaign.id}
                onAdd={handleAddNPC}
              />
            </div>

            <div className="decorative-line" />

            <div className="bg-surface-container-low p-6 rounded-sm border border-secondary/5">
              <SessionItemTracker
                items={campaign.sessionItems || []}
                campaignId={campaign.id}
                onAdd={handleAddItem}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Live Activity Feed */}
      <LiveActivityFeed campaignId={campaign.id} />
    </main>
  );
}
