"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { HealthBar } from "@/components/ui/health-bar";
import { Select } from "@/components/ui/select";
import { CampaignSettingsPanel } from "@/components/dm/campaign-settings-panel";
import { CampaignContinuityPanel } from "@/components/dm/campaign-continuity-panel";
import { CampaignInsightsPanel } from "@/components/dm/campaign-insights-panel";

interface PartyMember {
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
    race: { name: string };
    class: { name: string };
  } | null;
}

interface Quest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  notes: string | null;
}

interface GameSession {
  id: string;
  number: number;
  title: string | null;
  date: string | null;
  status: string;
  summary: string | null;
  dmRecap?: string | null;
  publicRecap?: string | null;
  attendance?: Array<{ characterId: string; name: string; status: string }> | null;
}

interface NPC {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface Encounter {
  id: string;
  name: string;
}

interface CampaignOverviewData {
  id: string;
  name: string;
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
  storyThreads: unknown;
  scheduledEvents: unknown;
  threatClocks: unknown;
  unresolvedMysteries: unknown;
  partyTreasury: unknown;
  groupReputation: number;
  groupRenown: number;
  stronghold: unknown;
  sharedPlans: unknown;
  craftingProjects: unknown;
  schedulePolls: unknown;
  handouts: unknown;
  backups: unknown;
  sessionZero: unknown;
  accessibilityOptions: unknown;
  viewerRole?: string | null;
  status: string;
  members: PartyMember[];
  npcs: NPC[];
  quests: Quest[];
  gameSessions: GameSession[];
  locations: Location[];
  encounters: Encounter[];
}

interface OverviewTabProps {
  campaign: CampaignOverviewData;
  onStatusChange: (newStatus: string) => void;
  onCampaignRefresh: () => void;
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "bg-error/20 text-error border-error/20" },
  normal: {
    label: "Normal",
    color:
      "bg-surface-container-high/60 text-on-surface-variant border-outline-variant/10",
  },
  low: {
    label: "Low",
    color: "bg-surface-container-high/40 text-on-surface-variant/60 border-outline-variant/5",
  },
};

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
}

export function OverviewTab({ campaign, onStatusChange, onCampaignRefresh }: OverviewTabProps) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);

  const playersWithCharacters = campaign.members.filter(
    (m) => m.role === "PLAYER" && m.character
  );
  const viewerIsOwner = campaign.viewerRole === "DM";
  const canManageContinuity = campaign.viewerRole === "DM" || campaign.viewerRole === "CO_DM";
  const activeQuests = campaign.quests.filter((q) => q.status === "ACTIVE");
  const latestSession =
    campaign.gameSessions.length > 0 ? campaign.gameSessions[0] : null;
  const looseThreads = toList(campaign.storyThreads).slice(0, 5);
  const factionMoves = toList(campaign.factions).slice(0, 5);
  const upcomingEvents = toList(campaign.scheduledEvents).slice(0, 5);
  const treasury = (campaign.partyTreasury as Record<string, number> | null) ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

  async function handleStatusChange(newStatus: string) {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onStatusChange(newStatus);
      }
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleMemberRoleChange(memberId: string, role: string) {
    setRoleUpdatingId(memberId);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        onCampaignRefresh();
      }
    } finally {
      setRoleUpdatingId(null);
    }
  }

  const stats = [
    {
      icon: "group",
      count: campaign.members.filter((m) => m.role === "PLAYER").length,
      label: "Players",
      color: "text-secondary",
    },
    {
      icon: "person_search",
      count: campaign.npcs.length,
      label: "NPCs",
      color: "text-primary",
    },
    {
      icon: "assignment",
      count: campaign.quests.length,
      label: "Quests",
      color: "text-secondary",
    },
    {
      icon: "map",
      count: campaign.locations.length,
      label: "Locations",
      color: "text-primary",
    },
    {
      icon: "swords",
      count: campaign.encounters.length,
      label: "Encounters",
      color: "text-error",
    },
    {
      icon: "calendar_month",
      count: campaign.gameSessions.length,
      label: "Sessions",
      color: "text-secondary",
    },
  ];

  const statusBadge: Record<string, { label: string; icon: string; color: string }> = {
    LOBBY: {
      label: "In Lobby",
      icon: "hourglass_top",
      color: "text-on-surface-variant bg-surface-container-high",
    },
    ACTIVE: {
      label: "Active",
      icon: "play_circle",
      color: "text-green-400 bg-green-900/20",
    },
    ARCHIVED: {
      label: "Archived",
      icon: "archive",
      color: "text-on-surface-variant/50 bg-surface-container-high/40",
    },
  };

  const badge = statusBadge[campaign.status] || statusBadge.LOBBY;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Campaign Status Controls */}
      <section className="bg-surface-container-low p-6 rounded-sm border border-outline-variant/8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${badge.color}`}
            >
              <Icon name={badge.icon} size={16} filled />
              <span className="font-label text-[10px] uppercase tracking-[0.15em] font-bold">
                {badge.label}
              </span>
            </div>
            <h2 className="font-headline text-xl text-on-surface">
              {campaign.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === "LOBBY" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("ACTIVE")}
                disabled={statusLoading}
                loading={statusLoading}
                className="glow-gold"
              >
                <Icon name="play_arrow" size={16} />
                Start Campaign
              </Button>
            )}
            {campaign.status === "ACTIVE" && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusChange("LOBBY")}
                  disabled={statusLoading}
                  loading={statusLoading}
                >
                  <Icon name="pause" size={16} />
                  Pause
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStatusChange("ARCHIVED")}
                  disabled={statusLoading}
                  loading={statusLoading}
                >
                  <Icon name="archive" size={16} />
                  Archive
                </Button>
              </>
            )}
            {campaign.status === "ARCHIVED" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange("ACTIVE")}
                disabled={statusLoading}
                loading={statusLoading}
              >
                <Icon name="unarchive" size={16} />
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section>
        <h3 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-bold mb-4">
          Campaign at a Glance
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 stagger-children">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-container-low p-4 rounded-sm border border-outline-variant/8 text-center interactive-lift transition-all duration-300"
            >
              <Icon
                name={stat.icon}
                size={22}
                className={`${stat.color} mx-auto mb-2`}
              />
              <p className="font-headline text-2xl font-bold text-on-surface">
                {stat.count}
              </p>
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/50 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "Loose Threads", icon: "lan", items: looseThreads, empty: "No unresolved threads recorded" },
          { title: "Faction Moves", icon: "flag", items: factionMoves, empty: "No faction moves scheduled" },
          { title: "Upcoming Events", icon: "schedule", items: upcomingEvents, empty: "No future events scheduled" },
        ].map((section) => (
          <div key={section.title} className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-3 flex items-center gap-2">
              <Icon name={section.icon} size={16} className="text-secondary" />
              <h3 className="font-headline text-base text-on-surface">{section.title}</h3>
            </div>
            {section.items.length > 0 ? (
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item} className="rounded-sm bg-surface-container px-3 py-2 text-sm text-on-surface-variant">
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant/40">{section.empty}</p>
            )}
          </div>
        ))}
      </section>

      <CampaignInsightsPanel
        members={campaign.members.map((member) => ({
          id: member.id,
          role: member.role,
          character: member.character
            ? {
                id: member.character.id,
                name: member.character.name,
              }
            : null,
        }))}
        quests={campaign.quests.map((quest) => ({
          id: quest.id,
          title: quest.title,
          status: quest.status,
          priority: quest.priority,
        }))}
        sessions={campaign.gameSessions.map((session) => ({
          id: session.id,
          number: session.number,
          title: session.title,
          status: session.status,
          date: session.date,
          publicRecap: session.publicRecap ?? null,
          dmRecap: session.dmRecap ?? null,
          attendance: session.attendance ?? null,
        }))}
        threatClocks={campaign.threatClocks}
        unresolvedMysteries={campaign.unresolvedMysteries}
        handouts={campaign.handouts}
        schedulePolls={campaign.schedulePolls}
        craftingProjects={campaign.craftingProjects}
        storyThreads={campaign.storyThreads}
        scheduledEvents={campaign.scheduledEvents}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="payments" size={16} className="text-secondary" />
            <h3 className="font-headline text-base text-on-surface">Party Treasury</h3>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {(["cp", "sp", "ep", "gp", "pp"] as const).map((coin) => (
              <div key={coin} className="rounded-sm bg-surface-container px-2 py-3">
                <div className="font-headline text-lg text-on-surface">{treasury[coin] ?? 0}</div>
                <div className="font-label text-[10px] uppercase tracking-[0.14em] text-on-surface-variant/50">{coin}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="military_tech" size={16} className="text-secondary" />
            <h3 className="font-headline text-base text-on-surface">Renown & Reputation</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-sm bg-surface-container px-3 py-3">
              <span className="text-sm text-on-surface-variant">Renown</span>
              <span className="font-headline text-lg text-secondary">{campaign.groupRenown}</span>
            </div>
            <div className="flex items-center justify-between rounded-sm bg-surface-container px-3 py-3">
              <span className="text-sm text-on-surface-variant">Reputation</span>
              <span className="font-headline text-lg text-secondary">{campaign.groupReputation}</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="public" size={16} className="text-secondary" />
            <h3 className="font-headline text-base text-on-surface">World Snapshot</h3>
          </div>
          <div className="space-y-2 text-sm text-on-surface-variant">
            <p><span className="text-on-surface">System:</span> {campaign.system} {campaign.edition}</p>
            {campaign.setting && <p><span className="text-on-surface">Setting:</span> {campaign.setting}</p>}
            {campaign.tone && <p><span className="text-on-surface">Tone:</span> {campaign.tone}</p>}
            {campaign.worldName && <p><span className="text-on-surface">World:</span> {campaign.worldName}</p>}
            {campaign.onboardingMode && <p><span className="text-on-surface">Onboarding:</span> {campaign.onboardingMode}</p>}
          </div>
        </div>
      </section>

      <div className="decorative-line" />

      {/* Active Quests */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg text-secondary">
            <Icon name="assignment" size={20} className="inline mr-2 align-text-bottom" />
            Active Quests
          </h3>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40">
            {activeQuests.length} active
          </span>
        </div>

        {activeQuests.length > 0 ? (
          <div className="space-y-2">
            {activeQuests.map((quest) => {
              const prio =
                priorityConfig[quest.priority] || priorityConfig.normal;
              return (
                <div
                  key={quest.id}
                  className="bg-surface-container-low p-4 rounded-sm border-l-2 border-secondary/30 flex items-center justify-between gap-3 interactive-glow transition-all duration-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      name="flag"
                      size={16}
                      filled
                      className="text-secondary shrink-0"
                    />
                    <span className="font-body text-sm text-on-surface truncate">
                      {quest.title}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full font-label text-[10px] uppercase tracking-wider font-bold border ${prio.color}`}
                  >
                    {prio.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-surface-container-low/40 rounded-sm border border-dashed border-outline-variant/10">
            <Icon
              name="assignment"
              size={32}
              className="text-on-surface/10 mx-auto mb-2"
            />
            <p className="font-body text-sm text-on-surface-variant/40">
              No active quests yet
            </p>
          </div>
        )}
      </section>

      <div className="decorative-line" />

      {/* Party HP Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg text-secondary">
            <Icon name="favorite" size={20} className="inline mr-2 align-text-bottom" />
            Party Health
          </h3>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40">
            {playersWithCharacters.length} characters
          </span>
        </div>

        {playersWithCharacters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {playersWithCharacters.map((member) => {
              const char = member.character!;
              const hpPercent =
                char.maxHP > 0 ? (char.currentHP / char.maxHP) * 100 : 0;
              const isLow = hpPercent < 25;

              return (
                <div
                  key={member.id}
                  className={`bg-surface-container-low p-4 rounded-sm border transition-all duration-300 ${
                    isLow
                      ? "border-error/20"
                      : "border-outline-variant/8"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <p className="font-headline text-base font-bold text-on-surface truncate">
                        {char.name}
                      </p>
                      <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant/50">
                        {char.race.name} {char.class.name} &middot; Lv{" "}
                        {char.level}
                      </p>
                    </div>
                    <div className="flex flex-col items-center shrink-0 ml-2">
                      <div className="w-9 h-9 rounded-full border border-secondary/40 bg-surface-container-highest flex items-center justify-center">
                        <span className="font-headline text-sm font-bold text-secondary">
                          {char.armorClass}
                        </span>
                      </div>
                      <span className="font-label text-[9px] uppercase text-on-surface/30 mt-0.5">
                        AC
                      </span>
                    </div>
                  </div>
                  <HealthBar
                    current={char.currentHP}
                    max={char.maxHP}
                    size="sm"
                    showLabel
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-surface-container-low/40 rounded-sm border border-dashed border-outline-variant/10">
            <Icon
              name="group"
              size={32}
              className="text-on-surface/10 mx-auto mb-2"
            />
            <p className="font-body text-sm text-on-surface-variant/40">
              No player characters yet
            </p>
          </div>
        )}
      </section>

      <div className="decorative-line" />

      {/* Recent Session */}
      <section>
        <h3 className="font-headline text-lg text-secondary mb-4">
          <Icon name="history" size={20} className="inline mr-2 align-text-bottom" />
          Latest Session
        </h3>

        {latestSession ? (
          <div className="bg-surface-container-low p-5 rounded-sm border border-outline-variant/8">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="font-label text-[10px] uppercase tracking-widest text-secondary/70">
                  Session {latestSession.number}
                </span>
                <h4 className="font-headline text-lg font-bold text-on-surface mt-0.5">
                  {latestSession.title || "Untitled Session"}
                </h4>
              </div>
              <span
                className={`shrink-0 px-2.5 py-1 rounded-full font-label text-[10px] uppercase tracking-wider font-bold ${
                  latestSession.status === "COMPLETED"
                    ? "bg-green-900/20 text-green-400"
                    : latestSession.status === "IN_PROGRESS"
                      ? "bg-secondary/15 text-secondary"
                      : "bg-surface-container-high/60 text-on-surface-variant/60"
                }`}
              >
                {latestSession.status.replace("_", " ")}
              </span>
            </div>

            {latestSession.date && (
              <p className="font-body text-xs text-on-surface-variant/50 flex items-center gap-1.5 mb-3">
                <Icon name="calendar_today" size={14} />
                {new Date(latestSession.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            {latestSession.summary && (
              <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                {latestSession.summary}
              </p>
            )}

            {!latestSession.summary && (
              <p className="font-body text-sm text-on-surface-variant/30 italic">
                No summary written yet
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-surface-container-low/40 rounded-sm border border-dashed border-outline-variant/10">
            <Icon
              name="calendar_month"
              size={32}
              className="text-on-surface/10 mx-auto mb-2"
            />
            <p className="font-body text-sm text-on-surface-variant/40">
              No sessions scheduled yet
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="admin_panel_settings" size={18} className="text-secondary" />
          <h3 className="font-headline text-lg text-on-surface">Party Access</h3>
        </div>

        <div className="grid gap-3">
          {campaign.members.map((member) => (
            <div
              key={member.id}
              className="grid gap-3 rounded-sm border border-outline-variant/8 bg-surface-container-low p-4 md:grid-cols-[minmax(0,1fr)_220px]"
            >
              <div className="min-w-0">
                <p className="font-headline text-base text-on-surface">{member.user.name || "Unknown member"}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {member.role === "PLAYER" && member.character
                    ? `${member.character.name} · Level ${member.character.level} ${member.character.race.name} ${member.character.class.name}`
                    : member.role === "CO_DM"
                      ? "Can manage prep, builders, and DM-facing campaign tools."
                      : member.role === "SPECTATOR"
                        ? "Can view player-facing campaign information without active character controls."
                        : "Campaign owner and primary DM."}
                </p>
              </div>

              {viewerIsOwner && member.role !== "DM" ? (
                <Select
                  id={`member-role-${member.id}`}
                  label="Access Role"
                  value={member.role}
                  disabled={roleUpdatingId === member.id}
                  onChange={(event) => handleMemberRoleChange(member.id, event.target.value)}
                >
                  <option value="PLAYER">Player</option>
                  <option value="CO_DM">Co-DM</option>
                  <option value="SPECTATOR">Spectator</option>
                </Select>
              ) : (
                <div className="flex items-center md:justify-end">
                  <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary">
                    {member.role === "DM"
                      ? "Dungeon Master"
                      : member.role === "CO_DM"
                        ? "Co-DM"
                        : member.role === "SPECTATOR"
                          ? "Spectator"
                          : "Player"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {viewerIsOwner && (
          <p className="text-xs text-on-surface-variant">
            Co-DMs can use the DM workspace. Spectators keep read-only player visibility and stay out of character and loot assignment flows.
          </p>
        )}
      </section>

      <CampaignContinuityPanel
        campaignId={campaign.id}
        threatClocks={campaign.threatClocks}
        unresolvedMysteries={campaign.unresolvedMysteries}
        storyThreads={campaign.storyThreads}
        factions={campaign.factions}
        scheduledEvents={campaign.scheduledEvents}
        activeQuests={activeQuests.map((quest) => ({
          id: quest.id,
          title: quest.title,
          priority: quest.priority,
        }))}
        latestSession={
          latestSession
            ? {
                id: latestSession.id,
                title: latestSession.title,
                dmRecap: (latestSession as GameSession & { dmRecap?: string | null }).dmRecap ?? null,
                publicRecap: (latestSession as GameSession & { publicRecap?: string | null }).publicRecap ?? null,
              }
            : null
        }
        canManage={canManageContinuity}
        onSaved={onCampaignRefresh}
      />

      <CampaignSettingsPanel campaign={campaign} onSaved={onCampaignRefresh} />
    </div>
  );
}
