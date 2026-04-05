"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EntityImage } from "@/components/ui/entity-image";
import { OptionGallery } from "@/components/builder/option-gallery";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface CharClass {
  id: string;
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  skillChoices: string[];
  numSkillChoices: number;
  imageUrl?: string | null;
  proficiencies: { armor: string; weapons: string; tools: string };
  startingEquipment?: { description?: string };
}

const FEATURED_CLASSES = ["Fighter", "Wizard", "Rogue", "Cleric", "Barbarian", "Bard"];

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

export function ClassSelection({ builder }: Props) {
  const { state, update, nextStep, prevStep } = builder;
  const [classes, setClasses] = useState<CharClass[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedClass = classes.find((c) => c.id === state.classId);
  const featuredClassIds = useMemo(
    () =>
      classes
        .filter((cls) => FEATURED_CLASSES.includes(cls.name))
        .map((cls) => cls.id),
    [classes]
  );

  const classOptions = useMemo(
    () =>
      classes.map((cls) => ({
        id: cls.id,
        title: cls.name,
        subtitle: `Hit die d${cls.hitDie} · ${cls.primaryAbility} focus`,
        description: `Saving throws: ${cls.savingThrows.join(", ")}. Choose ${cls.numSkillChoices} skills from ${cls.skillChoices.join(", ")}.`,
        entityType: "class" as const,
        imageUrl: cls.imageUrl ?? null,
        meta: [
          `d${cls.hitDie} HP`,
          `${cls.numSkillChoices} skills`,
          ...cls.savingThrows.map((save) => `${save} save`),
        ],
        searchText: `${cls.primaryAbility} ${cls.proficiencies.armor} ${cls.proficiencies.weapons} ${cls.skillChoices.join(" ")}`,
      })),
    [classes]
  );

  useEffect(() => {
    fetch("/api/srd/classes")
      .then((res) => res.json())
      .then((data) => { setClasses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function renderClassDetails(optionId: string) {
    const selected = classes.find((entry) => entry.id === optionId);
    if (!selected) return null;

    return (
      <div className="space-y-5">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary/80">
            Class details
          </p>
          <h4 className="mt-2 font-headline text-3xl text-on-surface">{selected.name}</h4>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
              Core play pattern
            </p>
            <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
              <p>Primary ability: {selected.primaryAbility}</p>
              <p>Hit die: d{selected.hitDie}</p>
              <p>Saving throws: {selected.savingThrows.join(", ")}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
              Starting proficiencies
            </p>
            <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
              <p>Armor: {selected.proficiencies.armor}</p>
              <p>Weapons: {selected.proficiencies.weapons}</p>
              <p>Tools: {selected.proficiencies.tools}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
            Skill training
          </p>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            Choose {selected.numSkillChoices} from: {selected.skillChoices.join(", ")}.
          </p>
        </div>

        {selected.startingEquipment?.description && (
          <div className="rounded-2xl border border-outline-variant/10 bg-background/40 p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
              Starting equipment
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
              {selected.startingEquipment.description}
            </p>
          </div>
        )}
      </div>
    );
  }

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
        <div className="mb-12">
          <OptionGallery
            options={classOptions}
            selectedId={state.classId}
            detailRenderer={(option) => renderClassDetails(option.id)}
            confirmLabel="Choose class"
            onSelect={(option) => {
              const cls = classes.find((entry) => entry.id === option.id);
              if (cls) update({
                classId: cls.id,
                className: cls.name,
                skillProficiencies: [],
                availableSkills: cls.skillChoices,
                numSkillChoices: cls.numSkillChoices,
              });
            }}
            featuredIds={featuredClassIds}
            featuredLabel="Popular callings"
            allLabel="Every class"
            searchPlaceholder="Search classes, proficiencies, or skills"
          />
        </div>
      )}

      {/* Selected Class Details */}
      {selectedClass && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-scale-in">
          <div className="space-y-4">
            <div className="bg-surface-container-low p-6 rounded-sm space-y-3 border border-outline-variant/8 shadow-whisper">
              <div className="flex items-center gap-4">
                <EntityImage entityType="class" name={selectedClass.name} imageUrl={selectedClass.imageUrl} size="md" />
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
                <span className="ml-2 font-body text-[10px] normal-case tracking-normal text-on-surface-variant/60">
                  ({state.skillProficiencies.length} / {selectedClass.numSkillChoices} selected)
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedClass.skillChoices.map((skill) => {
                  const isChosen = state.skillProficiencies.includes(skill);
                  const atLimit = state.skillProficiencies.length >= selectedClass.numSkillChoices;
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        if (isChosen) {
                          update({ skillProficiencies: state.skillProficiencies.filter((s) => s !== skill) });
                        } else if (!atLimit) {
                          update({ skillProficiencies: [...state.skillProficiencies, skill] });
                        }
                      }}
                      disabled={!isChosen && atLimit}
                      className={`px-3 py-1.5 rounded-xl font-label text-[10px] uppercase border transition-all duration-300 ${
                        isChosen
                          ? "bg-secondary text-on-secondary border-secondary/40 glow-gold shadow-whisper"
                          : atLimit
                            ? "bg-surface-container text-on-surface/20 border-outline-variant/10 cursor-not-allowed"
                            : "bg-surface-container-high text-on-surface border-outline-variant/10 interactive-lift hover:border-secondary/30 hover:text-secondary"
                      }`}
                    >
                      {isChosen && <Icon name="check" size={10} className="mr-1 inline" />}
                      {skill}
                    </button>
                  );
                })}
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
        <Button onClick={nextStep} disabled={!state.classId || state.skillProficiencies.length < state.numSkillChoices}>
          Continue to Background
          <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
