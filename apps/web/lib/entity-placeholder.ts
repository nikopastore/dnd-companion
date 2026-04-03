export type PlaceholderEntityType =
  | "character"
  | "npc"
  | "location"
  | "item"
  | "quest"
  | "encounter"
  | "race"
  | "class"
  | "spell";

const PLACEHOLDER_THEME: Record<PlaceholderEntityType, { start: string; end: string; accent: string }> = {
  character: { start: "#4a1d44", end: "#1a122f", accent: "#f4b75e" },
  npc: { start: "#14364b", end: "#0d1526", accent: "#78d4ff" },
  location: { start: "#234226", end: "#0f1d15", accent: "#9fd17b" },
  item: { start: "#5a2b17", end: "#1b1015", accent: "#ffcc7a" },
  quest: { start: "#183557", end: "#0d1628", accent: "#8ec5ff" },
  encounter: { start: "#581a1a", end: "#180d12", accent: "#ff8a7a" },
  race: { start: "#43235f", end: "#140f24", accent: "#d6a5ff" },
  class: { start: "#3e2e16", end: "#141016", accent: "#f0c17a" },
  spell: { start: "#31206a", end: "#100f24", accent: "#b0a0ff" },
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toHeadline(name: string, entityType: PlaceholderEntityType) {
  const normalized = name.trim();
  if (!normalized) {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  }

  return normalized
    .split(/\s+/)
    .slice(0, 3)
    .join(" ")
    .slice(0, 28);
}

export function getEntityPlaceholderImage(entityType: PlaceholderEntityType, name?: string | null) {
  const theme = PLACEHOLDER_THEME[entityType];
  const headline = escapeXml(toHeadline(name || "", entityType));
  const label = escapeXml(entityType.toUpperCase());

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-label="${headline}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.start}" />
          <stop offset="100%" stop-color="${theme.end}" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="18" fill="url(#bg)" />
      <circle cx="250" cy="60" r="88" fill="url(#glow)" opacity="0.25" />
      <circle cx="78" cy="195" r="72" fill="${theme.accent}" opacity="0.12" />
      <path d="M0 188 C64 152 106 224 175 188 S274 143 320 170 L320 240 L0 240 Z" fill="#ffffff" opacity="0.07" />
      <rect x="22" y="22" width="104" height="24" rx="12" fill="#ffffff" fill-opacity="0.09" />
      <text x="34" y="38" font-family="Georgia, serif" font-size="11" letter-spacing="2" fill="${theme.accent}">${label}</text>
      <text x="24" y="176" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#f7f1e6">${headline}</text>
      <text x="24" y="203" font-family="Arial, sans-serif" font-size="12" fill="#f7f1e6" fill-opacity="0.72">Placeholder art for builder and card views</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
