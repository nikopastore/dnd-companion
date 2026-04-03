"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TimelineEntry {
  id: string;
  title: string;
  summary: string;
  sessionLabel: string | null;
  dateLabel: string | null;
}

interface StoryPanelProps {
  personalityTraits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  personalGoals: string | null;
  secrets: string | null;
  voiceNotes: string | null;
  lastSessionChanges: string | null;
  characterTimeline: unknown;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}

function toTimelineEntries(value: unknown) {
  if (!Array.isArray(value)) return [] as TimelineEntry[];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      const summary = String(item.summary || "").trim();
      if (!title || !summary) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        title,
        summary,
        sessionLabel: typeof item.sessionLabel === "string" ? item.sessionLabel : null,
        dateLabel: typeof item.dateLabel === "string" ? item.dateLabel : null,
      };
    })
    .filter((entry: TimelineEntry | null): entry is TimelineEntry => Boolean(entry));
}

export function StoryPanel(props: StoryPanelProps) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    personalityTraits: props.personalityTraits || "",
    ideals: props.ideals || "",
    bonds: props.bonds || "",
    flaws: props.flaws || "",
    personalGoals: props.personalGoals || "",
    secrets: props.secrets || "",
    voiceNotes: props.voiceNotes || "",
    lastSessionChanges: props.lastSessionChanges || "",
  });
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(() => toTimelineEntries(props.characterTimeline));
  const [newEntry, setNewEntry] = useState({
    title: "",
    summary: "",
    sessionLabel: "",
    dateLabel: "",
  });
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setDraft({
      personalityTraits: props.personalityTraits || "",
      ideals: props.ideals || "",
      bonds: props.bonds || "",
      flaws: props.flaws || "",
      personalGoals: props.personalGoals || "",
      secrets: props.secrets || "",
      voiceNotes: props.voiceNotes || "",
      lastSessionChanges: props.lastSessionChanges || "",
    });
  }, [
    props.bonds,
    props.flaws,
    props.ideals,
    props.lastSessionChanges,
    props.personalGoals,
    props.personalityTraits,
    props.secrets,
    props.voiceNotes,
  ]);

  useEffect(() => {
    setTimelineEntries(toTimelineEntries(props.characterTimeline));
  }, [props.characterTimeline]);

  const visibleTimeline = useMemo(
    () => [...timelineEntries].reverse(),
    [timelineEntries]
  );

  async function saveStory() {
    setSaving(true);
    try {
      await props.onSave({
        personalityTraits: draft.personalityTraits.trim() || null,
        ideals: draft.ideals.trim() || null,
        bonds: draft.bonds.trim() || null,
        flaws: draft.flaws.trim() || null,
        personalGoals: draft.personalGoals.trim() || null,
        secrets: draft.secrets.trim() || null,
        voiceNotes: draft.voiceNotes.trim() || null,
        lastSessionChanges: draft.lastSessionChanges.trim() || null,
        characterTimeline: timelineEntries,
      });
      setStatus({ kind: "success", message: "Story details saved." });
    } catch {
      setStatus({ kind: "error", message: "Could not save story details." });
    } finally {
      setSaving(false);
    }
  }

  function addTimelineEntry() {
    const title = newEntry.title.trim();
    const summary = newEntry.summary.trim();
    if (!title || !summary) return;

    setTimelineEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        summary,
        sessionLabel: newEntry.sessionLabel.trim() || null,
        dateLabel: newEntry.dateLabel.trim() || null,
      },
    ]);
    setNewEntry({
      title: "",
      summary: "",
      sessionLabel: "",
      dateLabel: "",
    });
  }

  function removeTimelineEntry(entryId: string) {
    setTimelineEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  }

  return (
    <div className="space-y-6">
      {status && <FormStatus kind={status.kind} message={status.message} />}
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <Icon name="theater_comedy" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Identity</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Textarea
              id="story-traits"
              label="Traits"
              rows={4}
              value={draft.personalityTraits}
              onChange={(event) => setDraft((prev) => ({ ...prev, personalityTraits: event.target.value }))}
              placeholder="Mannerisms, habits, tells, and how this character carries themselves..."
            />
            <Textarea
              id="story-ideals"
              label="Ideals"
              rows={4}
              value={draft.ideals}
              onChange={(event) => setDraft((prev) => ({ ...prev, ideals: event.target.value }))}
              placeholder="Beliefs, values, promises, codes, and principles..."
            />
            <Textarea
              id="story-bonds"
              label="Bonds"
              rows={4}
              value={draft.bonds}
              onChange={(event) => setDraft((prev) => ({ ...prev, bonds: event.target.value }))}
              placeholder="People, places, factions, debts, family, or causes that matter most..."
            />
            <Textarea
              id="story-flaws"
              label="Flaws"
              rows={4}
              value={draft.flaws}
              onChange={(event) => setDraft((prev) => ({ ...prev, flaws: event.target.value }))}
              placeholder="Weak points, contradictions, temptations, bad habits, or blind spots..."
            />
            <Textarea
              id="story-goals"
              label="Goals"
              rows={4}
              value={draft.personalGoals}
              onChange={(event) => setDraft((prev) => ({ ...prev, personalGoals: event.target.value }))}
              placeholder="Short-term aims, arc goals, promises to keep, or unfinished business..."
            />
            <Textarea
              id="story-secrets"
              label="Secrets"
              rows={4}
              value={draft.secrets}
              onChange={(event) => setDraft((prev) => ({ ...prev, secrets: event.target.value }))}
              placeholder="Hidden truths, withheld motives, private fears, or dangerous knowledge..."
            />
          </div>

          <Textarea
            id="story-voice"
            label="Voice / Accent Notes"
            rows={3}
            value={draft.voiceNotes}
            onChange={(event) => setDraft((prev) => ({ ...prev, voiceNotes: event.target.value }))}
            placeholder="Cadence, accent, favorite phrases, vocal energy, or roleplay notes..."
          />

          <Textarea
            id="story-last-session"
            label="What Changed Last Session?"
            rows={4}
            value={draft.lastSessionChanges}
            onChange={(event) => setDraft((prev) => ({ ...prev, lastSessionChanges: event.target.value }))}
            placeholder="New scars, promises, breakthroughs, curses, loot, relationships, or revelations..."
          />

          <div className="flex justify-end">
            <Button onClick={saveStory} loading={saving}>
              <Icon name="save" size={16} />
              Save Story Details
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="flex items-center gap-2">
              <Icon name="timeline" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Character Timeline</h3>
            </div>

            <Input
              id="timeline-title"
              label="Entry Title"
              value={newEntry.title}
              onChange={(event) => setNewEntry((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Accepted the queen's bargain"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="timeline-session"
                label="Session / Chapter"
                value={newEntry.sessionLabel}
                onChange={(event) => setNewEntry((prev) => ({ ...prev, sessionLabel: event.target.value }))}
                placeholder="Session 12"
              />
              <Input
                id="timeline-date"
                label="Date / Arc"
                value={newEntry.dateLabel}
                onChange={(event) => setNewEntry((prev) => ({ ...prev, dateLabel: event.target.value }))}
                placeholder="Winter Court Arc"
              />
            </div>
            <Textarea
              id="timeline-summary"
              label="Summary"
              rows={4}
              value={newEntry.summary}
              onChange={(event) => setNewEntry((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="What happened, why it mattered, and how it changed the character..."
            />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={addTimelineEntry}>
                <Icon name="add" size={16} />
                Add Timeline Entry
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="flex items-center gap-2">
              <Icon name="history" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Journey Log</h3>
            </div>

            {visibleTimeline.length === 0 ? (
              <EmptyState
                icon="history"
                title="No timeline entries yet"
                description="Track turning points, injuries, promises, victories, losses, and identity changes over time."
              />
            ) : (
              <div className="space-y-3">
                {visibleTimeline.map((entry) => (
                  <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-headline text-base text-on-surface">{entry.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                          {[entry.sessionLabel, entry.dateLabel].filter(Boolean).join(" · ") || "Timeline entry"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-on-surface-variant/50 transition-colors hover:text-error"
                        onClick={() => removeTimelineEntry(entry.id)}
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-on-surface-variant">{entry.summary}</p>
                  </div>
                ))}
              </div>
            )}

            {visibleTimeline.length > 0 && (
              <div className="flex justify-end">
                <Button onClick={saveStory} loading={saving}>
                  <Icon name="save" size={16} />
                  Save Timeline
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
