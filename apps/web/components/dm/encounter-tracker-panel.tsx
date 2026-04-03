"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CONDITIONS, type ConditionKey } from "@dnd-companion/shared";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/hooks/use-socket";
import {
  buildEncounterLiveState,
  cycleEncounterTurn,
  getEncounterLightingOpacity,
  parseEncounterMonsters,
  parseEncounterLiveState,
  type EncounterLiveState,
  type EncounterTrackerCharacter,
} from "@/lib/encounter-tracker";
import { computeVisibilityPolygon, getCoverBetween, parseMapRevealAreas, parseMapWalls, toSvgPolygon } from "@/lib/map-visibility";

interface EncounterTrackerPanelProps {
  campaignId: string;
  encounter: {
    id: string;
    name: string;
    status: string;
    liveState: unknown;
    monsters: unknown;
    notes: string | null;
  };
  characters: EncounterTrackerCharacter[];
  locations: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    mapData: unknown;
  }>;
  onRefresh: () => void;
}

interface EncounterMapMarker {
  id: string;
  label: string;
  kind: string;
  visibility: string;
  x: number;
  y: number;
}

function parseMapMarkers(value: unknown) {
  if (!value || typeof value !== "object") return [] as EncounterMapMarker[];
  const mapData = value as Record<string, unknown>;
  if (!Array.isArray(mapData.markers)) return [] as EncounterMapMarker[];
  return mapData.markers
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const marker = entry as Record<string, unknown>;
      return {
        id: String(marker.id || crypto.randomUUID()),
        label: String(marker.label || "Marker"),
        kind: String(marker.kind || "poi"),
        visibility: String(marker.visibility || "public"),
        x: Math.max(0, Math.min(100, Number(marker.x ?? 50) || 50)),
        y: Math.max(0, Math.min(100, Number(marker.y ?? 50) || 50)),
      } satisfies EncounterMapMarker;
    })
    .filter((entry): entry is EncounterMapMarker => Boolean(entry));
}

export function EncounterTrackerPanel({
  campaignId,
  encounter,
  characters,
  locations,
  onRefresh,
}: EncounterTrackerPanelProps) {
  const { emit } = useSocket();
  const [draft, setDraft] = useState<EncounterLiveState | null>(() => parseEncounterLiveState(encounter.liveState));
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);
  const [eventNote, setEventNote] = useState("");
  const [draggingCombatantId, setDraggingCombatantId] = useState<string | null>(null);
  const draftRef = useRef<EncounterLiveState | null>(draft);
  const mapBoardRef = useRef<HTMLDivElement | null>(null);
  const visionMaskId = useId().replace(/:/g, "");

  const availableConditions = Object.entries(CONDITIONS).filter(([key]) => key !== "EXHAUSTION") as Array<
    [ConditionKey, (typeof CONDITIONS)[ConditionKey]]
  >;
  const selectedMapLocation = locations.find((location) => location.id === draft?.mapLocationId) ?? null;
  const selectedWalls = useMemo(() => parseMapWalls(selectedMapLocation?.mapData), [selectedMapLocation?.mapData]);
  const revealedAreas = useMemo(() => parseMapRevealAreas(selectedMapLocation?.mapData), [selectedMapLocation?.mapData]);
  const fogEnabled = Boolean(
    selectedMapLocation?.mapData &&
      typeof selectedMapLocation.mapData === "object" &&
      (selectedMapLocation.mapData as Record<string, unknown>).fogEnabled
  );

  useEffect(() => {
    const nextDraft = parseEncounterLiveState(encounter.liveState);
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  }, [encounter.liveState]);

  const orderedCombatants = useMemo(
    () =>
      draft
        ? [...draft.combatants].sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name))
        : [],
    [draft]
  );
  const playerVisionCombatants = useMemo(
    () => orderedCombatants.filter((combatant) => combatant.kind === "player" && !combatant.defeated && combatant.visionRadius > 0),
    [orderedCombatants]
  );
  const visionPolygons = useMemo(
    () =>
      playerVisionCombatants.map((combatant) => ({
        id: combatant.id,
        points: computeVisibilityPolygon(
          { x: combatant.tokenX, y: combatant.tokenY },
          combatant.visionRadius,
          selectedWalls
        ),
      })),
    [playerVisionCombatants, selectedWalls]
  );
  const lightingOpacity = draft ? getEncounterLightingOpacity(draft.lightingMode) : 0;

  async function saveEncounter(
    nextState: EncounterLiveState | null,
    nextStatus = nextState ? (encounter.status === "completed" ? "completed" : "active") : encounter.status
  ) {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/encounters/${encounter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, liveState: nextState }),
      });

      if (response.ok) {
        setStatus({ kind: "success", message: "Encounter tracker updated." });
        emit("encounter:update", {
          campaignId,
          encounterId: encounter.id,
          encounterName: encounter.name,
          status: nextStatus,
          liveState: nextState,
        });
        onRefresh();
      } else {
        const data = await response.json().catch(() => ({}));
        setStatus({ kind: "error", message: String(data.error || "Could not update encounter tracker.") });
      }
    } finally {
      setLoading(false);
    }
  }

  async function startEncounter() {
    const nextState = buildEncounterLiveState(
      parseEncounterMonsters(encounter.monsters),
      characters,
      locations[0]?.id ?? null
    );
    draftRef.current = nextState;
    setDraft(nextState);
    await saveEncounter(nextState, "active");
  }

  function patchCombatant(
    combatantId: string,
    updater: (current: EncounterLiveState["combatants"][number]) => EncounterLiveState["combatants"][number]
  ) {
    setDraft((current) => {
      const nextState = current
        ? { ...current, combatants: current.combatants.map((entry) => (entry.id === combatantId ? updater(entry) : entry)) }
        : current;
      draftRef.current = nextState;
      return nextState;
    });
  }

  function patchDraft(updater: (current: EncounterLiveState) => EncounterLiveState) {
    setDraft((current) => {
      const nextState = current ? updater(current) : current;
      draftRef.current = nextState;
      return nextState;
    });
  }

  function moveCombatant(combatantId: string, x: number, y: number) {
    const currentDraft = draftRef.current;
    if (!currentDraft) return null;
    const nextState = {
      ...currentDraft,
      combatants: currentDraft.combatants.map((entry) =>
        entry.id === combatantId
          ? { ...entry, tokenX: Math.max(6, Math.min(94, x)), tokenY: Math.max(8, Math.min(92, y)) }
          : entry
      ),
    } satisfies EncounterLiveState;
    draftRef.current = nextState;
    setDraft(nextState);
    return nextState;
  }

  function moveCombatantFromPointer(combatantId: string, clientX: number, clientY: number) {
    const board = mapBoardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return moveCombatant(combatantId, ((clientX - rect.left) / rect.width) * 100, ((clientY - rect.top) / rect.height) * 100);
  }

  const activeCombatantId = draft?.activeCombatantId ?? null;
  const activeCombatant = orderedCombatants.find((combatant) => combatant.id === activeCombatantId) ?? null;

  return (
    <div className="space-y-4">
      {status && <FormStatus kind={status.kind} message={status.message} />}

      {!draft || draft.combatants.length === 0 ? (
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
          <EmptyState
            icon="swords"
            title="Tracker not started"
            description="Seed initiative from party members and encounter monsters, then run the fight round by round."
            action={
              <Button size="sm" onClick={startEncounter} loading={loading} className="glow-gold">
                <Icon name="play_arrow" size={14} />
                Start Combat
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip variant="active" icon="restart_alt">
                  Round {draft.round}
                </Chip>
                {activeCombatantId && (
                  <Chip variant="success" icon="play_circle">
                    {orderedCombatants.find((entry) => entry.id === activeCombatantId)?.name || "Active"}
                  </Chip>
                )}
                <Chip icon="groups_2">{draft.combatants.filter((entry) => !entry.defeated).length} up</Chip>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                    Battle Map
                  </label>
                  <select
                    className="mt-1 w-full rounded-sm border border-outline-variant/10 bg-surface-container-highest/80 px-4 py-3 font-body text-on-surface outline-none transition-all duration-300 focus:border-secondary/40"
                    value={draft.mapLocationId ?? ""}
                    onChange={(event) =>
                      patchDraft((current) => ({
                        ...current,
                        mapLocationId: event.target.value || null,
                      }))
                    }
                  >
                    <option value="">No linked location map</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                    Lighting
                  </label>
                  <select
                    className="mt-1 w-full rounded-sm border border-outline-variant/10 bg-surface-container-highest/80 px-4 py-3 font-body text-on-surface outline-none transition-all duration-300 focus:border-secondary/40"
                    value={draft.lightingMode}
                    onChange={(event) =>
                      patchDraft((current) => ({
                        ...current,
                        lightingMode:
                          event.target.value === "dark" || event.target.value === "dim"
                            ? event.target.value
                            : "bright",
                      }))
                    }
                  >
                    <option value="bright">Bright</option>
                    <option value="dim">Dim</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <Input
                  id={`encounter-objective-${encounter.id}`}
                  label="Encounter Objective"
                  value={draft.objective}
                  onChange={(event) => patchDraft((current) => ({ ...current, objective: event.target.value }))}
                  placeholder="Hold the gate until the ritual ends"
                />
                <Input
                  id={`encounter-environment-${encounter.id}`}
                  label="Environment"
                  value={draft.environment}
                  onChange={(event) => patchDraft((current) => ({ ...current, environment: event.target.value }))}
                  placeholder="Broken bridge, driving rain, weak footing"
                />
                <Input
                  id={`encounter-lair-init-${encounter.id}`}
                  label="Lair Action Initiative"
                  type="number"
                  value={draft.lairActionInitiative ?? ""}
                  onChange={(event) =>
                    patchDraft((current) => ({
                      ...current,
                      lairActionInitiative: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  placeholder="20"
                />
                <Input
                  id={`encounter-legendary-pool-${encounter.id}`}
                  label="Legendary Actions / Round"
                  type="number"
                  min={0}
                  value={draft.legendaryPool}
                  onChange={(event) =>
                    patchDraft((current) => {
                      const nextValue = Math.max(0, Number(event.target.value) || 0);
                      return { ...current, legendaryPool: nextValue, legendaryRemaining: nextValue };
                    })
                  }
                />
              </div>
              <div className="mt-3">
                <Textarea
                  id={`encounter-battlefield-${encounter.id}`}
                  label="Battlefield Notes"
                  rows={3}
                  value={draft.battlefieldNotes}
                  onChange={(event) => patchDraft((current) => ({ ...current, battlefieldNotes: event.target.value }))}
                  placeholder="Cover, hazards, objectives, reinforcements, triggers..."
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const nextState = cycleEncounterTurn(draft, -1);
                    draftRef.current = nextState;
                    setDraft(nextState);
                    await saveEncounter(nextState, "active");
                  }}
                >
                  <Icon name="navigate_before" size={14} />
                  Previous Turn
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const nextState = cycleEncounterTurn(draft, 1);
                    draftRef.current = nextState;
                    setDraft(nextState);
                    await saveEncounter(nextState, "active");
                  }}
                  className="glow-gold"
                >
                  <Icon name="navigate_next" size={14} />
                  Next Turn
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => patchDraft((current) => ({ ...current, legendaryRemaining: current.legendaryPool }))}
                >
                  <Icon name="refresh" size={14} />
                  Reset Legendary Pool
                </Button>
                <Button size="sm" variant="ghost" onClick={() => saveEncounter(draft, "completed")} loading={loading}>
                  <Icon name="check_circle" size={14} />
                  End Encounter
                </Button>
                <Button size="sm" variant="secondary" onClick={() => saveEncounter(draft, "active")} loading={loading}>
                  <Icon name="save" size={14} />
                  Save Tracker
                </Button>
              </div>
              <div className="mt-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon name="map" size={16} className="text-secondary" />
                    <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                      Battle Map Runtime
                    </span>
                  </div>
                  {selectedMapLocation && <span className="text-xs text-on-surface-variant">{selectedMapLocation.name}</span>}
                </div>

                {selectedMapLocation?.imageUrl ? (
                  <div
                    ref={mapBoardRef}
                    className="relative aspect-[16/10] touch-none overflow-hidden rounded-sm border border-outline-variant/10 bg-surface-container-high"
                  >
                    <img src={selectedMapLocation.imageUrl} alt={selectedMapLocation.name} className="h-full w-full object-cover" />
                    {fogEnabled && (
                      <div className="pointer-events-none absolute inset-0 bg-background/55">
                        {revealedAreas.map((area) => (
                          <div
                            key={area.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                            style={{
                              left: `${area.x}%`,
                              top: `${area.y}%`,
                              width: `${area.radius * 2}%`,
                              height: `${area.radius * 2}%`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {parseMapMarkers(selectedMapLocation.mapData)
                      .filter((marker) => marker.visibility !== "dm")
                      .map((marker) => (
                        <div
                          key={marker.id}
                          className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-background bg-secondary/80 text-[9px] text-background shadow-whisper"
                          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                          title={marker.label}
                        >
                          <Icon name="place" size={10} />
                        </div>
                      ))}
                    {selectedWalls.map((wall) => (
                      <div
                        key={wall.id}
                        className="pointer-events-none absolute origin-center rounded-full bg-background/85 shadow-whisper"
                        style={{
                          left: `${(wall.x1 + wall.x2) / 2}%`,
                          top: `${(wall.y1 + wall.y2) / 2}%`,
                          width: `${Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1)}%`,
                          height: "0.45rem",
                          transform: `translate(-50%, -50%) rotate(${Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1)}rad)`,
                        }}
                        title="Wall"
                      />
                    ))}
                    {lightingOpacity > 0 && playerVisionCombatants.length > 0 && (
                      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                        <defs>
                          <mask id={visionMaskId}>
                            <rect width="100%" height="100%" fill="white" />
                            {visionPolygons.map((polygon) => (
                              <polygon
                                key={`${polygon.id}-vision`}
                                points={toSvgPolygon(polygon.points)}
                                fill="black"
                              />
                            ))}
                          </mask>
                        </defs>
                        <rect
                          width="100%"
                          height="100%"
                          fill="#05080E"
                          fillOpacity={lightingOpacity}
                          mask={`url(#${visionMaskId})`}
                        />
                      </svg>
                    )}
                    {orderedCombatants.map((combatant) => (
                      <button
                        key={`${combatant.id}-token`}
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          setDraggingCombatantId(combatant.id);
                          event.currentTarget.setPointerCapture(event.pointerId);
                          moveCombatantFromPointer(combatant.id, event.clientX, event.clientY);
                        }}
                        onPointerMove={(event) => {
                          if (draggingCombatantId !== combatant.id) return;
                          moveCombatantFromPointer(combatant.id, event.clientX, event.clientY);
                        }}
                        onPointerUp={(event) => {
                          if (draggingCombatantId !== combatant.id) return;
                          moveCombatantFromPointer(combatant.id, event.clientX, event.clientY);
                          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            event.currentTarget.releasePointerCapture(event.pointerId);
                          }
                          setDraggingCombatantId(null);
                          if (draftRef.current) {
                            void saveEncounter(draftRef.current, "active");
                          }
                        }}
                        onPointerCancel={(event) => {
                          if (draggingCombatantId !== combatant.id) return;
                          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            event.currentTarget.releasePointerCapture(event.pointerId);
                          }
                          setDraggingCombatantId(null);
                        }}
                        className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background text-xs font-bold shadow-whisper transition-transform ${
                          combatant.kind === "player"
                            ? "bg-primary text-background"
                            : combatant.defeated
                              ? "bg-surface-container-high text-on-surface-variant"
                              : "bg-error text-background"
                        } ${draggingCombatantId === combatant.id ? "scale-110 cursor-grabbing" : "cursor-grab"}`}
                        style={{ left: `${combatant.tokenX}%`, top: `${combatant.tokenY}%` }}
                        title={`${combatant.name} · drag to move`}
                      >
                        {combatant.name.slice(0, 1).toUpperCase()}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">
                    Choose a location with map art to track token positions during combat.
                  </p>
                )}
                {selectedMapLocation?.imageUrl && (
                  <p className="mt-3 text-xs text-on-surface-variant">
                    Drag tokens to reposition them. Lighting previews player sightlines, while revealed fog areas show what the party has actually uncovered.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="notes" size={16} className="text-secondary" />
                <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                  Recent Combat Notes
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  id={`encounter-event-note-${encounter.id}`}
                  label="Add Event"
                  value={eventNote}
                  onChange={(event) => setEventNote(event.target.value)}
                  placeholder="Cleric broke concentration on Hold Person"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const note = eventNote.trim();
                    if (!note) return;
                    patchDraft((current) => ({ ...current, recentEvents: [note, ...current.recentEvents].slice(0, 8) }));
                    setEventNote("");
                  }}
                >
                  <Icon name="add_comment" size={14} />
                  Log
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {draft.recentEvents.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No combat events logged yet.</p>
                ) : (
                  draft.recentEvents.map((entry, index) => (
                    <div
                      key={`${index}-${entry}`}
                      className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-3 text-sm text-on-surface-variant"
                    >
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <div className="space-y-3">
            {orderedCombatants.map((combatant) => (
              <div
                key={combatant.id}
                className={`rounded-sm border p-4 transition-all ${
                  combatant.id === activeCombatantId
                    ? "border-secondary/30 bg-secondary/5"
                    : "border-outline-variant/8 bg-surface-container"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-headline text-base text-on-surface">{combatant.name}</p>
                      <Chip
                        variant={combatant.kind === "player" ? "success" : "default"}
                        icon={combatant.kind === "player" ? "shield_person" : "pest_control"}
                      >
                        {combatant.kind}
                      </Chip>
                      {combatant.id === activeCombatantId && <Chip variant="active" icon="play_arrow">Current Turn</Chip>}
                      {combatant.defeated && <Chip variant="condition" icon="skull">Down</Chip>}
                    </div>
                    {combatant.notes && <p className="mt-2 text-sm text-on-surface-variant">{combatant.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => patchDraft((current) => ({ ...current, activeCombatantId: combatant.id }))}
                    >
                      <Icon name="my_location" size={14} />
                      Set Active
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        patchCombatant(combatant.id, (current) => ({
                          ...current,
                          defeated: !current.defeated,
                          currentHP: current.defeated ? Math.max(1, current.currentHP) : 0,
                        }))
                      }
                    >
                      <Icon name={combatant.defeated ? "favorite" : "skull"} size={14} />
                      {combatant.defeated ? "Revive" : "Mark Down"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-8">
                  <Input id={`${combatant.id}-initiative`} label="Initiative" type="number" value={combatant.initiative} onChange={(event) => patchCombatant(combatant.id, (current) => ({ ...current, initiative: Number(event.target.value) || 0 }))} />
                  <Input id={`${combatant.id}-current-hp`} label="Current HP" type="number" min={0} value={combatant.currentHP} onChange={(event) => patchCombatant(combatant.id, (current) => { const nextHp = Math.max(0, Number(event.target.value) || 0); return { ...current, currentHP: nextHp, defeated: nextHp <= 0 }; })} />
                  <Input id={`${combatant.id}-max-hp`} label="Max HP" type="number" min={1} value={combatant.maxHP} onChange={(event) => patchCombatant(combatant.id, (current) => ({ ...current, maxHP: Math.max(1, Number(event.target.value) || 1) }))} />
                  <Input id={`${combatant.id}-ac`} label="AC" type="number" min={0} value={combatant.armorClass} onChange={(event) => patchCombatant(combatant.id, (current) => ({ ...current, armorClass: Math.max(0, Number(event.target.value) || 0) }))} />
                  <Input id={`${combatant.id}-token-x`} label="Token X" type="number" min={0} max={100} value={Math.round(combatant.tokenX)} onChange={(event) => moveCombatant(combatant.id, Number(event.target.value) || 0, combatant.tokenY)} />
                  <Input id={`${combatant.id}-token-y`} label="Token Y" type="number" min={0} max={100} value={Math.round(combatant.tokenY)} onChange={(event) => moveCombatant(combatant.id, combatant.tokenX, Number(event.target.value) || 0)} />
                  <Input id={`${combatant.id}-vision-radius`} label="Vision Radius" type="number" min={8} max={48} value={combatant.visionRadius} onChange={(event) => patchCombatant(combatant.id, (current) => ({ ...current, visionRadius: Math.max(8, Math.min(48, Number(event.target.value) || 8)) }))} />
                  <Input id={`${combatant.id}-concentration`} label="Concentration" value={combatant.concentrationSpell || ""} onChange={(event) => patchCombatant(combatant.id, (current) => ({ ...current, concentrationSpell: event.target.value.trim() || null }))} placeholder="Bless" />
                </div>
                {activeCombatant && activeCombatant.id !== combatant.id && (
                  <p className="mt-3 text-xs text-on-surface-variant">
                    Cover from {activeCombatant.name}:{" "}
                    {getCoverBetween(
                      { x: activeCombatant.tokenX, y: activeCombatant.tokenY },
                      { x: combatant.tokenX, y: combatant.tokenY },
                      selectedWalls
                    )}
                  </p>
                )}

                <div className="mt-4">
                  <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">Conditions</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableConditions.map(([conditionKey, condition]) => {
                      const active = combatant.conditions.includes(conditionKey);
                      return (
                        <button
                          key={conditionKey}
                          type="button"
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                            active
                              ? "border-error/30 bg-error/10 text-error"
                              : "border-outline-variant/10 bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                          }`}
                          onClick={() =>
                            patchCombatant(combatant.id, (current) => ({
                              ...current,
                              conditions: current.conditions.includes(conditionKey)
                                ? current.conditions.filter((entry) => entry !== conditionKey)
                                : [...current.conditions, conditionKey],
                            }))
                          }
                          title={condition.description}
                        >
                          <Icon name={condition.icon} size={14} />
                          {condition.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
