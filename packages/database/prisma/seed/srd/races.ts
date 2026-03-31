import { PrismaClient } from "@prisma/client";
import { fetchAll } from "./api";

interface Open5eRace {
  name: string;
  slug: string;
  asi: Array<{ attributes: string[]; value: number }>;
  size_raw: string;
  speed: { walk: number };
  languages: string;
  traits: string;
  subraces: Array<{
    name: string;
    slug: string;
    asi: Array<{ attributes: string[]; value: number }>;
    traits: string;
  }>;
}

function parseAbilityBonuses(asi: Array<{ attributes: string[]; value: number }>) {
  const bonuses: Record<string, number> = {};
  for (const a of asi) {
    for (const attr of a.attributes) {
      bonuses[attr.toLowerCase()] = a.value;
    }
  }
  return bonuses;
}

function parseTraits(traits: string) {
  const parsed: Array<{ name: string; description: string }> = [];
  const sections = traits.split(/\n\n+/).filter(Boolean);

  for (const section of sections) {
    const match = section.match(/\*\*\*(.+?)\.\*\*\*\s*(.*)/s);
    if (match) {
      parsed.push({ name: match[1].trim(), description: match[2].trim() });
    } else if (section.trim()) {
      parsed.push({ name: "Trait", description: section.trim() });
    }
  }

  return parsed;
}

function parseLanguages(langText: string): string[] {
  const languages: string[] = [];
  const common = ["Common", "Elvish", "Dwarvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon"];
  for (const lang of common) {
    if (langText.includes(lang)) languages.push(lang);
  }
  if (languages.length === 0) languages.push("Common");
  return languages;
}

export async function seedRaces(prisma: PrismaClient) {
  console.log("  Fetching races...");
  const races = await fetchAll<Open5eRace>("races");

  for (const race of races) {
    const created = await prisma.race.upsert({
      where: { name: race.name },
      update: {},
      create: {
        name: race.name,
        speed: race.speed.walk,
        abilityBonuses: parseAbilityBonuses(race.asi),
        traits: parseTraits(race.traits),
        languages: parseLanguages(race.languages),
        size: race.size_raw || "Medium",
      },
    });

    // Seed subraces
    if (race.subraces && race.subraces.length > 0) {
      for (const sub of race.subraces) {
        await prisma.subrace.upsert({
          where: { raceId_name: { raceId: created.id, name: sub.name } },
          update: {},
          create: {
            name: sub.name,
            raceId: created.id,
            abilityBonuses: parseAbilityBonuses(sub.asi || []),
            traits: parseTraits(sub.traits || ""),
          },
        });
      }
    }
  }

  console.log(`  ✓ Seeded ${races.length} races`);
}
