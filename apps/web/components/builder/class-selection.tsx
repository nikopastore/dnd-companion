"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EntityImage } from "@/components/ui/entity-image";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface CharClass {
  id: string;
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  skillChoices: string[];
  numSkillChoices: number;
  proficiencies: { armor: string; weapons: string; tools: string };
}

const CLASS_ICONS: Record<string, string> = {
  Barbarian: "bolt", Bard: "music_note", Cleric: "church", Druid: "eco",
  Fighter: "swords", Monk: "self_improvement", Paladin: "shield",
  Ranger: "target", Rogue: "visibility", Sorcerer: "magic_button",
  Warlock: "nights_stay", Wizard: "auto_stories",
};

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

export function ClassSelection({ builder }: Props) {
  const { state, update, nextStep, prevStep } = builder;
  const [classes, setClasses] = useState<CharClass[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedClass = classes.find((c) => c.id === state.classId);

  useEffect(() => {
    fetch("/api/srd/classes")
      .then((res) => res.json())
      .then((data) => { setClasses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-12 text-center md:text-left">
        <h2 className="font-headline text-4xl md:text-5xl text-primary mb-2 tracking-tight animate-fade-in-up">
          Path & Calling
        </h2>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl italic animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          Choose the discipline that will shape your combat style, abilities, and role within the party.
        </p>
      </div>

      {loading ? (
        <p className="text-on-surface-variant animate-pulse">Loading classes...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12 stagger-children">
          {classes.map((cls) => {
            const isSelected = state.classId === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => update({ classId: cls.id, className: cls.name })}
                className={`p-6 rounded-sm text-center transition-all duration-500 interactive-glow animate-fade-in-up group ${
                  isSelected
                    ? "bg-surface-container border border-secondary/60 relative overflow-hidden animate-border-glow shadow-elevated"
                    : "bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high hover:border-secondary/40"
                }`}
              >
                {isSelected && <div className="absolute inset-0 bg-primary-container/5 pointer-events-none" />}
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isSelected
                    ? "bg-primary-container/20 scale-110 border border-secondary/30 glow-gold"
                    : "bg-surface-container-highest group-hover:scale-110 group-hover:bg-surface-container-high"
                }`}>
                  <Icon
                    name={CLASS_ICONS[cls.name] || "person"}
                    size={28}
                    filled={isSelected}
                    className={`transition-colors duration-500 ${isSelected ? "text-secondary" : "text-on-surface-variant group-hover:text-secondary"}`}
                  />
                </div>
                <span className={`font-headline text-lg block transition-colors duration-500 ${isSelected ? "text-secondary" : "text-on-surface"}`}>
                  {cls.name}
                </span>
                <span className="font-label text-[10px] uppercase tracking-tighter text-on-surface-variant">
                  d{cls.hitDie} Hit Die
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Class Details */}
      {selectedClass && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-scale-in">
          <div className="space-y-4">
            <div className="bg-surface-container-low p-6 rounded-sm space-y-3 border border-outline-variant/8 shadow-whisper">
              <div className="flex items-center gap-4">
                <EntityImage entityType="class" name={selectedClass.name} size="md" />
                <h3 className="font-headline text-2xl text-on-surface">{selectedClass.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-high p-3 rounded-sm text-center relative overflow-hidden glow-gold border border-outline-variant/8">
                  <div className="decorative-orb w-12 h-12 bg-secondary -right-1 -top-1" />
                  <div className="relative z-10">
                    <div className="text-secondary font-headline text-xl">d{selectedClass.hitDie}</div>
                    <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Hit Die</div>
                  </div>
                </div>
                <div className="bg-surface-container-high p-3 rounded-sm text-center relative overflow-hidden glow-gold border border-outline-variant/8">
                  <div className="decorative-orb w-12 h-12 bg-secondary -left-1 -top-1" />
                  <div className="relative z-10">
                    <div className="text-secondary font-headline text-xl capitalize">{selectedClass.primaryAbility.slice(0, 3)}</div>
                    <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Primary</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-sm space-y-2 border border-outline-variant/8 shadow-whisper animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <h4 className="font-label text-xs uppercase tracking-widest text-secondary font-bold">Saving Throws</h4>
              <div className="flex flex-wrap gap-2">
                {selectedClass.savingThrows.map((st) => (
                  <span key={st} className="px-3 py-1.5 rounded-xl bg-secondary-container/20 text-secondary font-label text-[10px] uppercase font-bold border border-secondary/20 shadow-whisper">
                    {st}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-low p-6 rounded-sm space-y-2 border border-outline-variant/8 shadow-whisper animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              <h4 className="font-label text-xs uppercase tracking-widest text-secondary font-bold">Proficiencies</h4>
              <div className="space-y-2 font-body text-sm text-on-surface-variant">
                <p><span className="text-on-surface font-medium">Armor:</span> {selectedClass.proficiencies.armor}</p>
                <p><span className="text-on-surface font-medium">Weapons:</span> {selectedClass.proficiencies.weapons}</p>
                <p><span className="text-on-surface font-medium">Tools:</span> {selectedClass.proficiencies.tools}</p>
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-sm space-y-2 border border-outline-variant/8 shadow-whisper animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <h4 className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
                Choose {selectedClass.numSkillChoices} Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedClass.skillChoices.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface font-label text-[10px] uppercase border border-outline-variant/10 interactive-lift">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-12">
        <Button variant="ghost" onClick={prevStep}>
          <Icon name="arrow_back" size={16} />
          Back
        </Button>
        <Button onClick={nextStep} disabled={!state.classId}>
          Continue to Background
          <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
