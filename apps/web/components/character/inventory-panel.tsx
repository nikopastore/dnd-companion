"use client";

import { Icon } from "@/components/ui/icon";

interface Item {
  id: string;
  name: string;
  quantity: number;
  weight: number | null;
  isEquipped: boolean;
  isAttuned: boolean;
  notes: string | null;
}

interface Props {
  items: Item[];
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };
  onUpdateCurrency: (currency: { cp: number; sp: number; ep: number; gp: number; pp: number }) => void;
}

const COIN_STYLES: Record<string, { label: string; color: string; glow: string }> = {
  cp: { label: "Copper", color: "text-orange-400", glow: "focus:ring-orange-400/30 focus:border-orange-400/20" },
  sp: { label: "Silver", color: "text-gray-300", glow: "focus:ring-gray-400/30 focus:border-gray-400/20" },
  ep: { label: "Electrum", color: "text-blue-300", glow: "focus:ring-blue-400/30 focus:border-blue-400/20" },
  gp: { label: "Gold", color: "text-secondary", glow: "focus:ring-secondary/30 focus:border-secondary/20" },
  pp: { label: "Platinum", color: "text-cyan-200", glow: "focus:ring-cyan-300/30 focus:border-cyan-300/20" },
};

export function InventoryPanel({ items, currency, onUpdateCurrency }: Props) {
  const totalWeight = items.reduce((sum, i) => sum + (i.weight ?? 0) * i.quantity, 0);
  const equippedItems = items.filter((i) => i.isEquipped);
  const attunedCount = items.filter((i) => i.isAttuned).length;

  // Assume a default carry capacity (STR * 15); we show warning styling at 80%
  // Since we don't have STR here, we use a visual threshold at common values
  const isHeavy = totalWeight > 120; // Rough 80% of 150 (STR 10)

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
                className="flex items-center gap-3 p-3 bg-surface-container rounded-sm border border-transparent transition-all duration-300 interactive-glow hover:bg-surface-container-high group"
              >
                {/* Item icon area */}
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 ${
                  item.isAttuned
                    ? "bg-secondary-container/20 border border-secondary/20"
                    : item.isEquipped
                      ? "bg-primary-container/20 border border-primary/20"
                      : "bg-surface-container-highest"
                }`}>
                  <Icon
                    name={item.isEquipped ? "shield" : "inventory_2"}
                    size={16}
                    className={item.isAttuned ? "text-secondary/60" : item.isEquipped ? "text-primary/60" : "text-on-surface/20"}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-sm text-on-surface group-hover:text-on-background transition-colors truncate">
                      {item.name}
                    </span>
                    {item.quantity > 1 && (
                      <span className="font-label text-[10px] text-on-surface/40 bg-surface-container-highest px-1.5 py-0.5 rounded-sm">
                        x{item.quantity}
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
                    {item.notes && (
                      <span className="font-body text-[10px] text-on-surface/20 truncate">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
