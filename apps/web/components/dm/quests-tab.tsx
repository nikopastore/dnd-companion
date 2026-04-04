"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";
import { OptionGallery } from "@/components/builder/option-gallery";

type QuestStatus = "active" | "on_hold" | "completed" | "failed";
type QuestPriority = "urgent" | "normal" | "low";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  giverNpcId: string | null;
  notes: string | null;
}

interface NPC {
  id: string;
  name: string;
  description: string | null;
  isEnemy: boolean;
  notes: string | null;
}

interface Props {
  quests: Quest[];
  npcs: NPC[];
  campaignId: string;
  onAdd: (quest: Quest) => void;
  onUpdate: (quest: Quest) => void;
}

const STATUS_CONFIG: Record<QuestStatus, { label: string; icon: string; color: string }> = {
  active: { label: "Active", icon: "play_arrow", color: "text-green-400" },
  on_hold: { label: "On Hold", icon: "pause", color: "text-yellow-400" },
  completed: { label: "Completed", icon: "check_circle", color: "text-secondary" },
  failed: { label: "Failed", icon: "cancel", color: "text-error" },
};

const PRIORITY_CONFIG: Record<QuestPriority, { label: string; className: string }> = {
  urgent: { label: "Urgent", className: "bg-error-container/30 text-error border-error/20" },
  normal: { label: "Normal", className: "bg-surface-container-high/80 text-on-surface/70 border-outline-variant/10" },
  low: { label: "Low", className: "bg-surface-container-high/40 text-on-surface/40 border-outline-variant/5" },
};

const STATUS_ORDER: QuestStatus[] = ["active", "on_hold", "completed", "failed"];

const QUEST_THEME_OPTIONS = [
  { id: "retrieval", title: "Retrieval", description: "Recover a lost relic, stolen object, or critical resource before someone else does.", subtitle: "Classic hook", entityType: "quest" as const, meta: ["Artifact", "Time pressure"] },
  { id: "rescue", title: "Rescue", description: "Locate and extract a captive, lost ally, or endangered village figure.", subtitle: "Emotional stakes", entityType: "quest" as const, meta: ["NPC focus", "Urgency"] },
  { id: "investigation", title: "Investigation", description: "Follow clues, uncover motives, and reveal the truth behind a threat or mystery.", subtitle: "Clue-driven", entityType: "quest" as const, meta: ["Mystery", "Discovery"] },
  { id: "hunt", title: "Hunt", description: "Track a dangerous creature, faction operative, or supernatural threat through the world.", subtitle: "Pursuit", entityType: "quest" as const, meta: ["Combat", "Tracking"] },
  { id: "escort", title: "Escort", description: "Protect a fragile convoy, diplomat, or artifact over dangerous ground.", subtitle: "Travel tension", entityType: "quest" as const, meta: ["Road danger", "Defense"] },
  { id: "heist", title: "Heist", description: "Plan and execute a stealthy break-in, infiltration, or social theft under pressure.", subtitle: "Planning-heavy", entityType: "quest" as const, meta: ["Stealth", "Cunning"] },
];

export function QuestsTab({ quests, npcs, campaignId, onAdd, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(false);
  const [builderStep, setBuilderStep] = useState<0 | 1>(0);
  const [questTheme, setQuestTheme] = useState("retrieval");

  // New quest form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<QuestPriority>("normal");
  const [giverNpcId, setGiverNpcId] = useState("");
  const [notes, setNotes] = useState("");

  // Edit form state
  const [editStatus, setEditStatus] = useState<QuestStatus>("active");
  const [editPriority, setEditPriority] = useState<QuestPriority>("normal");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<QuestStatus, Quest[]> = { active: [], on_hold: [], completed: [], failed: [] };
    quests.forEach((q) => {
      const status = q.status as QuestStatus;
      if (groups[status]) groups[status].push(q);
      else groups.active.push(q);
    });
    return groups;
  }, [quests]);

  const npcMap = useMemo(() => {
    const map: Record<string, string> = {};
    npcs.forEach((n) => { map[n.id] = n.name; });
    return map;
  }, [npcs]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("normal");
    setGiverNpcId("");
    setNotes("");
    setQuestTheme("retrieval");
    setBuilderStep(0);
  }

  function openEdit(quest: Quest) {
    setEditingQuest(quest);
    setEditStatus((quest.status as QuestStatus) || "active");
    setEditPriority((quest.priority as QuestPriority) || "normal");
    setEditDescription(quest.description || "");
    setEditNotes(quest.notes || "");
  }

  async function handleAdd() {
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/quests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        giverNpcId: giverNpcId || null,
        notes: notes.trim() || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const quest = await res.json();
      onAdd(quest);
      resetForm();
      setShowForm(false);
      setStatus({ kind: "success", message: "Quest created." });
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus({ kind: "error", message: String(data.error || "Could not create quest.") });
    }
  }

  async function handleUpdate() {
    if (!editingQuest) return;
    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/quests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questId: editingQuest.id,
        status: editStatus,
        priority: editPriority,
        description: editDescription.trim() || null,
        notes: editNotes.trim() || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      setEditingQuest(null);
      setStatus({ kind: "success", message: "Quest updated." });
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus({ kind: "error", message: String(data.error || "Could not update quest.") });
    }
  }

  async function handleQuickStatusChange(quest: Quest, newStatus: QuestStatus) {
    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/quests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId: quest.id, status: newStatus }),
    });
    setLoading(false);
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      setStatus({ kind: "success", message: `Quest moved to ${STATUS_CONFIG[newStatus].label}.` });
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus({ kind: "error", message: String(data.error || "Could not update quest status.") });
    }
  }

  return (
    <div className="space-y-6">
      {status && <FormStatus kind={status.kind} message={status.message} />}
      <AtmosphericHero
        eyebrow="Quest Board"
        title="Stage story arcs as cases, pressures, and promises instead of plain rows."
        description="The quest view now opens with stronger story framing before you move into status management, arc creation, and DM editing."
        entityType="quest"
        imageName="The Lantern Board"
        chips={["Quest Builder", "Status Columns", "NPC Hooks", "Arc Pressure"]}
        highlights={[
          { icon: "assignment", label: "All Quests", value: `${quests.length}` },
          { icon: "play_arrow", label: "Active", value: `${grouped.active.length}` },
          { icon: "check_circle", label: "Completed", value: `${grouped.completed.length}` },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (showForm) {
                resetForm();
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
              setEditingQuest(null);
            }}
            className="interactive-glow"
          >
            <Icon name={showForm ? "close" : "add"} size={14} />
            {showForm ? "Cancel" : "New Quest"}
          </Button>
        }
        sideContent={
          <div className="space-y-3">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
              Board State
            </p>
            <div className="grid gap-3 text-sm text-on-surface-variant">
              <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                NPC quest givers, quest themes, and priority are surfaced before you open a card.
              </div>
              <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                This screen now reads more like a narrative operations board than a utility list.
              </div>
            </div>
          </div>
        }
      />

      {/* New Quest Form */}
      {showForm && (
        <div className="glass rounded-sm p-6 border border-secondary/10 space-y-3 animate-fade-in-up shadow-whisper relative overflow-hidden">
          <div className="decorative-orb absolute -top-10 -right-10 w-32 h-32" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <p className="font-headline text-sm text-secondary uppercase tracking-wider">Quest Builder</p>
            <div className="decorative-line flex-1 ml-2" />
            <AIAssistButton
              label="Generate Quest"
              size="sm"
              systemPrompt={AI_PROMPTS.questGenerator}
              userPrompt="Generate an engaging D&D quest with hooks, objectives, and rewards."
              onApply={(content) => {}}
              onApplyJSON={(data) => {
                const quest = data as Record<string, unknown>;
                if (quest.title) setTitle(quest.title as string);
                if (quest.description) setDescription(quest.description as string);
                if (quest.priority) setPriority((quest.priority as QuestPriority) || "normal");
                if (quest.notes) setNotes(quest.notes as string);
                setBuilderStep(1);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["Choose Arc", "Finalize Quest"].map((label, index) => (
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
            <div className="space-y-4">
              <OptionGallery
                options={QUEST_THEME_OPTIONS}
                selectedId={questTheme}
                onSelect={(option) => {
                  setQuestTheme(option.id);
                  if (!description.trim()) {
                    setDescription(option.description);
                  }
                  setBuilderStep(1);
                }}
                featuredIds={["retrieval", "rescue", "investigation"]}
                featuredLabel="Popular quest starts"
                allLabel="Quest archetypes"
                searchPlaceholder="Search quest arcs"
              />
            </div>
          )}

          {builderStep === 1 && (
            <div className="space-y-4">
              <Input id="quest-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Retrieve the Lost Amulet..." />
              <Input id="quest-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A mysterious artifact has been stolen..." />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  id="quest-priority"
                  label="Priority"
                  icon="priority_high"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as QuestPriority)}
                >
                  <option value="urgent">Urgent</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </Select>
                <Select
                  id="quest-giver"
                  label="Quest Giver"
                  icon="person"
                  value={giverNpcId}
                  onChange={(e) => setGiverNpcId(e.target.value)}
                >
                  <option value="">None</option>
                  {npcs.filter((n) => !n.isEnemy).map((npc) => (
                    <option key={npc.id} value={npc.id}>{npc.name}</option>
                  ))}
                </Select>
              </div>

              <Textarea
                id="quest-notes"
                label="DM Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes for the DM..."
                rows={3}
              />

              <div className="flex justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(0)}>
                  <Icon name="arrow_back" size={14} />
                  Back
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={loading || !title.trim()} className="glow-gold">
                  {loading ? "Creating..." : "Create Quest"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Quest Modal */}
      {editingQuest && (
        <div className="glass rounded-sm p-6 border border-primary/20 space-y-3 animate-fade-in-up shadow-whisper relative overflow-hidden">
          <div className="decorative-orb absolute -bottom-10 -left-10 w-28 h-28" />
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2">
              <p className="font-headline text-sm text-primary uppercase tracking-wider">
                Edit: {editingQuest.title}
              </p>
              <div className="decorative-line flex-1 ml-2" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditingQuest(null)}>
              <Icon name="close" size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="edit-status"
              label="Status"
              icon="flag"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as QuestStatus)}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </Select>
            <Select
              id="edit-priority"
              label="Priority"
              icon="priority_high"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as QuestPriority)}
            >
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </Select>
          </div>

          <Textarea
            id="edit-desc"
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
          />

          <Textarea
            id="edit-notes"
            label="DM Notes"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={2}
          />

          <Button size="sm" onClick={handleUpdate} disabled={loading} className="glow-gold">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}

      {/* Quest Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const statusQuests = grouped[status];

          return (
            <div key={status} className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center gap-2 pb-2">
                <Icon name={config.icon} size={16} className={config.color} />
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/60 font-bold">
                  {config.label}
                </span>
                <span className={`font-label text-[10px] ${config.color}`}>
                  {statusQuests.length}
                </span>
                <div className="decorative-line flex-1" />
              </div>

              {/* Quest Cards */}
              <div className="space-y-2">
                {statusQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-surface-container-low p-4 rounded-sm border border-outline-variant/8 interactive-glow cursor-pointer transition-all duration-300 hover:border-secondary/20 shadow-whisper"
                    onClick={() => openEdit(quest)}
                  >
                    {/* Title + Priority */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-body font-semibold text-sm text-on-surface leading-tight">
                        {quest.title}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-xl font-label text-[9px] uppercase font-bold tracking-wider border whitespace-nowrap ${(PRIORITY_CONFIG[quest.priority as QuestPriority] || PRIORITY_CONFIG.normal).className}`}
                      >
                        {(PRIORITY_CONFIG[quest.priority as QuestPriority] || PRIORITY_CONFIG.normal).label}
                      </span>
                    </div>

                    {/* Description Preview */}
                    {quest.description && (
                      <p className="font-body text-xs text-on-surface-variant line-clamp-2 mb-2">
                        {quest.description}
                      </p>
                    )}

                    {/* Quest Giver */}
                    {quest.giverNpcId && npcMap[quest.giverNpcId] && (
                      <div className="flex items-center gap-1 mb-3">
                        <Icon name="person" size={12} className="text-secondary/60" />
                        <span className="font-label text-[10px] text-secondary/80">
                          {npcMap[quest.giverNpcId]}
                        </span>
                      </div>
                    )}

                    {/* Quick Status Chips */}
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-outline-variant/5" onClick={(e) => e.stopPropagation()}>
                      {STATUS_ORDER.filter((s) => s !== quest.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleQuickStatusChange(quest, s)}
                          disabled={loading}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl font-label text-[9px] uppercase tracking-wider border border-outline-variant/10 bg-surface-container-high/40 hover:bg-surface-container-highest transition-all duration-200 ${STATUS_CONFIG[s].color}`}
                        >
                          <Icon name={STATUS_CONFIG[s].icon} size={10} />
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {statusQuests.length === 0 && (
                  <EmptyState
                    icon="inbox"
                    title={`No ${config.label.toLowerCase()} quests`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
