"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { HealthBar } from "@/components/ui/health-bar";

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

export function OverviewTab({ campaign, onStatusChange }: OverviewTabProps) {
  const [statusLoading, setStatusLoading] = useState(false);

  const playersWithCharacters = campaign.members.filter(
    (m) => m.role === "PLAYER" && m.character
  );
  const activeQuests = campaign.quests.filter((q) => q.status === "ACTIVE");
  const latestSession =
    campaign.gameSessions.length > 0 ? campaign.gameSessions[0] : null;

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
    </div>
  );
}
