"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { OptionGallery } from "@/components/builder/option-gallery";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface Background {
  id: string;
  name: string;
  imageUrl?: string | null;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number;
  equipment?: { items?: string[] };
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
        entityType: "character" as const,
        imageUrl: background.imageUrl ?? null,
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

  function renderBackgroundDetails(optionId: string) {
    const background = backgrounds.find((entry) => entry.id === optionId);
    if (!background) return null;

    return (
      <div className="space-y-5">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary/80">
            Origin details
          </p>
          <h4 className="mt-2 font-headline text-3xl text-on-surface">{background.name}</h4>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
            Background feature
          </p>
          <h5 className="mt-2 font-headline text-xl text-on-surface">{background.feature.name}</h5>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            {background.feature.description}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
              Proficiencies
            </p>
            <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
              <p>Skills: {background.skillProficiencies.join(", ")}</p>
              <p>
                Tools: {background.toolProficiencies.length > 0 ? background.toolProficiencies.join(", ") : "None"}
              </p>
              <p>Bonus languages: {background.languages}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
              Starting gear
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(background.equipment?.items ?? []).map((item) => (
                <span
                  key={`${background.id}-${item}`}
                  className="rounded-full border border-secondary/15 bg-secondary/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-headline text-3xl text-on-background mb-1">Choose a Background</h2>
        <p className="text-sm text-on-surface-variant">What did your character do before becoming an adventurer?</p>
      </div>

      {loading ? (
        <p className="text-on-surface-variant animate-pulse">Loading backgrounds...</p>
      ) : (
        <div className="mb-8">
          <OptionGallery
            options={backgroundOptions}
            selectedId={state.backgroundId}
            detailRenderer={(option) => renderBackgroundDetails(option.id)}
            confirmLabel="Choose background"
            onSelect={(option) => {
              const background = backgrounds.find((entry) => entry.id === option.id);
              if (background) {
                update({ backgroundId: background.id, backgroundName: background.name });
              }
            }}
            featuredIds={featuredBackgroundIds}
            featuredLabel="Popular"
            allLabel="All backgrounds"
            searchPlaceholder="Search backgrounds..."
          />
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep}>
          <Icon name="arrow_back" size={16} /> Back
        </Button>
        <Button onClick={nextStep} disabled={!state.backgroundId}>
          Continue <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
