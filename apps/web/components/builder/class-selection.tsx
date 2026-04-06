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
      <div className="mb-8">
        <h2 className="font-headline text-3xl text-on-background mb-1">Choose a Class</h2>
        <p className="text-sm text-on-surface-variant">Your class determines your combat style, abilities, and role in the party.</p>
      </div>

      {loading ? (
        <p className="text-on-surface-variant animate-pulse">Loading classes...</p>
      ) : (
        <div className="mb-8">
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
            featuredLabel="Popular"
            allLabel="All classes"
            searchPlaceholder="Search classes..."
          />
        </div>
      )}

      {/* Skill picker — shown after class is selected */}
      {selectedClass && (
        <section className="mb-8 space-y-3 animate-fade-in-up">
          <h3 className="font-headline text-xl text-on-background">
            Choose {selectedClass.numSkillChoices} skills
            <span className="ml-2 text-sm font-normal text-on-surface-variant">
              ({state.skillProficiencies.length} / {selectedClass.numSkillChoices})
            </span>
          </h3>
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
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    isChosen
                      ? "border-secondary/30 bg-secondary/10 text-secondary font-bold"
                      : atLimit
                        ? "border-outline-variant/10 bg-surface-container text-on-surface/20 cursor-not-allowed"
                        : "border-outline-variant/10 bg-surface-container-high text-on-surface-variant hover:border-secondary/20"
                  }`}
                >
                  {isChosen && <Icon name="check" size={10} className="mr-1 inline" />}
                  {skill}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep}>
          <Icon name="arrow_back" size={16} />
          Back
        </Button>
        <Button onClick={nextStep} disabled={!state.classId || state.skillProficiencies.length < state.numSkillChoices}>
          Continue
          <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
