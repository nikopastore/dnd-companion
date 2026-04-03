export interface CharacterNotification {
  id: string;
  type: "item_received" | "rest_applied" | "campaign_update";
  title: string;
  message: string;
  imageUrl?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function normalizeCharacterNotifications(value: unknown): CharacterNotification[] {
  if (!Array.isArray(value)) return [];

  const notifications = value.map((entry): CharacterNotification | null => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      const message = String(item.message || "").trim();
      if (!title || !message) return null;

      const type =
        item.type === "item_received" || item.type === "rest_applied" || item.type === "campaign_update"
          ? item.type
          : "campaign_update";

      const notification: CharacterNotification = {
        id: String(item.id || crypto.randomUUID()),
        type,
        title,
        message,
        imageUrl: typeof item.imageUrl === "string" && item.imageUrl.trim() ? item.imageUrl.trim() : null,
        createdAt: String(item.createdAt || new Date().toISOString()),
        metadata: item.metadata && typeof item.metadata === "object" ? (item.metadata as Record<string, unknown>) : undefined,
      };

      return notification;
    })
    .filter((entry): entry is CharacterNotification => entry !== null);

  return notifications;
}

export function createCharacterNotification(
  type: CharacterNotification["type"],
  title: string,
  message: string,
  options?: { imageUrl?: string | null; metadata?: Record<string, unknown> }
): CharacterNotification {
  return {
    id: crypto.randomUUID(),
    type,
    title,
    message,
    imageUrl: options?.imageUrl ?? null,
    createdAt: new Date().toISOString(),
    metadata: options?.metadata,
  };
}

export function appendCharacterNotification(existing: unknown, entry: CharacterNotification) {
  return [entry, ...normalizeCharacterNotifications(existing)].slice(0, 12);
}

export function removeCharacterNotifications(existing: unknown, ids: string[]) {
  const blocked = new Set(ids);
  return normalizeCharacterNotifications(existing).filter((entry) => !blocked.has(entry.id));
}
