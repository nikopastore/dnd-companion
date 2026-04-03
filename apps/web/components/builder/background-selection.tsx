"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { OptionGallery } from "@/components/builder/option-gallery";
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

const FEATURED_BACKGROUNDS = ["Soldier", "Acolyte", "Criminal", "Sage", "Folk Hero", "Charlatan"];

export function BackgroundSelection({ builder }: Props) {
  const { state, update, nextStep, prevStep } = builder;
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = backgrounds.find((b) => b.id === state.backgroundId);
  const featuredBackgroundIds = useMemo(
    () =>
      backgrounds
        .filter((background) => FEATURED_BACKGROUNDS.includes(background.name))
        .map((background) => background.id),
    [backgrounds]
  );

  const backgroundOptions = useMemo(
    () =>
      backgrounds.map((background) => ({
        id: background.id,
        title: background.name,
        subtitle:
          background.languages > 0
            ? `${background.languages} bonus language${background.languages > 1 ? "s" : ""}`
            : "No bonus languages",
        description: background.feature.description,
        entityType: "quest" as const,
        imageUrl: null,
        meta: [
          ...background.skillProficiencies,
          ...(background.toolProficiencies.length > 0
            ? background.toolProficiencies
            : ["No tool proficiencies"]),
        ],
        searchText: `${background.feature.name} ${background.feature.description} ${background.skillProficiencies.join(" ")} ${background.toolProficiencies.join(" ")}`,
      })),
    [backgrounds]
  );

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
        <div className="mb-12">
          <OptionGallery
            options={backgroundOptions}
            selectedId={state.backgroundId}
            onSelect={(option) => {
              const background = backgrounds.find((entry) => entry.id === option.id);
              if (background) {
                update({ backgroundId: background.id, backgroundName: background.name });
              }
            }}
            featuredIds={featuredBackgroundIds}
            featuredLabel="Popular origins"
            allLabel="Every background"
            searchPlaceholder="Search backgrounds, features, or proficiencies"
          />
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
