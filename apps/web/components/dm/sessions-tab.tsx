"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";
import { OptionGallery } from "@/components/builder/option-gallery";

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
  objectives: Array<{ text: string }> | null;
  scenes: Scene[] | null;
  secretsAndClues: SecretOrClue[] | null;
  summary: string | null;
  notes: string | null;
  publicRecap: string | null;
  dmRecap: string | null;
  pacingNotes: string | null;
  attendance: Array<{ characterId: string; name: string; status: string }> | null;
  preparedChecklist: Array<{ text: string; done: boolean }> | null;
  liveNotes: Array<{ time: string; text: string; visibility: string }> | null;
}

interface SessionsTabProps {
  sessions: GameSession[];
  campaignId: string;
  members: Array<{ id: string; name: string }>;
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

const SESSION_STYLE_OPTIONS = [
  { id: "travel", title: "Travel & Discovery", description: "Road hazards, wilderness beats, new landmarks, and moving fronts.", subtitle: "Exploration-led", entityType: "encounter" as const, meta: ["Travel", "Discovery"] },
  { id: "social", title: "Social Pressure", description: "Negotiation, faction agendas, tense roleplay, and reputation shifts.", subtitle: "Roleplay-led", entityType: "encounter" as const, meta: ["Diplomacy", "Factions"] },
  { id: "mystery", title: "Mystery Session", description: "Clues, reveals, suspects, and hidden motives unfolding scene by scene.", subtitle: "Clue-led", entityType: "encounter" as const, meta: ["Clues", "Revelation"] },
  { id: "assault", title: "Assault Mission", description: "A direct strike, timed breach, raid, or battlefield push with momentum.", subtitle: "Action-led", entityType: "encounter" as const, meta: ["Combat", "Momentum"] },
  { id: "dungeon", title: "Dungeon Delve", description: "Hazards, chambers, attrition, and escalating discoveries underground.", subtitle: "Site-based", entityType: "encounter" as const, meta: ["Attrition", "Rooms"] },
  { id: "finale", title: "Major Finale", description: "Set-piece confrontation, payoff scenes, and campaign-defining decisions.", subtitle: "High stakes", entityType: "encounter" as const, meta: ["Boss fight", "Payoff"] },
];

const SESSION_PRESSURE_OPTIONS = [
  { id: "countdown", title: "Countdown", description: "The longer the party waits, the worse the outcome becomes.", subtitle: "Time pressure", entityType: "encounter" as const, meta: ["Deadline"] },
  { id: "ambush", title: "Ambush Risk", description: "Enemies can strike first, forcing the players to stay sharp.", subtitle: "Surprise pressure", entityType: "encounter" as const, meta: ["Danger"] },
  { id: "scarcity", title: "Resource Drain", description: "Spell slots, rations, healing, or goodwill will be stretched thin.", subtitle: "Attrition", entityType: "encounter" as const, meta: ["Long day"] },
  { id: "politics", title: "Political Fallout", description: "Every choice changes alliances, trust, and campaign leverage.", subtitle: "Faction pressure", entityType: "encounter" as const, meta: ["Social stakes"] },
  { id: "revelation", title: "Secret Reveal", description: "The session is built around exposing hidden truths at the right moment.", subtitle: "Narrative payoff", entityType: "encounter" as const, meta: ["Twist"] },
  { id: "boss", title: "Boss Threat", description: "A major enemy presence shapes every scene, even before combat starts.", subtitle: "Threat-driven", entityType: "encounter" as const, meta: ["Final threat"] },
];

export function SessionsTab({ sessions, campaignId, members, onAdd }: SessionsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [builderStep, setBuilderStep] = useState<0 | 1 | 2>(0);
  const [sessionStyle, setSessionStyle] = useState("travel");
  const [sessionPressure, setSessionPressure] = useState("countdown");

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [strongStart, setStrongStart] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [scenes, setScenes] = useState<{ title: string; description: string }[]>([]);
  const [secrets, setSecrets] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [publicRecap, setPublicRecap] = useState("");
  const [dmRecap, setDmRecap] = useState("");
  const [pacingNotes, setPacingNotes] = useState("");
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  // Scene/secret input helpers
  const [newObjective, setNewObjective] = useState("");
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
    setObjectives([]);
    setScenes([]);
    setSecrets([]);
    setNotes("");
    setPublicRecap("");
    setDmRecap("");
    setPacingNotes("");
    setAttendance({});
    setNewObjective("");
    setNewSceneTitle("");
    setNewSceneDesc("");
    setNewSecret("");
    setBuilderStep(0);
    setSessionStyle("travel");
    setSessionPressure("countdown");
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

  function addObjective() {
    if (!newObjective.trim()) return;
    setObjectives((prev) => [...prev, newObjective.trim()]);
    setNewObjective("");
  }

  function removeObjective(index: number) {
    setObjectives((prev) => prev.filter((_, i) => i !== index));
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
          objectives: objectives.length > 0 ? objectives.map((objective) => ({ text: objective })) : null,
          scenes:
            scenes.length > 0
              ? scenes.map((s) => ({ ...s, type: "scene" }))
              : null,
          secretsAndClues:
            secrets.length > 0
              ? secrets.map((s) => ({ secret: s, discovered: false }))
              : null,
          notes: notes.trim() || null,
          publicRecap: publicRecap.trim() || null,
          dmRecap: dmRecap.trim() || null,
          pacingNotes: pacingNotes.trim() || null,
          attendance:
            Object.keys(attendance).length > 0
              ? members.map((member) => ({
                  characterId: member.id,
                  name: member.name,
                  status: attendance[member.id] || "planned",
                }))
              : null,
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
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
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
              Session Builder
            </h3>
            <div className="decorative-line flex-1 ml-2" />
          </div>
          <div className="flex flex-wrap gap-2">
            {["Style", "Pressure", "Prep"].map((label, index) => (
              <div
                key={label}
                className={`rounded-full px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] ${
                  builderStep === index
                    ? "bg-secondary/10 text-secondary"
                    : builderStep > index
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container-high text-on-surface-variant/45"
                }`}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>

          {builderStep === 0 && (
            <OptionGallery
              options={SESSION_STYLE_OPTIONS}
              selectedId={sessionStyle}
              onSelect={(option) => {
                setSessionStyle(option.id);
                setBuilderStep(1);
              }}
              featuredIds={["travel", "social", "dungeon"]}
              featuredLabel="Common session structures"
              allLabel="Session archetypes"
              searchPlaceholder="Search session styles"
            />
          )}

          {builderStep === 1 && (
            <div className="space-y-4">
              <OptionGallery
                options={SESSION_PRESSURE_OPTIONS}
                selectedId={sessionPressure}
                onSelect={(option) => {
                  setSessionPressure(option.id);
                  if (!strongStart.trim()) {
                    setStrongStart(option.description);
                  }
                  setBuilderStep(2);
                }}
                featuredIds={["countdown", "revelation", "boss"]}
                featuredLabel="Recommended pressure"
                allLabel="Session pressure"
                searchPlaceholder="Search pacing and stakes"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(0)}>
                <Icon name="arrow_back" size={14} />
                Back
              </Button>
            </div>
          )}

          {builderStep === 2 && (
            <>
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

              <Input
                id="session-summary"
                label="Builder Summary"
                value={`${sessionStyle} · ${sessionPressure}`}
                readOnly
              />

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
                    context={`Session style: ${sessionStyle}\nPressure: ${sessionPressure}${title ? `\nTitle: ${title}` : ""}`}
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

              <div className="space-y-3">
                <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold flex items-center gap-1.5">
                  <Icon name="checklist" size={14} className="text-secondary" />
                  Objectives ({objectives.length})
                </label>
                {objectives.length > 0 && (
                  <div className="space-y-2">
                    {objectives.map((objective, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-sm border border-outline-variant/5 bg-surface-container p-3">
                        <span className="flex-1 text-sm text-on-surface">{objective}</span>
                        <button onClick={() => removeObjective(i)} className="text-on-surface-variant/30 hover:text-error transition-colors">
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="new-objective"
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Add a session objective..."
                      icon="task_alt"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addObjective();
                        }
                      }}
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={addObjective} disabled={!newObjective.trim()}>
                    <Icon name="add" size={16} />
                  </Button>
                </div>
              </div>

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
                    context={`Session style: ${sessionStyle}\nPressure: ${sessionPressure}${title ? `\nSession title: ${title}` : ""}${strongStart ? `\nStrong Start: ${strongStart}` : ""}`}
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
                    context={`Session style: ${sessionStyle}\nPressure: ${sessionPressure}${title ? `\nSession title: ${title}` : ""}${strongStart ? `\nStrong Start: ${strongStart}` : ""}`}
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

              <Textarea
                id="session-notes"
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes, reminders, or ideas..."
              />

              <div className="space-y-3">
                <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold flex items-center gap-1.5">
                  <Icon name="groups" size={14} className="text-secondary" />
                  Attendance Plan
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  {members.map((member) => (
                    <div key={member.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                      <div className="mb-2 text-sm text-on-surface">{member.name}</div>
                      <select
                        value={attendance[member.id] || "planned"}
                        onChange={(event) =>
                          setAttendance((prev) => ({ ...prev, [member.id]: event.target.value }))
                        }
                        className="w-full rounded-sm border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
                      >
                        <option value="planned">Planned</option>
                        <option value="attended">Attended</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <Textarea
                id="session-public-recap"
                label="Player Recap"
                value={publicRecap}
                onChange={(e) => setPublicRecap(e.target.value)}
                rows={3}
                placeholder="Player-facing recap or catch-up summary..."
              />
              <div className="flex justify-end">
                <AIAssistButton
                  label="Generate Player Recap"
                  size="sm"
                  systemPrompt={AI_PROMPTS.sessionRecapPlayer}
                  userPrompt={`Generate a player-facing recap for ${title || "this session"}.`}
                  context={`Strong Start: ${strongStart}\nObjectives: ${objectives.join("; ")}\nScenes: ${scenes.map((scene) => scene.title).join(", ")}\nSecrets: ${secrets.join("; ")}\nNotes: ${notes}`}
                  onApply={(content) => setPublicRecap(content)}
                />
              </div>

              <Textarea
                id="session-dm-recap"
                label="DM Recap"
                value={dmRecap}
                onChange={(e) => setDmRecap(e.target.value)}
                rows={3}
                placeholder="DM-only continuity recap and consequences..."
              />
              <div className="flex justify-end">
                <AIAssistButton
                  label="Generate DM Recap"
                  size="sm"
                  systemPrompt={AI_PROMPTS.sessionRecapDM}
                  userPrompt={`Generate a DM continuity recap for ${title || "this session"}.`}
                  context={`Strong Start: ${strongStart}\nObjectives: ${objectives.join("; ")}\nScenes: ${scenes.map((scene) => `${scene.title}: ${scene.description}`).join(" | ")}\nSecrets: ${secrets.join("; ")}\nNotes: ${notes}\nPacing: ${pacingNotes}`}
                  onApply={(content) => setDmRecap(content)}
                />
              </div>

              <Textarea
                id="session-pacing"
                label="Pacing Notes"
                value={pacingNotes}
                onChange={(e) => setPacingNotes(e.target.value)}
                rows={2}
                placeholder="Combat / RP / exploration balance, session tempo, fatigue, spotlight..."
              />

              <div className="flex justify-between pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(1)}>
                  <Icon name="arrow_back" size={14} />
                  Back
                </Button>
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
            </>
          )}
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

                            {session.objectives &&
                              Array.isArray(session.objectives) &&
                              session.objectives.length > 0 && (
                                <div>
                                  <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                                    <Icon name="task_alt" size={12} />
                                    Objectives ({session.objectives.length})
                                  </p>
                                  <div className="space-y-1.5 pl-4 border-l border-secondary/20">
                                    {session.objectives.map((objective, i) => (
                                      <div key={i} className="text-sm text-on-surface-variant">
                                        {objective.text}
                                      </div>
                                    ))}
                                  </div>
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

                            {session.publicRecap && (
                              <div>
                                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                                  <Icon name="menu_book" size={12} />
                                  Player Recap
                                </p>
                                <p className="font-body text-sm text-on-surface-variant leading-relaxed pl-4 border-l border-secondary/20">
                                  {session.publicRecap}
                                </p>
                              </div>
                            )}

                            {session.dmRecap && (
                              <div>
                                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                                  <Icon name="shield" size={12} />
                                  DM Recap
                                </p>
                                <p className="font-body text-sm text-on-surface-variant leading-relaxed pl-4 border-l border-secondary/20">
                                  {session.dmRecap}
                                </p>
                              </div>
                            )}

                            {session.pacingNotes && (
                              <div>
                                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/50 font-bold flex items-center gap-1 mb-1.5">
                                  <Icon name="speed" size={12} />
                                  Pacing Notes
                                </p>
                                <p className="font-body text-sm text-on-surface-variant/70 leading-relaxed pl-4 border-l border-outline-variant/10">
                                  {session.pacingNotes}
                                </p>
                              </div>
                            )}

                            {session.attendance &&
                              Array.isArray(session.attendance) &&
                              session.attendance.length > 0 && (
                                <div>
                                  <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                                    <Icon name="groups" size={12} />
                                    Attendance
                                  </p>
                                  <div className="flex flex-wrap gap-2 pl-4 border-l border-secondary/20">
                                    {session.attendance.map((entry) => (
                                      <span key={entry.characterId} className="rounded-full bg-surface-container px-2.5 py-1 text-xs text-on-surface-variant">
                                        {entry.name}: {entry.status}
                                      </span>
                                    ))}
                                  </div>
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
