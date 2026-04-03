"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";

type MarkerKind = "poi" | "hazard" | "loot" | "npc" | "travel" | "secret";
type MarkerVisibility = "public" | "discovered" | "dm";

interface LocationExplorerLocation {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  mapData: unknown;
  description: string | null;
}

interface Props {
  locations: LocationExplorerLocation[];
}

interface MapMarker {
  id: string;
  label: string;
  kind: MarkerKind;
  visibility: MarkerVisibility;
  description: string;
  x: number;
  y: number;
}

interface MapWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const MARKER_CONFIG: Record<MarkerKind, { icon: string; className: string }> = {
  poi: { icon: "place", className: "bg-secondary text-background" },
  hazard: { icon: "warning", className: "bg-error text-background" },
  loot: { icon: "diamond", className: "bg-amber-500 text-background" },
  npc: { icon: "groups", className: "bg-primary text-background" },
  travel: { icon: "route", className: "bg-green-500 text-background" },
  secret: { icon: "visibility_off", className: "bg-purple-500 text-background" },
};

function normalizeMarkers(value: unknown) {
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
        kind: marker.kind === "hazard" || marker.kind === "loot" || marker.kind === "npc" || marker.kind === "travel" || marker.kind === "secret" ? marker.kind : "poi",
        visibility: marker.visibility === "dm" || marker.visibility === "discovered" ? marker.visibility : "public",
        description: String(marker.description || ""),
        x: Math.max(0, Math.min(100, Number(marker.x ?? 50) || 50)),
        y: Math.max(0, Math.min(100, Number(marker.y ?? 50) || 50)),
      } satisfies MapMarker;
    })
    .filter((entry): entry is MapMarker => Boolean(entry))
    .filter((entry) => entry.visibility !== "dm");
}

function normalizeWalls(value: unknown) {
  if (!value || typeof value !== "object") return [] as MapWall[];
  const mapData = value as Record<string, unknown>;
  if (!Array.isArray(mapData.walls)) return [] as MapWall[];

  return mapData.walls
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const wall = entry as Record<string, unknown>;
      return {
        id: String(wall.id || crypto.randomUUID()),
        x1: Math.max(0, Math.min(100, Number(wall.x1 ?? 0) || 0)),
        y1: Math.max(0, Math.min(100, Number(wall.y1 ?? 0) || 0)),
        x2: Math.max(0, Math.min(100, Number(wall.x2 ?? 100) || 100)),
        y2: Math.max(0, Math.min(100, Number(wall.y2 ?? 100) || 100)),
      } satisfies MapWall;
    })
    .filter((entry): entry is MapWall => Boolean(entry));
}

export function LocationExplorerPanel({ locations }: Props) {
  const explorableLocations = useMemo(
    () => locations.filter((location) => location.imageUrl || normalizeMarkers(location.mapData).length > 0),
    [locations]
  );
  const [selectedId, setSelectedId] = useState<string | null>(explorableLocations[0]?.id ?? null);
  const selectedLocation = explorableLocations.find((location) => location.id === selectedId) ?? explorableLocations[0] ?? null;
  const markers = normalizeMarkers(selectedLocation?.mapData);
  const walls = normalizeWalls(selectedLocation?.mapData);

  if (explorableLocations.length === 0) {
    return (
      <EmptyState
        icon="map"
        title="No shared maps revealed yet"
        description="Public map locations will appear here when the DM uploads maps or reveals discoverable points."
      />
    );
  }

  return (
    <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
      <div className="flex items-center gap-2">
        <Icon name="travel_explore" size={18} className="text-secondary" />
        <h3 className="font-headline text-lg text-on-surface">Location Explorer</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {explorableLocations.map((location) => (
          <button
            key={location.id}
            type="button"
            onClick={() => setSelectedId(location.id)}
            className={`rounded-full border px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.16em] transition-colors ${
              selectedLocation?.id === location.id
                ? "border-secondary/30 bg-secondary/10 text-secondary"
                : "border-outline-variant/10 bg-surface-container text-on-surface-variant hover:border-secondary/20"
            }`}
          >
            {location.name}
          </button>
        ))}
      </div>

      {selectedLocation && (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-outline-variant/10 bg-surface-container">
              {selectedLocation.imageUrl ? (
                <img src={selectedLocation.imageUrl} alt={selectedLocation.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                  No map art uploaded for this location yet.
                </div>
              )}
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background shadow-whisper ${MARKER_CONFIG[marker.kind].className}`}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  title={marker.label}
                >
                  <Icon name={MARKER_CONFIG[marker.kind].icon} size={14} />
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
            </div>
            <p className="text-xs text-on-surface-variant">
              Visible markers are either fully public or already discovered by the party. Shared walls now appear on revealed battle maps.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <p className="font-headline text-base text-on-surface">{selectedLocation.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">{selectedLocation.type}</p>
              {selectedLocation.description && (
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{selectedLocation.description}</p>
              )}
            </div>

            <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-headline text-base text-on-surface">Revealed Markers</p>
                <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                  {markers.length} visible
                </span>
              </div>

              {markers.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No revealed markers yet.</p>
              ) : (
                <div className="space-y-2">
                  {markers.map((marker) => (
                    <div key={marker.id} className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-3">
                      <p className="font-body text-sm font-semibold text-on-surface">{marker.label}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {marker.kind}
                        {marker.visibility === "discovered" ? " · discovered" : " · public"}
                      </p>
                      {marker.description && (
                        <p className="mt-2 text-sm text-on-surface-variant">{marker.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
