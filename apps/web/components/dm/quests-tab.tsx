"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Chip } from "@/components/ui/chip";

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

export function QuestsTab({ quests, npcs, campaignId, onAdd, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(false);

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
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Icon name="assignment" size={24} className="text-secondary" />
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">
            Quest Board ({quests.length})
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setShowForm(!showForm); setEditingQuest(null); }} className="interactive-glow">
          <Icon name={showForm ? "close" : "add"} size={14} />
          {showForm ? "Cancel" : "New Quest"}
        </Button>
      </div>

      {/* New Quest Form */}
      {showForm && (
        <div className="bg-surface-container p-5 rounded-sm space-y-3 animate-fade-in-up border border-secondary/10">
          <p className="font-headline text-sm text-secondary uppercase tracking-wider mb-2">New Quest</p>
          <Input id="quest-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Retrieve the Lost Amulet..." />
          <Input id="quest-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A mysterious artifact has been stolen..." />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as QuestPriority)}
                className="w-full bg-surface-container-highest/80 rounded-sm px-4 py-3 font-body text-on-surface border border-outline-variant/10 outline-none focus:border-secondary/40 transition-all duration-300"
              >
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                Quest Giver
              </label>
              <select
                value={giverNpcId}
                onChange={(e) => setGiverNpcId(e.target.value)}
                className="w-full bg-surface-container-highest/80 rounded-sm px-4 py-3 font-body text-on-surface border border-outline-variant/10 outline-none focus:border-secondary/40 transition-all duration-300"
              >
                <option value="">None</option>
                {npcs.filter((n) => !n.isEnemy).map((npc) => (
                  <option key={npc.id} value={npc.id}>{npc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quest-notes" className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
              DM Notes
            </label>
            <textarea
              id="quest-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes for the DM..."
              rows={3}
              className="w-full bg-surface-container-highest/80 rounded-sm px-4 py-3 font-body text-on-surface border border-outline-variant/10 outline-none focus:border-secondary/40 transition-all duration-300 placeholder:text-on-surface/25 resize-none"
            />
          </div>

          <Button size="sm" onClick={handleAdd} disabled={loading || !title.trim()} className="glow-gold">
            {loading ? "Creating..." : "Create Quest"}
          </Button>
        </div>
      )}

      {/* Edit Quest Modal */}
      {editingQuest && (
        <div className="bg-surface-container p-5 rounded-sm space-y-3 animate-fade-in-up border border-primary/20">
          <div className="flex justify-between items-center">
            <p className="font-headline text-sm text-primary uppercase tracking-wider">
              Edit: {editingQuest.title}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setEditingQuest(null)}>
              <Icon name="close" size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as QuestStatus)}
                className="w-full bg-surface-container-highest/80 rounded-sm px-4 py-3 font-body text-on-surface border border-outline-variant/10 outline-none focus:border-secondary/40 transition-all duration-300"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                Priority
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as QuestPriority)}
                className="w-full bg-surface-container-highest/80 rounded-sm px-4 py-3 font-body text-on-surface border border-outline-variant/10 outline-none focus:border-secondary/40 transition-all duration-300"
              >
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-desc" className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
              Description
            </label>
            <textarea
              id="edit-desc"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full bg-surface-container-highest/80 rounded-sm px-4 py-3 font-body text-on-surface border border-outline-variant/10 outline-none focus:border-secondary/40 transition-all duration-300 placeholder:text-on-surface/25 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-notes" className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
              DM Notes
            </label>
            <textarea
              id="edit-notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className="w-full bg-surface-container-highest/80 rounded-sm px-4 py-3 font-body text-on-surface border border-outline-variant/10 outline-none focus:border-secondary/40 transition-all duration-300 placeholder:text-on-surface/25 resize-none"
            />
          </div>

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
              <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
                <Icon name={config.icon} size={16} className={config.color} />
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/60 font-bold">
                  {config.label}
                </span>
                <span className={`font-label text-[10px] ml-auto ${config.color}`}>
                  {statusQuests.length}
                </span>
              </div>

              {/* Quest Cards */}
              <div className="space-y-2">
                {statusQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-surface-container-low p-4 rounded-sm border border-outline-variant/8 interactive-glow cursor-pointer transition-all duration-300 hover:border-secondary/20"
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
                  <div className="py-6 text-center">
                    <Icon name="inbox" size={24} className="text-on-surface/10 mx-auto mb-1" />
                    <p className="font-body text-[10px] text-on-surface/20">No quests</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
