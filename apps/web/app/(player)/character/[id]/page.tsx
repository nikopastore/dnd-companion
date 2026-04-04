"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ABILITIES, getAbilityModifier, formatModifier, SKILLS } from "@dnd-companion/shared";
import type { ConditionKey } from "@dnd-companion/shared";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
import { AttributeOrb } from "@/components/ui/attribute-orb";
import { Icon } from "@/components/ui/icon";
import { EntityImage } from "@/components/ui/entity-image";
import { ImageUpload } from "@/components/ui/image-upload";
import { CombatStats } from "@/components/character/combat-stats";
import { ConditionManager } from "@/components/character/condition-manager";
import { CharacterNotificationStack } from "@/components/character/character-notification-stack";
import { RestButtons } from "@/components/character/rest-buttons";
import { DiceRoller } from "@/components/character/dice-roller";
import { InventoryPanel } from "@/components/character/inventory-panel";
import { ProgressionPanel } from "@/components/character/progression-panel";
import { RulesReferencePanel } from "@/components/character/rules-reference-panel";
import { SpellbookPanel } from "@/components/character/spellbook-panel";
import { StoryPanel } from "@/components/character/story-panel";
import { normalizeCharacterNotifications } from "@/lib/character-notifications";
import {
  normalizeAutomationMode,
  resetClassResourcesForLongRest,
  resetClassResourcesForShortRest,
} from "@/lib/rest-automation";

interface CharacterData {
  id: string;
  name: string;
  imageUrl: string | null;
  backstory: string | null;
  level: number;
  experiencePoints: number;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  subclassName: string | null;
  primaryClassLevel: number;
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
  spellSlotsState: Record<string, { current: number; total: number }> | null;
  pactSpellSlotsState: Record<string, { current: number; total: number }> | null;
  concentrationSpell: string | null;
  automationMode: string;
  rulesBookmarks: unknown;
  pendingNotifications: unknown;
  personalityTraits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  personalGoals: string | null;
  secrets: string | null;
  voiceNotes: string | null;
  lastSessionChanges: string | null;
  characterTimeline: unknown;
  copperPieces: number;
  silverPieces: number;
  electrumPieces: number;
  goldPieces: number;
  platinumPieces: number;
  race: { name: string };
  class: {
    id: string;
    name: string;
    hitDie: number;
    primaryAbility: string;
    imageUrl?: string | null;
    levels: Array<{
      level: number;
      spellSlots: Record<string, number> | null;
      resources: Record<string, unknown> | null;
    }>;
  };
  multiclasses: Array<{
    id: string;
    level: number;
    subclassName: string | null;
    classId: string;
    class: {
      id: string;
      name: string;
      hitDie: number;
      primaryAbility: string;
      imageUrl?: string | null;
      levels: Array<{
        level: number;
        spellSlots: Record<string, number> | null;
        resources: Record<string, unknown> | null;
      }>;
    };
  }>;
  background: { name: string };
  spells: Array<{
    id: string;
    isPrepared: boolean;
    sourceClass: {
      id: string;
      name: string;
      primaryAbility: string;
    } | null;
    spell: {
      id: string;
      name: string;
      level: number;
      school: string;
      castingTime: string;
      range: string;
      components: string;
      duration: string;
      concentration: boolean;
      ritual: boolean;
      description: string;
    };
  }>;
  features: Array<{
    id: string;
    name: string;
    description: string;
    source: string;
    level: number;
  }>;
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: string | null;
    rarity: string | null;
    value: string | null;
    quantity: number;
    weight: number | null;
    isEquipped: boolean;
    isAttuned: boolean;
    notes: string | null;
    itemHistory: unknown;
  }>;
  conditions: Array<{ condition: ConditionKey }>;
  partyMembers: Array<{
    id: string;
    name: string;
    race: { name: string };
    class: { name: string };
  }>;
  campaignContext: {
    name: string;
    system: string;
    edition: string;
    houseRules: unknown;
  } | null;
}

const TAB_ICONS: Record<string, string> = {
  sheet: "description",
  inventory: "inventory_2",
  progression: "trending_up",
  spellbook: "local_library",
  rules: "gavel",
  story: "history_edu",
  dice: "casino",
};

export default function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>();
  const [char, setChar] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sheet" | "inventory" | "progression" | "spellbook" | "rules" | "story" | "dice">("sheet");
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);

  const refreshCharacter = useCallback(async () => {
    const res = await fetch(`/api/characters/${id}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setChar(data);
    if (data.imageUrl) {
      setPortraitUrl(data.imageUrl);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refreshCharacter().catch(() => setLoading(false));
  }, [refreshCharacter]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshCharacter().catch(() => undefined);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [refreshCharacter]);

  useEffect(() => {
    if (char?.imageUrl) {
      setPortraitUrl(char.imageUrl);
    }
  }, [char?.imageUrl]);

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
    const res = await fetch(`/api/characters/${id}/conditions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition }),
    });
    if (!res.ok) {
      await refreshCharacter();
    }
  }, [char, id, refreshCharacter]);

  const updateItem = useCallback(
    async (itemId: string, changes: Record<string, unknown>) => {
      if (!char) return;

      const res = await fetch(`/api/characters/${id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      if (!res.ok) return;

      const updatedItem = await res.json();
      setChar((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                item.id === itemId ? updatedItem : item
              ),
            }
          : prev
      );
    },
    [char, id]
  );

  const tradeWithPartyMember = useCallback(
    async (
      payload:
        | { kind: "item"; targetCharacterId: string; itemId: string; quantity: number }
        | { kind: "currency"; targetCharacterId: string; currencyType: "copperPieces" | "silverPieces" | "electrumPieces" | "goldPieces" | "platinumPieces"; amount: number }
    ) => {
      if (!char) return;

      const res = await fetch(`/api/characters/${id}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      await refreshCharacter();
    },
    [char, id, refreshCharacter]
  );

  const dismissNotifications = useCallback(
    async (notificationIds: string[]) => {
      setChar((prev) =>
        prev
          ? {
              ...prev,
              pendingNotifications: normalizeCharacterNotifications(
                prev.pendingNotifications
              ).filter((notification) => !notificationIds.includes(notification.id)),
            }
          : prev
      );

      const res = await fetch(`/api/characters/${id}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });

      if (!res.ok) {
        await refreshCharacter();
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { pendingNotifications?: unknown }
        | null;

      if (data && "pendingNotifications" in data) {
        setChar((prev) =>
          prev
            ? {
                ...prev,
                pendingNotifications: data.pendingNotifications,
              }
            : prev
        );
      }
    },
    [id, refreshCharacter]
  );

  const handleShortRest = useCallback(() => {
    if (!char) return;
    const automationMode = normalizeAutomationMode(char.automationMode);
    if (automationMode === "MANUAL") {
      return;
    }

    // Reset death saves
    updateField("deathSaveSuccesses", 0);
    updateField("deathSaveFailures", 0);
    if (char.pactSpellSlotsState) {
      const refreshedPactSlots = Object.entries(char.pactSpellSlotsState).reduce<Record<string, { current: number; total: number }>>(
        (acc, [slotLevel, slotState]) => ({
          ...acc,
          [slotLevel]: {
            current: slotState.total,
            total: slotState.total,
          },
        }),
        {}
      );
      updateField("pactSpellSlotsState", refreshedPactSlots);
    }
    if (automationMode === "FULL") {
      const refreshedResources = resetClassResourcesForShortRest(
        (char.classResources as Record<string, unknown> | null) ?? null
      );
      if (refreshedResources) {
        updateField("classResources", refreshedResources);
      }
    }
  }, [char, updateField]);

  const handleLongRest = useCallback(() => {
    if (!char) return;
    const automationMode = normalizeAutomationMode(char.automationMode);
    if (automationMode === "MANUAL") {
      return;
    }

    updateField("currentHP", char.maxHP);
    updateField("tempHP", 0);
    updateField("deathSaveSuccesses", 0);
    updateField("deathSaveFailures", 0);
    updateField("hitDiceRemaining", char.hitDiceTotal);
    if (char.spellSlotsState) {
      const refreshedSlots = Object.entries(char.spellSlotsState).reduce<Record<string, { current: number; total: number }>>(
        (acc, [slotLevel, slotState]) => ({
          ...acc,
          [slotLevel]: {
            current: slotState.total,
            total: slotState.total,
          },
        }),
        {}
      );
      updateField("spellSlotsState", refreshedSlots);
    }
    if (char.pactSpellSlotsState) {
      const refreshedPactSlots = Object.entries(char.pactSpellSlotsState).reduce<Record<string, { current: number; total: number }>>(
        (acc, [slotLevel, slotState]) => ({
          ...acc,
          [slotLevel]: {
            current: slotState.total,
            total: slotState.total,
          },
        }),
        {}
      );
      updateField("pactSpellSlotsState", refreshedPactSlots);
    }
    // Reset exhaustion by 1 level
    if (char.exhaustionLevel > 0) {
      updateField("exhaustionLevel", char.exhaustionLevel - 1);
    }
    if (automationMode === "FULL") {
      const refreshedResources = resetClassResourcesForLongRest(
        (char.classResources as Record<string, unknown> | null) ?? null
      );
      if (refreshedResources) {
        updateField("classResources", refreshedResources);
      }
      if (char.concentrationSpell) {
        updateField("concentrationSpell", null);
      }
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
  const classTracks = [
    {
      classId: char.class.id,
      className: char.class.name,
      level: char.primaryClassLevel,
      subclassName: char.subclassName,
      hitDie: char.class.hitDie,
      primaryAbility: char.class.primaryAbility,
      imageUrl: char.class.imageUrl ?? null,
      levels: char.class.levels,
      isPrimary: true,
    },
    ...char.multiclasses.map((entry) => ({
      classId: entry.class.id,
      className: entry.class.name,
      level: entry.level,
      subclassName: entry.subclassName,
      hitDie: entry.class.hitDie,
      primaryAbility: entry.class.primaryAbility,
      imageUrl: entry.class.imageUrl ?? null,
      levels: entry.class.levels,
      isPrimary: false,
    })),
  ];
  const classSummary = classTracks.map((track) => `${track.className} ${track.level}`).join(" / ");
  const pendingNotifications = normalizeCharacterNotifications(char.pendingNotifications);

  return (
    <main className="pt-20 pb-28 px-4 max-w-5xl mx-auto space-y-8">
      <CharacterNotificationStack
        notifications={pendingNotifications}
        onDismiss={dismissNotifications}
        onViewInventory={() => setTab("inventory")}
      />

      <AtmosphericHero
        eyebrow="Character Sheet"
        title={char.name}
        description={
          char.backstory ||
          "Track combat readiness, inventory, spellcraft, growth, and identity from a single character command page."
        }
        entityType="character"
        imageName={char.name}
        imageUrl={portraitUrl}
        chips={[
          `Level ${char.level}`,
          char.race.name,
          classSummary,
          char.background.name,
        ]}
        highlights={[
          { icon: "favorite", label: "HP", value: `${char.currentHP} / ${char.maxHP}` },
          { icon: "shield", label: "AC", value: `${char.armorClass}` },
          { icon: "bolt", label: "Initiative", value: `${formatModifier(char.initiative)}` },
        ]}
        sideContent={
          <div className="space-y-4">
            <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-4">
              <p className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary/80">
                Class Profile
              </p>
              <p className="mt-2 font-headline text-xl text-on-surface">{classSummary}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Proficiency bonus +{char.proficiencyBonus}
              </p>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
        {[
          { icon: "military_tech", label: "Proficiency", value: `+${char.proficiencyBonus}` },
          { icon: "tire_repair", label: "Hit Dice", value: `${char.hitDiceRemaining} / ${char.hitDiceTotal}` },
          { icon: "psychology", label: "Conditions", value: `${activeConditions.length}` },
          { icon: "workspace_premium", label: "Subclass", value: char.subclassName || "Unchosen" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-outline-variant/10 bg-surface-container/70 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 text-secondary">
              <Icon name={item.icon} size={16} />
              <p className="font-label text-[10px] uppercase tracking-[0.16em]">{item.label}</p>
            </div>
            <p className="mt-2 font-headline text-2xl text-on-surface">{item.value}</p>
          </div>
        ))}
      </section>

      {/*
      <>
      Character Header
      <div className="animate-fade-in-up">
        <div className="flex items-end gap-4">
          <div className="relative group shrink-0">
            <EntityImage
              imageUrl={portraitUrl}
              entityType="character"
              name={char!.name}
              size="lg"
            />
            <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ImageUpload
                currentImage={portraitUrl}
                onUpload={(url) => {
                  setPortraitUrl(url);
                  updateField("imageUrl", url);
                }}
                size="sm"
                label="Change Portrait"
              />
            </div>
          </div>
          <div>
            <h1 className="font-headline text-4xl text-on-background tracking-tight">{char!.name}</h1>
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mt-1">
              Level {char.level} {char.race.name} · {classSummary} · {char.background.name}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="px-3 py-1.5 bg-secondary-container/15 border border-secondary/20 rounded-sm">
              <span className="font-label text-[10px] text-secondary/70 uppercase tracking-wider">Prof</span>
              <span className="font-headline text-sm text-secondary ml-1.5">+{char!.proficiencyBonus}</span>
            </div>
          </div>
        </div>
        <div className="decorative-line mt-4" />
      </div>
      </>
      */}

      {/* Tab Navigation */}
      <div className="flex gap-2 animate-fade-in">
        {(["sheet", "inventory", "progression", "spellbook", "rules", "story", "dice"] as const).map((t) => (
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

          {char.backstory && (
            <section className="bg-surface-container-low p-6 rounded-sm shadow-whisper animate-fade-in-up">
              <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-4">
                Backstory
              </span>
              <p className="font-body text-sm leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                {char.backstory}
              </p>
            </section>
          )}

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
          <RestButtons
            onShortRest={handleShortRest}
            onLongRest={handleLongRest}
            automationMode={normalizeAutomationMode(char.automationMode)}
          />
        </div>
      )}

      {tab === "progression" && (
        <ProgressionPanel
          characterId={char.id}
          level={char.level}
          proficiencyBonus={char.proficiencyBonus}
          experiencePoints={char.experiencePoints}
          constitution={char.constitution}
          abilityScores={{
            strength: char.strength,
            dexterity: char.dexterity,
            constitution: char.constitution,
            intelligence: char.intelligence,
            wisdom: char.wisdom,
            charisma: char.charisma,
          }}
          classTracks={classTracks}
          classResources={char.classResources}
          spellSlotsState={char.spellSlotsState}
          features={char.features}
          onRefresh={refreshCharacter}
        />
      )}

      {tab === "spellbook" && (
        <SpellbookPanel
          characterId={char.id}
          classTracks={classTracks.map((track) => ({
            classId: track.classId,
            className: track.className,
            level: track.level,
            primaryAbility: track.primaryAbility,
            subclassName: track.subclassName,
          }))}
          abilityScores={{
            strength: char.strength,
            dexterity: char.dexterity,
            constitution: char.constitution,
            intelligence: char.intelligence,
            wisdom: char.wisdom,
            charisma: char.charisma,
          }}
          spellSlotsState={char.spellSlotsState}
          pactSpellSlotsState={char.pactSpellSlotsState}
          knownSpells={char.spells}
          onRefresh={refreshCharacter}
          onUpdateField={updateField}
        />
      )}

      {tab === "rules" && (
        <RulesReferencePanel
          automationMode={char.automationMode}
          rulesBookmarks={char.rulesBookmarks}
          activeConditions={activeConditions}
          concentrationSpell={char.concentrationSpell}
          spellSlotsState={char.spellSlotsState}
          pactSpellSlotsState={char.pactSpellSlotsState}
          campaignContext={char.campaignContext}
          onUpdateField={updateField}
        />
      )}

      {tab === "story" && (
        <StoryPanel
          personalityTraits={char.personalityTraits}
          ideals={char.ideals}
          bonds={char.bonds}
          flaws={char.flaws}
          personalGoals={char.personalGoals}
          secrets={char.secrets}
          voiceNotes={char.voiceNotes}
          lastSessionChanges={char.lastSessionChanges}
          characterTimeline={char.characterTimeline}
          onSave={async (payload) => {
            await fetch(`/api/characters/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            await refreshCharacter();
          }}
        />
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
          onUpdateItem={updateItem}
          partyMembers={char.partyMembers.map((member) => ({
            id: member.id,
            name: member.name,
            raceName: member.race.name,
            className: member.class.name,
          }))}
          onTrade={tradeWithPartyMember}
        />
      )}

      {tab === "dice" && <DiceRoller />}
    </main>
  );
}
