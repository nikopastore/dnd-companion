"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

interface NPC {
  id: string;
  name: string;
  description: string | null;
  isEnemy: boolean;
  notes: string | null;
}

interface Props {
  npcs: NPC[];
  campaignId: string;
  onAdd: (npc: NPC) => void;
}

export function NPCTracker({ npcs, campaignId, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isEnemy, setIsEnemy] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/npcs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, name: name.trim(), description: description.trim() || null, isEnemy }),
    });
    setLoading(false);
    if (res.ok) {
      const npc = await res.json();
      onAdd(npc);
      setName("");
      setDescription("");
      setIsEnemy(false);
      setShowForm(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="font-headline text-secondary uppercase tracking-widest text-xs">
          NPCs & Enemies ({npcs.length})
        </span>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
          <Icon name={showForm ? "close" : "add"} size={14} />
          {showForm ? "Cancel" : "Add"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-surface-container p-4 rounded-sm space-y-3">
          <Input id="npc-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Goblin Chief..." />
          <Input id="npc-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isEnemy} onChange={(e) => setIsEnemy(e.target.checked)} className="accent-error" />
            <span className="font-label text-xs uppercase text-error">Enemy</span>
          </label>
          <Button size="sm" onClick={handleAdd} disabled={loading || !name.trim()}>
            {loading ? "Adding..." : "Add NPC"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {npcs.map((npc) => (
          <div
            key={npc.id}
            className={`p-4 rounded-sm flex items-center gap-3 ${
              npc.isEnemy ? "bg-error-container/10 border-l-2 border-error" : "bg-surface-container-low border-l-2 border-secondary/30"
            }`}
          >
            <Icon name={npc.isEnemy ? "swords" : "person"} size={20} className={npc.isEnemy ? "text-error" : "text-secondary"} />
            <div className="flex-1">
              <span className="font-body font-semibold text-on-surface">{npc.name}</span>
              {npc.description && (
                <p className="font-body text-xs text-on-surface-variant">{npc.description}</p>
              )}
            </div>
            <span className={`font-label text-[10px] uppercase ${npc.isEnemy ? "text-error" : "text-secondary/60"}`}>
              {npc.isEnemy ? "Enemy" : "NPC"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
