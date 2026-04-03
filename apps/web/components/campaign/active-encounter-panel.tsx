"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { getEncounterLightingOpacity, parseEncounterLiveState } from "@/lib/encounter-tracker";
import { computeVisibilityPolygon, parseMapWalls, toSvgPolygon } from "@/lib/map-visibility";

interface EncounterSummary {
  id: string;
  name: string;
  status: string;
  difficulty: string | null;
  liveState: unknown;
}

interface LocationSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  mapData: unknown;
}

interface Props {
  encounters: EncounterSummary[];
  locations: LocationSummary[];
}

interface MapMarker {
  id: string;
  label: string;
  visibility: string;
  x: number;
  y: number;
}

function parseMapMarkers(value: unknown) {
  if (!value || typeof value !== "object") return [] as MapMarker[];
  const mapData = value as Record<string, unknown>;
  if (!Array.isArray(mapData.markers)) return [] as MapMarker[];
  return mapData.markers
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const marker = entry as Record<string, unknown>;
      return {
        id: String(marker.id || crypto.randomUUID()),
        label: String(marker.label || "Marker"),
        visibility: String(marker.visibility || "public"),
        x: Math.max(0, Math.min(100, Number(marker.x ?? 50) || 50)),
        y: Math.max(0, Math.min(100, Number(marker.y ?? 50) || 50)),
      } satisfies MapMarker;
    })
    .filter((entry): entry is MapMarker => Boolean(entry))
    .filter((entry) => entry.visibility !== "dm");
}

export function ActiveEncounterPanel({ encounters, locations }: Props) {
  const activeEncounters = useMemo(
    () => encounters.filter((encounter) => encounter.status === "active" && parseEncounterLiveState(encounter.liveState)),
    [encounters]
  );
  const [selectedId, setSelectedId] = useState<string | null>(activeEncounters[0]?.id ?? null);
  const visionMaskId = useId().replace(/:/g, "");
  useEffect(() => {
    if (!activeEncounters.some((encounter) => encounter.id === selectedId)) {
      setSelectedId(activeEncounters[0]?.id ?? null);
    }
  }, [activeEncounters, selectedId]);
  const selectedEncounter = activeEncounters.find((encounter) => encounter.id === selectedId) ?? activeEncounters[0] ?? null;
  const liveState = selectedEncounter ? parseEncounterLiveState(selectedEncounter.liveState) : null;
  const location = liveState?.mapLocationId ? locations.find((entry) => entry.id === liveState.mapLocationId) ?? null : null;
  const markers = parseMapMarkers(location?.mapData);
  const walls = parseMapWalls(location?.mapData);
  const playerVisionCombatants = liveState
    ? liveState.combatants.filter((combatant) => combatant.kind === "player" && !combatant.defeated && combatant.visionRadius > 0)
    : [];
  const visionPolygons = playerVisionCombatants.map((combatant) => ({
    id: combatant.id,
    points: computeVisibilityPolygon({ x: combatant.tokenX, y: combatant.tokenY }, combatant.visionRadius, walls),
  }));
  const lightingOpacity = liveState ? getEncounterLightingOpacity(liveState.lightingMode) : 0;

  if (!selectedEncounter || !liveState) {
    return (
      <EmptyState
        icon="swords"
        title="No active battle right now"
        description="When the DM starts a live encounter, the party board will appear here with turn order and battle-map state."
      />
    );
  }

  const orderedCombatants = [...liveState.combatants].sort(
    (a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="swords" size={18} className="text-secondary" />
          <h3 className="font-headline text-lg text-on-surface">Active Encounter</h3>
        </div>
        <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
          Round {liveState.round}
        </span>
      </div>

      {activeEncounters.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {activeEncounters.map((encounter) => (
            <button
              key={encounter.id}
              type="button"
              onClick={() => setSelectedId(encounter.id)}
              className={`rounded-full border px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.16em] transition-colors ${
                selectedEncounter.id === encounter.id
                  ? "border-secondary/30 bg-secondary/10 text-secondary"
                  : "border-outline-variant/10 bg-surface-container text-on-surface-variant hover:border-secondary/20"
              }`}
            >
              {encounter.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
            <p className="font-headline text-base text-on-surface">{selectedEncounter.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
              {selectedEncounter.difficulty || "Encounter"} · {liveState.objective || "No objective tracked"}
            </p>
            {liveState.environment && (
              <p className="mt-3 text-sm text-on-surface-variant">{liveState.environment}</p>
            )}
          </div>

          <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-outline-variant/10 bg-surface-container">
            {location?.imageUrl ? (
              <img src={location.imageUrl} alt={location.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                No shared encounter map selected.
              </div>
            )}

            {markers.map((marker) => (
              <div
                key={marker.id}
                className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-background bg-secondary/80 text-background shadow-whisper"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                title={marker.label}
              >
                <Icon name="place" size={10} />
              </div>
            ))}
            {walls.map((wall) => (
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
              <div
                key={combatant.id}
                className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background text-xs font-bold shadow-whisper ${
                  combatant.kind === "player"
                    ? "bg-primary text-background"
                    : combatant.defeated
                      ? "bg-surface-container-high text-on-surface-variant"
                      : "bg-error text-background"
                }`}
                style={{ left: `${combatant.tokenX}%`, top: `${combatant.tokenY}%` }}
                title={combatant.name}
              >
                {combatant.name.slice(0, 1).toUpperCase()}
              </div>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant">
            Tokens update from the DM’s live battle board. Visible map markers match the party-facing map state.
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-headline text-base text-on-surface">Initiative Order</p>
              {liveState.activeCombatantId && (
                <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary">
                  Current turn
                </span>
              )}
            </div>
            <div className="space-y-2">
              {orderedCombatants.map((combatant) => (
                <div
                  key={combatant.id}
                  className={`rounded-sm border p-3 ${
                    liveState.activeCombatantId === combatant.id
                      ? "border-secondary/25 bg-secondary/5"
                      : "border-outline-variant/8 bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-body text-sm font-semibold text-on-surface">{combatant.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {combatant.kind} · init {combatant.initiative}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-headline text-sm text-on-surface">
                        {combatant.currentHP}/{combatant.maxHP}
                      </p>
                      {combatant.defeated && (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-error">Down</p>
                      )}
                    </div>
                  </div>
                  {combatant.conditions.length > 0 && (
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Conditions: {combatant.conditions.join(", ")}
                    </p>
                  )}
                  {combatant.concentrationSpell && (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Concentrating: {combatant.concentrationSpell}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
