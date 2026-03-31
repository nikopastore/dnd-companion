"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface Race {
  id: string;
  name: string;
  speed: number;
  size: string;
  abilityBonuses: Record<string, number>;
  traits: Array<{ name: string; description: string }>;
  languages: string[];
  subraces: Array<{ id: string; name: string; abilityBonuses: Record<string, number>; traits: Array<{ name: string; description: string }> }>;
}

const RACE_ICONS: Record<string, string> = {
  Human: "person", Elf: "forest", Dwarf: "mountain_flag", Halfling: "cruelty_free",
  Dragonborn: "egg", Gnome: "psychology", "Half-Elf": "diversity_3",
  "Half-Orc": "fitness_center", Tiefling: "auto_awesome",
};

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

export function RaceSelection({ builder }: Props) {
  const { state, update, nextStep } = builder;
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedRace = races.find((r) => r.id === state.raceId);

  useEffect(() => {
    fetch("/api/srd/races")
      .then((res) => res.json())
      .then((data) => { setRaces(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function selectRace(race: Race) {
    update({ raceId: race.id, raceName: race.name, subraceId: null });
  }

  return (
    <div>
      <div className="mb-12 text-center md:text-left">
        <h2 className="font-headline text-4xl md:text-5xl text-primary mb-2 tracking-tight">
          Origin & Heritage
        </h2>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl italic">
          Select the foundational bloodline that defines your physical form and innate magical affinity.
        </p>
      </div>

      {/* Race Carousel */}
      <section className="mb-12">
        <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold mb-4 block">
          Common Ancestries
        </span>
        {loading ? (
          <p className="text-on-surface-variant animate-pulse">Loading races...</p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x">
            {races.map((race) => {
              const isSelected = state.raceId === race.id;
              return (
                <button
                  key={race.id}
                  onClick={() => selectRace(race)}
                  className={`snap-start flex-none w-40 h-52 rounded-sm p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                    isSelected
                      ? "bg-surface-container border border-secondary/60 relative overflow-hidden"
                      : "bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high hover:border-secondary/40"
                  }`}
                >
                  {isSelected && <div className="absolute inset-0 bg-primary-container/5 pointer-events-none" />}
                  <div
                    className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center transition-transform ${
                      isSelected
                        ? "bg-primary-container/20 scale-110 border border-secondary/30"
                        : "bg-surface-container-highest group-hover:scale-110"
                    }`}
                  >
                    <Icon
                      name={RACE_ICONS[race.name] || "person"}
                      size={36}
                      filled={isSelected}
                      className={isSelected ? "text-secondary" : "text-on-surface-variant group-hover:text-secondary"}
                    />
                  </div>
                  <span className={`font-headline text-lg ${isSelected ? "text-secondary" : "text-on-surface"}`}>
                    {race.name}
                  </span>
                  <span className={`font-label text-[10px] uppercase tracking-tighter ${isSelected ? "text-secondary/70" : "text-on-surface-variant"}`}>
                    Speed {race.speed}ft
                  </span>
                  {isSelected && <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Race Details */}
      {selectedRace && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-surface-container-low rounded-sm relative border-l-2 border-primary">
              <h3 className="font-headline text-2xl text-on-surface mb-2">{selectedRace.name}</h3>
              <div className="space-y-1 font-body text-sm text-on-surface-variant">
                <p>Size: {selectedRace.size}</p>
                <p>Speed: {selectedRace.speed} ft</p>
                <p>Languages: {selectedRace.languages.join(", ")}</p>
              </div>
            </div>

            {/* Subraces */}
            {selectedRace.subraces.length > 0 && (
              <div className="space-y-3">
                <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
                  Subraces
                </span>
                {selectedRace.subraces.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => update({ subraceId: sub.id })}
                    className={`w-full p-4 rounded-sm text-left transition-all ${
                      state.subraceId === sub.id
                        ? "bg-surface-container border border-secondary/40"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(selectedRace.abilityBonuses).map(([ability, bonus]) => (
                <div
                  key={ability}
                  className="bg-surface-container-high p-4 rounded-sm border border-outline-variant/10 text-center relative overflow-hidden"
                >
                  <div className="absolute -right-2 -top-2 w-12 h-12 bg-secondary-container/20 rounded-full blur-xl" />
                  <div className="text-secondary font-headline text-2xl mb-1">+{bonus as number}</div>
                  <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    {ability}
                  </div>
                </div>
              ))}
            </div>

            {/* Traits */}
            <div className="space-y-4">
              <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
                Racial Traits
              </span>
              {(selectedRace.traits as Array<{ name: string; description: string }>).map((trait, i) => (
                <div key={i} className="bg-surface-container-low p-4 rounded-sm border-l border-primary/20">
                  <h4 className="font-headline text-lg text-primary mb-1">{trait.name}</h4>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    {trait.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      <div className="flex justify-end mt-12">
        <Button onClick={nextStep} disabled={!state.raceId}>
          Continue to Class
          <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
