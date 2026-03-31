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

export function InventoryPanel({ items, currency, onUpdateCurrency }: Props) {
  const totalWeight = items.reduce((sum, i) => sum + (i.weight ?? 0) * i.quantity, 0);
  const equippedItems = items.filter((i) => i.isEquipped);
  const attunedCount = items.filter((i) => i.isAttuned).length;

  return (
    <div className="space-y-6">
      {/* Currency */}
      <div className="bg-surface-container-low p-6 rounded-sm">
        <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-4">
          Currency
        </span>
        <div className="grid grid-cols-5 gap-2">
          {(["cp", "sp", "ep", "gp", "pp"] as const).map((coin) => (
            <div key={coin} className="text-center">
              <input
                type="number"
                min="0"
                value={currency[coin]}
                onChange={(e) =>
                  onUpdateCurrency({ ...currency, [coin]: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="w-full bg-surface-container-highest rounded-sm px-2 py-2 text-center font-headline text-lg text-on-surface border-0 outline-none focus:ring-1 focus:ring-secondary/40"
              />
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 mt-1 block">
                {coin}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="flex gap-4">
        <div className="flex-1 bg-surface-container-low p-4 rounded-sm text-center">
          <div className="font-headline text-xl text-on-surface">{totalWeight.toFixed(1)}</div>
          <div className="font-label text-[10px] uppercase text-on-surface/40">lbs carried</div>
        </div>
        <div className="flex-1 bg-surface-container-low p-4 rounded-sm text-center">
          <div className="font-headline text-xl text-on-surface">{attunedCount}/3</div>
          <div className="font-label text-[10px] uppercase text-on-surface/40">attuned</div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-surface-container-low p-6 rounded-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">
            Items ({items.length})
          </span>
        </div>
        {items.length === 0 ? (
          <p className="text-center text-on-surface/30 font-body text-sm py-4">
            No items yet
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-surface-container rounded-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm text-on-surface">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="font-label text-[10px] text-on-surface/40">×{item.quantity}</span>
                    )}
                    {item.isEquipped && (
                      <span className="px-1.5 py-0.5 rounded-xl bg-primary-container/20 text-[8px] text-primary uppercase font-bold">
                        Equipped
                      </span>
                    )}
                    {item.isAttuned && (
                      <span className="px-1.5 py-0.5 rounded-xl bg-secondary-container/20 text-[8px] text-secondary uppercase font-bold">
                        Attuned
                      </span>
                    )}
                  </div>
                  {item.weight && (
                    <span className="font-label text-[10px] text-on-surface/30">
                      {item.weight * item.quantity} lbs
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
