"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { type ConditionKey } from "@dnd-companion/shared";
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
import { CampaignSearchPanel } from "@/components/campaign/campaign-search-panel";
import { ActiveEncounterPanel } from "@/components/campaign/active-encounter-panel";
import { LocationExplorerPanel } from "@/components/campaign/location-explorer-panel";
import { PartyHubPanel } from "@/components/campaign/party-hub-panel";
import { WorldbuildingPanel } from "@/components/dm/worldbuilding-panel";
import { useSocket } from "@/hooks/use-socket";

interface CampaignData {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  status: string;
  system: string;
  edition: string;
  setting: string | null;
  tone: string | null;
  onboardingMode: string;
  worldName: string | null;
  worldSummary: string | null;
  houseRules: unknown;
  worldCanon: unknown;
  playerCanon: unknown;
  rumors: unknown;
  factions: unknown;
  factionDirectory: unknown;
  storyThreads: unknown;
  scheduledEvents: unknown;
  worldRegions: unknown;
  loreEntries: unknown;
  historicalEvents: unknown;
  calendarState: unknown;
  threatClocks: unknown;
  unresolvedMysteries: unknown;
  partyTreasury: unknown;
  treasuryLedger: unknown;
  partyStash: unknown;
  craftingProjects: unknown;
  announcements: unknown;
  merchants: unknown;
  economyLog: unknown;
  schedulePolls: unknown;
  campaignMessages: unknown;
  handouts: unknown;
  groupReputation: number;
  groupRenown: number;
  stronghold: unknown;
  sharedPlans: unknown;
  backups: unknown;
  sessionZero: unknown;
  accessibilityOptions: unknown;
  viewerRole: string | null;
  viewerCanManage: boolean;
  viewerCanViewDmContent: boolean;
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
      initiative: number;
      concentrationSpell: string | null;
      conditions: Array<{ condition: string }>;
      race: { name: string };
      class: { name: string };
    } | null;
  }>;
  npcs: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    description: string | null;
    isEnemy: boolean;
    notes: string | null;
    race: string | null;
    npcClass: string | null;
    alignment: string | null;
    personality: string | null;
    appearance: string | null;
    voice: string | null;
    faction: string | null;
    locationName: string | null;
    relationship: string | null;
    isAlive: boolean;
    cr: string | null;
    statBlock: unknown;
  }>;
  sessionItems: Array<{
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    isHidden: boolean;
    claimedById: string | null;
    rarity: string | null;
    value: string | null;
    category: string | null;
    quantity: number;
    imageUrl: string | null;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameSessions: any[];
  locations: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    mapData: unknown;
    type: string;
    description: string | null;
    notes: string | null;
    parentId: string | null;
    children: Array<{ id: string; name: string; type: string }>;
  }>;
  quests: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    notes: string | null;
    giverNpcId: string | null;
  }>;
  encounters: Array<{
    id: string;
    name: string;
    description: string | null;
    difficulty: string | null;
    monsters: unknown;
    loot: unknown;
    liveState: unknown;
    notes: string | null;
    status: string;
  }>;
  campaignNotes: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    isPinned: boolean;
  }>;
}

type PartyRealtimePatch = Partial<
  Pick<
    CampaignData,
    | "partyTreasury"
    | "treasuryLedger"
    | "partyStash"
    | "craftingProjects"
    | "announcements"
    | "merchants"
    | "economyLog"
    | "schedulePolls"
    | "campaignMessages"
    | "handouts"
    | "sharedPlans"
  >
>;

const DM_TABS = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "world", label: "World", icon: "public" },
  { id: "party", label: "Party", icon: "groups_2" },
  { id: "sessions", label: "Sessions", icon: "event_note" },
  { id: "npcs", label: "NPCs", icon: "groups" },
  { id: "quests", label: "Quests", icon: "assignment" },
  { id: "locations", label: "Locations", icon: "map" },
  { id: "encounters", label: "Encounters", icon: "swords" },
  { id: "loot", label: "Loot & Items", icon: "inventory_2" },
  { id: "search", label: "Search", icon: "manage_search" },
];

function getRoleLabel(role: string | null | undefined) {
  switch (role) {
    case "DM":
      return "Dungeon Master";
    case "CO_DM":
      return "Co-DM";
    case "PLAYER":
      return "Player";
    case "SPECTATOR":
      return "Spectator";
    default:
      return "Member";
  }
}

function getMemberSubtitle(member: CampaignData["members"][number]) {
  if (member.role === "DM") return "Dungeon Master";
  if (member.role === "CO_DM") return "Co-DM";
  if (member.role === "SPECTATOR") return "Spectator";
  return member.character?.name || "No character";
}

function sanitizePartyRealtimePatch(patch: PartyRealtimePatch, canManage: boolean): PartyRealtimePatch {
  if (canManage || !Array.isArray(patch.handouts)) {
    return patch;
  }

  return {
    ...patch,
    handouts: patch.handouts.filter((entry) => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      return (entry as { visibility?: string }).visibility !== "dm";
    }),
  };
}

export default function CampaignLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const { connected, emit, on } = useSocket();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const canManageCampaign = Boolean(campaign?.viewerCanManage);
  const viewerRoleLabel = getRoleLabel(campaign?.viewerRole);
  const canContributePlans = campaign?.viewerRole !== "SPECTATOR";

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaign(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const refreshCampaign = useCallback(() => {
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => setCampaign(data));
  }, [id]);

  useEffect(() => {
    if (!campaign || canManageCampaign) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshCampaign();
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [campaign, canManageCampaign, refreshCampaign]);

  useEffect(() => {
    if (!connected) return;

    emit("campaign:join", id);
    return () => {
      emit("campaign:leave", id);
    };
  }, [connected, emit, id]);

  useEffect(() => {
    const unsubs = [
      on("encounter:updated", (payload: unknown) => {
        const data = payload as { campaignId?: string; encounterId?: string; status?: string; liveState?: unknown };
        if (!data.campaignId || data.campaignId !== id || !data.encounterId) return;
        setCampaign((current) =>
          current
            ? {
                ...current,
                encounters: current.encounters.map((encounter) =>
                  encounter.id === data.encounterId
                    ? {
                        ...encounter,
                        status: data.status ?? encounter.status,
                        liveState: data.liveState ?? encounter.liveState,
                      }
                    : encounter
                ),
              }
            : current
        );
      }),
      on("location:map-updated", (payload: unknown) => {
        const data = payload as { campaignId?: string; locationId?: string; location?: CampaignData["locations"][number] };
        if (!data.campaignId || data.campaignId !== id || !data.locationId || !data.location) return;
        setCampaign((current) =>
          current
            ? {
                ...current,
                locations: current.locations.map((location) => (location.id === data.locationId ? data.location! : location)),
              }
            : current
        );
      }),
      on("campaign:party-updated", (payload: unknown) => {
        const data = payload as { campaignId?: string; patch?: PartyRealtimePatch };
        const patch = data.patch;
        if (!data.campaignId || data.campaignId !== id || !patch) return;
        setCampaign((current) =>
          current
            ? {
                ...current,
                ...sanitizePartyRealtimePatch(patch, Boolean(current.viewerCanManage)),
              }
            : current
        );
      }),
      on("campaign:status-update", (payload: unknown) => {
        const data = payload as { campaignId?: string; status?: string };
        if (!data.campaignId || data.campaignId !== id || !data.status) return;
        setCampaign((current) => (current ? { ...current, status: data.status! } : current));
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub?.());
    };
  }, [id, on]);

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
    setCampaign((prev) => (prev ? { ...prev, status: newStatus } : prev));
    if (connected) {
      emit("campaign:status-update", {
        campaignId: campaign.id,
        status: newStatus,
      });
    }
  }

  if (loading) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-64 bg-surface-container-high rounded-sm mx-auto" />
          <div className="h-4 w-40 bg-surface-container-high/60 rounded-sm mx-auto" />
          <div className="h-12 bg-surface-container-high/30 rounded-sm mt-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-24 bg-surface-container-high/20 rounded-sm" />
            ))}
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

  if (!canManageCampaign) {
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
            DM: {campaign.dm.name} - You are here as {viewerRoleLabel}
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
                  {getMemberSubtitle(member)}
                </p>
              </div>
            </div>
          ))}
        </section>

        <PartyHubPanel
          campaignId={campaign.id}
          partyTreasury={campaign.partyTreasury}
          treasuryLedger={campaign.treasuryLedger}
          partyStash={campaign.partyStash}
          craftingProjects={campaign.craftingProjects}
          announcements={campaign.announcements}
          merchants={campaign.merchants}
          economyLog={campaign.economyLog}
          schedulePolls={campaign.schedulePolls}
          campaignMessages={campaign.campaignMessages}
          handouts={campaign.handouts}
          sharedPlans={campaign.sharedPlans}
          members={campaign.members}
          sessions={campaign.gameSessions}
          canManage={false}
          canContributePlans={Boolean(canContributePlans)}
          socketConnected={connected}
          emitSocketEvent={emit}
          onRefresh={refreshCampaign}
        />

        <WorldbuildingPanel
          campaignId={campaign.id}
          worldName={campaign.worldName}
          worldSummary={campaign.worldSummary}
          worldRegions={campaign.worldRegions}
          factionDirectory={campaign.factionDirectory}
          loreEntries={campaign.loreEntries}
          historicalEvents={campaign.historicalEvents}
          calendarState={campaign.calendarState}
          canManage={false}
          onSaved={refreshCampaign}
        />

        <ActiveEncounterPanel
          encounters={campaign.encounters || []}
          locations={(campaign.locations || []).map((location) => ({
            id: location.id,
            name: location.name,
            imageUrl: location.imageUrl,
            mapData: location.mapData,
          }))}
        />

        <LocationExplorerPanel locations={campaign.locations || []} />

        <LiveActivityFeed campaignId={campaign.id} />
      </main>
    );
  }

  const tabsWithCounts = DM_TABS.map((tab) => ({
    ...tab,
    count:
      tab.id === "npcs"
        ? campaign.npcs?.length
        : tab.id === "sessions"
          ? campaign.gameSessions?.length
          : tab.id === "world"
            ? (Array.isArray(campaign.worldRegions) ? campaign.worldRegions.length : 0) +
              (Array.isArray(campaign.loreEntries) ? campaign.loreEntries.length : 0)
          : tab.id === "quests"
            ? campaign.quests?.length
            : tab.id === "locations"
              ? campaign.locations?.length
              : tab.id === "encounters"
                ? campaign.encounters?.length
                : tab.id === "loot"
                  ? campaign.sessionItems?.length
                  : undefined,
  }));

  return (
    <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-3xl md:text-4xl text-primary">{campaign.name}</h1>
            <span className={`px-2.5 py-1 rounded-sm font-label text-[10px] uppercase tracking-widest border ${statusColors[campaign.status]}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-label uppercase tracking-tighter mt-1">
            DM: {campaign.dm.name} {campaign.viewerRole === "DM" ? "(You)" : `- ${viewerRoleLabel}`} - {campaign.members.length} members
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

      <DMTabs tabs={tabsWithCounts} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="animate-fade-in" key={activeTab}>
        {activeTab === "overview" && (
          <OverviewTab
            campaign={campaign}
            onStatusChange={updateStatus}
            onCampaignRefresh={refreshCampaign}
          />
        )}
        {activeTab === "party" && (
          <PartyHubPanel
            campaignId={campaign.id}
            partyTreasury={campaign.partyTreasury}
            treasuryLedger={campaign.treasuryLedger}
            partyStash={campaign.partyStash}
            craftingProjects={campaign.craftingProjects}
            announcements={campaign.announcements}
            merchants={campaign.merchants}
            economyLog={campaign.economyLog}
            schedulePolls={campaign.schedulePolls}
            campaignMessages={campaign.campaignMessages}
            handouts={campaign.handouts}
            sharedPlans={campaign.sharedPlans}
            members={campaign.members}
            sessions={campaign.gameSessions}
            canManage={Boolean(campaign.viewerCanManage)}
            canContributePlans={Boolean(canContributePlans)}
            socketConnected={connected}
            emitSocketEvent={emit}
            onRefresh={refreshCampaign}
          />
        )}
        {activeTab === "world" && (
          <WorldbuildingPanel
            campaignId={campaign.id}
            worldName={campaign.worldName}
            worldSummary={campaign.worldSummary}
            worldRegions={campaign.worldRegions}
            factionDirectory={campaign.factionDirectory}
            loreEntries={campaign.loreEntries}
            historicalEvents={campaign.historicalEvents}
            calendarState={campaign.calendarState}
            canManage={Boolean(campaign.viewerCanManage)}
            onSaved={refreshCampaign}
          />
        )}
        {activeTab === "sessions" && (
          <SessionsTab
            sessions={campaign.gameSessions || []}
            campaignId={campaign.id}
            members={campaign.members
              .filter((member) => member.character)
              .map((member) => ({
                id: member.character!.id,
                name: member.character!.name,
              }))}
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
            characters={campaign.members
              .filter((member) => member.character)
              .map((member) => ({
                id: member.character!.id,
                name: member.character!.name,
                currentHP: member.character!.currentHP,
                maxHP: member.character!.maxHP,
                armorClass: member.character!.armorClass,
                initiative: member.character!.initiative,
                concentrationSpell: member.character!.concentrationSpell,
                activeConditions: member.character!.conditions.map((entry) => entry.condition as ConditionKey),
              }))}
            locations={(campaign.locations || []).map((location) => ({
              id: location.id,
              name: location.name,
              imageUrl: location.imageUrl,
              mapData: location.mapData,
            }))}
            onAdd={() => refreshCampaign()}
          />
        )}
        {activeTab === "loot" && (
          <LootTab
            sessionItems={campaign.sessionItems || []}
            campaignId={campaign.id}
            characters={campaign.members
              .filter((member) => member.character)
              .map((member) => ({
                id: member.character!.id,
                name: member.character!.name,
                raceName: member.character!.race.name,
                className: member.character!.class.name,
              }))}
            onAddItem={() => refreshCampaign()}
          />
        )}
        {activeTab === "search" && (
          <CampaignSearchPanel campaignId={campaign.id} />
        )}
      </div>

      <LiveActivityFeed campaignId={campaign.id} />
    </main>
  );
}
