"use client";

import { Icon } from "@/components/ui/icon";
import { deriveCampaignInsights } from "@/lib/campaign-insights";

interface CampaignInsightsPanelProps {
  members: Array<{
    id: string;
    role: string;
    character: {
      id: string;
      name: string;
    } | null;
  }>;
  quests: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  sessions: Array<{
    id: string;
    number: number;
    title: string | null;
    status: string;
    date: string | null;
    publicRecap?: string | null;
    dmRecap?: string | null;
    attendance?: Array<{ characterId: string; name: string; status: string }> | null;
  }>;
  threatClocks: unknown;
  unresolvedMysteries: unknown;
  handouts: unknown;
  schedulePolls: unknown;
  craftingProjects: unknown;
  storyThreads: unknown;
  scheduledEvents: unknown;
}

const toneClasses: Record<"warning" | "attention" | "info", string> = {
  warning: "border-error/20 bg-error/10 text-error",
  attention: "border-secondary/20 bg-secondary/10 text-secondary",
  info: "border-outline-variant/10 bg-surface-container text-on-surface-variant",
};

export function CampaignInsightsPanel(props: CampaignInsightsPanelProps) {
  const insights = deriveCampaignInsights(props);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="query_stats" size={18} className="text-secondary" />
          <h3 className="font-headline text-lg text-on-surface">Campaign Insights</h3>
        </div>
        <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
          Memory and momentum
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Active Quests", value: insights.stats.activeQuests, icon: "assignment" },
          { label: "Completed Sessions", value: insights.stats.completedSessions, icon: "history" },
          { label: "Open Clocks", value: insights.stats.openClocks, icon: "timer" },
          { label: "Mysteries", value: insights.stats.unresolvedMysteries, icon: "help" },
          { label: "Open Polls", value: insights.stats.openPolls, icon: "event_upcoming" },
          { label: "Crafting Live", value: insights.stats.craftingInProgress, icon: "construction" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-4">
            <Icon name={stat.icon} size={18} className="text-secondary" />
            <p className="mt-3 font-headline text-2xl text-on-surface">{stat.value}</p>
            <p className="mt-1 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="campaign" size={18} className="text-secondary" />
            <h4 className="font-headline text-base text-on-surface">Prep Signals</h4>
          </div>

          {insights.prepPrompts.length > 0 ? (
            <div className="space-y-3">
              {insights.prepPrompts.map((prompt) => (
                <div key={prompt.id} className={`rounded-sm border p-4 ${toneClasses[prompt.tone]}`}>
                  <div className="flex items-start gap-3">
                    <Icon name={prompt.icon} size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-headline text-base">{prompt.title}</p>
                      <p className="mt-1 text-sm leading-relaxed">{prompt.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">
              No urgent prep signals are currently standing out. That usually means the campaign state is relatively clean.
            </p>
          )}
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="person_search" size={18} className="text-secondary" />
            <h4 className="font-headline text-base text-on-surface">Spotlight Tracker</h4>
          </div>

          {insights.spotlight.length > 0 ? (
            <div className="space-y-3">
              {insights.spotlight.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{entry.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {entry.present} present · {entry.partial} partial · {entry.absent} absent
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] ${
                      entry.attendanceRate < 60
                        ? "bg-error/10 text-error"
                        : entry.attendanceRate < 80
                        ? "bg-secondary/10 text-secondary"
                        : "bg-green-900/20 text-green-400"
                    }`}>
                      {entry.attendanceRate}% attendance
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">
              Attendance analytics will appear after sessions start recording attendance data.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="psychology" size={18} className="text-secondary" />
          <h4 className="font-headline text-base text-on-surface">Memory Surfacing</h4>
        </div>

        {insights.memoryCards.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {insights.memoryCards.map((card) => (
              <div key={card.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                <div className="flex items-start gap-3">
                  <Icon name={card.icon} size={18} className="mt-0.5 shrink-0 text-secondary" />
                  <div>
                    <p className="font-headline text-base text-on-surface">{card.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{card.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Memory prompts will start surfacing once sessions, handouts, and open threads accumulate.
          </p>
        )}
      </div>
    </section>
  );
}
