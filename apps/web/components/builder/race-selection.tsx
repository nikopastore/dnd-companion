"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EntityImage } from "@/components/ui/entity-image";
import { OptionGallery } from "@/components/builder/option-gallery";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface Race {
  id: string;
  name: string;
  speed: number;
  size: string;
  imageUrl?: string | null;
  abilityBonuses: Record<string, number>;
  traits: Array<{ name: string; description: string }>;
  languages: string[];
  subraces: Array<{ id: string; name: string; abilityBonuses: Record<string, number>; traits: Array<{ name: string; description: string }> }>;
}

const FEATURED_RACES = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Tiefling"];

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

export function RaceSelection({ builder }: Props) {
  const { state, update, nextStep } = builder;
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedRace = races.find((r) => r.id === state.raceId);
  const featuredRaceIds = useMemo(
    () =>
      races
        .filter((race) => FEATURED_RACES.includes(race.name))
        .map((race) => race.id),
    [races]
  );

  const raceOptions = useMemo(
    () =>
      races.map((race) => ({
        id: race.id,
        title: race.name,
        subtitle: `${race.size} form · ${race.speed} ft speed`,
        description:
          race.traits[0]?.description ??
          `Languages: ${race.languages.join(", ")}`,
        entityType: "race" as const,
        imageUrl: race.imageUrl ?? null,
        meta: [
          ...Object.entries(race.abilityBonuses).map(
            ([ability, bonus]) => `+${bonus} ${ability.slice(0, 3)}`
          ),
          race.subraces.length > 0 ? `${race.subraces.length} subraces` : "Single lineage",
        ],
        searchText: `${race.languages.join(" ")} ${(race.traits ?? [])
          .map((trait) => `${trait.name} ${trait.description}`)
          .join(" ")}`,
      })),
    [races]
  );

  useEffect(() => {
    fetch("/api/srd/races")
      .then((res) => res.json())
      .then((data) => { setRaces(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function selectRace(race: Race) {
    const hasSubraces = race.subraces.length > 0;
    update({
      raceId: race.id,
      raceName: race.name,
      subraceId: null,
      subraceRequired: hasSubraces,
      racialBonuses: race.abilityBonuses,
    });
  }

  function renderRaceDetails(optionId: string) {
    const race = races.find((entry) => entry.id === optionId);
    if (!race) return null;

    return (
      <div className="space-y-5">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary/80">
            Lineage details
          </p>
          <h4 className="mt-2 font-headline text-3xl text-on-surface">{race.name}</h4>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
              Core stats
            </p>
            <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
              <p>Size: {race.size}</p>
              <p>Speed: {race.speed} ft</p>
              <p>Languages: {race.languages.join(", ")}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
              Ability bonuses
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(race.abilityBonuses).map(([ability, bonus]) => (
                <span
                  key={ability}
                  className="rounded-full border border-secondary/15 bg-secondary/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary"
                >
                  +{bonus} {ability}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
            Unique racial traits
          </p>
          <div className="space-y-3">
            {race.traits.map((trait) => (
              <div
                key={trait.name}
                className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4"
              >
                <h5 className="font-headline text-lg text-on-surface">{trait.name}</h5>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {trait.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {race.subraces.length > 0 && (
          <div className="space-y-3">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
              Subrace paths
            </p>
            <div className="grid gap-3">
              {race.subraces.map((subrace) => (
                <div
                  key={subrace.id}
                  className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-headline text-lg text-on-surface">{subrace.name}</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(subrace.abilityBonuses).map(([ability, bonus]) => (
                        <span
                          key={`${subrace.id}-${ability}`}
                          className="rounded-full bg-secondary/10 px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary"
                        >
                          +{bonus} {ability}
                        </span>
                      ))}
                    </div>
                  </div>
                  {subrace.traits.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {subrace.traits.map((trait) => (
                        <div key={`${subrace.id}-${trait.name}`}>
                          <p className="text-sm font-medium text-on-surface">{trait.name}</p>
                          <p className="text-sm text-on-surface-variant">{trait.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-12 text-center md:text-left">
        <h2 className="font-headline text-4xl md:text-5xl text-primary mb-2 tracking-tight animate-fade-in-up">
          Origin & Heritage
        </h2>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl italic animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          Select the foundational bloodline that defines your physical form and innate magical affinity.
        </p>
      </div>

      <section className="mb-12">
        {loading ? (
          <p className="text-on-surface-variant animate-pulse">Loading races...</p>
        ) : (
          <OptionGallery
            options={raceOptions}
            selectedId={state.raceId}
            detailRenderer={(option) => renderRaceDetails(option.id)}
            confirmLabel="Select lineage"
            onSelect={(option) => {
              const race = races.find((entry) => entry.id === option.id);
              if (race) selectRace(race);
            }}
            featuredIds={featuredRaceIds}
            featuredLabel="Popular lineages"
            allLabel="Every ancestry"
            searchPlaceholder="Search races, languages, or traits"
          />
        )}
      </section>

      {/* Selected Race Details */}
      {selectedRace && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-surface-container-low rounded-sm relative border-l-2 border-primary animate-slide-in-left shadow-whisper">
              <div className="flex items-center gap-4 mb-3">
                <EntityImage entityType="race" name={selectedRace.name} size="md" />
                <h3 className="font-headline text-2xl text-on-surface">{selectedRace.name}</h3>
              </div>
              <div className="space-y-1 font-body text-sm text-on-surface-variant">
                <p>Size: {selectedRace.size}</p>
                <p>Speed: {selectedRace.speed} ft</p>
                <p>Languages: {selectedRace.languages.join(", ")}</p>
              </div>
            </div>

            {/* Subraces */}
            {selectedRace.subraces.length > 0 && (
              <div className="space-y-3 animate-fade-in" style={{ animationDelay: "150ms" }}>
                <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
                  Subraces
                </span>
                {selectedRace.subraces.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      const combinedBonuses = { ...selectedRace.abilityBonuses, ...sub.abilityBonuses };
                      update({ subraceId: sub.id, racialBonuses: combinedBonuses });
                    }}
                    className={`w-full p-4 rounded-sm text-left transition-all duration-500 interactive-glow ${
                      state.subraceId === sub.id
                        ? "bg-surface-container border border-secondary/40 shadow-whisper"
                        : "bg-surface-container-low border border-outline-variant/10 hover:border-secondary/20"
                    }`}
                  >
                    <span className="font-headline text-lg text-on-surface">{sub.name}</span>
                    <div className="flex gap-2 mt-2">
                      {Object.entries(sub.abilityBonuses).map(([ability, bonus]) => (
                        <span key={ability} className="text-xs font-label text-secondary uppercase">
                          +{bonus} {ability.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-8">
            {/* Ability Bonuses */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger-children">
              {Object.entries(selectedRace.abilityBonuses).map(([ability, bonus]) => (
                <div
                  key={ability}
                  className="bg-surface-container-high p-4 rounded-sm border border-outline-variant/8 text-center relative overflow-hidden interactive-lift animate-fade-in-up"
                >
                  <div className="decorative-orb w-16 h-16 bg-secondary -right-2 -top-2" />
                  <div className="relative z-10">
                    <div className="text-secondary font-headline text-2xl mb-1">+{bonus as number}</div>
                    <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                      {ability}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Traits */}
            <div className="space-y-4">
              <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
                Racial Traits
              </span>
              <div className="stagger-children space-y-4">
                {(selectedRace.traits as Array<{ name: string; description: string }>).map((trait, i) => (
                  <div key={i} className="bg-surface-container-low p-4 rounded-sm border-l-2 border-primary/20 animate-fade-in-up interactive-lift shadow-whisper">
                    <h4 className="font-headline text-lg text-primary mb-1">{trait.name}</h4>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                      {trait.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      <div className="flex justify-end mt-12">
        <Button onClick={nextStep} disabled={!state.raceId || (state.subraceRequired && !state.subraceId)}>
          Continue to Class
          <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
