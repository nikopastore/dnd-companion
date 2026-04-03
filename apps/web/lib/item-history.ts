export interface ItemHistoryEntry {
  id: string;
  type: string;
  title: string;
  detail: string;
  createdAt: string;
  actor: string;
}

export function normalizeItemHistory(value: unknown): ItemHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        type: String(item.type || "note").trim() || "note",
        title,
        detail: String(item.detail || "").trim(),
        createdAt: String(item.createdAt || new Date(0).toISOString()),
        actor: String(item.actor || "Unknown"),
      } satisfies ItemHistoryEntry;
    })
    .filter((entry): entry is ItemHistoryEntry => Boolean(entry));
}

export function createItemHistoryEntry(
  type: string,
  title: string,
  detail: string,
  actor: string
): ItemHistoryEntry {
  return {
    id: crypto.randomUUID(),
    type,
    title,
    detail,
    createdAt: new Date().toISOString(),
    actor,
  };
}

export function appendItemHistory(
  existing: unknown,
  entry: ItemHistoryEntry
): ItemHistoryEntry[] {
  return [entry, ...normalizeItemHistory(existing)].slice(0, 30);
}
