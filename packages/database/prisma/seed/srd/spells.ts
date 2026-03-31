import { PrismaClient } from "@prisma/client";
import { fetchAll } from "./api";

interface Open5eSpell {
  name: string;
  slug: string;
  level_int: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  concentration: string;
  ritual: string;
  desc: string;
  higher_level: string;
  dnd_class: string;
}

export async function seedSpells(prisma: PrismaClient) {
  console.log("  Fetching spells...");
  const spells = await fetchAll<Open5eSpell>("spells");

  // Batch upsert for performance
  let count = 0;
  for (const spell of spells) {
    const classes = spell.dnd_class
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);

    await prisma.spell.upsert({
      where: { name: spell.name },
      update: {},
      create: {
        name: spell.name,
        level: spell.level_int,
        school: spell.school,
        castingTime: spell.casting_time,
        range: spell.range,
        components: spell.components,
        duration: spell.duration,
        concentration: spell.concentration === "yes",
        ritual: spell.ritual === "yes",
        description: spell.desc,
        higherLevels: spell.higher_level || null,
        classes,
      },
    });
    count++;
    if (count % 50 === 0) console.log(`    ... ${count}/${spells.length} spells`);
  }

  console.log(`  ✓ Seeded ${spells.length} spells`);
}
