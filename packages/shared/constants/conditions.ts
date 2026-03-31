export const CONDITIONS = {
  BLINDED: {
    name: "Blinded",
    description:
      "Can't see. Auto-fail ability checks requiring sight. Attack rolls against have advantage, your attacks have disadvantage.",
    icon: "visibility_off",
  },
  CHARMED: {
    name: "Charmed",
    description:
      "Can't attack the charmer. Charmer has advantage on social ability checks.",
    icon: "favorite",
  },
  DEAFENED: {
    name: "Deafened",
    description: "Can't hear. Auto-fail ability checks requiring hearing.",
    icon: "hearing_disabled",
  },
  EXHAUSTION: {
    name: "Exhaustion",
    description:
      "Cumulative levels 1-6. Each level: -2 to d20 rolls, -5ft speed. Level 6: death.",
    icon: "bedtime",
  },
  FRIGHTENED: {
    name: "Frightened",
    description:
      "Disadvantage on ability checks and attacks while source is in sight. Can't willingly move closer.",
    icon: "warning",
  },
  GRAPPLED: {
    name: "Grappled",
    description: "Speed becomes 0. Ends if grappler is incapacitated or effect moves you out of reach.",
    icon: "pan_tool",
  },
  INCAPACITATED: {
    name: "Incapacitated",
    description: "Can't take actions or reactions.",
    icon: "block",
  },
  INVISIBLE: {
    name: "Invisible",
    description:
      "Impossible to see without special sense. Attacks against have disadvantage, your attacks have advantage.",
    icon: "person_off",
  },
  PARALYZED: {
    name: "Paralyzed",
    description:
      "Incapacitated. Can't move or speak. Auto-fail STR/DEX saves. Attacks have advantage; melee hits are critical.",
    icon: "accessibility_new",
  },
  PETRIFIED: {
    name: "Petrified",
    description:
      "Transformed to stone. Incapacitated, unaware. Resistance to all damage. Immune to poison and disease.",
    icon: "landscape",
  },
  POISONED: {
    name: "Poisoned",
    description: "Disadvantage on attack rolls and ability checks.",
    icon: "science",
  },
  PRONE: {
    name: "Prone",
    description:
      "Disadvantage on attacks. Melee attacks within 5ft have advantage against you; ranged have disadvantage.",
    icon: "airline_seat_flat",
  },
  RESTRAINED: {
    name: "Restrained",
    description:
      "Speed 0. Attacks against have advantage. Your attacks and DEX saves have disadvantage.",
    icon: "lock",
  },
  STUNNED: {
    name: "Stunned",
    description:
      "Incapacitated. Can't move, can only speak falteringly. Auto-fail STR/DEX saves. Attacks have advantage.",
    icon: "flash_on",
  },
} as const;

export type ConditionKey = keyof typeof CONDITIONS;
