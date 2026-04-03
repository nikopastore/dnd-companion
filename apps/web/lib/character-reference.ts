import type { AbilityKey } from "@dnd-companion/shared";

export interface SubclassOption {
  id: string;
  className: string;
  name: string;
  description: string;
  theme: string;
}

export interface FeatOption {
  id: string;
  name: string;
  description: string;
  tags: string[];
  suggestedAbilities?: AbilityKey[];
}

export interface ClassChoiceOption {
  id: string;
  className: string;
  name: string;
  description: string;
  tags: string[];
  minLevel?: number;
}

export interface ClassChoiceGroup {
  id: string;
  className: string;
  level: number;
  title: string;
  description: string;
  sourceLabel: string;
  selectionCount: number;
  options: ClassChoiceOption[];
}

const SUBCLASS_OPTIONS: Record<string, SubclassOption[]> = {
  Barbarian: [
    { id: "berserker", className: "Barbarian", name: "Path of the Berserker", theme: "Fury", description: "Lean into relentless rage, brutal offense, and an all-in frontline style." },
    { id: "totem-warrior", className: "Barbarian", name: "Path of the Totem Warrior", theme: "Spirit guide", description: "Channel primal spirits for resilience, guidance, and adaptable battlefield presence." },
    { id: "zealot", className: "Barbarian", name: "Path of the Zealot", theme: "Divine wrath", description: "Turn faith and fury into radiant aggression and hard-to-kill momentum." },
  ],
  Bard: [
    { id: "lore", className: "Bard", name: "College of Lore", theme: "Scholar", description: "Master broad magical utility, knowledge, and cutting words that disrupt enemies." },
    { id: "valor", className: "Bard", name: "College of Valor", theme: "Battle bard", description: "Blend martial presence with inspiration for a durable support combatant." },
    { id: "glamour", className: "Bard", name: "College of Glamour", theme: "Presence", description: "Lead through charm, motion, and battlefield repositioning through sheer force of personality." },
  ],
  Cleric: [
    { id: "life", className: "Cleric", name: "Life Domain", theme: "Healing", description: "Focus on durability, healing efficiency, and classic divine support." },
    { id: "light", className: "Cleric", name: "Light Domain", theme: "Radiance", description: "Wield blinding light, burning spells, and offensive divine magic." },
    { id: "war", className: "Cleric", name: "War Domain", theme: "Battle", description: "Mix divine magic with martial aggression, buffs, and battlefield authority." },
  ],
  Druid: [
    { id: "land", className: "Druid", name: "Circle of the Land", theme: "Spellcasting", description: "Expand spell utility and terrain identity through a strong casting-focused druid path." },
    { id: "moon", className: "Druid", name: "Circle of the Moon", theme: "Wild Shape", description: "Emphasize combat shapeshifting, durability, and primal frontline play." },
    { id: "stars", className: "Druid", name: "Circle of Stars", theme: "Cosmic", description: "Blend celestial guidance, ranged pressure, and concentrated support magic." },
  ],
  Fighter: [
    { id: "champion", className: "Fighter", name: "Champion", theme: "Simplicity", description: "Go all-in on reliable weapon combat, critical hits, and straightforward excellence." },
    { id: "battle-master", className: "Fighter", name: "Battle Master", theme: "Tactics", description: "Use maneuvers to control the field, pressure enemies, and shape combat turns." },
    { id: "eldritch-knight", className: "Fighter", name: "Eldritch Knight", theme: "Magic knight", description: "Fuse martial discipline with arcane utility and defensive spellcasting." },
  ],
  Monk: [
    { id: "open-hand", className: "Monk", name: "Way of the Open Hand", theme: "Control", description: "Turn mobility and martial arts into control, knockdowns, and combat disruption." },
    { id: "shadow", className: "Monk", name: "Way of Shadow", theme: "Stealth", description: "Operate like a mystical infiltrator with darkness, teleportation, and ambush tools." },
    { id: "mercy", className: "Monk", name: "Way of Mercy", theme: "Healing strikes", description: "Alternate between precision harm and battlefield triage through ki techniques." },
  ],
  Paladin: [
    { id: "devotion", className: "Paladin", name: "Oath of Devotion", theme: "Virtue", description: "Classic holy knight play with radiant justice, protection, and moral clarity." },
    { id: "vengeance", className: "Paladin", name: "Oath of Vengeance", theme: "Hunter", description: "Chase priority threats with relentless single-target pressure and pursuit." },
    { id: "ancients", className: "Paladin", name: "Oath of the Ancients", theme: "Nature guardian", description: "Protect allies and the world with resilient, light-touched magic." },
  ],
  Ranger: [
    { id: "hunter", className: "Ranger", name: "Hunter", theme: "Predator", description: "Sharpen tracking and weapon play into dependable damage and target control." },
    { id: "beast-master", className: "Ranger", name: "Beast Master", theme: "Companion", description: "Fight alongside a bonded beast partner and build turns around teamwork." },
    { id: "gloom-stalker", className: "Ranger", name: "Gloom Stalker", theme: "Ambusher", description: "Excel in darkness, scouting, and explosive opening turns." },
  ],
  Rogue: [
    { id: "thief", className: "Rogue", name: "Thief", theme: "Agility", description: "Push speed, utility, and object interaction into elite infiltration play." },
    { id: "assassin", className: "Rogue", name: "Assassin", theme: "Burst", description: "Focus on disguise, setup, and devastating first-strike damage." },
    { id: "arcane-trickster", className: "Rogue", name: "Arcane Trickster", theme: "Magic utility", description: "Add illusion and enchantment tricks to stealth, scouting, and control." },
  ],
  Sorcerer: [
    { id: "draconic", className: "Sorcerer", name: "Draconic Bloodline", theme: "Heritage", description: "Gain resilience and elemental identity through draconic ancestry." },
    { id: "wild-magic", className: "Sorcerer", name: "Wild Magic", theme: "Chaos", description: "Embrace unpredictability, swingy turns, and volatile magical surges." },
    { id: "shadow-magic", className: "Sorcerer", name: "Shadow Magic", theme: "Darkness", description: "Mix survivability, eerie flavor, and shadow-soaked magical pressure." },
  ],
  Warlock: [
    { id: "fiend", className: "Warlock", name: "The Fiend", theme: "Infernal", description: "Push damage and survivability through a dangerous infernal pact." },
    { id: "great-old-one", className: "Warlock", name: "The Great Old One", theme: "Mind-bending", description: "Play with telepathy, unsettling influence, and cosmic weirdness." },
    { id: "archfey", className: "Warlock", name: "The Archfey", theme: "Trickery", description: "Lean into charm, escape tools, and elusive battlefield manipulation." },
  ],
  Wizard: [
    { id: "evocation", className: "Wizard", name: "School of Evocation", theme: "Blasting", description: "Specialize in explosive spell damage while protecting allies from friendly fire." },
    { id: "illusion", className: "Wizard", name: "School of Illusion", theme: "Deception", description: "Use layered illusions, trickery, and creative problem solving to dominate scenes." },
    { id: "divination", className: "Wizard", name: "School of Divination", theme: "Foresight", description: "Manipulate probability, gather information, and steer outcomes through foresight." },
  ],
};

const FEAT_OPTIONS: FeatOption[] = [
  { id: "alert", name: "Alert", description: "Stay ahead of danger with improved initiative and resistance to ambushes.", tags: ["Initiative", "Awareness"], suggestedAbilities: ["dexterity", "wisdom"] },
  { id: "athlete", name: "Athlete", description: "Improve physical mobility, climbing, and battlefield recovery.", tags: ["Mobility", "Physical"], suggestedAbilities: ["strength", "dexterity"] },
  { id: "crusher", name: "Crusher", description: "Turn blunt force into positioning pressure and critical-hit momentum.", tags: ["Control", "Martial"], suggestedAbilities: ["strength", "constitution"] },
  { id: "defensive-duelist", name: "Defensive Duelist", description: "React with precise footwork and weapon skill to avoid incoming attacks.", tags: ["Defense", "Reaction"], suggestedAbilities: ["dexterity"] },
  { id: "fey-touched", name: "Fey Touched", description: "Gain a touch of fey magic with expanded spell access and utility.", tags: ["Magic", "Mobility"], suggestedAbilities: ["intelligence", "wisdom", "charisma"] },
  { id: "healer", name: "Healer", description: "Provide fast battlefield medicine and improved nonmagical healing support.", tags: ["Support", "Healing"], suggestedAbilities: ["wisdom"] },
  { id: "inspiring-leader", name: "Inspiring Leader", description: "Bolster the party with speeches that grant temporary hit points before danger.", tags: ["Support", "Leadership"], suggestedAbilities: ["charisma"] },
  { id: "lucky", name: "Lucky", description: "Bend fortune at clutch moments with extra reroll leverage.", tags: ["Universal", "Fortune"] },
  { id: "mage-slayer", name: "Mage Slayer", description: "Punish hostile spellcasters and pressure concentration-heavy enemies.", tags: ["Martial", "Anti-caster"], suggestedAbilities: ["strength", "dexterity"] },
  { id: "magic-initiate", name: "Magic Initiate", description: "Pick up introductory spellcasting from another class list.", tags: ["Magic", "Versatility"] },
  { id: "observant", name: "Observant", description: "Sharpen passive awareness and notice secrets others miss.", tags: ["Investigation", "Perception"], suggestedAbilities: ["intelligence", "wisdom"] },
  { id: "resilient", name: "Resilient", description: "Harden yourself with stronger saving throws and personal endurance.", tags: ["Defense", "Saves"] },
  { id: "sentinel", name: "Sentinel", description: "Lock enemies down and punish movement near you.", tags: ["Control", "Frontline"], suggestedAbilities: ["strength"] },
  { id: "shadow-touched", name: "Shadow Touched", description: "Gain stealth-flavored magic and eerie battlefield utility.", tags: ["Magic", "Stealth"], suggestedAbilities: ["intelligence", "wisdom", "charisma"] },
  { id: "sharpshooter", name: "Sharpshooter", description: "Push ranged attacks into high-risk, high-reward accuracy and damage.", tags: ["Ranged", "Damage"], suggestedAbilities: ["dexterity"] },
  { id: "skill-expert", name: "Skill Expert", description: "Expand your skill list and deepen mastery in one area.", tags: ["Skills", "Versatility"] },
  { id: "tough", name: "Tough", description: "Gain a substantial durability boost and stay standing longer.", tags: ["Durability", "HP"], suggestedAbilities: ["constitution"] },
  { id: "war-caster", name: "War Caster", description: "Maintain concentration more reliably and cast effectively in the thick of battle.", tags: ["Magic", "Concentration"], suggestedAbilities: ["constitution"] },
];

const SUBCLASS_UNLOCK_LEVELS: Record<string, number> = {
  Barbarian: 3,
  Bard: 3,
  Cleric: 1,
  Druid: 2,
  Fighter: 3,
  Monk: 3,
  Paladin: 3,
  Ranger: 3,
  Rogue: 3,
  Sorcerer: 1,
  Warlock: 1,
  Wizard: 2,
};

const WARLOCK_PACT_BOONS: ClassChoiceOption[] = [
  {
    id: "pact-blade",
    className: "Warlock",
    name: "Pact of the Blade",
    description: "Conjure or bind a weapon and lean into a martial warlock style with a personalized pact armament.",
    tags: ["Weapon", "Martial", "Pact"],
  },
  {
    id: "pact-chain",
    className: "Warlock",
    name: "Pact of the Chain",
    description: "Gain an empowered familiar for scouting, delivery, and tricky battlefield utility.",
    tags: ["Familiar", "Utility", "Pact"],
  },
  {
    id: "pact-tome",
    className: "Warlock",
    name: "Pact of the Tome",
    description: "Receive a grimoire of extra cantrips and ritual-style flexibility for a more arcane support role.",
    tags: ["Cantrips", "Utility", "Pact"],
  },
];

const WARLOCK_INVOCATIONS: ClassChoiceOption[] = [
  {
    id: "agonizing-blast",
    className: "Warlock",
    name: "Agonizing Blast",
    description: "Empower Eldritch Blast with added Charisma-based damage pressure.",
    tags: ["Damage", "Cantrip", "Popular"],
  },
  {
    id: "armor-of-shadows",
    className: "Warlock",
    name: "Armor of Shadows",
    description: "Cast Mage Armor on yourself at will for steady baseline defense.",
    tags: ["Defense", "At-will"],
  },
  {
    id: "beast-speech",
    className: "Warlock",
    name: "Beast Speech",
    description: "Speak with animals at will to expand scouting, roleplay, and environmental interaction.",
    tags: ["Utility", "Exploration"],
  },
  {
    id: "devils-sight",
    className: "Warlock",
    name: "Devil's Sight",
    description: "See normally in darkness, including magical darkness, for strong control setups.",
    tags: ["Vision", "Control", "Popular"],
  },
  {
    id: "eldritch-mind",
    className: "Warlock",
    name: "Eldritch Mind",
    description: "Gain stronger concentration reliability when maintaining important spells.",
    tags: ["Concentration", "Defense"],
  },
  {
    id: "fiendish-vigor",
    className: "Warlock",
    name: "Fiendish Vigor",
    description: "Cast False Life on yourself at will for repeatable temporary durability.",
    tags: ["Durability", "At-will"],
  },
  {
    id: "gaze-of-two-minds",
    className: "Warlock",
    name: "Gaze of Two Minds",
    description: "Perceive through another willing creature for risky scouting and shared perspective plays.",
    tags: ["Scouting", "Utility"],
  },
  {
    id: "mask-of-many-faces",
    className: "Warlock",
    name: "Mask of Many Faces",
    description: "Cast Disguise Self at will for infiltration-heavy or social deception play.",
    tags: ["Social", "Infiltration", "At-will"],
  },
  {
    id: "misty-visions",
    className: "Warlock",
    name: "Misty Visions",
    description: "Cast Silent Image at will for trickery, distractions, and battlefield creativity.",
    tags: ["Illusion", "At-will"],
  },
  {
    id: "one-with-shadows",
    className: "Warlock",
    name: "One with Shadows",
    description: "Fade invisible in dim light or darkness while stationary to support stealth and ambushes.",
    tags: ["Stealth", "Darkness"],
    minLevel: 5,
  },
  {
    id: "repelling-blast",
    className: "Warlock",
    name: "Repelling Blast",
    description: "Push creatures with Eldritch Blast to create control, spacing, and hazard play.",
    tags: ["Control", "Cantrip", "Popular"],
  },
  {
    id: "sculptor-of-flesh",
    className: "Warlock",
    name: "Sculptor of Flesh",
    description: "Gain access to Polymorph as a flexible power spike for utility or disruption.",
    tags: ["Transformation", "Control"],
    minLevel: 7,
  },
  {
    id: "thief-of-five-fates",
    className: "Warlock",
    name: "Thief of Five Fates",
    description: "Add Bane to your toolkit for debuff-heavy support and attrition pressure.",
    tags: ["Debuff", "Support"],
  },
  {
    id: "visions-of-distant-realms",
    className: "Warlock",
    name: "Visions of Distant Realms",
    description: "Cast Arcane Eye at will to dominate scouting, surveillance, and remote information gathering.",
    tags: ["Scouting", "High-level"],
    minLevel: 15,
  },
];

const WARLOCK_INVOCATION_LEVELS = [2, 5, 7, 9, 12, 15, 18];

export function getSubclassOptions(className: string) {
  return SUBCLASS_OPTIONS[className] ?? [];
}

export function getFeatOptions() {
  return FEAT_OPTIONS;
}

export function getFeatById(id: string) {
  return FEAT_OPTIONS.find((feat) => feat.id === id) ?? null;
}

export function getSubclassByName(className: string, name: string) {
  const normalized = name.trim().toLowerCase();
  return getSubclassOptions(className).find((option) => option.name.toLowerCase() === normalized) ?? null;
}

export function getSubclassUnlockLevel(className: string) {
  return SUBCLASS_UNLOCK_LEVELS[className] ?? 3;
}

export function getAbilityScoreImprovementLevels(className: string) {
  if (className === "Fighter") return [4, 6, 8, 12, 14, 16, 19];
  if (className === "Rogue") return [4, 8, 10, 12, 16, 19];
  return [4, 8, 12, 16, 19];
}

const FIGHTING_STYLES: ClassChoiceOption[] = [
  {
    id: "fighting-style-archery",
    className: "Martial",
    name: "Archery",
    description: "Sharpen ranged accuracy for bows, crossbows, and other precision weapon builds.",
    tags: ["Ranged", "Accuracy"],
  },
  {
    id: "fighting-style-defense",
    className: "Martial",
    name: "Defense",
    description: "Boost steady frontline durability while wearing armor.",
    tags: ["Defense", "Armor"],
  },
  {
    id: "fighting-style-dueling",
    className: "Martial",
    name: "Dueling",
    description: "Improve one-weapon damage for sword-and-shield or elegant single-weapon play.",
    tags: ["Melee", "Damage"],
  },
  {
    id: "fighting-style-great-weapon",
    className: "Martial",
    name: "Great Weapon Fighting",
    description: "Lean into heavy weapon play with more reliable two-handed damage output.",
    tags: ["Heavy", "Damage"],
  },
  {
    id: "fighting-style-protection",
    className: "Martial",
    name: "Protection",
    description: "Use shields and positioning to protect allies from incoming weapon strikes.",
    tags: ["Support", "Shield"],
  },
  {
    id: "fighting-style-two-weapon",
    className: "Martial",
    name: "Two-Weapon Fighting",
    description: "Make dual-wielding turns hit harder and feel more fluid.",
    tags: ["Dual-wield", "Melee"],
  },
];

const SORCERER_METAMAGIC: ClassChoiceOption[] = [
  {
    id: "metamagic-careful",
    className: "Sorcerer",
    name: "Careful Spell",
    description: "Protect allies from your area effects when positioning is tight.",
    tags: ["Control", "Safety"],
  },
  {
    id: "metamagic-distant",
    className: "Sorcerer",
    name: "Distant Spell",
    description: "Push the reach of touch and ranged magic to safer or more surprising positions.",
    tags: ["Range", "Utility"],
  },
  {
    id: "metamagic-empowered",
    className: "Sorcerer",
    name: "Empowered Spell",
    description: "Smooth out swingy damage rolls and improve offensive spell consistency.",
    tags: ["Damage", "Reliable"],
  },
  {
    id: "metamagic-extended",
    className: "Sorcerer",
    name: "Extended Spell",
    description: "Stretch useful buffs and debuffs so they last through longer scenes.",
    tags: ["Duration", "Utility"],
  },
  {
    id: "metamagic-heightened",
    className: "Sorcerer",
    name: "Heightened Spell",
    description: "Press key enemies harder by making one target more vulnerable to a crucial spell.",
    tags: ["Save pressure", "Control"],
  },
  {
    id: "metamagic-quickened",
    className: "Sorcerer",
    name: "Quickened Spell",
    description: "Compress action economy for explosive turns and flexible combat sequencing.",
    tags: ["Tempo", "Popular"],
  },
  {
    id: "metamagic-subtle",
    className: "Sorcerer",
    name: "Subtle Spell",
    description: "Cast without obvious components for stealth, social scenes, and anti-counterspell play.",
    tags: ["Social", "Stealth", "Popular"],
  },
  {
    id: "metamagic-twinned",
    className: "Sorcerer",
    name: "Twinned Spell",
    description: "Duplicate key single-target spells for strong buff or control value.",
    tags: ["Efficiency", "Popular"],
  },
];

const BATTLE_MASTER_MANEUVERS: ClassChoiceOption[] = [
  {
    id: "maneuver-disarming",
    className: "Fighter",
    name: "Disarming Attack",
    description: "Knock key weapons or items away to disrupt enemy plans.",
    tags: ["Control", "Weapon"],
  },
  {
    id: "maneuver-feinting",
    className: "Fighter",
    name: "Feinting Attack",
    description: "Create your own advantage and convert setup into sharp single-hit damage.",
    tags: ["Accuracy", "Damage"],
  },
  {
    id: "maneuver-goading",
    className: "Fighter",
    name: "Goading Attack",
    description: "Pressure enemies into focusing on you instead of your more fragile allies.",
    tags: ["Tank", "Control"],
  },
  {
    id: "maneuver-maneuvering",
    className: "Fighter",
    name: "Maneuvering Attack",
    description: "Reposition allies safely while maintaining offensive momentum.",
    tags: ["Support", "Movement"],
  },
  {
    id: "maneuver-menacing",
    className: "Fighter",
    name: "Menacing Attack",
    description: "Blend damage with fear pressure to break enemy positioning.",
    tags: ["Fear", "Control"],
  },
  {
    id: "maneuver-parry",
    className: "Fighter",
    name: "Parry",
    description: "Reduce incoming melee damage and stay in the fight longer.",
    tags: ["Defense", "Reaction"],
  },
  {
    id: "maneuver-precision",
    className: "Fighter",
    name: "Precision Attack",
    description: "Rescue near-miss attacks and convert accuracy into dependable output.",
    tags: ["Accuracy", "Popular"],
  },
  {
    id: "maneuver-pushing",
    className: "Fighter",
    name: "Pushing Attack",
    description: "Force movement to break formations and exploit terrain or hazards.",
    tags: ["Control", "Positioning"],
  },
  {
    id: "maneuver-rally",
    className: "Fighter",
    name: "Rally",
    description: "Turn tactical leadership into temporary durability for an ally.",
    tags: ["Support", "Temp HP"],
  },
  {
    id: "maneuver-riposte",
    className: "Fighter",
    name: "Riposte",
    description: "Punish misses with reactive offense and strong duel pressure.",
    tags: ["Reaction", "Damage", "Popular"],
  },
  {
    id: "maneuver-sweeping",
    className: "Fighter",
    name: "Sweeping Attack",
    description: "Spread weapon damage across clustered enemies for better crowd pressure.",
    tags: ["Cleaving", "Damage"],
  },
  {
    id: "maneuver-trip",
    className: "Fighter",
    name: "Trip Attack",
    description: "Put enemies prone to create advantage windows for you and your allies.",
    tags: ["Control", "Popular"],
  },
];

const CLASS_CHOICE_COUNT_BY_LEVEL: Record<string, Record<number, number>> = {
  Fighter: { 1: 1, 10: 1 },
  Paladin: { 2: 1 },
  Ranger: { 2: 1 },
  Sorcerer: { 3: 2, 10: 1, 17: 1 },
};

export function getClassChoiceGroups(className: string, level: number, subclassName?: string | null) {
  const groups: ClassChoiceGroup[] = [];

  if (className === "Warlock") {
    if (level === 3) {
      groups.push({
        id: "warlock-pact-boon",
        className,
        level,
        title: "Pact Boon",
        description: "Choose the boon that defines how your patron's gift manifests in play.",
        sourceLabel: "Pact Boon",
        selectionCount: 1,
        options: WARLOCK_PACT_BOONS,
      });
    }

    if (WARLOCK_INVOCATION_LEVELS.includes(level)) {
      groups.push({
        id: `warlock-invocation-${level}`,
        className,
        level,
        title: "Eldritch Invocation",
        description: "Choose one new eldritch invocation unlocked at this warlock level.",
        sourceLabel: "Invocation",
        selectionCount: 1,
        options: WARLOCK_INVOCATIONS.filter((option) => !option.minLevel || option.minLevel <= level),
      });
    }
  }

  const fightingStyleCount = CLASS_CHOICE_COUNT_BY_LEVEL[className]?.[level];
  if (fightingStyleCount && ["Fighter", "Paladin", "Ranger"].includes(className)) {
    groups.push({
      id: `${className.toLowerCase()}-fighting-style-${level}`,
      className,
      level,
      title: "Fighting Style",
      description: "Choose the combat style that best fits how this class track fights.",
      sourceLabel: "Fighting Style",
      selectionCount: fightingStyleCount,
      options: FIGHTING_STYLES,
    });
  }

  if (className === "Sorcerer") {
    const metamagicCount = CLASS_CHOICE_COUNT_BY_LEVEL.Sorcerer[level];
    if (metamagicCount) {
      groups.push({
        id: `sorcerer-metamagic-${level}`,
        className,
        level,
        title: "Metamagic",
        description: "Choose sorcerous techniques that reshape how your spells function in play.",
        sourceLabel: "Metamagic",
        selectionCount: metamagicCount,
        options: SORCERER_METAMAGIC,
      });
    }
  }

  if (className === "Fighter" && subclassName === "Battle Master") {
    const maneuverSelectionCount = level === 3 ? 3 : [7, 10, 15].includes(level) ? 2 : 0;
    if (maneuverSelectionCount > 0) {
      groups.push({
        id: `battle-master-maneuvers-${level}`,
        className,
        level,
        title: "Battle Master Maneuvers",
        description: "Choose combat maneuvers that define your battlefield control and tactical identity.",
        sourceLabel: "Maneuver",
        selectionCount: maneuverSelectionCount,
        options: BATTLE_MASTER_MANEUVERS,
      });
    }
  }

  return groups;
}
