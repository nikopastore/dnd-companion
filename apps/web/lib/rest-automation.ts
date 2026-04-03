import {
  AUTOMATION_MODES,
  type AutomationMode,
} from "@dnd-companion/shared";

const SHORT_REST_USED_KEYS = ["secondWindUsed", "actionSurgeUsed"] as const;

export function normalizeAutomationMode(value: unknown): AutomationMode {
  if (typeof value === "string" && value in AUTOMATION_MODES) {
    return value as AutomationMode;
  }
  return "ASSISTED";
}

export function resetClassResourcesForShortRest(
  resources: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!resources) return null;

  let changed = false;
  const next: Record<string, unknown> = { ...resources };

  for (const key of SHORT_REST_USED_KEYS) {
    if (typeof next[key] === "boolean" && next[key] === true) {
      next[key] = false;
      changed = true;
    }
  }

  return changed ? next : resources;
}

export function resetClassResourcesForLongRest(
  resources: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!resources) return null;

  let changed = false;
  const next: Record<string, unknown> = { ...resources };

  for (const [key, value] of Object.entries(resources)) {
    if (key.endsWith("Remaining")) {
      const totalKey = `${key.slice(0, -("Remaining".length))}Total`;
      const totalValue = resources[totalKey];
      if (typeof value === "number" && typeof totalValue === "number" && value !== totalValue) {
        next[key] = totalValue;
        changed = true;
      }
      continue;
    }

    if (key.endsWith("Used") && value === true) {
      next[key] = false;
      changed = true;
    }
  }

  return changed ? next : resources;
}
