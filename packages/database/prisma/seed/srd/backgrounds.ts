import { PrismaClient } from "@prisma/client";

// The SRD only includes Acolyte, but we'll include common PHB backgrounds
// as they're widely considered part of the core game experience
const BACKGROUNDS = [
  {
    name: "Acolyte",
    skillProficiencies: ["insight", "religion"],
    toolProficiencies: [],
    languages: 2,
    equipment: {
      items: ["Holy symbol", "Prayer book or prayer wheel", "5 sticks of incense", "Vestments", "Common clothes", "Belt pouch with 15 gp"],
    },
    feature: {
      name: "Shelter of the Faithful",
      description: "As an acolyte, you command the respect of those who share your faith. You and your companions can expect free healing and care at a temple, shrine, or other established presence of your faith. You can also count on the priests there for assistance, provided it doesn't endanger them.",
    },
  },
  {
    name: "Criminal",
    skillProficiencies: ["deception", "stealth"],
    toolProficiencies: ["Gaming set", "Thieves' tools"],
    languages: 0,
    equipment: { items: ["Crowbar", "Dark common clothes with hood", "Belt pouch with 15 gp"] },
    feature: { name: "Criminal Contact", description: "You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals." },
  },
  {
    name: "Folk Hero",
    skillProficiencies: ["animalhandling", "survival"],
    toolProficiencies: ["Artisan's tools", "Vehicles (land)"],
    languages: 0,
    equipment: { items: ["Artisan's tools", "Shovel", "Iron pot", "Common clothes", "Belt pouch with 10 gp"] },
    feature: { name: "Rustic Hospitality", description: "Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among commoners, unless you have shown yourself to be a danger to them." },
  },
  {
    name: "Noble",
    skillProficiencies: ["history", "persuasion"],
    toolProficiencies: ["Gaming set"],
    languages: 1,
    equipment: { items: ["Fine clothes", "Signet ring", "Scroll of pedigree", "Purse with 25 gp"] },
    feature: { name: "Position of Privilege", description: "Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society. Common folk make every effort to accommodate you and avoid your displeasure." },
  },
  {
    name: "Sage",
    skillProficiencies: ["arcana", "history"],
    toolProficiencies: [],
    languages: 2,
    equipment: { items: ["Bottle of black ink", "Quill", "Small knife", "Letter from dead colleague", "Common clothes", "Belt pouch with 10 gp"] },
    feature: { name: "Researcher", description: "When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it." },
  },
  {
    name: "Soldier",
    skillProficiencies: ["athletics", "intimidation"],
    toolProficiencies: ["Gaming set", "Vehicles (land)"],
    languages: 0,
    equipment: { items: ["Insignia of rank", "Trophy from fallen enemy", "Bone dice or deck of cards", "Common clothes", "Belt pouch with 10 gp"] },
    feature: { name: "Military Rank", description: "You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence." },
  },
  {
    name: "Charlatan",
    skillProficiencies: ["deception", "sleightofhand"],
    toolProficiencies: ["Disguise kit", "Forgery kit"],
    languages: 0,
    equipment: { items: ["Fine clothes", "Disguise kit", "Tools of the con", "Belt pouch with 15 gp"] },
    feature: { name: "False Identity", description: "You have created a second identity that includes documentation, established acquaintances, and disguises that allow you to assume that persona." },
  },
  {
    name: "Entertainer",
    skillProficiencies: ["acrobatics", "performance"],
    toolProficiencies: ["Disguise kit", "Musical instrument"],
    languages: 0,
    equipment: { items: ["Musical instrument", "Favor of an admirer", "Costume", "Belt pouch with 15 gp"] },
    feature: { name: "By Popular Demand", description: "You can always find a place to perform. You receive free lodging and food of a modest or comfortable standard, as long as you perform each night." },
  },
  {
    name: "Hermit",
    skillProficiencies: ["medicine", "religion"],
    toolProficiencies: ["Herbalism kit"],
    languages: 1,
    equipment: { items: ["Scroll case with notes", "Winter blanket", "Common clothes", "Herbalism kit", "5 gp"] },
    feature: { name: "Discovery", description: "The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery." },
  },
  {
    name: "Outlander",
    skillProficiencies: ["athletics", "survival"],
    toolProficiencies: ["Musical instrument"],
    languages: 1,
    equipment: { items: ["Staff", "Hunting trap", "Trophy from animal", "Traveler's clothes", "Belt pouch with 10 gp"] },
    feature: { name: "Wanderer", description: "You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. You can find food and fresh water for yourself and up to five other people each day." },
  },
  {
    name: "Guild Artisan",
    skillProficiencies: ["insight", "persuasion"],
    toolProficiencies: ["Artisan's tools"],
    languages: 1,
    equipment: { items: ["Artisan's tools", "Letter of introduction from guild", "Traveler's clothes", "Belt pouch with 15 gp"] },
    feature: { name: "Guild Membership", description: "As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary." },
  },
  {
    name: "Sailor",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["Navigator's tools", "Vehicles (water)"],
    languages: 0,
    equipment: { items: ["Belaying pin (club)", "50 feet of silk rope", "Lucky charm", "Common clothes", "Belt pouch with 10 gp"] },
    feature: { name: "Ship's Passage", description: "When you need to, you can secure free passage on a sailing ship for yourself and your adventuring companions." },
  },
  {
    name: "Urchin",
    skillProficiencies: ["sleightofhand", "stealth"],
    toolProficiencies: ["Disguise kit", "Thieves' tools"],
    languages: 0,
    equipment: { items: ["Small knife", "Map of home city", "Pet mouse", "Token of parents", "Common clothes", "Belt pouch with 10 gp"] },
    feature: { name: "City Secrets", description: "You know the secret patterns and flow to cities and can find passages through the urban sprawl that others would miss." },
  },
];

export async function seedBackgrounds(prisma: PrismaClient) {
  console.log("  Seeding backgrounds...");

  for (const bg of BACKGROUNDS) {
    await prisma.background.upsert({
      where: { name: bg.name },
      update: {},
      create: {
        name: bg.name,
        skillProficiencies: bg.skillProficiencies,
        toolProficiencies: bg.toolProficiencies,
        languages: bg.languages,
        equipment: bg.equipment,
        feature: bg.feature,
      },
    });
  }

  console.log(`  ✓ Seeded ${BACKGROUNDS.length} backgrounds`);
}
