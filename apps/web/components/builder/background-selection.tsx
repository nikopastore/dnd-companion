"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface Background {
  id: string;
  name: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number;
  feature: { name: string; description: string };
}

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

export function BackgroundSelection({ builder }: Props) {
  const { state, update, nextStep, prevStep } = builder;
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = backgrounds.find((b) => b.id === state.backgroundId);

  useEffect(() => {
    fetch("/api/srd/backgrounds")
      .then((res) => res.json())
      .then((data) => { setBackgrounds(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-12 text-center md:text-left">
        <h2 className="font-headline text-4xl md:text-5xl text-primary mb-2 tracking-tight animate-fade-in-up">
          Life Before Adventure
        </h2>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl italic animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          What shaped your character before they took up the adventurer's life?
        </p>
      </div>

      {loading ? (
        <p className="text-on-surface-variant animate-pulse">Loading backgrounds...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 stagger-children">
          {backgrounds.map((bg) => {
            const isSelected = state.backgroundId === bg.id;
            return (
              <button
                key={bg.id}
                onClick={() => update({ backgroundId: bg.id, backgroundName: bg.name })}
                className={`p-6 rounded-sm text-left transition-all duration-500 interactive-glow animate-fade-in-up group ${
                  isSelected
                    ? "bg-surface-container border border-secondary/60 shadow-elevated"
                    : "bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high hover:border-secondary/40"
                }`}
              >
                <h3 className={`font-headline text-xl mb-2 transition-colors duration-500 ${isSelected ? "text-secondary" : "text-on-surface group-hover:text-secondary/80"}`}>
                  {bg.name}
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {bg.skillProficiencies.map((skill) => (
                    <span key={skill} className={`px-2 py-0.5 rounded-xl text-[9px] font-label uppercase transition-all duration-500 ${
                      isSelected
                        ? "bg-secondary-container/20 text-secondary border border-secondary/20"
                        : "bg-surface-container-highest text-on-surface-variant border border-transparent"
                    }`}>
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="font-body text-xs text-on-surface-variant">
                  {bg.feature.name}
                </p>
                {isSelected && <div className="mt-3 h-0.5 bg-secondary/40 rounded-full" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Background Detail */}
      {selected && (
        <section className="bg-surface-container-low p-8 rounded-sm mb-12 border-l-2 border-secondary lore-margins animate-fade-in shadow-whisper">
          <h3 className="font-headline text-2xl text-secondary mb-4">{selected.feature.name}</h3>
          <div className="decorative-line w-full mb-4" />
          <p className="font-body text-on-surface-variant leading-relaxed animate-fade-in" style={{ animationDelay: "100ms" }}>
            {selected.feature.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 font-label text-xs uppercase tracking-widest text-on-surface/60">
            {selected.toolProficiencies.length > 0 && (
              <span className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>Tools: {selected.toolProficiencies.join(", ")}</span>
            )}
            {selected.languages > 0 && (
              <span className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>+{selected.languages} language{selected.languages > 1 ? "s" : ""}</span>
            )}
          </div>
        </section>
      )}

      <div className="flex justify-between mt-12">
        <Button variant="ghost" onClick={prevStep}>
          <Icon name="arrow_back" size={16} /> Back
        </Button>
        <Button onClick={nextStep} disabled={!state.backgroundId}>
          Continue to Abilities <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
