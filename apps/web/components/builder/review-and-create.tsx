"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { AttributeOrb } from "@/components/ui/attribute-orb";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";
import { ImageUpload } from "@/components/ui/image-upload";
import { ABILITIES, getAbilityModifier } from "@dnd-companion/shared";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

export function ReviewAndCreate({ builder }: Props) {
  const { state, update, prevStep } = builder;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backstory, setBackstory] = useState("");
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);

  async function handleCreate() {
    if (!state.name.trim()) {
      setError("Your character needs a name");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name.trim(),
        raceId: state.raceId,
        subraceId: state.subraceId,
        classId: state.classId,
        backgroundId: state.backgroundId,
        abilityScores: state.abilityScores,
        campaignId: state.campaignId,
        imageUrl: portraitUrl,
        backstory,
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
            <div className="flex items-start gap-6">
              <ImageUpload
                currentImage={portraitUrl}
                onUpload={(url) => setPortraitUrl(url)}
                size="sm"
                label="Portrait"
              />
              <div className="flex-1 space-y-3">
                <Input
                  id="name"
                  label="Character Name"
                  placeholder="What shall they be called?"
                  value={state.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="font-headline text-2xl"
                />
                <AIAssistButton
                  label="Generate Backstory"
                  systemPrompt={AI_PROMPTS.backstoryGenerator}
                  userPrompt={`Write a backstory for a character named "${state.name || "this character"}".`}
                  context={`Race: ${state.raceName || "Unknown"}\nClass: ${state.className || "Unknown"}\nBackground: ${state.backgroundName || "Unknown"}`}
                  onApply={(text) => setBackstory(text)}
                  size="sm"
                />
              </div>
            </div>

            {backstory && (
              <div className="bg-surface-container p-4 rounded-sm border-l-2 border-secondary/40 animate-fade-in">
                <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold block mb-2">
                  Backstory
                </span>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {backstory}
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
        </div>

        {/* Right: Ability Scores */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
            Ability Scores
          </span>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 stagger-children">
            {ABILITIES.map((ability) => {
              const score = state.abilityScores[ability.key];
              return (
                <div key={ability.key} className="animate-fade-in-up">
                  <AttributeOrb
                    abbreviation={ability.abbreviation}
                    score={score}
                    isPrimary={score >= 14}
                  />
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
                  {getAbilityModifier(state.abilityScores.dexterity) >= 0 ? "+" : ""}
                  {getAbilityModifier(state.abilityScores.dexterity)}
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
