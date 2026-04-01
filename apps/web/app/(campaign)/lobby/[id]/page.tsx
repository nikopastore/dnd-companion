"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { LiveActivityFeed } from "@/components/campaign/live-activity-feed";
import { DMTabs } from "@/components/dm/dm-tabs";
import { OverviewTab } from "@/components/dm/overview-tab";
import { SessionsTab } from "@/components/dm/sessions-tab";
import { NPCsTab } from "@/components/dm/npcs-tab";
import { QuestsTab } from "@/components/dm/quests-tab";
import { LocationsTab } from "@/components/dm/locations-tab";
import { EncountersTab } from "@/components/dm/encounters-tab";
import { LootTab } from "@/components/dm/loot-tab";

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
      currentHP: number;
      maxHP: number;
      armorClass: number;
    } | null;
  }>;
  npcs: Array<{
    id: string; name: string; description: string | null; isEnemy: boolean;
    notes: string | null; race: string | null; npcClass: string | null;
    alignment: string | null; personality: string | null; appearance: string | null;
    voice: string | null; faction: string | null; locationName: string | null;
    relationship: string | null; isAlive: boolean; cr: string | null;
    statBlock: unknown;
  }>;
  sessionItems: Array<{
    id: string; name: string; description: string | null; location: string | null;
    isHidden: boolean; claimedById: string | null; rarity: string | null; value: string | null;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameSessions: any[];
  locations: Array<{
    id: string; name: string; type: string; description: string | null;
    notes: string | null; parentId: string | null;
    children: Array<{ id: string; name: string; type: string }>;
  }>;
  quests: Array<{
    id: string; title: string; description: string | null; status: string;
    priority: string; notes: string | null; giverNpcId: string | null;
  }>;
  encounters: Array<{
    id: string; name: string; description: string | null; difficulty: string | null;
    monsters: unknown; loot: unknown; notes: string | null; status: string;
  }>;
  campaignNotes: Array<{
    id: string; title: string; content: string; category: string;
    isPinned: boolean;
  }>;
}

const DM_TABS = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "sessions", label: "Sessions", icon: "event_note" },
  { id: "npcs", label: "NPCs", icon: "groups" },
  { id: "quests", label: "Quests", icon: "assignment" },
  { id: "locations", label: "Locations", icon: "map" },
  { id: "encounters", label: "Encounters", icon: "swords" },
  { id: "loot", label: "Loot & Items", icon: "inventory_2" },
];

export default function CampaignLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const isDM = session?.user?.id === campaign?.dm?.id;

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => { setCampaign(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const refreshCampaign = useCallback(() => {
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => setCampaign(data));
  }, [id]);

  function copyInviteCode() {
    if (!campaign) return;
    navigator.clipboard.writeText(campaign.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function updateStatus(newStatus: string) {
    if (!campaign) return;
    await fetch(`/api/campaigns/${campaign.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setCampaign((prev) => prev ? { ...prev, status: newStatus } : prev);
  }

  if (loading) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-64 bg-surface-container-high rounded-sm mx-auto" />
          <div className="h-4 w-40 bg-surface-container-high/60 rounded-sm mx-auto" />
          <div className="h-12 bg-surface-container-high/30 rounded-sm mt-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface-container-high/20 rounded-sm" />)}
          </div>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <div className="text-center py-20">
          <Icon name="error" size={48} className="text-error/40 mx-auto mb-4" />
          <p className="text-error font-body">Campaign not found</p>
        </div>
      </main>
    );
  }

  const statusColors: Record<string, string> = {
    LOBBY: "bg-secondary-container/20 text-secondary border-secondary/20",
    ACTIVE: "bg-green-900/30 text-green-400 border-green-500/20",
    ARCHIVED: "bg-surface-container-high text-on-surface/40 border-outline-variant/20",
  };

  // Player view (non-DM)
  if (!isDM) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-8">
        <section className="text-center space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3">
            <h1 className="font-headline text-4xl text-primary">{campaign.name}</h1>
            <span className={`px-2.5 py-1 rounded-sm font-label text-[10px] uppercase tracking-widest border ${statusColors[campaign.status]}`}>
              {campaign.status}
            </span>
          </div>
          {campaign.description && (
            <p className="font-body text-on-surface-variant max-w-lg mx-auto">{campaign.description}</p>
          )}
          <p className="text-xs text-on-surface-variant font-label uppercase tracking-tighter">
            DM: {campaign.dm.name}
          </p>
        </section>

        <section className="bg-surface-container-low rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-secondary/10">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-label text-xs uppercase tracking-widest text-on-surface/40">Invite Code</p>
            <p className="font-headline text-3xl text-secondary tracking-[0.3em] tabular-nums">
              {campaign.inviteCode.slice(0, 3)}-{campaign.inviteCode.slice(3)}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={copyInviteCode} aria-label="Copy invite code">
            <Icon name={copied ? "check" : "content_copy"} size={16} />
            {copied ? "Copied!" : "Copy Code"}
          </Button>
        </section>

        <section className="space-y-3 stagger-children">
          <h3 className="font-headline text-xl text-on-surface mb-4">Party Members</h3>
          {campaign.members.map((member) => (
            <div key={member.id} className="bg-surface-container-low p-4 rounded-sm flex items-center gap-4 border-l-2 border-primary/30 interactive-glow">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="font-headline text-sm">{member.user.name?.[0]?.toUpperCase() || "?"}</span>
              </div>
              <div>
                <p className="font-body font-semibold text-on-surface">{member.user.name}</p>
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface/40">
                  {member.role === "DM" ? "Dungeon Master" : member.character?.name || "No character"}
                </p>
              </div>
            </div>
          ))}
        </section>

        <LiveActivityFeed campaignId={campaign.id} />
      </main>
    );
  }

  // DM Command Center
  const tabsWithCounts = DM_TABS.map((tab) => ({
    ...tab,
    count:
      tab.id === "npcs" ? campaign.npcs?.length :
      tab.id === "sessions" ? campaign.gameSessions?.length :
      tab.id === "quests" ? campaign.quests?.length :
      tab.id === "locations" ? campaign.locations?.length :
      tab.id === "encounters" ? campaign.encounters?.length :
      tab.id === "loot" ? campaign.sessionItems?.length :
      undefined,
  }));

  return (
    <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      {/* Campaign Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-3xl md:text-4xl text-primary">{campaign.name}</h1>
            <span className={`px-2.5 py-1 rounded-sm font-label text-[10px] uppercase tracking-widest border ${statusColors[campaign.status]}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-label uppercase tracking-tighter mt-1">
            DM: {campaign.dm.name} (You) · {campaign.members.length} members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-low px-4 py-2 rounded-sm border border-secondary/10 flex items-center gap-2">
            <span className="font-label text-[10px] uppercase text-on-surface/40">Code:</span>
            <span className="font-headline text-lg text-secondary tracking-widest tabular-nums">
              {campaign.inviteCode.slice(0, 3)}-{campaign.inviteCode.slice(3)}
            </span>
            <button onClick={copyInviteCode} className="p-1 hover:text-secondary transition-colors" aria-label="Copy invite code">
              <Icon name={copied ? "check" : "content_copy"} size={14} className={copied ? "text-secondary" : "text-on-surface/40"} />
            </button>
          </div>
        </div>
      </section>

      <div className="decorative-line" />

      {/* DM Tab Navigation */}
      <DMTabs tabs={tabsWithCounts} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="animate-fade-in" key={activeTab}>
        {activeTab === "overview" && (
          <OverviewTab
            campaign={campaign as any}
            onStatusChange={updateStatus}
          />
        )}
        {activeTab === "sessions" && (
          <SessionsTab
            sessions={campaign.gameSessions || []}
            campaignId={campaign.id}
            onAdd={() => refreshCampaign()}
          />
        )}
        {activeTab === "npcs" && (
          <NPCsTab
            npcs={campaign.npcs as any[] || []}
            campaignId={campaign.id}
            onAdd={() => refreshCampaign()}
            onUpdate={() => refreshCampaign()}
          />
        )}
        {activeTab === "quests" && (
          <QuestsTab
            quests={campaign.quests || []}
            npcs={campaign.npcs || []}
            campaignId={campaign.id}
            onAdd={() => refreshCampaign()}
            onUpdate={() => refreshCampaign()}
          />
        )}
        {activeTab === "locations" && (
          <LocationsTab
            locations={campaign.locations || []}
            campaignId={campaign.id}
            onAdd={() => refreshCampaign()}
          />
        )}
        {activeTab === "encounters" && (
          <EncountersTab
            encounters={campaign.encounters || []}
            campaignId={campaign.id}
            onAdd={() => refreshCampaign()}
          />
        )}
        {activeTab === "loot" && (
          <LootTab
            sessionItems={campaign.sessionItems || []}
            campaignId={campaign.id}
            onAddItem={() => refreshCampaign()}
          />
        )}
      </div>

      {/* Activity Feed (always visible) */}
      <LiveActivityFeed campaignId={campaign.id} />
    </main>
  );
}
