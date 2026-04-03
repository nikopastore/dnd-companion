"use client";

import { useEffect, useMemo, useState } from "react";
import { ABILITIES, getAbilityModifier, type AbilityKey } from "@dnd-companion/shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { OptionGallery, type BuilderOption } from "@/components/builder/option-gallery";
import {
  getDefaultHitPointIncrease,
  getPreparedSpellLimit,
  getProgressionHighlights,
  getProficiencyBonus,
} from "@/lib/character-progression";
import {
  getAbilityScoreImprovementLevels,
  getClassChoiceGroups,
  getFeatOptions,
  getSubclassOptions,
  getSubclassUnlockLevel,
} from "@/lib/character-reference";

interface ClassLevelData {
  level: number;
  spellSlots: Record<string, number> | null;
  resources: Record<string, unknown> | null;
}

interface CharacterFeatureData {
  id: string;
  name: string;
  description: string;
  source: string;
  level: number;
}

interface ClassTrackData {
  classId: string;
  className: string;
  level: number;
  subclassName: string | null;
  hitDie: number;
  primaryAbility: string;
  imageUrl?: string | null;
  levels: ClassLevelData[];
  isPrimary: boolean;
}

interface AvailableClassData {
  id: string;
  name: string;
  hitDie: number;
  primaryAbility: string;
  imageUrl?: string | null;
  levels: ClassLevelData[];
}

interface ProgressionPanelProps {
  characterId: string;
  level: number;
  proficiencyBonus: number;
  experiencePoints: number;
  constitution: number;
  abilityScores: Record<AbilityKey, number>;
  classTracks: ClassTrackData[];
  classResources: Record<string, unknown> | null;
  spellSlotsState: Record<string, { current: number; total: number }> | null;
  features: CharacterFeatureData[];
  onRefresh: () => void;
}

function formatResourceSummary(resources: Record<string, unknown> | null) {
  if (!resources) return [];
  return Object.entries(resources)
    .filter(([, value]) => value !== null && typeof value !== "object")
    .map(([key, value]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()),
      value: String(value),
    }));
}

function sumAsi(values: Partial<Record<AbilityKey, number>>) {
  return Object.values(values).reduce((sum, value) => sum + Number(value || 0), 0);
}

export function ProgressionPanel({
  characterId,
  level,
  proficiencyBonus,
  experiencePoints,
  constitution,
  abilityScores,
  classTracks,
  classResources,
  spellSlotsState,
  features,
  onRefresh,
}: ProgressionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<AvailableClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classTracks[0]?.classId ?? "");
  const [subclassDraft, setSubclassDraft] = useState(classTracks[0]?.subclassName || "");
  const [hpGain, setHpGain] = useState(
    getDefaultHitPointIncrease(classTracks[0]?.hitDie ?? 8, getAbilityModifier(constitution))
  );
  const [selectedFeatId, setSelectedFeatId] = useState<string | null>(null);
  const [selectedClassChoices, setSelectedClassChoices] = useState<Record<string, string[]>>({});
  const [abilityScoreIncreases, setAbilityScoreIncreases] = useState<Partial<Record<AbilityKey, number>>>({});
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/srd/classes?levels=true")
      .then((res) => res.json())
      .then((data) => setAvailableClasses(Array.isArray(data) ? data : []))
      .catch(() => setAvailableClasses([]));
  }, []);

  const selectedExistingTrack = classTracks.find((track) => track.classId === selectedClassId) ?? null;
  const selectedNewClass = availableClasses.find((entry) => entry.id === selectedClassId) ?? null;
  const selectedTrack = selectedExistingTrack
    ? {
        classId: selectedExistingTrack.classId,
        className: selectedExistingTrack.className,
        level: selectedExistingTrack.level,
        subclassName: selectedExistingTrack.subclassName,
        hitDie: selectedExistingTrack.hitDie,
        primaryAbility: selectedExistingTrack.primaryAbility,
        imageUrl: selectedExistingTrack.imageUrl,
        levels: selectedExistingTrack.levels,
        isPrimary: selectedExistingTrack.isPrimary,
      }
    : selectedNewClass
      ? {
          classId: selectedNewClass.id,
          className: selectedNewClass.name,
          level: 0,
          subclassName: null,
          hitDie: selectedNewClass.hitDie,
          primaryAbility: selectedNewClass.primaryAbility,
          imageUrl: selectedNewClass.imageUrl,
          levels: selectedNewClass.levels,
          isPrimary: false,
        }
      : null;

  useEffect(() => {
    if (!selectedTrack) return;
    setSubclassDraft(selectedExistingTrack?.subclassName || "");
    setHpGain(getDefaultHitPointIncrease(selectedTrack.hitDie, getAbilityModifier(constitution)));
    setSelectedFeatId(null);
    setSelectedClassChoices({});
    setAbilityScoreIncreases({});
  }, [constitution, selectedClassId, selectedExistingTrack?.subclassName, selectedTrack?.hitDie]);

  const nextTrackLevel = (selectedTrack?.level ?? 0) + 1;
  const nextCharacterLevel = level + 1;
  const nextClassLevel = selectedTrack?.levels.find((entry) => entry.level === nextTrackLevel) ?? null;
  const currentClassLevel =
    selectedTrack && selectedTrack.level > 0
      ? selectedTrack.levels.find((entry) => entry.level === selectedTrack.level) ?? null
      : null;
  const selectedPrimaryAbility = (selectedTrack?.primaryAbility ?? "strength") as AbilityKey;
  const selectedPrimaryAbilityScore = abilityScores[selectedPrimaryAbility];
  const primaryAbilityModifier = getAbilityModifier(selectedPrimaryAbilityScore);
  const preparedLimit =
    selectedTrack && selectedTrack.level > 0
      ? getPreparedSpellLimit({
          className: selectedTrack.className,
          level: selectedTrack.level,
          primaryAbilityModifier,
        })
      : null;
  const subclassUnlockLevel = selectedTrack ? getSubclassUnlockLevel(selectedTrack.className) : 3;
  const asiEligible = selectedTrack
    ? getAbilityScoreImprovementLevels(selectedTrack.className).includes(nextTrackLevel)
    : false;
  const classChoiceGroups = selectedTrack
    ? getClassChoiceGroups(selectedTrack.className, nextTrackLevel, subclassDraft || selectedTrack.subclassName)
    : [];
  const totalAsiPoints = sumAsi(abilityScoreIncreases);

  const progressionHighlights = useMemo(() => {
    if (!selectedTrack || !nextClassLevel) return [];
    if (selectedTrack.level === 0) {
      return [
        `Add ${selectedTrack.className} as a new class track.`,
        `Gain a d${selectedTrack.hitDie} hit die and start ${selectedTrack.className} progression at level 1.`,
        selectedTrack.className === "Warlock"
          ? "Warlock pact slots stay separate from shared multiclass spell slots."
          : `Your total character level becomes ${nextCharacterLevel}.`,
        ...classChoiceGroups.map((group) => `${group.title}: choose ${group.selectionCount}.`),
      ];
    }

    return [
      ...getProgressionHighlights({
      className: selectedTrack.className,
      currentLevel: selectedTrack.level,
      nextLevel: nextTrackLevel,
      currentSpellSlots: currentClassLevel?.spellSlots ?? null,
      nextSpellSlots: nextClassLevel.spellSlots ?? null,
      currentResources: currentClassLevel?.resources ?? null,
      nextResources: nextClassLevel.resources,
      currentProficiencyBonus: proficiencyBonus,
      nextProficiencyBonus: getProficiencyBonus(nextCharacterLevel),
      }),
      ...classChoiceGroups.map((group) => `${group.title}: choose ${group.selectionCount}.`),
    ];
  }, [classChoiceGroups, currentClassLevel?.resources, currentClassLevel?.spellSlots, nextCharacterLevel, nextClassLevel, nextTrackLevel, proficiencyBonus, selectedTrack]);

  const featureTimeline = [...features].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const resourceSummary = formatResourceSummary(classResources);
  const existingTrackOptions = useMemo<BuilderOption[]>(
    () =>
      classTracks.map((track) => ({
        id: track.classId,
        title: track.className,
        description:
          track.subclassName
            ? `${track.subclassName} at class level ${track.level}.`
            : `Current class level ${track.level}.`,
        subtitle: track.isPrimary ? "Primary class" : "Multiclass track",
        imageUrl: track.imageUrl,
        entityType: "class",
        meta: [`Level ${track.level}`, track.primaryAbility],
        badge: track.isPrimary ? "Main" : "Split",
        searchText: `${track.className} ${track.subclassName ?? ""} ${track.primaryAbility}`,
      })),
    [classTracks]
  );

  const multiclassOptions = useMemo<BuilderOption[]>(
    () =>
      availableClasses
        .filter((entry) => !classTracks.some((track) => track.classId === entry.id))
        .map((entry) => ({
          id: entry.id,
          title: entry.name,
          description: `Start a new ${entry.name} track with its own subclass timing, features, and spell list.`,
          subtitle: "Add multiclass",
          imageUrl: entry.imageUrl,
          entityType: "class",
          meta: [`d${entry.hitDie} hit die`, entry.primaryAbility],
          searchText: `${entry.name} ${entry.primaryAbility}`,
        })),
    [availableClasses, classTracks]
  );

  const subclassOptions = useMemo<BuilderOption[]>(
    () =>
      selectedTrack
        ? getSubclassOptions(selectedTrack.className).map((option) => ({
            id: option.id,
            title: option.name,
            description: option.description,
            subtitle: option.theme,
            entityType: "class",
            meta: [selectedTrack.className, option.theme],
            searchText: `${option.name} ${option.theme} ${option.description}`,
          }))
        : [],
    [selectedTrack]
  );

  const featOptions = useMemo<BuilderOption[]>(
    () =>
      getFeatOptions().map((feat) => ({
        id: feat.id,
        title: feat.name,
        description: feat.description,
        subtitle: feat.tags.join(" · "),
        entityType: "item",
        meta: feat.tags,
        badge: feat.suggestedAbilities?.[0]?.toUpperCase(),
        searchText: `${feat.name} ${feat.tags.join(" ")} ${feat.description}`,
      })),
    []
  );

  async function handleLevelUp() {
    if (!selectedTrack || !nextClassLevel) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/characters/${characterId}/level-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetClassId: selectedTrack.classId,
          hpGain,
          subclassName: subclassDraft.trim() || null,
          featIds: selectedFeatId ? [selectedFeatId] : [],
          classChoiceIds: Object.values(selectedClassChoices).flat(),
          abilityScoreIncreases,
        }),
      });

      if (res.ok) {
        setSelectedFeatId(null);
        setSelectedClassChoices({});
        setAbilityScoreIncreases({});
        setStatus({ kind: "success", message: `${selectedTrack.className} advanced to level ${nextTrackLevel}.` });
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: String(data.error || "Level-up failed.") });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectFeat(featId: string) {
    setSelectedFeatId(featId);
    setAbilityScoreIncreases({});
  }

  function handleAsiChange(ability: AbilityKey, rawValue: number) {
    setSelectedFeatId(null);
    setAbilityScoreIncreases((prev) => {
      const next = {
        ...prev,
        [ability]: Math.max(0, Math.min(2, rawValue)),
      };
      if (!next[ability]) delete next[ability];

      const total = sumAsi(next);
      if (total > 2) {
        const overflow = total - 2;
        next[ability] = Math.max(0, Number(next[ability] || 0) - overflow);
        if (!next[ability]) delete next[ability];
      }

      return next;
    });
  }

  function handleClassChoice(groupId: string, optionId: string, selectionCount: number) {
    setSelectedClassChoices((prev) => ({
      ...prev,
      [groupId]: (() => {
        const current = prev[groupId] || [];
        if (selectionCount <= 1) return [optionId];
        if (current.includes(optionId)) {
          return current.filter((id) => id !== optionId);
        }
        if (current.length >= selectionCount) {
          return [...current.slice(1), optionId];
        }
        return [...current, optionId];
      })(),
    }));
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Character Level", value: String(level), accent: "text-secondary" },
          { label: "Class Tracks", value: String(classTracks.length), accent: "text-primary" },
          { label: "Proficiency", value: `+${proficiencyBonus}`, accent: "text-secondary" },
          { label: "XP", value: String(experiencePoints), accent: "text-primary" },
        ].map((item) => (
          <div key={item.label} className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
              {item.label}
            </p>
            <p className={`mt-2 font-headline text-2xl ${item.accent}`}>{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="trending_up" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Level-Up Assistant</h3>
          </div>

          {selectedTrack && nextClassLevel ? (
            <div className="space-y-5">
              {status && <FormStatus kind={status.kind} message={status.message} />}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon name="tactic" size={16} className="text-secondary" />
                  <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                    Advance an Existing Class
                  </p>
                </div>
                <OptionGallery
                  options={existingTrackOptions}
                  selectedId={selectedExistingTrack?.classId ?? null}
                  onSelect={(option) => setSelectedClassId(option.id)}
                  featuredIds={existingTrackOptions.slice(0, 3).map((option) => option.id)}
                  featuredLabel="Current class tracks"
                  allLabel="All current tracks"
                  searchPlaceholder="Search class tracks"
                  emptyMessage="No class tracks found."
                />
              </div>

              {multiclassOptions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="library_add" size={16} className="text-secondary" />
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                      Add a New Multiclass
                    </p>
                  </div>
                  <OptionGallery
                    options={multiclassOptions}
                    selectedId={!selectedExistingTrack ? selectedClassId : null}
                    onSelect={(option) => setSelectedClassId(option.id)}
                    featuredIds={multiclassOptions.slice(0, 3).map((option) => option.id)}
                    featuredLabel="Popular multiclass starts"
                    allLabel="All multiclass options"
                    searchPlaceholder="Search multiclass options"
                    emptyMessage="No additional classes are available to add."
                  />
                </div>
              )}

              {selectedTrack.className === "Warlock" && classTracks.length > 1 && (
                <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4 text-sm text-on-surface-variant">
                  Warlock keeps its pact slots separate from shared multiclass spell slots and refreshes them on short
                  rests.
                </div>
              )}

              <div className="rounded-sm border border-secondary/10 bg-surface-container p-4">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                  Selected Advance
                </p>
                <p className="mt-2 font-headline text-2xl text-on-surface">
                  {selectedTrack.className} {nextTrackLevel}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Total character level becomes {nextCharacterLevel}.
                </p>
                <div className="mt-3 space-y-2">
                  {progressionHighlights.map((note) => (
                    <div key={note} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <Icon name="auto_awesome" size={16} className="mt-0.5 text-secondary" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="subclass-name"
                  label="Subclass / Path"
                  value={subclassDraft}
                  onChange={(event) => setSubclassDraft(event.target.value)}
                  placeholder={
                    nextTrackLevel < subclassUnlockLevel
                      ? `Subclass usually unlocks at class level ${subclassUnlockLevel}`
                      : "Choose an official option or type a homebrew path"
                  }
                />
                <Input
                  id="hp-gain"
                  label="HP Gain"
                  type="number"
                  min={1}
                  value={hpGain}
                  onChange={(event) => setHpGain(Math.max(1, Number(event.target.value) || 1))}
                />
              </div>

              {nextTrackLevel >= subclassUnlockLevel && subclassOptions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="account_tree" size={16} className="text-secondary" />
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                      Subclass Paths
                    </p>
                  </div>
                  <OptionGallery
                    options={subclassOptions}
                    selectedId={subclassOptions.find((option) => option.title === subclassDraft)?.id ?? null}
                    onSelect={(option) => setSubclassDraft(option.title)}
                    featuredIds={subclassOptions.slice(0, 3).map((option) => option.id)}
                    featuredLabel="Recommended paths"
                    allLabel="All subclass options"
                    searchPlaceholder="Search subclass paths"
                    emptyMessage="No subclasses matched your search."
                  />
                </div>
              )}

              {classChoiceGroups.map((group) => {
                const options: BuilderOption[] = group.options.map((option) => ({
                  id: option.id,
                  title: option.name,
                  description: option.description,
                  subtitle: group.title,
                  entityType: "class",
                  meta: option.tags,
                  searchText: `${option.name} ${option.tags.join(" ")} ${option.description}`,
                }));

                return (
                  <div key={group.id} className="space-y-3 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="flex items-center gap-2">
                      <Icon name="auto_awesome" size={16} className="text-secondary" />
                      <div>
                        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                          {group.title}
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">{group.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                      <span>
                        Select {group.selectionCount} {group.selectionCount === 1 ? "option" : "options"}.
                      </span>
                      <span className="font-label uppercase tracking-[0.16em] text-secondary">
                        {(selectedClassChoices[group.id] || []).length}/{group.selectionCount}
                      </span>
                    </div>
                    <OptionGallery
                      options={options}
                      selectedIds={selectedClassChoices[group.id] || []}
                      onSelect={(option) => handleClassChoice(group.id, option.id, group.selectionCount)}
                      featuredIds={options.slice(0, 3).map((option) => option.id)}
                      featuredLabel="Recommended picks"
                      allLabel="All available picks"
                      searchPlaceholder={`Search ${group.title.toLowerCase()} options`}
                      emptyMessage={`No ${group.title.toLowerCase()} options matched your search.`}
                    />
                  </div>
                );
              })}

              {asiEligible && (
                <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                        Feat or Ability Score Improvement
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Choose one feat or distribute up to two ability points for this class level.
                      </p>
                    </div>
                    <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                      {totalAsiPoints}/2 ASI points
                    </span>
                  </div>

                  <OptionGallery
                    options={featOptions}
                    selectedId={selectedFeatId}
                    onSelect={(option) => handleSelectFeat(option.id)}
                    featuredIds={["war-caster", "resilient", "lucky", "tough", "sharpshooter", "fey-touched"]}
                    featuredLabel="Popular feats"
                    allLabel="All feat options"
                    searchPlaceholder="Search feats"
                    emptyMessage="No feats matched your search."
                  />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon name="tune" size={16} className="text-secondary" />
                      <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                        Ability Score Improvement
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {ABILITIES.map((ability) => {
                        const pending = Number(abilityScoreIncreases[ability.key] || 0);
                        const currentScore = abilityScores[ability.key];
                        const preview = Math.min(20, currentScore + pending);
                        return (
                          <div key={ability.key} className="rounded-sm border border-outline-variant/8 bg-surface-container-high/40 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-headline text-base text-on-surface">{ability.abbreviation}</p>
                              <p className="text-sm text-on-surface-variant">
                                {currentScore}
                                {pending > 0 ? ` → ${preview}` : ""}
                              </p>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              {[0, 1, 2].map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => handleAsiChange(ability.key, value)}
                                  className={`rounded-sm border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                                    pending === value
                                      ? "border-secondary/40 bg-secondary/10 text-secondary"
                                      : "border-outline-variant/10 bg-surface-container text-on-surface-variant hover:border-secondary/20"
                                  }`}
                                >
                                  +{value}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
                  Recommendation
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Average HP for {selectedTrack.className} is{" "}
                  <span className="font-semibold text-on-surface">
                    {getDefaultHitPointIncrease(selectedTrack.hitDie, getAbilityModifier(constitution))}
                  </span>{" "}
                  based on a d{selectedTrack.hitDie} hit die and your Constitution modifier.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleLevelUp}
                  loading={loading}
                >
                  <Icon name="upgrade" size={16} />
                  Advance to {selectedTrack.className} {nextTrackLevel}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="workspace_premium"
              title="This character has reached the current progression cap"
              description="No further class progression data is available right now."
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="military_tech" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Current Build</h3>
            </div>

            <div className="space-y-3">
              {classTracks.map((track) => (
                <div key={track.classId} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{track.className}</p>
                      <p className="text-sm text-on-surface-variant">
                        {track.subclassName || "No subclass yet"}
                      </p>
                    </div>
                    <span className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary">
                      {track.isPrimary ? "Primary" : "Multiclass"} · Lv {track.level}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between gap-3 text-sm text-on-surface-variant">
                    <span>Primary Ability</span>
                    <span className="text-on-surface capitalize">{track.primaryAbility}</span>
                  </div>
                </div>
              ))}
            </div>

            {preparedLimit !== null && selectedTrack && selectedTrack.level > 0 && (
              <div className="mt-4 flex justify-between gap-3 text-sm text-on-surface-variant">
                <span>{selectedTrack.className} Prepared Limit</span>
                <span className="text-on-surface">{preparedLimit}</span>
              </div>
            )}

            {resourceSummary.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
                  Primary Class Resources
                </p>
                {resourceSummary.map((resource) => (
                  <div key={resource.key} className="flex justify-between gap-3 text-sm text-on-surface-variant">
                    <span>{resource.label}</span>
                    <span className="text-on-surface">{resource.value}</span>
                  </div>
                ))}
              </div>
            )}

            {spellSlotsState && Object.keys(spellSlotsState).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
                  Shared Spell Slots
                </p>
                {Object.entries(spellSlotsState).map(([slotLevel, slotState]) => (
                  <div key={slotLevel} className="flex justify-between gap-3 text-sm text-on-surface-variant">
                    <span>Level {slotLevel}</span>
                    <span className="text-on-surface">
                      {slotState.current}/{slotState.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="history_edu" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Feature Timeline</h3>
            </div>
            {featureTimeline.length === 0 ? (
              <EmptyState
                icon="timeline"
                title="No class feature history saved yet"
                description="The level-up assistant will add class and feat history as progression data is chosen."
              />
            ) : (
              <div className="space-y-3">
                {featureTimeline.map((feature) => (
                  <div key={feature.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-headline text-base text-on-surface">{feature.name}</p>
                      <span className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary">
                        {feature.source} · Lv {feature.level}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-on-surface-variant">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
