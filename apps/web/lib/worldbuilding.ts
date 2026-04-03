export interface WorldRegion {
  id: string;
  name: string;
  kind: string;
  summary: string;
  tags: string[];
  notes: string | null;
  playerVisible: boolean;
}

export interface FactionDirectoryEntry {
  id: string;
  name: string;
  type: string;
  agenda: string;
  status: string;
  influence: number;
  regions: string[];
  notes: string | null;
  playerVisible: boolean;
}

export interface LoreEntry {
  id: string;
  title: string;
  category: string;
  summary: string;
  dmTruth: string | null;
  relatedNames: string[];
  playerVisible: boolean;
}

export interface HistoricalEvent {
  id: string;
  title: string;
  era: string;
  dateLabel: string;
  summary: string;
  impact: string | null;
  playerVisible: boolean;
}

export interface CalendarState {
  currentDateLabel: string;
  season: string;
  weather: string;
  moonPhase: string;
  nextHoliday: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function toId(value: unknown, prefix: string, index: number) {
  return typeof value === "string" && value.trim() ? value : `${prefix}-${index}`;
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export function parseWorldRegions(value: unknown) {
  if (!Array.isArray(value)) return [] as WorldRegion[];
  return value
    .map((entry, index) => {
      const item = asRecord(entry);
      if (!item) return null;
      const name = String(item.name || "").trim();
      if (!name) return null;
      return {
        id: toId(item.id, "region", index),
        name,
        kind: String(item.kind || "Region").trim() || "Region",
        summary: String(item.summary || "").trim(),
        tags: toStringList(item.tags),
        notes: typeof item.notes === "string" && item.notes.trim() ? item.notes.trim() : null,
        playerVisible: item.playerVisible !== false,
      } satisfies WorldRegion;
    })
    .filter((entry: WorldRegion | null): entry is WorldRegion => Boolean(entry));
}

export function parseFactionDirectory(value: unknown) {
  if (!Array.isArray(value)) return [] as FactionDirectoryEntry[];
  return value
    .map((entry, index) => {
      const item = asRecord(entry);
      if (!item) return null;
      const name = String(item.name || "").trim();
      if (!name) return null;
      return {
        id: toId(item.id, "faction", index),
        name,
        type: String(item.type || "Faction").trim() || "Faction",
        agenda: String(item.agenda || "").trim(),
        status: String(item.status || "stable").trim() || "stable",
        influence: Math.min(5, Math.max(1, Number(item.influence ?? 3) || 3)),
        regions: toStringList(item.regions),
        notes: typeof item.notes === "string" && item.notes.trim() ? item.notes.trim() : null,
        playerVisible: item.playerVisible !== false,
      } satisfies FactionDirectoryEntry;
    })
    .filter((entry: FactionDirectoryEntry | null): entry is FactionDirectoryEntry => Boolean(entry));
}

export function parseLoreEntries(value: unknown) {
  if (!Array.isArray(value)) return [] as LoreEntry[];
  return value
    .map((entry, index) => {
      const item = asRecord(entry);
      if (!item) return null;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: toId(item.id, "lore", index),
        title,
        category: String(item.category || "Lore").trim() || "Lore",
        summary: String(item.summary || "").trim(),
        dmTruth: typeof item.dmTruth === "string" && item.dmTruth.trim() ? item.dmTruth.trim() : null,
        relatedNames: toStringList(item.relatedNames),
        playerVisible: item.playerVisible !== false,
      } satisfies LoreEntry;
    })
    .filter((entry: LoreEntry | null): entry is LoreEntry => Boolean(entry));
}

export function parseHistoricalEvents(value: unknown) {
  if (!Array.isArray(value)) return [] as HistoricalEvent[];
  return value
    .map((entry, index) => {
      const item = asRecord(entry);
      if (!item) return null;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: toId(item.id, "event", index),
        title,
        era: String(item.era || "").trim(),
        dateLabel: String(item.dateLabel || "").trim(),
        summary: String(item.summary || "").trim(),
        impact: typeof item.impact === "string" && item.impact.trim() ? item.impact.trim() : null,
        playerVisible: item.playerVisible !== false,
      } satisfies HistoricalEvent;
    })
    .filter((entry: HistoricalEvent | null): entry is HistoricalEvent => Boolean(entry));
}

export function parseCalendarState(value: unknown): CalendarState {
  const item = asRecord(value) ?? {};
  return {
    currentDateLabel: String(item.currentDateLabel || "").trim(),
    season: String(item.season || "").trim(),
    weather: String(item.weather || "").trim(),
    moonPhase: String(item.moonPhase || "").trim(),
    nextHoliday: String(item.nextHoliday || "").trim(),
  };
}

export function filterPublicWorldRegions(value: unknown) {
  return parseWorldRegions(value).filter((entry) => entry.playerVisible);
}

export function filterPublicFactionDirectory(value: unknown) {
  return parseFactionDirectory(value).filter((entry) => entry.playerVisible);
}

export function filterPublicLoreEntries(value: unknown) {
  return parseLoreEntries(value).filter((entry) => entry.playerVisible);
}

export function filterPublicHistoricalEvents(value: unknown) {
  return parseHistoricalEvents(value).filter((entry) => entry.playerVisible);
}
