"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

interface SessionItem {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  isHidden: boolean;
  claimedById: string | null;
}

interface Props {
  items: SessionItem[];
  campaignId: string;
  onAdd: (item: SessionItem) => void;
}

export function SessionItemTracker({ items, campaignId, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/session-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, name: name.trim(), description: description.trim() || null, location: location.trim() || null }),
    });
    setLoading(false);
    if (res.ok) {
      const item = await res.json();
      onAdd(item);
      setName("");
      setDescription("");
      setLocation("");
      setShowForm(false);
    }
  }

  const hidden = items.filter((i) => i.isHidden);
  const revealed = items.filter((i) => !i.isHidden);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="font-headline text-secondary uppercase tracking-widest text-xs">
          Session Items ({items.length})
        </span>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
          <Icon name={showForm ? "close" : "add"} size={14} />
          {showForm ? "Cancel" : "Add"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-surface-container p-4 rounded-sm space-y-3">
          <Input id="item-name" label="Item Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sword of Flame..." />
          <Input id="item-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A magical weapon..." />
          <Input id="item-loc" label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Hidden in chest..." />
          <Button size="sm" onClick={handleAdd} disabled={loading || !name.trim()}>
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </div>
      )}

      {hidden.length > 0 && (
        <div className="space-y-2">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40">Hidden</span>
          {hidden.map((item) => (
            <div key={item.id} className="p-3 bg-surface-container-low rounded-sm flex items-center gap-3 border-l-2 border-outline-variant/30">
              <Icon name="visibility_off" size={16} className="text-on-surface/30" />
              <div className="flex-1">
                <span className="font-body text-sm text-on-surface">{item.name}</span>
                {item.location && <span className="font-label text-[10px] text-on-surface/30 ml-2">@ {item.location}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {revealed.length > 0 && (
        <div className="space-y-2">
          <span className="font-label text-[10px] uppercase tracking-widest text-secondary/60">Revealed</span>
          {revealed.map((item) => (
            <div key={item.id} className="p-3 bg-surface-container-low rounded-sm flex items-center gap-3 border-l-2 border-secondary/30">
              <Icon name="visibility" size={16} className="text-secondary" />
              <div className="flex-1">
                <span className="font-body text-sm text-on-surface">{item.name}</span>
                {item.claimedById && <span className="font-label text-[10px] text-secondary ml-2">Claimed</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
