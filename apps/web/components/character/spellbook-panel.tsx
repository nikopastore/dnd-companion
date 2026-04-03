"use client";

import { useEffect, useMemo, useState } from "react";
import { getAbilityModifier, type AbilityKey } from "@dnd-companion/shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  canClassCastSpells,
  getHighestSpellLevelFromSlots,
  getPreparedSpellLimit,
  isKnownCaster,
  isPactCaster,
  isPreparedCaster,
} from "@/lib/character-progression";

interface KnownSpell {
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
}

interface AvailableSpell {
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
}

interface SpellClassTrack {
  classId: string;
  className: string;
  level: number;
  primaryAbility: string;
  subclassName: string | null;
}

interface SpellbookPanelProps {
  characterId: string;
  classTracks: SpellClassTrack[];
  abilityScores: Record<AbilityKey, number>;
  spellSlotsState: Record<string, { current: number; total: number }> | null;
  pactSpellSlotsState: Record<string, { current: number; total: number }> | null;
  knownSpells: KnownSpell[];
  onRefresh: () => void;
  onUpdateField: (field: string, value: unknown) => Promise<void>;
}

export function SpellbookPanel({
  characterId,
  classTracks,
  abilityScores,
  spellSlotsState,
  pactSpellSlotsState,
  knownSpells,
  onRefresh,
  onUpdateField,
}: SpellbookPanelProps) {
  const casterTracks = useMemo(
    () => classTracks.filter((track) => canClassCastSpells(track.className)),
    [classTracks]
  );
  const [activeClassId, setActiveClassId] = useState(casterTracks[0]?.classId ?? "");
  const [availableSpells, setAvailableSpells] = useState<AvailableSpell[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [learningSpellId, setLearningSpellId] = useState<string | null>(null);
  const [slotSaving, setSlotSaving] = useState<string | null>(null);
  const [knownLoadingId, setKnownLoadingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!casterTracks.some((track) => track.classId === activeClassId)) {
      setActiveClassId(casterTracks[0]?.classId ?? "");
    }
  }, [activeClassId, casterTracks]);

  const activeTrack = casterTracks.find((track) => track.classId === activeClassId) ?? casterTracks[0] ?? null;
  const canCastSpells = Boolean(activeTrack);
  const preparedCaster = activeTrack ? isPreparedCaster(activeTrack.className) : false;
  const knownCaster = activeTrack ? isKnownCaster(activeTrack.className) : false;
  const activeSlotState =
    activeTrack && isPactCaster(activeTrack.className) ? pactSpellSlotsState : spellSlotsState;
  const highestSpellLevel = getHighestSpellLevelFromSlots(
    activeSlotState
      ? Object.entries(activeSlotState).reduce<Record<string, number>>((acc, [slotLevel, slotState]) => {
          acc[slotLevel] = slotState.total;
          return acc;
        }, {})
      : null
  );

  useEffect(() => {
    if (!activeTrack) return;
    fetch(`/api/srd/spells?class=${encodeURIComponent(activeTrack.className.toLowerCase())}`)
      .then((res) => res.json())
      .then((data) => setAvailableSpells(Array.isArray(data) ? data : []))
      .catch(() => setAvailableSpells([]));
  }, [activeTrack]);

  const preparedLimit =
    activeTrack && preparedCaster
      ? getPreparedSpellLimit({
          className: activeTrack.className,
          level: activeTrack.level,
          primaryAbilityModifier: getAbilityModifier(abilityScores[activeTrack.primaryAbility as AbilityKey]),
        })
      : null;

  const preparedCount = knownSpells.filter((entry) => {
    const sourceClassId = entry.sourceClass?.id ?? classTracks[0]?.classId;
    return entry.isPrepared && sourceClassId === activeTrack?.classId;
  }).length;

  const knownSpellIds = new Set(
    knownSpells
      .filter((entry) => {
        const sourceClassId = entry.sourceClass?.id ?? classTracks[0]?.classId;
        return sourceClassId === activeTrack?.classId;
      })
      .map((entry) => entry.spell.id)
  );

  const filteredAvailableSpells = useMemo(() => {
    return availableSpells.filter((spell) => {
      if (knownSpellIds.has(spell.id)) return false;
      if (spell.level > highestSpellLevel) return false;
      if (levelFilter !== "all" && spell.level !== Number(levelFilter)) return false;
      const haystack = `${spell.name} ${spell.school} ${spell.description}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [availableSpells, highestSpellLevel, knownSpellIds, levelFilter, search]);

  const groupedKnownSpells = useMemo(() => {
    const groups = new Map<number, KnownSpell[]>();
    for (const spell of knownSpells) {
      const levelGroup = spell.spell.level;
      const bucket = groups.get(levelGroup) || [];
      bucket.push(spell);
      groups.set(levelGroup, bucket);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [knownSpells]);

  async function handleLearnSpell(spellId: string) {
    if (!activeTrack) return;
    setLearningSpellId(spellId);
    try {
      const res = await fetch(`/api/characters/${characterId}/spells`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spellId, sourceClassId: activeTrack.classId }),
      });

      if (res.ok) {
        setStatus({ kind: "success", message: "Spell learned." });
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: String(data.error || "Could not learn spell.") });
      }
    } finally {
      setLearningSpellId(null);
    }
  }

  async function handlePreparedToggle(spellId: string, isPrepared: boolean) {
    setKnownLoadingId(spellId);
    try {
      const res = await fetch(`/api/characters/${characterId}/spells/${spellId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrepared }),
      });

      if (res.ok) {
        setStatus({ kind: "success", message: isPrepared ? "Spell prepared." : "Spell unprepared." });
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: String(data.error || "Could not update prepared status.") });
      }
    } finally {
      setKnownLoadingId(null);
    }
  }

  async function handleForgetSpell(spellId: string) {
    setKnownLoadingId(spellId);
    try {
      const res = await fetch(`/api/characters/${characterId}/spells/${spellId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStatus({ kind: "success", message: "Spell removed from spellbook." });
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: String(data.error || "Could not remove spell.") });
      }
    } finally {
      setKnownLoadingId(null);
    }
  }

  async function updateSlotState(slotLevel: string, nextCurrent: number) {
    if (!activeSlotState || !activeTrack) return;
    setSlotSaving(slotLevel);
    try {
      const next = {
        ...activeSlotState,
        [slotLevel]: {
          ...activeSlotState[slotLevel],
          current: Math.max(0, Math.min(nextCurrent, activeSlotState[slotLevel].total)),
        },
      };
      await onUpdateField(isPactCaster(activeTrack.className) ? "pactSpellSlotsState" : "spellSlotsState", next);
      setStatus({ kind: "success", message: "Spell slots updated." });
      onRefresh();
    } finally {
      setSlotSaving(null);
    }
  }

  if (!canCastSpells || !activeTrack) {
    return (
      <EmptyState
        icon="auto_stories"
        title="This character does not use a spellbook"
        description="Spellbook tools appear automatically for spellcasting class tracks."
      />
    );
  }

  return (
    <div className="space-y-6">
      {status && <FormStatus kind={status.kind} message={status.message} />}
      <section className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon name="category" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Spellcasting Tracks</h3>
          </div>
          <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
            Choose a spell list
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {casterTracks.map((track) => (
            <button
              key={track.classId}
              type="button"
              onClick={() => setActiveClassId(track.classId)}
              className={`rounded-sm border px-4 py-2 text-left transition-colors ${
                track.classId === activeTrack.classId
                  ? "border-secondary/40 bg-secondary/10 text-secondary"
                  : "border-outline-variant/10 bg-surface-container text-on-surface-variant hover:border-secondary/20"
              }`}
            >
              <div className="font-headline text-sm">{track.className}</div>
              <div className="font-label text-[10px] uppercase tracking-[0.16em]">
                Level {track.level}
                {track.subclassName ? ` · ${track.subclassName}` : ""}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="local_library" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Spell Slots</h3>
            </div>
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              {isPactCaster(activeTrack.className) ? "Pact magic" : knownCaster ? "Known caster" : "Prepared caster"}
            </span>
          </div>

          {activeSlotState && Object.keys(activeSlotState).length > 0 ? (
            <div className="grid gap-3">
              {Object.entries(activeSlotState).map(([slotLevel, slotState]) => (
                <div key={slotLevel} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">Level {slotLevel} Slots</p>
                      <p className="text-sm text-on-surface-variant">
                        {slotState.current}/{slotState.total} available
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={slotState.current <= 0 || slotSaving === slotLevel}
                        onClick={() => updateSlotState(slotLevel, slotState.current - 1)}
                      >
                        <Icon name="remove" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={slotState.current >= slotState.total || slotSaving === slotLevel}
                        onClick={() => updateSlotState(slotLevel, slotState.current + 1)}
                      >
                        <Icon name="add" size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="offline_bolt"
              title="No spell slots unlocked yet"
              description="Cantrips and future spell levels will appear here when the class gains casting progression."
            />
          )}

          <div className="mt-4 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
              {activeTrack.className} preparation
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {isPactCaster(activeTrack.className)
                ? `${activeTrack.className} uses pact slots that refresh on a short or long rest.`
                : preparedCaster
                ? `Prepared ${preparedCount}${preparedLimit !== null ? ` of ${preparedLimit}` : ""} ${activeTrack.className} spells.`
                : `${activeTrack.className} is a known-caster track and keeps learned spells ready.`}
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="library_add" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Learn Spells</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
            <Input
              id="spell-search"
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${activeTrack.className.toLowerCase()} spells`}
            />
            <Select
              id="spell-level-filter"
              label="Spell Level"
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <option value="all">All</option>
              {Array.from({ length: Math.max(highestSpellLevel, 0) + 1 }, (_, index) => (
                <option key={index} value={String(index)}>
                  {index === 0 ? "Cantrip" : `Level ${index}`}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {filteredAvailableSpells.length === 0 ? (
              <EmptyState
                icon="search_off"
                title="No matching spells available"
                description="Try another filter, or level up to unlock higher-level spells."
              />
            ) : (
              filteredAvailableSpells.slice(0, 18).map((spell) => (
                <div key={spell.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{spell.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} · {spell.school}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">{spell.description}</p>
                    </div>
                    <Button size="sm" loading={learningSpellId === spell.id} onClick={() => handleLearnSpell(spell.id)}>
                      <Icon name="add" size={16} />
                      Learn
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="menu_book" size={18} className="text-secondary" />
          <h3 className="font-headline text-lg text-on-surface">Known Spells</h3>
        </div>

        {groupedKnownSpells.length === 0 ? (
          <EmptyState
            icon="auto_stories"
            title="No spells learned yet"
            description="Learn class spells from the panel above to start building the spellbook."
          />
        ) : (
          <div className="space-y-4">
            {groupedKnownSpells.map(([spellLevel, spells]) => (
              <div key={spellLevel}>
                <p className="mb-2 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
                  {spellLevel === 0 ? "Cantrips" : `Level ${spellLevel}`}
                </p>
                <div className="grid gap-3">
                  {spells.map((entry) => {
                    const sourceClass = entry.sourceClass ?? {
                      id: classTracks[0]?.classId ?? "primary",
                      name: classTracks[0]?.className ?? "Unknown",
                      primaryAbility: classTracks[0]?.primaryAbility ?? "intelligence",
                    };
                    const entryPreparedCaster = isPreparedCaster(sourceClass.name);
                    return (
                      <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-headline text-base text-on-surface">{entry.spell.name}</p>
                              <span className="rounded-full border border-outline-variant/10 bg-surface-container-high px-2 py-1 font-label text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">
                                {sourceClass.name}
                              </span>
                              {entry.spell.concentration && (
                                <span className="rounded-full border border-secondary/20 bg-secondary/10 px-2 py-1 font-label text-[9px] uppercase tracking-[0.16em] text-secondary">
                                  Concentration
                                </span>
                              )}
                              {entry.spell.ritual && (
                                <span className="rounded-full border border-outline-variant/10 bg-surface-container-high px-2 py-1 font-label text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">
                                  Ritual
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                              {entry.spell.school} · {entry.spell.castingTime} · {entry.spell.duration}
                            </p>
                            <p className="mt-2 text-sm text-on-surface-variant">{entry.spell.description}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {entryPreparedCaster ? (
                              <Button
                                variant={entry.isPrepared ? "secondary" : "ghost"}
                                size="sm"
                                loading={knownLoadingId === entry.spell.id}
                                onClick={() => handlePreparedToggle(entry.spell.id, !entry.isPrepared)}
                              >
                                <Icon name={entry.isPrepared ? "check_circle" : "radio_button_unchecked"} size={16} />
                                {entry.isPrepared ? "Prepared" : "Prepare"}
                              </Button>
                            ) : (
                              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-2 py-1 font-label text-[9px] uppercase tracking-[0.16em] text-secondary">
                                Ready
                              </span>
                            )}
                            <button
                              type="button"
                              className="text-on-surface-variant/50 transition-colors hover:text-error"
                              onClick={() => handleForgetSpell(entry.spell.id)}
                            >
                              <Icon name="delete" size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
