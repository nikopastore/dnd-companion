"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ThreatClock {
  id: string;
  title: string;
  progress: number;
  max: number;
  status: "active" | "paused" | "resolved";
  notes: string | null;
}

interface Mystery {
  id: string;
  question: string;
  answer: string | null;
  status: "open" | "revealed" | "closed";
  notes: string | null;
}

interface QuestLite {
  id: string;
  title: string;
  priority: string;
}

interface SessionLite {
  id: string;
  title: string | null;
  dmRecap: string | null;
  publicRecap: string | null;
}

interface CampaignContinuityPanelProps {
  campaignId: string;
  threatClocks: unknown;
  unresolvedMysteries: unknown;
  storyThreads: unknown;
  factions: unknown;
  scheduledEvents: unknown;
  activeQuests: QuestLite[];
  latestSession: SessionLite | null;
  canManage: boolean;
  onSaved: () => void;
}

function toStrings(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function toThreatClocks(value: unknown) {
  if (!Array.isArray(value)) return [] as ThreatClock[];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        title,
        progress: Math.max(0, Number(item.progress ?? 0)),
        max: Math.max(1, Number(item.max ?? 4)),
        status:
          item.status === "paused" || item.status === "resolved" ? item.status : "active",
        notes: typeof item.notes === "string" ? item.notes : null,
      } satisfies ThreatClock;
    })
    .filter((entry: ThreatClock | null): entry is ThreatClock => Boolean(entry));
}

function toMysteries(value: unknown) {
  if (!Array.isArray(value)) return [] as Mystery[];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const question = String(item.question || "").trim();
      if (!question) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        question,
        answer: typeof item.answer === "string" ? item.answer : null,
        status:
          item.status === "revealed" || item.status === "closed" ? item.status : "open",
        notes: typeof item.notes === "string" ? item.notes : null,
      } satisfies Mystery;
    })
    .filter((entry: Mystery | null): entry is Mystery => Boolean(entry));
}

export function CampaignContinuityPanel({
  campaignId,
  threatClocks,
  unresolvedMysteries,
  storyThreads,
  factions,
  scheduledEvents,
  activeQuests,
  latestSession,
  canManage,
  onSaved,
}: CampaignContinuityPanelProps) {
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [clockDrafts, setClockDrafts] = useState<ThreatClock[]>(() => toThreatClocks(threatClocks));
  const [mysteryDrafts, setMysteryDrafts] = useState<Mystery[]>(() => toMysteries(unresolvedMysteries));
  const [newClock, setNewClock] = useState({ title: "", max: 4, notes: "" });
  const [newMystery, setNewMystery] = useState({ question: "", notes: "" });

  const prepPrompts = useMemo(() => {
    const prompts: string[] = [];
    const activeClock = clockDrafts
      .filter((clock) => clock.status === "active")
      .sort((a, b) => b.progress / b.max - a.progress / a.max)[0];
    const openMystery = mysteryDrafts.find((mystery) => mystery.status === "open");
    const nextEvent = toStrings(scheduledEvents)[0];
    const nextFactionMove = toStrings(factions)[0];
    const topThread = toStrings(storyThreads)[0];
    const urgentQuest = activeQuests.find((quest) => quest.priority === "urgent") ?? activeQuests[0];

    if (activeClock) {
      prompts.push(`Advance "${activeClock.title}" soon: it is at ${activeClock.progress}/${activeClock.max}.`);
    }
    if (openMystery) {
      prompts.push(`Seed a clue for "${openMystery.question}" next session.`);
    }
    if (urgentQuest) {
      prompts.push(`Keep "${urgentQuest.title}" moving so the party feels pressure on active objectives.`);
    }
    if (nextFactionMove) {
      prompts.push(`Show consequences from the faction front: ${nextFactionMove}`);
    }
    if (nextEvent) {
      prompts.push(`Prepare the scheduled event: ${nextEvent}`);
    }
    if (topThread) {
      prompts.push(`Reconnect the unresolved thread: ${topThread}`);
    }
    if (latestSession?.dmRecap) {
      prompts.push("Use the latest DM recap to decide what consequence lands first next session.");
    }

    return prompts.slice(0, 6);
  }, [activeQuests, clockDrafts, factions, latestSession?.dmRecap, mysteryDrafts, scheduledEvents, storyThreads]);

  async function saveContinuity() {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threatClocks: clockDrafts,
          unresolvedMysteries: mysteryDrafts,
        }),
      });

      if (res.ok) {
        setStatus({ kind: "success", message: "Continuity state saved." });
        onSaved();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: String(data.error || "Could not save continuity state.") });
      }
    } finally {
      setSaving(false);
    }
  }

  function addClock() {
    const title = newClock.title.trim();
    if (!title) return;
    setClockDrafts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        progress: 0,
        max: Math.max(2, Number(newClock.max) || 4),
        status: "active",
        notes: newClock.notes.trim() || null,
      },
    ]);
    setNewClock({ title: "", max: 4, notes: "" });
  }

  function addMystery() {
    const question = newMystery.question.trim();
    if (!question) return;
    setMysteryDrafts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        question,
        answer: null,
        status: "open",
        notes: newMystery.notes.trim() || null,
      },
    ]);
    setNewMystery({ question: "", notes: "" });
  }

  return (
    <div className="space-y-6">
      {status && <FormStatus kind={status.kind} message={status.message} />}

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <Icon name="pending_actions" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Threat Clocks</h3>
          </div>

          {canManage && (
            <div className="grid gap-3 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                <Input
                  id="new-clock-title"
                  label="Clock Title"
                  value={newClock.title}
                  onChange={(event) => setNewClock((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Cult ritual completes"
                />
                <Input
                  id="new-clock-max"
                  label="Segments"
                  type="number"
                  min={2}
                  value={newClock.max}
                  onChange={(event) => setNewClock((prev) => ({ ...prev, max: Math.max(2, Number(event.target.value) || 4) }))}
                />
              </div>
              <Textarea
                id="new-clock-notes"
                label="Notes"
                rows={2}
                value={newClock.notes}
                onChange={(event) => setNewClock((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="What advances this clock, and what happens when it fills?"
              />
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" onClick={addClock}>
                  <Icon name="add" size={16} />
                  Add Clock
                </Button>
              </div>
            </div>
          )}

          {clockDrafts.length === 0 ? (
            <EmptyState
              icon="schedule"
              title="No threat clocks yet"
              description="Track looming dangers, enemy schemes, faction escalations, and time-sensitive fallout."
            />
          ) : (
            <div className="space-y-3">
              {clockDrafts.map((clock) => {
                const percent = Math.min(100, (clock.progress / clock.max) * 100);
                return (
                  <div key={clock.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-headline text-base text-on-surface">{clock.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                          {clock.status} · {clock.progress}/{clock.max}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          className="text-on-surface-variant/50 transition-colors hover:text-error"
                          onClick={() => setClockDrafts((prev) => prev.filter((entry) => entry.id !== clock.id))}
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
                      <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${percent}%` }} />
                    </div>

                    {clock.notes && (
                      <p className="mt-3 text-sm text-on-surface-variant">{clock.notes}</p>
                    )}

                    {canManage && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setClockDrafts((prev) =>
                              prev.map((entry) =>
                                entry.id === clock.id
                                  ? { ...entry, progress: Math.max(0, entry.progress - 1) }
                                  : entry
                              )
                            )
                          }
                        >
                          <Icon name="remove" size={16} />
                          Tick Back
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setClockDrafts((prev) =>
                              prev.map((entry) =>
                                entry.id === clock.id
                                  ? { ...entry, progress: Math.min(entry.max, entry.progress + 1) }
                                  : entry
                              )
                            )
                          }
                        >
                          <Icon name="add" size={16} />
                          Advance
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setClockDrafts((prev) =>
                              prev.map((entry) =>
                                entry.id === clock.id
                                  ? {
                                      ...entry,
                                      status:
                                        entry.status === "active"
                                          ? "paused"
                                          : entry.status === "paused"
                                            ? "resolved"
                                            : "active",
                                    }
                                  : entry
                              )
                            )
                          }
                        >
                          <Icon name="sync" size={16} />
                          Cycle Status
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <Icon name="help" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Unresolved Mysteries</h3>
          </div>

          {canManage && (
            <div className="grid gap-3 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <Input
                id="new-mystery-question"
                label="Question"
                value={newMystery.question}
                onChange={(event) => setNewMystery((prev) => ({ ...prev, question: event.target.value }))}
                placeholder="Why did the queen spare the cult leader?"
              />
              <Textarea
                id="new-mystery-notes"
                label="Notes"
                rows={2}
                value={newMystery.notes}
                onChange={(event) => setNewMystery((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Possible answers, clue carriers, and likely reveal scenes..."
              />
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" onClick={addMystery}>
                  <Icon name="add" size={16} />
                  Add Mystery
                </Button>
              </div>
            </div>
          )}

          {mysteryDrafts.length === 0 ? (
            <EmptyState
              icon="help"
              title="No mysteries tracked yet"
              description="Track open questions, secrets the table is circling, and reveals you want to pace deliberately."
            />
          ) : (
            <div className="space-y-3">
              {mysteryDrafts.map((mystery) => (
                <div key={mystery.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{mystery.question}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {mystery.status}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        className="text-on-surface-variant/50 transition-colors hover:text-error"
                        onClick={() => setMysteryDrafts((prev) => prev.filter((entry) => entry.id !== mystery.id))}
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    )}
                  </div>

                  {mystery.answer && (
                    <p className="mt-3 text-sm text-on-surface">
                      <span className="text-secondary">Answer:</span> {mystery.answer}
                    </p>
                  )}
                  {mystery.notes && (
                    <p className="mt-2 text-sm text-on-surface-variant">{mystery.notes}</p>
                  )}

                  {canManage && (
                    <div className="mt-3 grid gap-3">
                      <Input
                        id={`mystery-answer-${mystery.id}`}
                        label="Answer / Reveal"
                        value={mystery.answer || ""}
                        onChange={(event) =>
                          setMysteryDrafts((prev) =>
                            prev.map((entry) =>
                              entry.id === mystery.id ? { ...entry, answer: event.target.value || null } : entry
                            )
                          )
                        }
                        placeholder="The answer you want to reveal later"
                      />
                      <div className="flex flex-wrap gap-2">
                        {(["open", "revealed", "closed"] as const).map((nextStatus) => (
                          <Button
                            key={nextStatus}
                            size="sm"
                            variant={mystery.status === nextStatus ? "secondary" : "ghost"}
                            onClick={() =>
                              setMysteryDrafts((prev) =>
                                prev.map((entry) =>
                                  entry.id === mystery.id ? { ...entry, status: nextStatus } : entry
                                )
                              )
                            }
                          >
                            {nextStatus}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="tips_and_updates" size={18} className="text-secondary" />
          <h3 className="font-headline text-lg text-on-surface">Prep Next Session</h3>
        </div>

        {prepPrompts.length === 0 ? (
          <EmptyState
            icon="tips_and_updates"
            title="No prep prompts yet"
            description="As you track quests, threads, faction moves, clocks, and mysteries, this panel will surface what matters next."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {prepPrompts.map((prompt) => (
              <div key={prompt} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4 text-sm text-on-surface-variant">
                {prompt}
              </div>
            ))}
          </div>
        )}

        {canManage && (
          <div className="mt-4 flex justify-end">
            <Button onClick={saveContinuity} loading={saving}>
              <Icon name="save" size={16} />
              Save Continuity State
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
