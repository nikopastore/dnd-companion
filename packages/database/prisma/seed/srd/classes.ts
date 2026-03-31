import { PrismaClient } from "@prisma/client";
import { fetchAll } from "./api";

interface Open5eClass {
  name: string;
  slug: string;
  hit_dice: string;
  prof_armor: string;
  prof_weapons: string;
  prof_tools: string;
  prof_saving_throws: string;
  prof_skills: string;
  equipment: string;
  spellcasting_ability: string;
  desc: string;
}

function parseHitDie(hitDice: string): number {
  const match = hitDice.match(/d(\d+)/);
  return match ? parseInt(match[1]) : 8;
}

function parseSavingThrows(text: string): string[] {
  return text.split(",").map((s) => s.trim().toLowerCase());
}

function parseSkillChoices(text: string): { skills: string[]; count: number } {
  const countMatch = text.match(/Choose (\w+)/i);
  const countWord = countMatch ? countMatch[1].toLowerCase() : "two";
  const countMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
  };
  const count = countMap[countWord] || 2;

  const skills: string[] = [];
  const skillNames = [
    "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
    "History", "Insight", "Intimidation", "Investigation", "Medicine",
    "Nature", "Perception", "Performance", "Persuasion", "Religion",
    "Sleight of Hand", "Stealth", "Survival",
  ];
  for (const skill of skillNames) {
    if (text.includes(skill)) skills.push(skill.toLowerCase().replace(/ /g, ""));
  }

  return { skills, count };
}

function getPrimaryAbility(className: string): string {
  const map: Record<string, string> = {
    Barbarian: "strength",
    Bard: "charisma",
    Cleric: "wisdom",
    Druid: "wisdom",
    Fighter: "strength",
    Monk: "dexterity",
    Paladin: "strength",
    Ranger: "dexterity",
    Rogue: "dexterity",
    Sorcerer: "charisma",
    Warlock: "charisma",
    Wizard: "intelligence",
  };
  return map[className] || "strength";
}

// Full caster spell slots by level (Bard, Cleric, Druid, Sorcerer, Wizard)
const FULL_CASTER_SLOTS: Record<number, Record<string, number>> = {
  1: { "1": 2 }, 2: { "1": 3 }, 3: { "1": 4, "2": 2 }, 4: { "1": 4, "2": 3 },
  5: { "1": 4, "2": 3, "3": 2 }, 6: { "1": 4, "2": 3, "3": 3 },
  7: { "1": 4, "2": 3, "3": 3, "4": 1 }, 8: { "1": 4, "2": 3, "3": 3, "4": 2 },
  9: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 1 }, 10: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2 },
  11: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1 }, 12: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1 },
  13: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1 }, 14: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1 },
  15: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1, "8": 1 }, 16: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1, "8": 1 },
  17: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1, "8": 1, "9": 1 }, 18: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 3, "6": 1, "7": 1, "8": 1, "9": 1 },
  19: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 3, "6": 2, "7": 1, "8": 1, "9": 1 }, 20: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 3, "6": 2, "7": 2, "8": 1, "9": 1 },
};

// Half caster spell slots (Paladin, Ranger) — start at level 2
const HALF_CASTER_SLOTS: Record<number, Record<string, number>> = {
  2: { "1": 2 }, 3: { "1": 3 }, 4: { "1": 3 }, 5: { "1": 4, "2": 2 },
  6: { "1": 4, "2": 2 }, 7: { "1": 4, "2": 3 }, 8: { "1": 4, "2": 3 },
  9: { "1": 4, "2": 3, "3": 2 }, 10: { "1": 4, "2": 3, "3": 2 },
  11: { "1": 4, "2": 3, "3": 3 }, 12: { "1": 4, "2": 3, "3": 3 },
  13: { "1": 4, "2": 3, "3": 3, "4": 1 }, 14: { "1": 4, "2": 3, "3": 3, "4": 1 },
  15: { "1": 4, "2": 3, "3": 3, "4": 2 }, 16: { "1": 4, "2": 3, "3": 3, "4": 2 },
  17: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 1 }, 18: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 1 },
  19: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2 }, 20: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2 },
};

// Warlock pact slots
const WARLOCK_SLOTS: Record<number, Record<string, number>> = {
  1: { "1": 1 }, 2: { "1": 2 }, 3: { "2": 2 }, 4: { "2": 2 }, 5: { "3": 2 },
  6: { "3": 2 }, 7: { "4": 2 }, 8: { "4": 2 }, 9: { "5": 2 }, 10: { "5": 2 },
  11: { "5": 3 }, 12: { "5": 3 }, 13: { "5": 3 }, 14: { "5": 3 },
  15: { "5": 3 }, 16: { "5": 3 }, 17: { "5": 4 }, 18: { "5": 4 },
  19: { "5": 4 }, 20: { "5": 4 },
};

// Class resources by level
function getClassResources(className: string, level: number): Record<string, unknown> | null {
  switch (className) {
    case "Barbarian": {
      const rages = [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 999, 999, 999, 999];
      const rageDmg = [2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4];
      return { ragesTotal: rages[level - 1], rageDamage: rageDmg[level - 1] };
    }
    case "Bard": {
      const dice = ["d6", "d6", "d6", "d6", "d8", "d8", "d8", "d8", "d8", "d10", "d10", "d10", "d10", "d10", "d12", "d12", "d12", "d12", "d12", "d12"];
      return { bardicInspirationTotal: Math.max(1, level >= 5 ? 5 : 3), bardicInspirationDie: dice[level - 1] };
    }
    case "Cleric":
      return level >= 2 ? { channelDivinityTotal: level >= 18 ? 3 : level >= 6 ? 2 : 1 } : null;
    case "Druid":
      return level >= 2 ? { wildShapeTotal: 2 } : null;
    case "Fighter":
      return {
        secondWindTotal: 1,
        actionSurgeTotal: level >= 17 ? 2 : level >= 2 ? 1 : 0,
      };
    case "Monk":
      return level >= 2 ? { kiPointsTotal: level } : null;
    case "Paladin": {
      return level >= 2 ? { channelDivinityTotal: 1, layOnHandsTotal: level * 5 } : { layOnHandsTotal: level * 5 };
    }
    case "Sorcerer":
      return level >= 2 ? { sorceryPointsTotal: level } : null;
    case "Warlock": {
      const pactSlots = level <= 2 ? 1 : level <= 10 ? 2 : level <= 16 ? 3 : 4;
      const pactLevel = level <= 2 ? 1 : level <= 4 ? 2 : level <= 6 ? 3 : level <= 8 ? 4 : 5;
      return { pactSlotsTotal: pactSlots, pactSlotLevel: pactLevel };
    }
    default:
      return null;
  }
}

function getSpellSlots(className: string, level: number): Record<string, number> | null {
  const fullCasters = ["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"];
  const halfCasters = ["Paladin", "Ranger"];

  if (fullCasters.includes(className)) return FULL_CASTER_SLOTS[level] || null;
  if (halfCasters.includes(className)) return HALF_CASTER_SLOTS[level] || null;
  if (className === "Warlock") return WARLOCK_SLOTS[level] || null;
  return null;
}

export async function seedClasses(prisma: PrismaClient) {
  console.log("  Fetching classes...");
  const classes = await fetchAll<Open5eClass>("classes");

  for (const cls of classes) {
    const hitDie = parseHitDie(cls.hit_dice);
    const savingThrows = parseSavingThrows(cls.prof_saving_throws);
    const { skills: skillChoices, count: numSkillChoices } = parseSkillChoices(cls.prof_skills);

    const created = await prisma.characterClass.upsert({
      where: { name: cls.name },
      update: {},
      create: {
        name: cls.name,
        hitDie,
        primaryAbility: getPrimaryAbility(cls.name),
        savingThrows,
        skillChoices,
        numSkillChoices,
        proficiencies: {
          armor: cls.prof_armor,
          weapons: cls.prof_weapons,
          tools: cls.prof_tools,
        },
        startingEquipment: { description: cls.equipment },
      },
    });

    // Create levels 1-20
    for (let level = 1; level <= 20; level++) {
      const spellSlots = getSpellSlots(cls.name, level);
      const resources = getClassResources(cls.name, level);

      await prisma.classLevel.upsert({
        where: { classId_level: { classId: created.id, level } },
        update: {},
        create: {
          classId: created.id,
          level,
          features: [], // Features will be populated from desc parsing in a future pass
          spellSlots: spellSlots || undefined,
          resources: resources || undefined,
        },
      });
    }
  }

  console.log(`  ✓ Seeded ${classes.length} classes with 20 levels each`);
}
