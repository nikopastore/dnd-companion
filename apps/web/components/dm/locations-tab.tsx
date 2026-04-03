"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { ImageUpload } from "@/components/ui/image-upload";
import { FormStatus } from "@/components/ui/form-status";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";
import { OptionGallery } from "@/components/builder/option-gallery";
import { useSocket } from "@/hooks/use-socket";

type LocationType = "region" | "city" | "dungeon" | "wilderness" | "building" | "tavern" | "temple";
type MarkerKind = "poi" | "hazard" | "loot" | "npc" | "travel" | "secret";
type MarkerVisibility = "public" | "discovered" | "dm";
type GridMode = "none" | "square" | "hex";
type MapMode = "world" | "location" | "battle";

interface Location {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  mapData: unknown;
  description: string | null;
  notes: string | null;
  parentId: string | null;
  children?: Array<{ id: string; name: string; type: string }>;
}

interface Props {
  locations: Location[];
  campaignId: string;
  onAdd: (location: Location) => void;
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

interface MapRevealArea {
  id: string;
  x: number;
  y: number;
  radius: number;
}

interface LocationMapData {
  mapMode: MapMode;
  gridMode: GridMode;
  fogEnabled: boolean;
  overlays: string[];
  markers: MapMarker[];
  walls: MapWall[];
  revealedAreas: MapRevealArea[];
}

interface TreeNode extends Location {
  children: TreeNode[];
}

const SCALE_OPTIONS = [
  { id: "small-site", title: "Small Site", description: "Single room, cabin, shrine, or compact point of interest.", subtitle: "Focused encounter map", entityType: "location" as const, meta: ["Tight scope"] },
  { id: "district", title: "District", description: "Neighborhood, cave wing, market ward, or multipart district.", subtitle: "Multi-scene zone", entityType: "location" as const, meta: ["Exploration"] },
  { id: "landmark", title: "Landmark", description: "Castle, ruins, temple complex, or major named destination.", subtitle: "Adventure hub", entityType: "location" as const, meta: ["Major location"] },
  { id: "region", title: "Region", description: "Wilderness stretch, kingdom section, travel route, or broad territory.", subtitle: "World map scale", entityType: "location" as const, meta: ["Travel map"] },
];

const OCCUPANCY_OPTIONS = [
  { id: "peaceful", title: "Peaceful", description: "Safe, active, and socially stable with little immediate danger.", subtitle: "Low conflict", entityType: "location" as const, meta: ["Settled"] },
  { id: "inhabited", title: "Inhabited", description: "Busy with factions, townsfolk, or creatures that shape the space.", subtitle: "Active population", entityType: "location" as const, meta: ["Social play"] },
  { id: "contested", title: "Contested", description: "Two or more groups want control, creating tension and moving fronts.", subtitle: "Conflict zone", entityType: "location" as const, meta: ["Pressure"] },
  { id: "ruined", title: "Ruined", description: "Broken, abandoned, or decaying, with history visible in the environment.", subtitle: "Collapsed past", entityType: "location" as const, meta: ["Exploration"] },
  { id: "boss-lair", title: "Boss Lair", description: "Engineered around a dangerous central threat, trap, or final confrontation.", subtitle: "High danger", entityType: "location" as const, meta: ["Encounter focus"] },
];

const TYPE_CONFIG: Record<LocationType, { label: string; icon: string; color: string }> = {
  region: { label: "Region", icon: "public", color: "text-blue-400" },
  city: { label: "City", icon: "location_city", color: "text-yellow-400" },
  dungeon: { label: "Dungeon", icon: "castle", color: "text-error" },
  wilderness: { label: "Wilderness", icon: "forest", color: "text-green-400" },
  building: { label: "Building", icon: "home", color: "text-orange-400" },
  tavern: { label: "Tavern", icon: "sports_bar", color: "text-amber-400" },
  temple: { label: "Temple", icon: "church", color: "text-purple-400" },
};

const MARKER_CONFIG: Record<MarkerKind, { icon: string; color: string; label: string }> = {
  poi: { icon: "place", color: "bg-secondary text-background", label: "Point of Interest" },
  hazard: { icon: "warning", color: "bg-error text-background", label: "Hazard" },
  loot: { icon: "diamond", color: "bg-amber-500 text-background", label: "Loot" },
  npc: { icon: "groups", color: "bg-primary text-background", label: "NPC" },
  travel: { icon: "route", color: "bg-green-500 text-background", label: "Travel" },
  secret: { icon: "visibility_off", color: "bg-purple-500 text-background", label: "Secret" },
};

function buildTree(locations: Location[]): TreeNode[] {
  const nodeMap: Record<string, TreeNode> = {};
  const roots: TreeNode[] = [];

  locations.forEach((loc) => {
    nodeMap[loc.id] = { ...loc, children: [] };
  });

  locations.forEach((loc) => {
    const node = nodeMap[loc.id];
    if (loc.parentId && nodeMap[loc.parentId]) {
      nodeMap[loc.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function normalizeMapData(value: unknown): LocationMapData {
  if (!value || typeof value !== "object") {
    return {
      mapMode: "location",
      gridMode: "none",
      fogEnabled: false,
      overlays: [],
      markers: [],
      walls: [],
      revealedAreas: [],
    };
  }

  const source = value as Record<string, unknown>;
  return {
    mapMode: source.mapMode === "world" || source.mapMode === "battle" ? source.mapMode : "location",
    gridMode: source.gridMode === "square" || source.gridMode === "hex" ? source.gridMode : "none",
    fogEnabled: Boolean(source.fogEnabled),
    overlays: Array.isArray(source.overlays) ? source.overlays.map((entry) => String(entry).trim()).filter(Boolean) : [],
    markers: Array.isArray(source.markers)
      ? source.markers
          .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const marker = entry as Record<string, unknown>;
            return {
              id: String(marker.id || crypto.randomUUID()),
              label: String(marker.label || "Marker").trim() || "Marker",
              kind: marker.kind === "hazard" || marker.kind === "loot" || marker.kind === "npc" || marker.kind === "travel" || marker.kind === "secret" ? marker.kind : "poi",
              visibility: marker.visibility === "dm" || marker.visibility === "discovered" ? marker.visibility : "public",
              description: String(marker.description || "").trim(),
              x: Math.max(0, Math.min(100, Number(marker.x ?? 50) || 50)),
              y: Math.max(0, Math.min(100, Number(marker.y ?? 50) || 50)),
            } satisfies MapMarker;
          })
          .filter((entry): entry is MapMarker => Boolean(entry))
      : [],
    walls: Array.isArray(source.walls)
      ? source.walls
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
          .filter((entry): entry is MapWall => Boolean(entry))
      : [],
    revealedAreas: Array.isArray(source.revealedAreas)
      ? source.revealedAreas
          .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const area = entry as Record<string, unknown>;
            return {
              id: String(area.id || crypto.randomUUID()),
              x: Math.max(0, Math.min(100, Number(area.x ?? 50) || 50)),
              y: Math.max(0, Math.min(100, Number(area.y ?? 50) || 50)),
              radius: Math.max(4, Math.min(40, Number(area.radius ?? 16) || 16)),
            } satisfies MapRevealArea;
          })
          .filter((entry): entry is MapRevealArea => Boolean(entry))
      : [],
  };
}

function LocationNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (locationId: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const config = TYPE_CONFIG[node.type as LocationType] || TYPE_CONFIG.region;
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const mapData = normalizeMapData(node.mapData);

  return (
    <div className="animate-fade-in-up">
      <div
        className={`flex items-center gap-2 rounded-sm border p-3 transition-all duration-300 ${
          isSelected
            ? "border-secondary/30 bg-surface-container"
            : "border-outline-variant/8 bg-surface-container-low hover:border-secondary/15"
        }`}
        style={{ marginLeft: depth * 20 }}
      >
        {hasChildren ? (
          <button type="button" onClick={() => setExpanded((prev) => !prev)} className="text-on-surface/40 hover:text-on-surface transition-colors">
            <Icon name={expanded ? "expand_more" : "chevron_right"} size={16} />
          </button>
        ) : (
          <span className="w-4" />
        )}

        <button type="button" onClick={() => onSelect(node.id)} className="flex flex-1 items-center gap-2 text-left">
          <Icon name={config.icon} size={18} className={config.color} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-sm font-semibold text-on-surface">{node.name}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-on-surface-variant/50">
              {config.label}
              {node.imageUrl ? " · map image" : ""}
              {mapData.markers.length > 0 ? ` · ${mapData.markers.length} marker${mapData.markers.length === 1 ? "" : "s"}` : ""}
            </p>
          </div>
        </button>

        {hasChildren && <span className="font-label text-[10px] text-on-surface/30">{node.children.length}</span>}
      </div>

      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <LocationNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationsTab({ locations, campaignId, onAdd }: Props) {
  const { emit } = useSocket();
  const [locationList, setLocationList] = useState<Location[]>(locations);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingMap, setSavingMap] = useState(false);
  const [builderStep, setBuilderStep] = useState<0 | 1 | 2>(0);
  const [status, setStatus] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("region");
  const [scale, setScale] = useState("landmark");
  const [occupancy, setOccupancy] = useState("inhabited");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [parentId, setParentId] = useState("");
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(locations[0]?.id ?? null);
  const [mapDraft, setMapDraft] = useState<LocationMapData>(normalizeMapData(null));
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedRevealId, setSelectedRevealId] = useState<string | null>(null);
  const [mapTool, setMapTool] = useState<"marker" | "wall" | "reveal">("marker");
  const [pendingWallPoint, setPendingWallPoint] = useState<{ x: number; y: number } | null>(null);
  const [overlayText, setOverlayText] = useState("");

  useEffect(() => {
    setLocationList(locations);
    setSelectedLocationId((prev) => (prev && locations.some((loc) => loc.id === prev) ? prev : locations[0]?.id ?? null));
  }, [locations]);

  const tree = useMemo(() => buildTree(locationList), [locationList]);
  const selectedLocation = useMemo(
    () => locationList.find((location) => location.id === selectedLocationId) ?? null,
    [locationList, selectedLocationId]
  );

  useEffect(() => {
    if (!selectedLocation) {
      setMapImageUrl(null);
      setMapDraft(normalizeMapData(null));
      setEditingMarkerId(null);
      setSelectedWallId(null);
      setSelectedRevealId(null);
      setPendingWallPoint(null);
      setOverlayText("");
      return;
    }

    const normalized = normalizeMapData(selectedLocation.mapData);
    setMapImageUrl(selectedLocation.imageUrl);
    setMapDraft(normalized);
    setEditingMarkerId(normalized.markers[0]?.id ?? null);
    setSelectedWallId(normalized.walls[0]?.id ?? null);
    setSelectedRevealId(normalized.revealedAreas[0]?.id ?? null);
    setPendingWallPoint(null);
    setOverlayText(normalized.overlays.join(", "));
  }, [selectedLocation]);

  const editingMarker = mapDraft.markers.find((marker) => marker.id === editingMarkerId) ?? null;
  const selectedWall = mapDraft.walls.find((wall) => wall.id === selectedWallId) ?? null;
  const selectedRevealArea = mapDraft.revealedAreas.find((area) => area.id === selectedRevealId) ?? null;

  function resetForm() {
    setName("");
    setType("region");
    setScale("landmark");
    setOccupancy("inhabited");
    setDescription("");
    setNotes("");
    setParentId("");
    setMapImageUrl(null);
    setBuilderStep(0);
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        type,
        imageUrl: mapImageUrl,
        description: description.trim()
          ? `Scale: ${scale}. Occupancy: ${occupancy}. ${description.trim()}`
          : `Scale: ${scale}. Occupancy: ${occupancy}.`,
        notes: notes.trim() || null,
        parentId: parentId || null,
        mapData: {
          mapMode: scale === "region" ? "world" : scale === "small-site" ? "battle" : "location",
          gridMode: scale === "small-site" ? "square" : "none",
          fogEnabled: occupancy === "boss-lair" || occupancy === "ruined",
          overlays: [scale, occupancy],
          markers: [],
          walls: [],
          revealedAreas: [],
        },
      }),
    });
    setLoading(false);
    if (res.ok) {
      const location = await res.json();
      setLocationList((prev) => [...prev, location]);
      setSelectedLocationId(location.id);
      setStatus({ kind: "success", message: "Location and map card created." });
      onAdd(location);
      resetForm();
      setShowForm(false);
    } else {
      setStatus({ kind: "error", message: "Could not create location." });
    }
  }

  function updateMarker(markerId: string, changes: Partial<MapMarker>) {
    setMapDraft((prev) => ({
      ...prev,
      markers: prev.markers.map((marker) => (marker.id === markerId ? { ...marker, ...changes } : marker)),
    }));
  }

  function addMarkerFromClick(event: MouseEvent<HTMLDivElement>) {
    if (!mapImageUrl) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const marker: MapMarker = {
      id: crypto.randomUUID(),
      label: `Marker ${mapDraft.markers.length + 1}`,
      kind: "poi",
      visibility: "public",
      description: "",
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
    setMapDraft((prev) => ({ ...prev, markers: [...prev.markers, marker] }));
    setEditingMarkerId(marker.id);
  }

  function addWallPointFromClick(event: MouseEvent<HTMLDivElement>) {
    if (!mapImageUrl) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };

    if (!pendingWallPoint) {
      setPendingWallPoint(point);
      return;
    }

    const wall: MapWall = {
      id: crypto.randomUUID(),
      x1: pendingWallPoint.x,
      y1: pendingWallPoint.y,
      x2: point.x,
      y2: point.y,
    };
    setMapDraft((prev) => ({ ...prev, walls: [...prev.walls, wall] }));
    setSelectedWallId(wall.id);
    setPendingWallPoint(null);
  }

  function addRevealAreaFromClick(event: MouseEvent<HTMLDivElement>) {
    if (!mapImageUrl) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const area: MapRevealArea = {
      id: crypto.randomUUID(),
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
      radius: 16,
    };
    setMapDraft((prev) => ({ ...prev, revealedAreas: [...prev.revealedAreas, area] }));
    setSelectedRevealId(area.id);
  }

  async function saveMapStudio() {
    if (!selectedLocation) return;
    setSavingMap(true);
    try {
      const nextMapData: LocationMapData = {
        ...mapDraft,
        overlays: overlayText.split(",").map((entry) => entry.trim()).filter(Boolean),
      };
      const res = await fetch(`/api/campaigns/${campaignId}/locations/${selectedLocation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: mapImageUrl,
          mapData: nextMapData,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setLocationList((prev) => prev.map((location) => (location.id === updated.id ? updated : location)));
        emit("location:map-updated", {
          campaignId,
          locationId: updated.id,
          location: updated,
        });
        setStatus({ kind: "success", message: "Map studio changes saved." });
      } else {
        setStatus({ kind: "error", message: "Could not save map studio changes." });
      }
    } finally {
      setSavingMap(false);
    }
  }

  return (
    <div className="space-y-6">
      {status && <FormStatus kind={status.kind} message={status.message} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="map" size={24} className="text-secondary" />
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">
            Locations ({locationList.length})
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowForm((prev) => !prev)} className="interactive-glow">
          <Icon name={showForm ? "close" : "add"} size={14} />
          {showForm ? "Cancel" : "Add Location"}
        </Button>
      </div>

      {showForm && (
        <div className="relative space-y-3 overflow-hidden rounded-sm border border-secondary/10 p-6 shadow-whisper glass">
          <div className="decorative-orb absolute -top-10 -right-10 h-32 w-32" />
          <div className="relative z-10 mb-2 flex items-center gap-2">
            <p className="font-headline text-sm uppercase tracking-wider text-secondary">Map Builder</p>
            <div className="decorative-line ml-2 flex-1" />
          </div>
          <div className="flex flex-wrap gap-2">
            {["Terrain", "Scale", "Occupancy + Details"].map((label, index) => (
              <div
                key={label}
                className={`rounded-full px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] ${
                  builderStep === index
                    ? "bg-secondary/10 text-secondary"
                    : builderStep > index
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container-high text-on-surface-variant/45"
                }`}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>

          {builderStep === 0 && (
            <OptionGallery
              options={(Object.keys(TYPE_CONFIG) as LocationType[]).map((locationType) => ({
                id: locationType,
                title: TYPE_CONFIG[locationType].label,
                description: `Build a ${TYPE_CONFIG[locationType].label.toLowerCase()} map or destination with guided world details.`,
                subtitle: "Map foundation",
                entityType: "location" as const,
                meta: [TYPE_CONFIG[locationType].label],
              }))}
              selectedId={type}
              onSelect={(option) => {
                setType(option.id as LocationType);
                setBuilderStep(1);
              }}
              featuredIds={["wilderness", "dungeon", "city"]}
              featuredLabel="Popular map starts"
              allLabel="Terrain and place types"
              searchPlaceholder="Search map types"
            />
          )}

          {builderStep === 1 && (
            <div className="space-y-4">
              <OptionGallery
                options={SCALE_OPTIONS}
                selectedId={scale}
                onSelect={(option) => {
                  setScale(option.id);
                  setBuilderStep(2);
                }}
                featuredIds={["small-site", "landmark", "region"]}
                featuredLabel="Recommended scales"
                allLabel="Map scope"
                searchPlaceholder="Search size and scope"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(0)}>
                <Icon name="arrow_back" size={14} />
                Back
              </Button>
            </div>
          )}

          {builderStep === 2 && (
            <div className="space-y-4">
              <OptionGallery
                options={OCCUPANCY_OPTIONS}
                selectedId={occupancy}
                onSelect={(option) => setOccupancy(option.id)}
                featuredIds={["inhabited", "contested", "boss-lair"]}
                featuredLabel="Common pressures"
                allLabel="Occupancy and tension"
                searchPlaceholder="Search occupancy styles"
              />
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-4">
                  <Input id="loc-name" label="Location Name" value={name} onChange={(event) => setName(event.target.value)} placeholder="The Whispering Peaks..." />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Select id="loc-parent" label="Parent Location" icon="account_tree" value={parentId} onChange={(event) => setParentId(event.target.value)}>
                      <option value="">Top Level</option>
                      {locationList.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {(TYPE_CONFIG[loc.type as LocationType] || TYPE_CONFIG.region).label}: {loc.name}
                        </option>
                      ))}
                    </Select>
                    <Input id="loc-summary" label="Builder Summary" value={`${TYPE_CONFIG[type].label} · ${scale} · ${occupancy}`} readOnly />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                        Description
                      </label>
                      <AIAssistButton
                        label="Describe Location"
                        size="sm"
                        systemPrompt={AI_PROMPTS.locationDescriber}
                        userPrompt={name ? `Describe a ${type} called "${name}".` : `Describe a ${type} in a fantasy D&D setting.`}
                        context={`Type: ${type}\nScale: ${scale}\nOccupancy: ${occupancy}${name ? `\nLocation name: ${name}` : ""}`}
                        onApply={(content) => setDescription(content)}
                      />
                    </div>
                    <Input id="loc-desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A vast mountain range shrouded in mist..." />
                  </div>

                  <Textarea
                    id="loc-notes"
                    label="DM Notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Secret passages, hidden treasures..."
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                    Map Image
                  </p>
                  <ImageUpload currentImage={mapImageUrl} onUpload={(url) => setMapImageUrl(url)} size="lg" label="Upload map art" />
                  <p className="text-xs text-on-surface-variant">
                    Add a region map, battle map, or concept art now. You can place markers and overlays after creation.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(1)}>
                  <Icon name="arrow_back" size={14} />
                  Back
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={loading || !name.trim()} className="glow-gold">
                  {loading ? "Creating..." : "Create Map Card"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-3">
          {tree.length > 0 ? (
            tree.map((node) => (
              <LocationNode key={node.id} node={node} depth={0} selectedId={selectedLocationId} onSelect={setSelectedLocationId} />
            ))
          ) : (
            <EmptyState
              icon="map"
              title="No locations added yet"
              description="Create regions, cities, and dungeons for your world"
              action={
                <Button variant="primary" size="sm" onClick={() => setShowForm(true)} className="glow-gold">
                  <Icon name="add" size={16} />
                  Add Location
                </Button>
              }
            />
          )}
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          {selectedLocation ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-headline text-xl text-on-surface">{selectedLocation.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                    {(TYPE_CONFIG[selectedLocation.type as LocationType] || TYPE_CONFIG.region).label}
                  </p>
                </div>
                <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary">
                  Map Studio
                </span>
              </div>

              {selectedLocation.description && <p className="text-sm leading-relaxed text-on-surface-variant">{selectedLocation.description}</p>}
              {selectedLocation.notes && <p className="text-sm text-on-surface-variant/80">DM: {selectedLocation.notes}</p>}

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">Map Surface</p>
                    <ImageUpload currentImage={mapImageUrl} onUpload={(url) => setMapImageUrl(url)} size="sm" label="Upload map" />
                  </div>

                  {mapImageUrl ? (
                    <div
                      className="relative aspect-[16/10] overflow-hidden rounded-sm border border-outline-variant/10 bg-surface-container-high"
                      onClick={
                        mapTool === "wall"
                          ? addWallPointFromClick
                          : mapTool === "reveal"
                            ? addRevealAreaFromClick
                            : addMarkerFromClick
                      }
                    >
                      <img src={mapImageUrl} alt={selectedLocation.name} className="h-full w-full object-cover" />
                      {mapDraft.gridMode !== "none" && (
                        <div
                          className={`pointer-events-none absolute inset-0 opacity-30 ${
                            mapDraft.gridMode === "hex"
                              ? "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[length:28px_24px]"
                              : "bg-[linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[length:32px_32px]"
                          }`}
                        />
                      )}
                      {mapDraft.fogEnabled && (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/35" />
                      )}
                      {mapDraft.revealedAreas.map((area) => (
                        <button
                          key={area.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRevealId(area.id);
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                            selectedRevealId === area.id
                              ? "border-secondary bg-secondary/10"
                              : "border-green-300/70 bg-green-400/10"
                          }`}
                          style={{
                            left: `${area.x}%`,
                            top: `${area.y}%`,
                            width: `${area.radius * 2}%`,
                            height: `${area.radius * 2}%`,
                          }}
                          title="Revealed area"
                        />
                      ))}
                      {mapDraft.walls.map((wall) => (
                        <button
                          key={wall.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedWallId(wall.id);
                          }}
                          className={`absolute origin-center rounded-full shadow-whisper ${
                            selectedWallId === wall.id ? "bg-secondary" : "bg-background/85"
                          }`}
                          style={{
                            left: `${(wall.x1 + wall.x2) / 2}%`,
                            top: `${(wall.y1 + wall.y2) / 2}%`,
                            width: `${Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1)}%`,
                            height: "0.45rem",
                            transform: `translate(-50%, -50%) rotate(${Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1)}rad)`,
                          }}
                          title="Wall segment"
                        />
                      ))}
                      {pendingWallPoint && (
                        <div
                          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-secondary shadow-whisper"
                          style={{ left: `${pendingWallPoint.x}%`, top: `${pendingWallPoint.y}%` }}
                        />
                      )}
                      {mapDraft.markers.map((marker) => (
                        <button
                          key={marker.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingMarkerId(marker.id);
                          }}
                          className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background shadow-whisper transition-transform hover:scale-110 ${MARKER_CONFIG[marker.kind].color}`}
                          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                          title={marker.label}
                        >
                          <Icon name={MARKER_CONFIG[marker.kind].icon} size={14} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="image"
                      title="No map image yet"
                      description="Upload a map image to place markers, choose a grid, and manage player-facing discovery."
                    />
                  )}

                  <p className="text-xs text-on-surface-variant">
                    {mapTool === "wall"
                      ? pendingWallPoint
                        ? "Click a second point to finish the wall segment."
                        : "Click one point to start a wall, then click again to finish it."
                      : mapTool === "reveal"
                        ? "Click the map to place a revealed area that players can see through fog of war."
                      : "Click anywhere on the map to add a marker. Use visibility to decide whether it is public, discoverable later, or DM-only."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="grid gap-3">
                      <Select id="map-tool" label="Editing Tool" value={mapTool} onChange={(event) => { setMapTool(event.target.value === "wall" ? "wall" : event.target.value === "reveal" ? "reveal" : "marker"); setPendingWallPoint(null); }}>
                        <option value="marker">Marker tool</option>
                        <option value="wall">Wall tool</option>
                        <option value="reveal">Reveal tool</option>
                      </Select>
                      <Select id="map-mode" label="Map Mode" value={mapDraft.mapMode} onChange={(event) => setMapDraft((prev) => ({ ...prev, mapMode: event.target.value as MapMode }))}>
                        <option value="world">World / travel</option>
                        <option value="location">Location exploration</option>
                        <option value="battle">Battle map</option>
                      </Select>
                      <Select id="grid-mode" label="Grid" value={mapDraft.gridMode} onChange={(event) => setMapDraft((prev) => ({ ...prev, gridMode: event.target.value as GridMode }))}>
                        <option value="none">No grid</option>
                        <option value="square">Square grid</option>
                        <option value="hex">Hex grid</option>
                      </Select>
                      <Select id="fog-enabled" label="Fog of War" value={mapDraft.fogEnabled ? "enabled" : "disabled"} onChange={(event) => setMapDraft((prev) => ({ ...prev, fogEnabled: event.target.value === "enabled" }))}>
                        <option value="disabled">Disabled</option>
                        <option value="enabled">Enabled</option>
                      </Select>
                      <Input id="map-overlays" label="Overlay Tags" value={overlayText} onChange={(event) => setOverlayText(event.target.value)} placeholder="faction lines, weather, danger, trade routes" />
                    </div>
                  </div>

                  <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-headline text-base text-on-surface">Markers</p>
                      <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {mapDraft.markers.length} total
                      </span>
                    </div>

                    {mapDraft.markers.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">No markers yet. Click the map to create one.</p>
                    ) : (
                      <div className="space-y-2">
                        {mapDraft.markers.map((marker) => (
                          <div key={marker.id} className={`rounded-sm border p-3 transition-colors ${editingMarkerId === marker.id ? "border-secondary/25 bg-secondary/5" : "border-outline-variant/8 bg-surface-container-low"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <button type="button" className="min-w-0 text-left" onClick={() => setEditingMarkerId(marker.id)}>
                                <p className="truncate font-body text-sm font-semibold text-on-surface">{marker.label}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                                  {MARKER_CONFIG[marker.kind].label} · {marker.visibility}
                                </p>
                              </button>
                              <button
                                type="button"
                                className="text-on-surface-variant/50 hover:text-error"
                                onClick={() => {
                                  setMapDraft((prev) => ({ ...prev, markers: prev.markers.filter((entry) => entry.id !== marker.id) }));
                                  if (editingMarkerId === marker.id) setEditingMarkerId(null);
                                }}
                              >
                                <Icon name="delete" size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-headline text-base text-on-surface">Walls</p>
                      <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {mapDraft.walls.length} total
                      </span>
                    </div>

                    {mapDraft.walls.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">No walls yet. Switch to wall tool and click two points to place one.</p>
                    ) : (
                      <div className="space-y-2">
                        {mapDraft.walls.map((wall, index) => (
                          <div key={wall.id} className={`rounded-sm border p-3 transition-colors ${selectedWallId === wall.id ? "border-secondary/25 bg-secondary/5" : "border-outline-variant/8 bg-surface-container-low"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <button type="button" className="min-w-0 text-left" onClick={() => setSelectedWallId(wall.id)}>
                                <p className="truncate font-body text-sm font-semibold text-on-surface">Wall {index + 1}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                                  {Math.round(wall.x1)},{Math.round(wall.y1)} → {Math.round(wall.x2)},{Math.round(wall.y2)}
                                </p>
                              </button>
                              <button
                                type="button"
                                className="text-on-surface-variant/50 hover:text-error"
                                onClick={() => {
                                  setMapDraft((prev) => ({ ...prev, walls: prev.walls.filter((entry) => entry.id !== wall.id) }));
                                  if (selectedWallId === wall.id) setSelectedWallId(null);
                                }}
                              >
                                <Icon name="delete" size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-headline text-base text-on-surface">Reveal Areas</p>
                      <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {mapDraft.revealedAreas.length} total
                      </span>
                    </div>

                    {mapDraft.revealedAreas.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">No revealed areas yet. Switch to reveal tool and click the map to add one.</p>
                    ) : (
                      <div className="space-y-2">
                        {mapDraft.revealedAreas.map((area, index) => (
                          <div key={area.id} className={`rounded-sm border p-3 transition-colors ${selectedRevealId === area.id ? "border-secondary/25 bg-secondary/5" : "border-outline-variant/8 bg-surface-container-low"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <button type="button" className="min-w-0 text-left" onClick={() => setSelectedRevealId(area.id)}>
                                <p className="truncate font-body text-sm font-semibold text-on-surface">Reveal {index + 1}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                                  Center {Math.round(area.x)},{Math.round(area.y)} · radius {Math.round(area.radius)}
                                </p>
                              </button>
                              <button
                                type="button"
                                className="text-on-surface-variant/50 hover:text-error"
                                onClick={() => {
                                  setMapDraft((prev) => ({ ...prev, revealedAreas: prev.revealedAreas.filter((entry) => entry.id !== area.id) }));
                                  if (selectedRevealId === area.id) setSelectedRevealId(null);
                                }}
                              >
                                <Icon name="delete" size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {editingMarker && (
                    <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                      <p className="mb-3 font-headline text-base text-on-surface">Edit Marker</p>
                      <div className="grid gap-3">
                        <Input id="marker-label" label="Label" value={editingMarker.label} onChange={(event) => updateMarker(editingMarker.id, { label: event.target.value })} />
                        <Select id="marker-kind" label="Kind" value={editingMarker.kind} onChange={(event) => updateMarker(editingMarker.id, { kind: event.target.value as MarkerKind })}>
                          <option value="poi">Point of interest</option>
                          <option value="hazard">Hazard</option>
                          <option value="loot">Loot</option>
                          <option value="npc">NPC</option>
                          <option value="travel">Travel route</option>
                          <option value="secret">Secret</option>
                        </Select>
                        <Select id="marker-visibility" label="Visibility" value={editingMarker.visibility} onChange={(event) => updateMarker(editingMarker.id, { visibility: event.target.value as MarkerVisibility })}>
                          <option value="public">Public immediately</option>
                          <option value="discovered">Reveal later</option>
                          <option value="dm">DM only</option>
                        </Select>
                        <div className="grid grid-cols-2 gap-3">
                          <Input id="marker-x" label="X Position" type="number" min={0} max={100} value={Math.round(editingMarker.x)} onChange={(event) => updateMarker(editingMarker.id, { x: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })} />
                          <Input id="marker-y" label="Y Position" type="number" min={0} max={100} value={Math.round(editingMarker.y)} onChange={(event) => updateMarker(editingMarker.id, { y: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })} />
                        </div>
                        <Textarea id="marker-description" label="Description" rows={3} value={editingMarker.description} onChange={(event) => updateMarker(editingMarker.id, { description: event.target.value })} placeholder="Hidden shrine entrance, recent ambush site, merchant camp..." />
                      </div>
                    </div>
                  )}

                  {selectedWall && (
                    <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                      <p className="mb-3 font-headline text-base text-on-surface">Edit Wall</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input id="wall-x1" label="Start X" type="number" min={0} max={100} value={Math.round(selectedWall.x1)} onChange={(event) => setMapDraft((prev) => ({ ...prev, walls: prev.walls.map((wall) => wall.id === selectedWall.id ? { ...wall, x1: Math.max(0, Math.min(100, Number(event.target.value) || 0)) } : wall) }))} />
                        <Input id="wall-y1" label="Start Y" type="number" min={0} max={100} value={Math.round(selectedWall.y1)} onChange={(event) => setMapDraft((prev) => ({ ...prev, walls: prev.walls.map((wall) => wall.id === selectedWall.id ? { ...wall, y1: Math.max(0, Math.min(100, Number(event.target.value) || 0)) } : wall) }))} />
                        <Input id="wall-x2" label="End X" type="number" min={0} max={100} value={Math.round(selectedWall.x2)} onChange={(event) => setMapDraft((prev) => ({ ...prev, walls: prev.walls.map((wall) => wall.id === selectedWall.id ? { ...wall, x2: Math.max(0, Math.min(100, Number(event.target.value) || 0)) } : wall) }))} />
                        <Input id="wall-y2" label="End Y" type="number" min={0} max={100} value={Math.round(selectedWall.y2)} onChange={(event) => setMapDraft((prev) => ({ ...prev, walls: prev.walls.map((wall) => wall.id === selectedWall.id ? { ...wall, y2: Math.max(0, Math.min(100, Number(event.target.value) || 0)) } : wall) }))} />
                      </div>
                    </div>
                  )}

                  {selectedRevealArea && (
                    <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                      <p className="mb-3 font-headline text-base text-on-surface">Edit Reveal Area</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Input id="reveal-x" label="Center X" type="number" min={0} max={100} value={Math.round(selectedRevealArea.x)} onChange={(event) => setMapDraft((prev) => ({ ...prev, revealedAreas: prev.revealedAreas.map((area) => area.id === selectedRevealArea.id ? { ...area, x: Math.max(0, Math.min(100, Number(event.target.value) || 0)) } : area) }))} />
                        <Input id="reveal-y" label="Center Y" type="number" min={0} max={100} value={Math.round(selectedRevealArea.y)} onChange={(event) => setMapDraft((prev) => ({ ...prev, revealedAreas: prev.revealedAreas.map((area) => area.id === selectedRevealArea.id ? { ...area, y: Math.max(0, Math.min(100, Number(event.target.value) || 0)) } : area) }))} />
                        <Input id="reveal-radius" label="Radius" type="number" min={4} max={40} value={Math.round(selectedRevealArea.radius)} onChange={(event) => setMapDraft((prev) => ({ ...prev, revealedAreas: prev.revealedAreas.map((area) => area.id === selectedRevealArea.id ? { ...area, radius: Math.max(4, Math.min(40, Number(event.target.value) || 4)) } : area) }))} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" loading={savingMap} onClick={saveMapStudio} className="glow-gold">
                  <Icon name="save" size={16} />
                  Save Map Studio
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="travel_explore"
              title="Select a location"
              description="Choose a location from the left to upload a map image, place markers, and manage discovery state."
            />
          )}
        </div>
      </section>
    </div>
  );
}
