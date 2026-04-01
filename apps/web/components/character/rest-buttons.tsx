"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

interface Props {
  onShortRest: () => void;
  onLongRest: () => void;
}

export function RestButtons({ onShortRest, onLongRest }: Props) {
  const [shortRestFeedback, setShortRestFeedback] = useState(false);
  const [longRestFeedback, setLongRestFeedback] = useState(false);

  function handleShortRest() {
    onShortRest();
    setShortRestFeedback(true);
    setTimeout(() => setShortRestFeedback(false), 1200);
  }

  function handleLongRest() {
    onLongRest();
    setLongRestFeedback(true);
    setTimeout(() => setLongRestFeedback(false), 1200);
  }

  return (
    <div className="flex gap-4 animate-fade-in-up">
      {/* Short Rest */}
      <button
        onClick={handleShortRest}
        className={`flex-1 glass rounded-sm p-5 flex flex-col items-center justify-center gap-3 group transition-all duration-500 interactive-lift ${
          shortRestFeedback
            ? "shadow-[0_0_25px_rgba(180,140,100,0.3)] border-orange-400/30"
            : "hover:shadow-[0_0_20px_rgba(180,140,100,0.15)]"
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-surface-container-highest border border-outline-variant/20 transition-all duration-500 ${
          shortRestFeedback ? "animate-scale-in bg-orange-900/30 border-orange-400/30" : "group-hover:bg-orange-900/20 group-hover:border-orange-400/20"
        }`}>
          <Icon
            name="coffee"
            size={24}
            filled={shortRestFeedback}
            className={`transition-colors duration-300 ${
              shortRestFeedback ? "text-orange-400" : "text-on-surface/60 group-hover:text-orange-300"
            }`}
          />
        </div>
        <div className="text-center">
          <span className="font-label text-xs uppercase tracking-widest text-on-surface block">
            Short Rest
          </span>
          <span className="font-body text-[10px] text-on-surface/30 mt-0.5 block">
            {shortRestFeedback ? "Resting..." : "1 hour"}
          </span>
        </div>
        {shortRestFeedback && (
          <div className="flex items-center gap-1 animate-scale-in">
            <Icon name="check_circle" size={14} filled className="text-orange-400" />
            <span className="font-label text-[10px] text-orange-400 uppercase">Complete</span>
          </div>
        )}
      </button>

      {/* Long Rest */}
      <button
        onClick={handleLongRest}
        className={`flex-1 glass rounded-sm p-5 flex flex-col items-center justify-center gap-3 group transition-all duration-500 interactive-lift ${
          longRestFeedback
            ? "shadow-[0_0_25px_rgba(233,195,73,0.3)] border-secondary/30 glow-gold"
            : "hover:shadow-[0_0_20px_rgba(233,195,73,0.1)]"
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-surface-container-highest border border-outline-variant/20 transition-all duration-500 ${
          longRestFeedback ? "animate-scale-in bg-secondary-container/20 border-secondary/30" : "group-hover:bg-secondary-container/10 group-hover:border-secondary/20"
        }`}>
          <Icon
            name="bedtime"
            size={24}
            filled={longRestFeedback}
            className={`transition-colors duration-300 ${
              longRestFeedback ? "text-secondary" : "text-on-surface/60 group-hover:text-secondary/80"
            }`}
          />
        </div>
        <div className="text-center">
          <span className="font-label text-xs uppercase tracking-widest text-on-surface block">
            Long Rest
          </span>
          <span className="font-body text-[10px] text-on-surface/30 mt-0.5 block">
            {longRestFeedback ? "Resting..." : "8 hours"}
          </span>
        </div>
        {longRestFeedback && (
          <div className="flex items-center gap-1 animate-scale-in">
            <Icon name="check_circle" size={14} filled className="text-secondary" />
            <span className="font-label text-[10px] text-secondary uppercase">Fully Restored</span>
          </div>
        )}
      </button>
    </div>
  );
}
