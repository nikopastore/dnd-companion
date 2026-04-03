"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EntityImage } from "@/components/ui/entity-image";
import { Icon } from "@/components/ui/icon";
import { normalizeItemHistory } from "@/lib/item-history";

interface Item {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  rarity?: string | null;
  value?: string | null;
  quantity: number;
  weight: number | null;
  isEquipped: boolean;
  isAttuned: boolean;
  notes: string | null;
  itemHistory: unknown;
}

interface Props {
  items: Item[];
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };
  onUpdateCurrency: (currency: { cp: number; sp: number; ep: number; gp: number; pp: number }) => void;
  onUpdateItem: (itemId: string, changes: Partial<Item>) => Promise<void>;
  partyMembers: Array<{ id: string; name: string; raceName?: string; className?: string }>;
  onTrade: (payload:
    | { kind: "item"; targetCharacterId: string; itemId: string; quantity: number }
    | { kind: "currency"; targetCharacterId: string; currencyType: "copperPieces" | "silverPieces" | "electrumPieces" | "goldPieces" | "platinumPieces"; amount: number }
  ) => Promise<void>;
}

const COIN_STYLES: Record<string, { label: string; color: string; glow: string }> = {
  cp: { label: "Copper", color: "text-orange-400", glow: "focus:ring-orange-400/30 focus:border-orange-400/20" },
  sp: { label: "Silver", color: "text-gray-300", glow: "focus:ring-gray-400/30 focus:border-gray-400/20" },
  ep: { label: "Electrum", color: "text-blue-300", glow: "focus:ring-blue-400/30 focus:border-blue-400/20" },
  gp: { label: "Gold", color: "text-secondary", glow: "focus:ring-secondary/30 focus:border-secondary/20" },
  pp: { label: "Platinum", color: "text-cyan-200", glow: "focus:ring-cyan-300/30 focus:border-cyan-300/20" },
};

export function InventoryPanel({ items, currency, onUpdateCurrency, onUpdateItem, partyMembers, onTrade }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<Item>>>({});
  const [shareTargetId, setShareTargetId] = useState<string>("");
  const [shareQuantities, setShareQuantities] = useState<Record<string, number>>({});
  const [coinTargetId, setCoinTargetId] = useState<string>("");
  const [coinType, setCoinType] = useState<"copperPieces" | "silverPieces" | "electrumPieces" | "goldPieces" | "platinumPieces">("goldPieces");
  const [coinAmount, setCoinAmount] = useState(1);
  const totalWeight = items.reduce((sum, i) => sum + (i.weight ?? 0) * i.quantity, 0);
  const equippedItems = items.filter((i) => i.isEquipped);
  const attunedCount = items.filter((i) => i.isAttuned).length;
  const editingDraft = editingId ? drafts[editingId] ?? {} : {};

  // Assume a default carry capacity (STR * 15); we show warning styling at 80%
  // Since we don't have STR here, we use a visual threshold at common values
  const isHeavy = totalWeight > 120; // Rough 80% of 150 (STR 10)

  const availableCategories = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort(),
    [items]
  );

  function startEditing(item: Item) {
    setEditingId(item.id);
    setDrafts((prev) => ({
      ...prev,
      [item.id]: {
        name: item.name,
        description: item.description,
        category: item.category,
        rarity: item.rarity,
        value: item.value,
        quantity: item.quantity,
        isEquipped: item.isEquipped,
        isAttuned: item.isAttuned,
        notes: item.notes,
      },
    }));
  }

  function updateDraft(itemId: string, changes: Partial<Item>) {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...changes,
      },
    }));
  }

  async function saveItem(itemId: string) {
    const changes = drafts[itemId];
    if (!changes) return;
    await onUpdateItem(itemId, changes);
    setEditingId(null);
  }

  async function shareItem(item: Item) {
    if (!shareTargetId) return;
    const quantity = Math.max(1, shareQuantities[item.id] || 1);
    await onTrade({
      kind: "item",
      targetCharacterId: shareTargetId,
      itemId: item.id,
      quantity,
    });
  }

  async function shareCurrency() {
    if (!coinTargetId) return;
    await onTrade({
      kind: "currency",
      targetCharacterId: coinTargetId,
      currencyType: coinType,
      amount: Math.max(1, coinAmount),
    });
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Currency */}
      <div className="bg-surface-container-low p-6 rounded-sm shadow-whisper relative overflow-hidden">
        <div className="decorative-orb w-40 h-40 -top-16 -right-16" style={{ background: "#e9c349" }} />
        <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-5 relative z-10">
          Currency
        </span>
        <div className="grid grid-cols-5 gap-3 relative z-10">
          {(["cp", "sp", "ep", "gp", "pp"] as const).map((coin) => {
            const style = COIN_STYLES[coin];
            return (
              <div key={coin} className="text-center group">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={currency[coin]}
                    onChange={(e) =>
                      onUpdateCurrency({ ...currency, [coin]: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className={`w-full bg-surface-container-highest rounded-sm px-2 py-2.5 text-center font-headline text-lg text-on-surface border border-outline-variant/10 outline-none transition-all ${style.glow} group-hover:border-outline-variant/20`}
                  />
                </div>
                <span className={`font-label text-[10px] uppercase tracking-widest mt-1.5 block transition-colors ${style.color}/60 group-hover:${style.color}`}>
                  {coin}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="flex gap-4">
        {/* Weight */}
        <div className={`flex-1 bg-surface-container-low p-4 rounded-sm text-center shadow-whisper border transition-all ${
          isHeavy ? "border-error/20 glow-danger" : "border-transparent"
        }`}>
          <div className="flex items-center justify-center gap-1.5">
            <Icon name="fitness_center" size={16} className={isHeavy ? "text-error/60" : "text-on-surface/30"} />
            <span className={`font-headline text-xl ${isHeavy ? "text-error" : "text-on-surface"}`}>
              {totalWeight.toFixed(1)}
            </span>
          </div>
          <div className="font-label text-[10px] uppercase text-on-surface/40 mt-1">lbs carried</div>
          {isHeavy && (
            <div className="font-label text-[9px] text-error/60 uppercase mt-1 animate-fade-in">
              Heavy load
            </div>
          )}
        </div>

        {/* Attunement Slots */}
        <div className="flex-1 bg-surface-container-low p-4 rounded-sm text-center shadow-whisper">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="auto_awesome" size={16} className="text-secondary/40" />
            <span className="font-headline text-xl text-on-surface">{attunedCount}/3</span>
          </div>
          <div className="font-label text-[10px] uppercase text-on-surface/40 mb-2">Attuned</div>
          {/* Visual attunement slots */}
          <div className="flex gap-2 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  i < attunedCount
                    ? "bg-secondary border-secondary shadow-[0_0_8px_rgba(233,195,73,0.4)]"
                    : "border-outline-variant/20 bg-surface-container-highest"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-surface-container-low p-6 rounded-sm shadow-whisper">
        <div className="flex justify-between items-center mb-5">
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">
            Items ({items.length})
          </span>
          {equippedItems.length > 0 && (
            <span className="font-label text-[9px] text-primary/50 uppercase tracking-wider">
              {equippedItems.length} equipped
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="inventory_2" size={32} className="text-on-surface/15 mx-auto mb-2" />
            <p className="text-on-surface/30 font-body text-sm">No items yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-sm border border-transparent bg-surface-container p-3 transition-all duration-300 interactive-glow hover:bg-surface-container-high group"
              >
                {(() => {
                  const history = normalizeItemHistory(item.itemHistory);
                  return (
                    <>
                <div className="flex items-start gap-3">
                  <EntityImage
                    imageUrl={item.imageUrl}
                    entityType="item"
                    name={item.name}
                    size="sm"
                    className={item.isAttuned ? "ring-1 ring-secondary/20" : item.isEquipped ? "ring-1 ring-primary/20" : ""}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body text-sm text-on-surface group-hover:text-on-background transition-colors truncate">
                        {item.name}
                      </span>
                      {item.quantity > 1 && (
                        <span className="font-label text-[10px] text-on-surface/40 bg-surface-container-highest px-1.5 py-0.5 rounded-sm">
                          x{item.quantity}
                        </span>
                      )}
                      {item.category && (
                        <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/70">
                          {item.category}
                        </span>
                      )}
                      {item.rarity && (
                        <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-label text-[9px] uppercase tracking-[0.14em] text-secondary">
                          {item.rarity}
                        </span>
                      )}
                      {item.isEquipped && (
                        <span className="px-2 py-0.5 rounded-xl bg-primary-container/20 text-[8px] text-primary uppercase font-bold tracking-wider border border-primary/15 glow-crimson">
                          Equipped
                        </span>
                      )}
                      {item.isAttuned && (
                        <span className="px-2 py-0.5 rounded-xl bg-secondary-container/20 text-[8px] text-secondary uppercase font-bold tracking-wider border border-secondary/15 glow-gold">
                          Attuned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.weight && (
                        <span className="font-label text-[10px] text-on-surface/30">
                          {(item.weight * item.quantity).toFixed(1)} lbs
                        </span>
                      )}
                      {item.value && (
                        <span className="font-label text-[10px] text-secondary/70">
                          {item.value}
                        </span>
                      )}
                      {item.notes && (
                        <span className="font-body text-[10px] text-on-surface/20 truncate">
                          {item.notes}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-1 text-xs leading-relaxed text-on-surface-variant/75">
                        {item.description}
                      </p>
                    )}
                    {history.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="font-label text-[9px] uppercase tracking-[0.16em] text-on-surface-variant/50">
                          Recent History
                        </p>
                        {history.slice(0, editingId === item.id ? 6 : 2).map((entry) => (
                          <div key={entry.id} className="text-xs text-on-surface-variant/70">
                            <span className="text-secondary/70">{entry.title}</span>
                            {entry.detail ? ` · ${entry.detail}` : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => (editingId === item.id ? setEditingId(null) : startEditing(item))}
                    >
                      <Icon name={editingId === item.id ? "close" : "edit"} size={14} />
                      {editingId === item.id ? "Close" : "Edit"}
                    </Button>
                  </div>
                </div>
                    </>
                  );
                })()}

                {partyMembers.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-outline-variant/10 pt-3">
                    <div className="min-w-[180px] flex-1">
                      <label className="mb-1.5 block font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
                        Share With
                      </label>
                      <select
                        value={shareTargetId}
                        onChange={(event) => setShareTargetId(event.target.value)}
                        className="w-full rounded-sm border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
                      >
                        <option value="">Select party member</option>
                        {partyMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="mb-1.5 block font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={shareQuantities[item.id] ?? 1}
                        onChange={(event) =>
                          setShareQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.max(1, Math.min(item.quantity, parseInt(event.target.value) || 1)),
                          }))
                        }
                        className="w-full rounded-sm border border-outline-variant/10 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
                      />
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={() => shareItem(item)} disabled={!shareTargetId}>
                      <Icon name="outbox" size={14} />
                      Trade
                    </Button>
                  </div>
                )}

                {editingId === item.id && (
                  <div className="mt-4 grid gap-4 rounded-sm border border-secondary/10 bg-surface-container-low p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        id={`item-name-${item.id}`}
                        label="Item Name"
                        value={String(editingDraft.name ?? "")}
                        onChange={(event) => updateDraft(item.id, { name: event.target.value })}
                      />
                      <Input
                        id={`item-quantity-${item.id}`}
                        label="Quantity"
                        type="number"
                        min={1}
                        value={Number(editingDraft.quantity ?? item.quantity)}
                        onChange={(event) =>
                          updateDraft(item.id, {
                            quantity: Math.max(1, Number(event.target.value) || 1),
                          })
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        id={`item-category-${item.id}`}
                        label="Category"
                        list={availableCategories.length > 0 ? `item-categories-${item.id}` : undefined}
                        value={String(editingDraft.category ?? "")}
                        onChange={(event) => updateDraft(item.id, { category: event.target.value })}
                      />
                      {availableCategories.length > 0 && (
                        <datalist id={`item-categories-${item.id}`}>
                          {availableCategories.map((category) => (
                            <option key={category} value={category ?? ""} />
                          ))}
                        </datalist>
                      )}
                      <Input
                        id={`item-rarity-${item.id}`}
                        label="Rarity"
                        value={String(editingDraft.rarity ?? "")}
                        onChange={(event) => updateDraft(item.id, { rarity: event.target.value })}
                      />
                    </div>

                    <Input
                      id={`item-value-${item.id}`}
                      label="Value"
                      value={String(editingDraft.value ?? "")}
                      onChange={(event) => updateDraft(item.id, { value: event.target.value })}
                    />

                    <Textarea
                      id={`item-description-${item.id}`}
                      label="Description"
                      rows={3}
                      value={String(editingDraft.description ?? "")}
                      onChange={(event) => updateDraft(item.id, { description: event.target.value })}
                    />

                    <Textarea
                      id={`item-notes-${item.id}`}
                      label="Notes"
                      rows={3}
                      value={String(editingDraft.notes ?? "")}
                      onChange={(event) => updateDraft(item.id, { notes: event.target.value })}
                    />

                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm text-on-surface">
                        <input
                          type="checkbox"
                          checked={Boolean(editingDraft.isEquipped)}
                          onChange={(event) => updateDraft(item.id, { isEquipped: event.target.checked })}
                        />
                        Equipped
                      </label>
                      <label className="flex items-center gap-2 text-sm text-on-surface">
                        <input
                          type="checkbox"
                          checked={Boolean(editingDraft.isAttuned)}
                          onChange={(event) => updateDraft(item.id, { isAttuned: event.target.checked })}
                        />
                        Attuned
                      </label>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={() => saveItem(item.id)}>
                        Save Item
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {partyMembers.length > 0 && (
        <div className="bg-surface-container-low p-6 rounded-sm shadow-whisper">
          <div className="mb-5 flex items-center gap-2">
            <Icon name="payments" size={18} className="text-secondary" />
            <span className="font-headline text-secondary uppercase tracking-widest text-xs">
              Share Currency
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
                Recipient
              </label>
              <select
                value={coinTargetId}
                onChange={(event) => setCoinTargetId(event.target.value)}
                className="w-full rounded-sm border border-outline-variant/10 bg-surface-container-high px-3 py-2.5 text-sm text-on-surface"
              >
                <option value="">Select party member</option>
                {partyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
                Coin
              </label>
              <select
                value={coinType}
                onChange={(event) => setCoinType(event.target.value as typeof coinType)}
                className="w-full rounded-sm border border-outline-variant/10 bg-surface-container-high px-3 py-2.5 text-sm text-on-surface"
              >
                <option value="copperPieces">CP</option>
                <option value="silverPieces">SP</option>
                <option value="electrumPieces">EP</option>
                <option value="goldPieces">GP</option>
                <option value="platinumPieces">PP</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60">
                Amount
              </label>
              <input
                type="number"
                min={1}
                value={coinAmount}
                onChange={(event) => setCoinAmount(Math.max(1, parseInt(event.target.value) || 1))}
                className="w-full rounded-sm border border-outline-variant/10 bg-surface-container-high px-3 py-2.5 text-sm text-on-surface"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" size="sm" onClick={shareCurrency} disabled={!coinTargetId}>
              <Icon name="send" size={14} />
              Transfer Currency
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
