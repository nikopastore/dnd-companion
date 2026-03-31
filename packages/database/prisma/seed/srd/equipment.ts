import { PrismaClient } from "@prisma/client";
import { fetchAll } from "./api";

interface Open5eWeapon {
  name: string;
  slug: string;
  category: string;
  cost: string;
  damage_dice: string;
  damage_type: string;
  weight: string;
  properties: string[];
}

interface Open5eArmor {
  name: string;
  slug: string;
  category: string;
  cost: string;
  ac_string: string;
  strength_requirement: string;
  stealth_disadvantage: boolean;
  weight: string;
}

export async function seedEquipment(prisma: PrismaClient) {
  console.log("  Fetching weapons...");
  const weapons = await fetchAll<Open5eWeapon>("weapons");

  for (const w of weapons) {
    await prisma.equipment.upsert({
      where: { name: w.name },
      update: {},
      create: {
        name: w.name,
        category: w.category || "Weapon",
        cost: w.cost || "0 gp",
        weight: w.weight ? parseFloat(w.weight) : null,
        properties: {
          type: "weapon",
          damageDice: w.damage_dice,
          damageType: w.damage_type,
          properties: w.properties || [],
        },
      },
    });
  }
  console.log(`  ✓ Seeded ${weapons.length} weapons`);

  console.log("  Fetching armor...");
  const armor = await fetchAll<Open5eArmor>("armor");

  for (const a of armor) {
    await prisma.equipment.upsert({
      where: { name: a.name },
      update: {},
      create: {
        name: a.name,
        category: a.category || "Armor",
        cost: a.cost || "0 gp",
        weight: a.weight ? parseFloat(a.weight) : null,
        properties: {
          type: "armor",
          acString: a.ac_string,
          strengthRequirement: a.strength_requirement,
          stealthDisadvantage: a.stealth_disadvantage,
        },
      },
    });
  }
  console.log(`  ✓ Seeded ${armor.length} armor`);

  // Seed common adventuring gear
  const gear = [
    { name: "Backpack", category: "Adventuring Gear", cost: "2 gp", weight: 5 },
    { name: "Bedroll", category: "Adventuring Gear", cost: "1 gp", weight: 7 },
    { name: "Rope, hempen (50 feet)", category: "Adventuring Gear", cost: "1 gp", weight: 10 },
    { name: "Rope, silk (50 feet)", category: "Adventuring Gear", cost: "10 gp", weight: 5 },
    { name: "Torch", category: "Adventuring Gear", cost: "1 cp", weight: 1 },
    { name: "Rations (1 day)", category: "Adventuring Gear", cost: "5 sp", weight: 2 },
    { name: "Waterskin", category: "Adventuring Gear", cost: "2 sp", weight: 5 },
    { name: "Tinderbox", category: "Adventuring Gear", cost: "5 sp", weight: 1 },
    { name: "Potion of Healing", category: "Potion", cost: "50 gp", weight: 0.5, properties: { type: "potion", healing: "2d4+2" } },
    { name: "Thieves' Tools", category: "Tools", cost: "25 gp", weight: 1 },
    { name: "Holy Symbol", category: "Adventuring Gear", cost: "5 gp", weight: 0 },
    { name: "Component Pouch", category: "Adventuring Gear", cost: "25 gp", weight: 2 },
    { name: "Arcane Focus (Crystal)", category: "Adventuring Gear", cost: "10 gp", weight: 1 },
    { name: "Explorer's Pack", category: "Equipment Pack", cost: "10 gp", weight: 59 },
    { name: "Dungeoneer's Pack", category: "Equipment Pack", cost: "12 gp", weight: 61.5 },
    { name: "Priest's Pack", category: "Equipment Pack", cost: "19 gp", weight: 24 },
    { name: "Scholar's Pack", category: "Equipment Pack", cost: "40 gp", weight: 10 },
    { name: "Burglar's Pack", category: "Equipment Pack", cost: "16 gp", weight: 44.5 },
    { name: "Diplomat's Pack", category: "Equipment Pack", cost: "39 gp", weight: 36 },
    { name: "Entertainer's Pack", category: "Equipment Pack", cost: "40 gp", weight: 38 },
  ];

  for (const item of gear) {
    await prisma.equipment.upsert({
      where: { name: item.name },
      update: {},
      create: {
        name: item.name,
        category: item.category,
        cost: item.cost,
        weight: item.weight,
        properties: "properties" in item ? (item as { properties: unknown }).properties : { type: "gear" },
      },
    });
  }
  console.log(`  ✓ Seeded ${gear.length} adventuring gear items`);
}
