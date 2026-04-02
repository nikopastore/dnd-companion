"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";

interface Scene {
  title: string;
  description: string;
  type: string;
}

interface SecretOrClue {
  secret: string;
  discovered: boolean;
}

interface GameSession {
  id: string;
  number: number;
  title: string | null;
  date: string | null;
  status: string;
  strongStart: string | null;
  scenes: Scene[] | null;
  secretsAndClues: SecretOrClue[] | null;
  summary: string | null;
  notes: string | null;
}

interface SessionsTabProps {
  sessions: GameSession[];
  campaignId: string;
  onAdd: (session: GameSession) => void;
}

const statusOrder: Record<string, number> = {
  IN_PROGRESS: 0,
  PLANNED: 1,
  COMPLETED: 2,
};

const statusConfig: Record<
  string,
  { label: string; icon: string; color: string; badgeClass: string }
> = {
  IN_PROGRESS: {
    label: "In Progress",
    icon: "play_circle",
    color: "text-secondary",
    badgeClass: "bg-secondary/15 text-secondary border-secondary/20",
  },
  PLANNED: {
    label: "Planned",
    icon: "schedule",
    color: "text-on-surface-variant",
    badgeClass:
      "bg-surface-container-high/60 text-on-surface-variant border-outline-variant/10",
  },
  COMPLETED: {
    label: "Completed",
    icon: "check_circle",
    color: "text-green-400",
    badgeClass: "bg-green-900/20 text-green-400 border-green-500/20",
  },
};

export function SessionsTab({ sessions, campaignId, onAdd }: SessionsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [strongStart, setStrongStart] = useState("");
  const [scenes, setScenes] = useState<{ title: string; description: string }[]>([]);
  const [secrets, setSecrets] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Scene/secret input helpers
  const [newSceneTitle, setNewSceneTitle] = useState("");
  const [newSceneDesc, setNewSceneDesc] = useState("");
  const [newSecret, setNewSecret] = useState("");

  // Group sessions by status
  const grouped = sessions
    .slice()
    .sort(
      (a, b) =>
        (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
    );

  const groups = [
    {
      status: "IN_PROGRESS",
      items: grouped.filter((s) => s.status === "IN_PROGRESS"),
    },
    { status: "PLANNED", items: grouped.filter((s) => s.status === "PLANNED") },
    {
      status: "COMPLETED",
      items: grouped.filter((s) => s.status === "COMPLETED"),
    },
  ].filter((g) => g.items.length > 0);

  function resetForm() {
    setTitle("");
    setDate("");
    setStrongStart("");
    setScenes([]);
    setSecrets([]);
    setNotes("");
    setNewSceneTitle("");
    setNewSceneDesc("");
    setNewSecret("");
  }

  function addScene() {
    if (!newSceneTitle.trim()) return;
    setScenes((prev) => [
      ...prev,
      { title: newSceneTitle.trim(), description: newSceneDesc.trim() },
    ]);
    setNewSceneTitle("");
    setNewSceneDesc("");
  }

  function removeScene(index: number) {
    setScenes((prev) => prev.filter((_, i) => i !== index));
  }

  function addSecret() {
    if (!newSecret.trim()) return;
    setSecrets((prev) => [...prev, newSecret.trim()]);
    setNewSecret("");
  }

  function removeSecret(index: number) {
    setSecrets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date: date || null,
          strongStart: strongStart.trim() || null,
          scenes:
            scenes.length > 0
              ? scenes.map((s) => ({ ...s, type: "scene" }))
              : null,
          secretsAndClues:
            secrets.length > 0
              ? secrets.map((s) => ({ secret: s, discovered: false }))
              : null,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        const session = await res.json();
        onAdd(session);
        resetForm();
        setShowForm(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-xl text-on-surface">
          Session Planning
        </h2>
        <Button
          variant={showForm ? "ghost" : "primary"}
          size="sm"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) resetForm();
          }}
          className={showForm ? "" : "glow-gold"}
        >
          <Icon name={showForm ? "close" : "add"} size={16} />
          {showForm ? "Cancel" : "New Session"}
        </Button>
      </div>

      {/* Create Session Form (Lazy DM / Sly Flourish Method) */}
      {showForm && (
        <div className="glass rounded-sm p-6 border border-secondary/10 space-y-5 animate-fade-in-up shadow-whisper relative overflow-hidden">
          <div className="decorative-orb absolute -top-10 -right-10 w-32 h-32" />
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <Icon name="auto_stories" size={20} className="text-secondary" />
            <h3 className="font-headline text-base text-secondary">
              Lazy DM Session Prep
            </h3>
            <div className="decorative-line flex-1 ml-2" />
          </div>

          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="session-title"
              label="Session Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Mines of Phandelver..."
              icon="title"
            />
            <Input
              id="session-date"
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              icon="calendar_month"
            />
          </div>

          {/* Strong Start */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold flex items-center gap-1.5">
                <Icon name="bolt" size={14} className="text-secondary" />
                Strong Start
              </label>
              <AIAssistButton
                label="Generate Strong Start"
                size="sm"
                systemPrompt={AI_PROMPTS.sessionStrongStart}
                userPrompt={title ? `Generate a strong start for a session titled "${title}".` : "Generate a strong start for a D&D session."}
                context={title ? `Session title: ${title}` : undefined}
                onApply={(content) => setStrongStart(content)}
              />
            </div>
            <Textarea
              id="session-strong-start"
              value={strongStart}
              onChange={(e) => setStrongStart(e.target.value)}
              rows={3}
              placeholder="Start the session with action, danger, or drama..."
            />
          </div>

          {/* Scenes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold flex items-center gap-1.5">
                <Icon name="movie" size={14} className="text-secondary" />
                Scenes ({scenes.length})
              </label>
              <AIAssistButton
                label="Generate Scenes"
                size="sm"
                systemPrompt={AI_PROMPTS.sessionScenes}
                userPrompt={title ? `Generate scenes for a session titled "${title}".` : "Generate scenes for a D&D session."}
                context={title ? `Session title: ${title}${strongStart ? `\nStrong Start: ${strongStart}` : ""}` : undefined}
                onApply={(content) => {}}
                onApplyJSON={(data) => {
                  if (Array.isArray(data)) {
                    const newScenes = data.map((s: { title?: string; description?: string }) => ({
                      title: s.title || "Untitled Scene",
                      description: s.description || "",
                    }));
                    setScenes((prev) => [...prev, ...newScenes]);
                  }
                }}
              />
            </div>

            {scenes.length > 0 && (
              <div className="space-y-2">
                {scenes.map((scene, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-surface-container p-3 rounded-sm border border-outline-variant/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-on-surface font-semibold">
                        {scene.title}
                      </p>
                      {scene.description && (
                        <p className="font-body text-xs text-on-surface-variant mt-0.5">
                          {scene.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeScene(i)}
                      className="text-on-surface-variant/30 hover:text-error transition-colors shrink-0 mt-0.5"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  id="new-scene-title"
                  value={newSceneTitle}
                  onChange={(e) => setNewSceneTitle(e.target.value)}
                  placeholder="Scene title..."
                  icon="movie"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addScene();
                    }
                  }}
                />
                <Input
                  id="new-scene-desc"
                  value={newSceneDesc}
                  onChange={(e) => setNewSceneDesc(e.target.value)}
                  placeholder="Brief description (optional)..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addScene();
                    }
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={addScene}
                disabled={!newSceneTitle.trim()}
                className="shrink-0 self-start mt-0.5"
              >
                <Icon name="add" size={16} />
              </Button>
            </div>
          </div>

          {/* Secrets & Clues */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold flex items-center gap-1.5">
                <Icon name="visibility" size={14} className="text-secondary" />
                Secrets &amp; Clues ({secrets.length})
              </label>
              <AIAssistButton
                label="Generate Secrets"
                size="sm"
                systemPrompt={AI_PROMPTS.sessionSecrets}
                userPrompt={title ? `Generate secrets and clues for a session titled "${title}".` : "Generate secrets and clues for a D&D session."}
                context={title ? `Session title: ${title}${strongStart ? `\nStrong Start: ${strongStart}` : ""}` : undefined}
                onApply={(content) => {}}
                onApplyJSON={(data) => {
                  if (Array.isArray(data)) {
                    const newSecrets = data.map((s: { secret?: string }) => s.secret || "").filter(Boolean);
                    setSecrets((prev) => [...prev, ...newSecrets]);
                  }
                }}
              />
            </div>

            {secrets.length > 0 && (
              <div className="space-y-2">
                {secrets.map((secret, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-surface-container p-3 rounded-sm border border-outline-variant/5"
                  >
                    <Icon
                      name="key"
                      size={14}
                      className="text-secondary/50 shrink-0"
                    />
                    <span className="flex-1 font-body text-sm text-on-surface min-w-0 truncate">
                      {secret}
                    </span>
                    <button
                      onClick={() => removeSecret(i)}
                      className="text-on-surface-variant/30 hover:text-error transition-colors shrink-0"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="new-secret"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  placeholder="Add a secret or clue..."
                  icon="key"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSecret();
                    }
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={addSecret}
                disabled={!newSecret.trim()}
                className="shrink-0 self-end"
              >
                <Icon name="add" size={16} />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <Textarea
            id="session-notes"
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes, reminders, or ideas..."
          />

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleCreate}
              disabled={loading || !title.trim()}
              loading={loading}
              className="glow-gold"
            >
              <Icon name="save" size={16} />
              Create Session
            </Button>
          </div>
        </div>
      )}

      {/* Session List grouped by status */}
      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => {
            const cfg = statusConfig[group.status] || statusConfig.PLANNED;

            return (
              <div key={group.status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon
                    name={cfg.icon}
                    size={16}
                    filled
                    className={cfg.color}
                  />
                  <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-bold">
                    {cfg.label} ({group.items.length})
                  </span>
                  <div className="decorative-line flex-1" />
                </div>

                <div className="space-y-2 stagger-children">
                  {group.items.map((session) => {
                    const isExpanded = expandedId === session.id;
                    const scfg =
                      statusConfig[session.status] || statusConfig.PLANNED;

                    return (
                      <div
                        key={session.id}
                        className="bg-surface-container-low rounded-sm border border-outline-variant/8 overflow-hidden transition-all duration-300 shadow-whisper"
                      >
                        {/* Session Card Header */}
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : session.id)
                          }
                          className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-container/50 transition-all duration-300"
                        >
                          <span className="font-headline text-lg font-bold text-secondary/60 w-8 text-center shrink-0">
                            {session.number}
                          </span>

                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm font-semibold text-on-surface truncate">
                              {session.title || "Untitled Session"}
                            </p>
                            {session.date && (
                              <p className="font-body text-xs text-on-surface-variant/40 mt-0.5">
                                {new Date(session.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            )}
                          </div>

                          <span
                            className={`shrink-0 px-2.5 py-0.5 rounded-full font-label text-[10px] uppercase tracking-wider font-bold border ${scfg.badgeClass}`}
                          >
                            {scfg.label}
                          </span>

                          <Icon
                            name={isExpanded ? "expand_less" : "expand_more"}
                            size={20}
                            className="text-on-surface-variant/30 shrink-0"
                          />
                        </button>

                        {/* Expanded Detail View */}
                        {isExpanded && (
                          <div className="px-4 pb-5 pt-1 border-t border-outline-variant/5 space-y-4 animate-fade-in-up">
                            {/* Strong Start */}
                            {session.strongStart && (
                              <div>
                                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                                  <Icon name="bolt" size={12} />
                                  Strong Start
                                </p>
                                <p className="font-body text-sm text-on-surface-variant leading-relaxed pl-4 border-l border-secondary/20">
                                  {session.strongStart}
                                </p>
                              </div>
                            )}

                            {/* Scenes */}
                            {session.scenes &&
                              Array.isArray(session.scenes) &&
                              session.scenes.length > 0 && (
                                <div>
                                  <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                                    <Icon name="movie" size={12} />
                                    Scenes ({session.scenes.length})
                                  </p>
                                  <div className="space-y-2 pl-4 border-l border-secondary/20">
                                    {(session.scenes as Scene[]).map(
                                      (scene, i) => (
                                        <div key={i}>
                                          <p className="font-body text-sm text-on-surface font-semibold">
                                            {scene.title}
                                          </p>
                                          {scene.description && (
                                            <p className="font-body text-xs text-on-surface-variant/60">
                                              {scene.description}
                                            </p>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Secrets & Clues */}
                            {session.secretsAndClues &&
                              Array.isArray(session.secretsAndClues) &&
                              session.secretsAndClues.length > 0 && (
                                <div>
                                  <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                                    <Icon name="visibility" size={12} />
                                    Secrets &amp; Clues (
                                    {session.secretsAndClues.length})
                                  </p>
                                  <div className="space-y-1.5 pl-4 border-l border-secondary/20">
                                    {(
                                      session.secretsAndClues as SecretOrClue[]
                                    ).map((sc, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2"
                                      >
                                        <Icon
                                          name={
                                            sc.discovered
                                              ? "check_circle"
                                              : "radio_button_unchecked"
                                          }
                                          size={14}
                                          className={
                                            sc.discovered
                                              ? "text-green-400"
                                              : "text-on-surface-variant/30"
                                          }
                                        />
                                        <span
                                          className={`font-body text-sm ${
                                            sc.discovered
                                              ? "text-on-surface-variant/50 line-through"
                                              : "text-on-surface-variant"
                                          }`}
                                        >
                                          {sc.secret}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Summary */}
                            {session.summary && (
                              <div>
                                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                                  <Icon name="description" size={12} />
                                  Summary
                                </p>
                                <p className="font-body text-sm text-on-surface-variant leading-relaxed pl-4 border-l border-secondary/20">
                                  {session.summary}
                                </p>
                              </div>
                            )}

                            {/* Notes */}
                            {session.notes && (
                              <div>
                                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/50 font-bold flex items-center gap-1 mb-1.5">
                                  <Icon name="note" size={12} />
                                  Notes
                                </p>
                                <p className="font-body text-sm text-on-surface-variant/70 leading-relaxed pl-4 border-l border-outline-variant/10">
                                  {session.notes}
                                </p>
                              </div>
                            )}

                            {/* Empty state for no prep */}
                            {!session.strongStart &&
                              (!session.scenes ||
                                (Array.isArray(session.scenes) &&
                                  session.scenes.length === 0)) &&
                              (!session.secretsAndClues ||
                                (Array.isArray(session.secretsAndClues) &&
                                  session.secretsAndClues.length === 0)) &&
                              !session.notes &&
                              !session.summary && (
                                <p className="font-body text-sm text-on-surface-variant/30 italic text-center py-4">
                                  No prep notes yet for this session
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <EmptyState
            icon="auto_stories"
            title="No sessions yet"
            description="Plan your first session using the Lazy DM method"
            action={
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)} className="glow-gold">
                <Icon name="add" size={16} />
                New Session
              </Button>
            }
          />
        )
      )}
    </div>
  );
}
