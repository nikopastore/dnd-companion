"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AttributeOrb } from "@/components/ui/attribute-orb";
import { EntityImage } from "@/components/ui/entity-image";
import { ABILITIES, getAbilityModifier } from "@dnd-companion/shared";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

export function ReviewAndCreate({ builder }: Props) {
  const { state, prevStep } = builder;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!state.name.trim()) {
      setError("Your character needs a name");
      return;
    }
    setError("");
    setLoading(true);

    const finalScores = { ...state.abilityScores };
    for (const [ability, bonus] of Object.entries(state.racialBonuses)) {
      if (ability in finalScores) {
        (finalScores as Record<string, number>)[ability] += bonus;
      }
    }

    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name.trim(),
        raceId: state.raceId,
        subraceId: state.subraceId,
        classId: state.classId,
        backgroundId: state.backgroundId,
        abilityScores: finalScores,
        skillProficiencies: state.skillProficiencies,
        campaignId: state.campaignId,
        imageUrl: state.portraitUrl,
        backstory: state.backstory,
        personalityTraits: state.personalityTraits,
        ideals: state.ideals,
        bonds: state.bonds,
        flaws: state.flaws,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create character");
      return;
    }

    const character = await res.json();
    router.push(`/character/${character.id}`);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-12 text-center md:text-left">
        <h2 className="font-headline text-4xl md:text-5xl text-primary mb-2 tracking-tight animate-fade-in-up">
          Seal Your Fate
        </h2>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl italic animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          Review your choices and name your character to complete their creation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Name and Summary */}
        <div className="lg:col-span-5 space-y-6 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="bg-surface-container-low p-8 rounded-sm space-y-6 border border-outline-variant/8 shadow-whisper">
            <div className="flex items-start gap-5">
              <EntityImage
                imageUrl={state.portraitUrl}
                entityType="character"
                name={state.name || "Unnamed Hero"}
                size="lg"
              />
              <div className="flex-1 space-y-3">
                <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
                  Character profile
                </span>
                <h3 className="font-headline text-3xl text-on-surface">
                  {state.name || "Unnamed adventurer"}
                </h3>
                {state.campaignName && (
                  <p className="text-sm text-on-surface-variant">
                    Bound to {state.campaignName}
                  </p>
                )}
              </div>
            </div>

            {state.backstory && (
              <div className="bg-surface-container p-4 rounded-sm border-l-2 border-secondary/40 animate-fade-in">
                <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">
                  Backstory
                </span>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {state.backstory}
                </p>
              </div>
            )}

            <div className="space-y-3 stagger-children">
              <div className="flex justify-between items-center py-2 animate-fade-in-up">
                <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">Race</span>
                <span className="font-headline text-lg text-secondary">{state.raceName || "\u2014"}</span>
              </div>
              <div className="decorative-line w-full" />
              <div className="flex justify-between items-center py-2 animate-fade-in-up">
                <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">Class</span>
                <span className="font-headline text-lg text-secondary">{state.className || "\u2014"}</span>
              </div>
              <div className="decorative-line w-full" />
              <div className="flex justify-between items-center py-2 animate-fade-in-up">
                <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">Background</span>
                <span className="font-headline text-lg text-secondary">{state.backgroundName || "\u2014"}</span>
              </div>
              <div className="decorative-line w-full" />
              <div className="flex justify-between items-center py-2 animate-fade-in-up">
                <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">Level</span>
                <span className="font-headline text-lg text-on-surface">1</span>
              </div>
              <div className="decorative-line w-full" />
              <div className="flex justify-between items-center py-2 animate-fade-in-up">
                <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">HP</span>
                <span className="font-headline text-lg text-primary">
                  Calculated on save
                </span>
              </div>
            </div>
          </div>

          {state.skillProficiencies.length > 0 && (
            <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-4 shadow-whisper animate-fade-in-up">
              <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
                Skill Proficiencies
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.skillProficiencies.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-secondary/15 bg-secondary/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(state.personalityTraits || state.ideals || state.bonds || state.flaws) && (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Traits", state.personalityTraits],
                ["Ideals", state.ideals],
                ["Bonds", state.bonds],
                ["Flaws", state.flaws],
              ]
                .filter(([, value]) => Boolean(value.trim()))
                .map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-4 shadow-whisper"
                  >
                    <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
                      {label}
                    </span>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                      {value}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right: Ability Scores */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
            Ability Scores
          </span>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 stagger-children">
            {ABILITIES.map((ability) => {
              const baseScore = state.abilityScores[ability.key];
              const racialBonus = state.racialBonuses[ability.key] ?? 0;
              const totalScore = baseScore + racialBonus;
              return (
                <div key={ability.key} className="animate-fade-in-up">
                  <AttributeOrb
                    abbreviation={ability.abbreviation}
                    score={totalScore}
                    isPrimary={totalScore >= 14}
                  />
                  {racialBonus > 0 && (
                    <p className="mt-1 text-center font-label text-[9px] uppercase tracking-widest text-secondary/70">
                      {baseScore} + {racialBonus}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-surface-container-low p-6 rounded-sm space-y-3 border border-outline-variant/8 shadow-whisper animate-fade-in-up" style={{ animationDelay: "350ms" }}>
            <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
              Starting Stats (Level 1)
            </span>
            <div className="grid grid-cols-2 gap-4 font-body text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Proficiency Bonus</span>
                <span className="text-secondary font-bold">+2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Initiative</span>
                <span className="text-on-surface font-bold">
                  {getAbilityModifier(state.abilityScores.dexterity + (state.racialBonuses.dexterity ?? 0)) >= 0 ? "+" : ""}
                  {getAbilityModifier(state.abilityScores.dexterity + (state.racialBonuses.dexterity ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-error text-sm font-body mt-6 text-center animate-fade-in">{error}</p>
      )}

      <div className="flex justify-between mt-12">
        <Button variant="ghost" onClick={prevStep}>
          <Icon name="arrow_back" size={16} /> Back
        </Button>
        <Button onClick={handleCreate} disabled={loading || !state.name.trim()} className="glow-gold-strong">
          {loading ? "Creating..." : "Create Character"}
          <Icon name="auto_awesome" size={16} />
        </Button>
      </div>
    </div>
  );
}
