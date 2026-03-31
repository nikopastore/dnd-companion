import { PrismaClient } from "@prisma/client";
import { seedRaces } from "./srd/races";
import { seedClasses } from "./srd/classes";
import { seedBackgrounds } from "./srd/backgrounds";
import { seedSpells } from "./srd/spells";
import { seedEquipment } from "./srd/equipment";

const prisma = new PrismaClient();

async function main() {
  console.log("🎲 Seeding D&D 5e SRD database...\n");

  const start = Date.now();

  await seedRaces(prisma);
  await seedClasses(prisma);
  await seedBackgrounds(prisma);
  await seedSpells(prisma);
  await seedEquipment(prisma);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Database seeded successfully in ${elapsed}s!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
