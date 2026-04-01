"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ABILITIES, getAbilityModifier, formatModifier, SKILLS } from "@dnd-companion/shared";
import type { ConditionKey } from "@dnd-companion/shared";
import { AttributeOrb } from "@/components/ui/attribute-orb";
import { Icon } from "@/components/ui/icon";
import { CombatStats } from "@/components/character/combat-stats";
import { ConditionManager } from "@/components/character/condition-manager";
import { RestButtons } from "@/components/character/rest-buttons";
import { DiceRoller } from "@/components/character/dice-roller";
import { InventoryPanel } from "@/components/character/inventory-panel";

interface CharacterData {
  id: string;
  name: string;
  level: number;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  saveProficiencies: string[];
  skillProficiencies: string[];
  skillExpertise: string[];
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  exhaustionLevel: number;
  hitDiceRemaining: number;
  hitDiceTotal: number;
  classResources: Record<string, unknown> | null;
  concentrationSpell: string | null;
  copperPieces: number;
  silverPieces: number;
  electrumPieces: number;
  goldPieces: number;
  platinumPieces: number;
  race: { name: string };
  class: { name: string; hitDie: number };
  background: { name: string };
  items: Array<{ id: string; name: string; quantity: number; weight: number | null; isEquipped: boolean; isAttuned: boolean; notes: string | null }>;
  conditions: Array<{ condition: ConditionKey }>;
}

const TAB_ICONS: Record<string, string> = {
  sheet: "description",
  inventory: "inventory_2",
  dice: "casino",
};

export default function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>();
  const [char, setChar] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sheet" | "inventory" | "dice">("sheet");

  useEffect(() => {
    fetch(`/api/characters/${id}`)
      .then((res) => res.json())
      .then((data) => { setChar(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const updateField = useCallback(async (field: string, value: unknown) => {
    if (!char) return;
    setChar((prev) => prev ? { ...prev, [field]: value } : prev);
    await fetch(`/api/characters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }, [char, id]);

  const toggleCondition = useCallback(async (condition: ConditionKey) => {
    if (!char) return;
    const current = char.conditions.map((c) => c.condition);
    // Optimistic update
    if (current.includes(condition)) {
      setChar((prev) => prev ? {
        ...prev,
        conditions: prev.conditions.filter((c) => c.condition !== condition),
      } : prev);
    } else {
      setChar((prev) => prev ? {
        ...prev,
        conditions: [...prev.conditions, { condition }],
      } : prev);
    }
    // TODO: API call to toggle condition
  }, [char]);

  const handleShortRest = useCallback(() => {
    if (!char) return;
    // Reset death saves
    updateField("deathSaveSuccesses", 0);
    updateField("deathSaveFailures", 0);
    // Class-specific resets would go here
  }, [char, updateField]);

  const handleLongRest = useCallback(() => {
    if (!char) return;
    updateField("currentHP", char.maxHP);
    updateField("tempHP", 0);
    updateField("deathSaveSuccesses", 0);
    updateField("deathSaveFailures", 0);
    updateField("hitDiceRemaining", char.hitDiceTotal);
    // Reset exhaustion by 1 level
    if (char.exhaustionLevel > 0) {
      updateField("exhaustionLevel", char.exhaustionLevel - 1);
    }
  }, [char, updateField]);

  if (loading) {
    return (
      <main className="pt-20 pb-28 px-4 max-w-5xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-surface-container-high rounded-sm" />
          <div className="h-4 w-32 bg-surface-container-high/60 rounded-sm" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="h-40 bg-surface-container-high/40 rounded-sm" />
            <div className="h-40 bg-surface-container-high/40 rounded-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="h-24 bg-surface-container-high/30 rounded-sm" />
            <div className="h-24 bg-surface-container-high/30 rounded-sm" />
            <div className="h-24 bg-surface-container-high/30 rounded-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (!char) {
    return (
      <main className="pt-20 pb-28 px-4 max-w-5xl mx-auto">
        <div className="text-center py-20">
          <Icon name="error" size={48} className="text-error/40 mx-auto mb-4" />
          <p className="text-error font-body">Character not found</p>
        </div>
      </main>
    );
  }

  const activeConditions = char.conditions.map((c) => c.condition);

  return (
    <main className="pt-20 pb-28 px-4 max-w-5xl mx-auto space-y-8">
      {/* Character Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-end gap-4">
          <div>
            <h1 className="font-headline text-4xl text-on-background tracking-tight">{char.name}</h1>
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mt-1">
              Level {char.level} {char.race.name} {char.class.name} · {char.background.name}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="px-3 py-1.5 bg-secondary-container/15 border border-secondary/20 rounded-sm">
              <span className="font-label text-[10px] text-secondary/70 uppercase tracking-wider">Prof</span>
              <span className="font-headline text-sm text-secondary ml-1.5">+{char.proficiencyBonus}</span>
            </div>
          </div>
        </div>
        <div className="decorative-line mt-4" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 animate-fade-in">
        {(["sheet", "inventory", "dice"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-2.5 rounded-sm font-label text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
              tab === t
                ? "bg-primary-container text-on-primary-container shadow-whisper"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
            }`}
          >
            <Icon name={TAB_ICONS[t]} size={16} filled={tab === t} />
            {t}
            {tab === t && (
              <span className="absolute -bottom-0.5 left-2 right-2 h-0.5 bg-primary rounded-full animate-scale-in" />
            )}
          </button>
        ))}
      </div>

      {tab === "sheet" && (
        <div className="space-y-8">
          {/* Combat Stats */}
          <CombatStats
            currentHP={char.currentHP}
            maxHP={char.maxHP}
            tempHP={char.tempHP}
            armorClass={char.armorClass}
            initiative={char.initiative}
            speed={char.speed}
            onUpdate={updateField}
          />

          {/* Ability Score Orbs */}
          <section className="animate-fade-in-up">
            <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-4">
              Abilities
            </span>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 stagger-children">
              {ABILITIES.map((ability) => {
                const score = char[ability.key as keyof typeof char] as number;
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
          </section>

          {/* Saving Throws */}
          <section className="bg-surface-container-low p-6 rounded-sm shadow-whisper animate-fade-in-up">
            <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-4">
              Saving Throws
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ABILITIES.map((ability) => {
                const score = char[ability.key as keyof typeof char] as number;
                const mod = getAbilityModifier(score);
                const isProficient = char.saveProficiencies.includes(ability.key);
                const bonus = mod + (isProficient ? char.proficiencyBonus : 0);
                return (
                  <div
                    key={ability.key}
                    className={`flex items-center gap-2 py-2 px-3 rounded-sm transition-all duration-300 ${
                      isProficient
                        ? "bg-primary-container/10 border border-primary/10"
                        : "hover:bg-surface-container"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      isProficient ? "bg-primary" : "bg-surface-container-highest"
                    }`} />
                    <span className="font-body text-sm text-on-surface flex-1">{ability.abbreviation}</span>
                    <span className={`font-headline text-sm ${isProficient ? "text-primary" : "text-on-surface/60"}`}>
                      {formatModifier(bonus)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Skills */}
          <section className="bg-surface-container-low p-6 rounded-sm shadow-whisper animate-fade-in-up">
            <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-4">
              Skills
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 stagger-children">
              {SKILLS.map((skill) => {
                const abilityScore = char[skill.ability as keyof typeof char] as number;
                const mod = getAbilityModifier(abilityScore);
                const isProficient = char.skillProficiencies.includes(skill.key);
                const isExpert = char.skillExpertise.includes(skill.key);
                const bonus = mod + (isProficient ? char.proficiencyBonus : 0) + (isExpert ? char.proficiencyBonus : 0);

                return (
                  <div
                    key={skill.key}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-sm transition-all duration-300 group ${
                      isExpert
                        ? "hover:bg-secondary-container/10"
                        : isProficient
                          ? "hover:bg-primary-container/10"
                          : "hover:bg-surface-container"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isExpert
                        ? "bg-secondary shadow-[0_0_6px_rgba(233,195,73,0.4)]"
                        : isProficient
                          ? "bg-primary"
                          : "bg-surface-container-highest group-hover:bg-surface-bright"
                    }`} />
                    <span className="font-body text-sm text-on-surface flex-1 group-hover:text-on-background transition-colors">
                      {skill.name}
                    </span>
                    <span className="font-label text-[10px] text-on-surface/30 uppercase tracking-wider">
                      {skill.ability.slice(0, 3)}
                    </span>
                    <span className={`font-headline text-sm w-8 text-right transition-colors ${
                      isExpert
                        ? "text-secondary"
                        : isProficient
                          ? "text-primary"
                          : "text-on-surface/60 group-hover:text-on-surface/80"
                    }`}>
                      {formatModifier(bonus)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Conditions & Death Saves */}
          <ConditionManager
            activeConditions={activeConditions}
            deathSaveSuccesses={char.deathSaveSuccesses}
            deathSaveFailures={char.deathSaveFailures}
            exhaustionLevel={char.exhaustionLevel}
            onToggleCondition={toggleCondition}
            onUpdate={updateField}
          />

          {/* Rest Buttons */}
          <RestButtons onShortRest={handleShortRest} onLongRest={handleLongRest} />
        </div>
      )}

      {tab === "inventory" && (
        <InventoryPanel
          items={char.items}
          currency={{
            cp: char.copperPieces,
            sp: char.silverPieces,
            ep: char.electrumPieces,
            gp: char.goldPieces,
            pp: char.platinumPieces,
          }}
          onUpdateCurrency={(c) => {
            updateField("copperPieces", c.cp);
            updateField("silverPieces", c.sp);
            updateField("electrumPieces", c.ep);
            updateField("goldPieces", c.gp);
            updateField("platinumPieces", c.pp);
          }}
        />
      )}

      {tab === "dice" && <DiceRoller />}
    </main>
  );
}
