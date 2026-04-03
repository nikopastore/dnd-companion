import { CONDITIONS, type ConditionKey } from "./conditions";

export const AUTOMATION_MODES = {
  MANUAL: {
    label: "Manual",
    description: "Keep rules tracking hands-on. Rest actions become checklists instead of auto-resets.",
  },
  ASSISTED: {
    label: "Assisted",
    description: "Auto-handle common rest resets and spell-slot refills while leaving edge cases to the table.",
  },
  FULL: {
    label: "Full",
    description: "Push deeper automation for rests and class-resource refreshes, useful for digital-heavy groups.",
  },
} as const;

export type AutomationMode = keyof typeof AUTOMATION_MODES;

export type RuleCategory =
  | "conditions"
  | "combat"
  | "spellcasting"
  | "rest"
  | "travel"
  | "downtime"
  | "crafting";

export interface RulesReferenceEntry {
  id: string;
  title: string;
  category: RuleCategory;
  icon: string;
  tags: string[];
  summary: string;
  details: string[];
  linkedCondition?: ConditionKey;
}

const CONDITION_RULES: RulesReferenceEntry[] = (
  Object.entries(CONDITIONS) as Array<[ConditionKey, (typeof CONDITIONS)[ConditionKey]]>
).map(([key, value]) => ({
  id: `condition-${key.toLowerCase()}`,
  title: value.name,
  category: "conditions",
  icon: value.icon,
  tags: ["condition", value.name.toLowerCase(), key.toLowerCase()],
  summary: value.description,
  details: [
    value.description,
    "Track this on the character sheet when it is actively affecting rolls, movement, or actions.",
  ],
  linkedCondition: key,
}));

export const RULES_REFERENCE: RulesReferenceEntry[] = [
  {
    id: "combat-action-economy",
    title: "Action Economy",
    category: "combat",
    icon: "swords",
    tags: ["combat", "actions", "bonus action", "reaction", "turn"],
    summary: "Most turns revolve around movement, one action, optional bonus action, and one reaction per round.",
    details: [
      "Movement can be split before and after actions unless an effect says otherwise.",
      "You only get a bonus action when an ability, feature, or spell explicitly grants one.",
      "Reactions refresh at the start of your next turn, not at the end of the round.",
    ],
  },
  {
    id: "combat-advantage",
    title: "Advantage and Disadvantage",
    category: "combat",
    icon: "tune",
    tags: ["combat", "advantage", "disadvantage", "rolls"],
    summary: "Roll two d20s and keep the higher for advantage or lower for disadvantage; they usually do not stack.",
    details: [
      "Multiple sources of advantage still only give one extra die.",
      "If at least one source of advantage and one source of disadvantage both apply, they cancel out.",
      "Check conditions, cover, visibility, and class features before resolving the roll.",
    ],
  },
  {
    id: "combat-cover",
    title: "Cover",
    category: "combat",
    icon: "shield",
    tags: ["combat", "cover", "ac", "dex saves", "ranged"],
    summary: "Half cover is usually +2 AC and Dexterity saves; three-quarters cover is usually +5.",
    details: [
      "Cover matters most against attacks and effects that originate from the far side of the obstacle.",
      "Total cover blocks direct targeting unless a feature says otherwise.",
      "Use this when terrain, allies, walls, or barricades partially block the line of attack.",
    ],
  },
  {
    id: "combat-death-saves",
    title: "Death Saves",
    category: "combat",
    icon: "favorite",
    tags: ["combat", "death save", "stabilized", "dying"],
    summary: "At 0 HP, three successes stabilize you and three failures kill you unless something intervenes first.",
    details: [
      "A natural 20 usually restores 1 HP. A natural 1 usually counts as two failures.",
      "Damage while at 0 HP causes a failure, and a critical hit usually causes two.",
      "Healing ends the death-save cycle immediately once HP goes above 0.",
    ],
  },
  {
    id: "spellcasting-concentration",
    title: "Concentration",
    category: "spellcasting",
    icon: "psychology",
    tags: ["spellcasting", "concentration", "saving throw", "duration"],
    summary: "You can normally concentrate on only one spell at a time and may lose it when you take damage.",
    details: [
      "Casting another concentration spell ends the previous one immediately.",
      "Damage can force a Constitution saving throw to maintain concentration.",
      "Resting, incapacity, or certain conditions can also break concentration.",
    ],
  },
  {
    id: "spellcasting-components",
    title: "Spell Components",
    category: "spellcasting",
    icon: "auto_fix_high",
    tags: ["spellcasting", "components", "verbal", "somatic", "material"],
    summary: "Spells can require verbal, somatic, and material components, and those constraints matter in play.",
    details: [
      "Silence, restrained hands, or missing materials can block a cast even if slots are available.",
      "A focus or component pouch often replaces common material costs, but not priced or consumed components.",
      "Use the spellbook details to confirm component load before combat starts.",
    ],
  },
  {
    id: "rest-short",
    title: "Short Rest",
    category: "rest",
    icon: "coffee",
    tags: ["rest", "short rest", "hit dice", "pact magic"],
    summary: "A short rest is typically about an hour and often restores short-rest features such as pact slots.",
    details: [
      "Tables often use short rests to spend hit dice and recover class features tied to a brief recovery window.",
      "Warlock pact slots commonly refresh here.",
      "Use Manual mode if your group wants to track each refresh step explicitly.",
    ],
  },
  {
    id: "rest-long",
    title: "Long Rest",
    category: "rest",
    icon: "bedtime",
    tags: ["rest", "long rest", "spell slots", "resources", "healing"],
    summary: "A long rest usually restores HP, spell slots, and many class resources after an extended recovery.",
    details: [
      "Long rests commonly clear temporary combat state such as death saves and many spent resources.",
      "Some tables also reduce exhaustion or update downtime clocks at the same time.",
      "Full mode automates more of this cleanup for digital-first groups.",
    ],
  },
  {
    id: "travel-overland",
    title: "Travel and Exploration",
    category: "travel",
    icon: "map",
    tags: ["travel", "exploration", "pace", "navigation", "watch"],
    summary: "Travel usually balances pace, safety, navigation, and who is responsible for scouting, foraging, or watching.",
    details: [
      "Use travel notes to record weather, distance, watches, and who exposed the party to risk or found clues.",
      "Cover discovered routes, hazards, and supply strain in session prep or recap notes.",
      "Maps, faction overlays, and future world-state tools should tie into this layer over time.",
    ],
  },
  {
    id: "downtime-activities",
    title: "Downtime Activities",
    category: "downtime",
    icon: "schedule",
    tags: ["downtime", "crafting", "training", "carousing", "projects"],
    summary: "Downtime is where crafting, research, training, business, and long-form personal goals usually live.",
    details: [
      "Track project owners, materials, deadlines, and payoff in the shared crafting board.",
      "Downtime is also a good place to resolve faction reactions, rumors, and character arc developments.",
      "Use campaign recaps to capture what changed between sessions.",
    ],
  },
  {
    id: "crafting-projects",
    title: "Crafting Projects",
    category: "crafting",
    icon: "construction",
    tags: ["crafting", "materials", "progress", "items", "downtime"],
    summary: "Crafting works best when projects have explicit materials, a responsible character, and visible progress.",
    details: [
      "Use the party hub to assign an owner, progress percentage, reward, and deadline.",
      "Rare or magical projects should usually reference a quest, location, faction, or special ingredient.",
      "Item history can record when a crafted item was completed, upgraded, traded, or lost.",
    ],
  },
  ...CONDITION_RULES,
];
