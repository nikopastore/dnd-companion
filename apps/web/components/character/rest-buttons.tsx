"use client";

import { Icon } from "@/components/ui/icon";

interface Props {
  onShortRest: () => void;
  onLongRest: () => void;
}

export function RestButtons({ onShortRest, onLongRest }: Props) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onShortRest}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-high rounded-sm font-label text-xs uppercase tracking-widest text-on-surface hover:bg-surface-bright transition-colors active:scale-95"
      >
        <Icon name="coffee" size={16} />
        Short Rest
      </button>
      <button
        onClick={onLongRest}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary-container/20 rounded-sm font-label text-xs uppercase tracking-widest text-secondary hover:bg-secondary-container/40 transition-colors active:scale-95"
      >
        <Icon name="bedtime" size={16} />
        Long Rest
      </button>
    </div>
  );
}
