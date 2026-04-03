"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";
import { OptionGallery } from "@/components/builder/option-gallery";
import { EntityImage } from "@/components/ui/entity-image";
import { ImageUpload } from "@/components/ui/image-upload";
import { CURATED_ITEM_TEMPLATES } from "@/lib/curated-compendium";
import { getEntityPlaceholderImage } from "@/lib/entity-placeholder";

type Rarity = "common" | "uncommon" | "rare" | "very_rare" | "legendary";

interface SessionItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  category?: string | null;
  description: string | null;
  quantity?: number;
  location: string | null;
  isHidden: boolean;
  claimedById: string | null;
  rarity?: string | null;
  value?: string | null;
}

interface SRDItem {
  index: string;
  name: string;
  desc?: string[];
  cost?: { quantity: number; unit: string };
}

interface Props {
  sessionItems: SessionItem[];
  campaignId: string;
  characters: Array<{ id: string; name: string; className?: string; raceName?: string }>;
  onAddItem: (item: SessionItem) => void;
}

type BuilderStep = 0 | 1 | 2;
type ItemCategory = "weapons" | "potions" | "armor" | "gear" | "treasure";

const ITEM_CATEGORY_OPTIONS = [
  {
    id: "weapons",
    title: "Weapons",
    description: "Blades, bows, and martial gear ready for immediate use or assignment.",
    subtitle: "Damage & combat",
    entityType: "item" as const,
    meta: ["Swords", "Bows", "Polearms"],
  },
  {
    id: "potions",
    title: "Potions & Healing",
    description: "Consumables, healing supplies, and quick-use magical support items.",
    subtitle: "Recovery & utility",
    entityType: "item" as const,
    meta: ["Healing", "Buffs", "Consumables"],
  },
  {
    id: "armor",
    title: "Armor & Shields",
    description: "Protective equipment, shields, and defensive magic gear for the party.",
    subtitle: "Defense & survival",
    entityType: "item" as const,
    meta: ["Heavy armor", "Light armor", "Shields"],
  },
  {
    id: "gear",
    title: "Adventuring Gear",
    description: "Travel tools, kits, supplies, and practical items for exploration.",
    subtitle: "Utility & travel",
    entityType: "item" as const,
    meta: ["Tools", "Kits", "Supplies"],
  },
  {
    id: "treasure",
    title: "Treasure",
    description: "Coins, gems, relics, and art objects that can be claimed or split later.",
    subtitle: "Loot & rewards",
    entityType: "item" as const,
    meta: ["Coins", "Gems", "Art objects"],
  },
];

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bgClass: string }> = {
  common: { label: "Common", color: "text-gray-400", bgClass: "bg-gray-900/20 border-gray-500/20" },
  uncommon: { label: "Uncommon", color: "text-green-400", bgClass: "bg-green-900/20 border-green-500/20" },
  rare: { label: "Rare", color: "text-blue-400", bgClass: "bg-blue-900/20 border-blue-500/20" },
  very_rare: { label: "Very Rare", color: "text-purple-400", bgClass: "bg-purple-900/20 border-purple-500/20" },
  legendary: { label: "Legendary", color: "text-secondary", bgClass: "bg-secondary/10 border-secondary/20" },
};

// DMG-style random treasure tables
const COIN_TREASURE: Record<string, { dice: string; types: string[] }> = {
  "0-4": { dice: "5d6", types: ["cp", "sp"] },
  "5-10": { dice: "4d6x10", types: ["sp", "gp"] },
  "11-16": { dice: "3d6x100", types: ["gp", "pp"] },
  "17+": { dice: "12d6x1000", types: ["gp", "pp"] },
};

const MUNDANE_ITEMS = [
  "Potion of Healing", "Rope of Climbing", "Bag of Holding", "Driftglobe",
  "Goggles of Night", "Sending Stones", "Cloak of Protection", "Amulet of Proof Against Detection",
  "Boots of Elvenkind", "Cloak of Elvenkind", "Gauntlets of Ogre Power", "Headband of Intellect",
  "Pearl of Power", "Ring of Warmth", "Rod of the Pact Keeper", "Wand of Magic Missiles",
];

const GEMS = [
  "Azurite (10 gp)", "Blue Quartz (10 gp)", "Agate (10 gp)", "Turquoise (10 gp)",
  "Bloodstone (50 gp)", "Carnelian (50 gp)", "Jasper (50 gp)", "Moonstone (50 gp)",
  "Amber (100 gp)", "Amethyst (100 gp)", "Garnet (100 gp)", "Jade (100 gp)",
  "Topaz (500 gp)", "Black Pearl (500 gp)", "Emerald (1000 gp)", "Ruby (1000 gp)",
  "Diamond (5000 gp)", "Star Ruby (1000 gp)", "Black Opal (1000 gp)", "Sapphire (1000 gp)",
];

const ART_OBJECTS = [
  "Silver Ewer (25 gp)", "Carved Bone Statuette (25 gp)", "Gold Bracelet (25 gp)",
  "Cloth-of-Gold Vestments (25 gp)", "Black Velvet Mask (25 gp)",
  "Gold Ring with Bloodstone (250 gp)", "Eye Patch with Mock Eye (250 gp)",
  "Embroidered Silk Handkerchief (250 gp)", "Jeweled Anklet (250 gp)",
  "Gold Music Box (250 gp)", "Obsidian Statuette (750 gp)",
  "Jeweled Gold Crown (7500 gp)", "Gold and Sapphire Pendant (7500 gp)",
];

const MAGIC_WEAPONS = [
  "Flame Tongue", "Frost Brand", "Javelin of Lightning", "Mace of Disruption",
  "Sun Blade", "Sword of Wounding", "Trident of Fish Command", "Vicious Weapon",
  "Weapon +1", "Weapon +2", "Weapon +3", "Dagger of Venom",
  "Berserker Axe", "Giant Slayer", "Dragon Slayer", "Nine Lives Stealer",
];

const MAGIC_ARMOR = [
  "Adamantine Armor", "Armor +1", "Armor +2", "Armor +3",
  "Armor of Resistance", "Demon Armor", "Dragon Scale Mail", "Dwarven Plate",
  "Elven Chain", "Glamoured Studded Leather", "Mithral Armor", "Shield +1",
  "Shield +2", "Shield +3", "Animated Shield", "Spellguard Shield",
];

const WONDROUS_ITEMS = [
  "Alchemy Jug", "Amulet of Health", "Belt of Giant Strength", "Boots of Speed",
  "Bracers of Defense", "Broom of Flying", "Cap of Water Breathing", "Carpet of Flying",
  "Circlet of Blasting", "Cloak of Displacement", "Cube of Force", "Decanter of Endless Water",
  "Deck of Illusions", "Eversmoking Bottle", "Eyes of Charming", "Feather Token",
  "Figurine of Wondrous Power", "Gem of Brightness", "Helm of Teleportation", "Horn of Blasting",
  "Immovable Rod", "Instant Fortress", "Iron Flask", "Lantern of Revealing",
  "Mantle of Spell Resistance", "Mirror of Life Trapping", "Necklace of Fireballs", "Periapt of Wound Closure",
  "Portable Hole", "Ring of Invisibility", "Ring of Spell Storing", "Robe of Stars",
];

function getRarityConfig(rarity: string | null | undefined) {
  if (rarity && RARITY_CONFIG[rarity as Rarity]) return RARITY_CONFIG[rarity as Rarity];
  return null;
}

type TreasureCategory = "coins" | "gems" | "art" | "magic_weapon" | "magic_armor" | "wondrous" | "mixed";

interface GeneratedTreasure {
  name: string;
  description: string;
  rarity: Rarity;
  value: string;
}

function rollDice(count: number, sides: number, multiplier = 1): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total * multiplier;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomRarity(crRange: string): Rarity {
  const roll = Math.random();
  if (crRange === "0-4") {
    if (roll < 0.6) return "common";
    if (roll < 0.9) return "uncommon";
    return "rare";
  } else if (crRange === "5-10") {
    if (roll < 0.3) return "common";
    if (roll < 0.6) return "uncommon";
    if (roll < 0.85) return "rare";
    return "very_rare";
  } else if (crRange === "11-16") {
    if (roll < 0.15) return "uncommon";
    if (roll < 0.5) return "rare";
    if (roll < 0.8) return "very_rare";
    return "legendary";
  } else {
    if (roll < 0.1) return "rare";
    if (roll < 0.4) return "very_rare";
    return "legendary";
  }
}

function generateTreasure(crRange: string): GeneratedTreasure[] {
  const results: GeneratedTreasure[] = [];
  const numItems = Math.floor(Math.random() * 3) + 1;

  // Always include some coins
  const coinAmount = crRange === "0-4"
    ? rollDice(5, 6)
    : crRange === "5-10"
      ? rollDice(4, 6, 10)
      : crRange === "11-16"
        ? rollDice(3, 6, 100)
        : rollDice(12, 6, 1000);
  const coinType = crRange === "0-4" ? "cp" : crRange === "5-10" ? "sp" : "gp";
  results.push({
    name: `${coinAmount} ${coinType.toUpperCase()}`,
    description: `A pile of ${coinAmount} ${coinType === "cp" ? "copper" : coinType === "sp" ? "silver" : "gold"} pieces`,
    rarity: "common",
    value: `${coinAmount} ${coinType}`,
  });

  // Random items
  for (let i = 0; i < numItems; i++) {
    const category = Math.random();
    const rarity = pickRandomRarity(crRange);

    if (category < 0.25) {
      const gem = pickRandom(GEMS);
      results.push({ name: gem.split(" (")[0], description: `A precious gem`, rarity, value: gem.match(/\((.+)\)/)?.[1] || "varies" });
    } else if (category < 0.4) {
      const art = pickRandom(ART_OBJECTS);
      results.push({ name: art.split(" (")[0], description: `An art object`, rarity, value: art.match(/\((.+)\)/)?.[1] || "varies" });
    } else if (category < 0.55) {
      const item = pickRandom(MUNDANE_ITEMS);
      results.push({ name: item, description: `A useful magic item`, rarity, value: "varies" });
    } else if (category < 0.7) {
      const weapon = pickRandom(MAGIC_WEAPONS);
      results.push({ name: weapon, description: `A magic weapon`, rarity, value: "varies" });
    } else if (category < 0.85) {
      const armor = pickRandom(MAGIC_ARMOR);
      results.push({ name: armor, description: `Magic armor`, rarity, value: "varies" });
    } else {
      const wondrous = pickRandom(WONDROUS_ITEMS);
      results.push({ name: wondrous, description: `A wondrous item`, rarity, value: "varies" });
    }
  }

  return results;
}

export function LootTab({ sessionItems, campaignId, characters, onAddItem }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"items" | "generator" | "browser">("items");
  const [builderStep, setBuilderStep] = useState<BuilderStep>(0);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Add item form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [rarity, setRarity] = useState<Rarity>("common");
  const [value, setValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);

  // Treasure generator
  const [crRange, setCrRange] = useState("0-4");
  const [generatedLoot, setGeneratedLoot] = useState<GeneratedTreasure[]>([]);

  // Magic item browser
  const [srdItems, setSrdItems] = useState<SRDItem[]>([]);
  const [srdLoading, setSrdLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const hidden = useMemo(() => sessionItems.filter((i) => i.isHidden), [sessionItems]);
  const revealed = useMemo(() => sessionItems.filter((i) => !i.isHidden), [sessionItems]);

  const filteredSrd = useMemo(() => {
    if (!searchFilter.trim()) return srdItems;
    const lower = searchFilter.toLowerCase();
    return srdItems.filter((item) => item.name.toLowerCase().includes(lower));
  }, [srdItems, searchFilter]);

  const builderTemplates = useMemo(() => {
    if (!selectedCategory) return [];

    if (selectedCategory === "treasure") {
      return [
        ...CURATED_ITEM_TEMPLATES.filter((item) => item.category === "treasure").map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          subtitle: item.subtitle,
          entityType: "item" as const,
          imageUrl: item.imageUrl,
          badge: item.featured ? "Featured" : undefined,
          meta: [item.value || "Value varies", ...(item.meta ?? [])],
          searchText: item.searchText,
        })),
        ...[...GEMS, ...ART_OBJECTS].map((entry) => ({
          id: entry,
          title: entry.split(" (")[0],
          description: entry.includes("gp")
            ? "A valuable treasure find ready to be claimed or split."
            : "A portable treasure reward.",
          subtitle: "Treasure",
          entityType: "item" as const,
          imageUrl: getEntityPlaceholderImage("item", entry.split(" (")[0]),
          meta: [entry.match(/\((.+)\)/)?.[1] || "Value varies"],
        })),
      ];
    }

    const categoryFilters: Record<Exclude<ItemCategory, "treasure">, (item: SRDItem) => boolean> = {
      weapons: (item) => item.name.toLowerCase().includes("sword") || item.name.toLowerCase().includes("bow") || item.name.toLowerCase().includes("axe") || item.name.toLowerCase().includes("dagger") || item.name.toLowerCase().includes("mace") || item.name.toLowerCase().includes("hammer") || item.name.toLowerCase().includes("spear") || item.name.toLowerCase().includes("staff") || item.name.toLowerCase().includes("crossbow") || item.name.toLowerCase().includes("weapon"),
      potions: (item) => item.name.toLowerCase().includes("potion") || item.name.toLowerCase().includes("healing"),
      armor: (item) => item.name.toLowerCase().includes("armor") || item.name.toLowerCase().includes("shield") || item.name.toLowerCase().includes("mail") || item.name.toLowerCase().includes("plate"),
      gear: (item) => !["weapon", "potion", "armor", "shield", "mail", "plate"].some((keyword) => item.name.toLowerCase().includes(keyword)),
    };

    const curated = CURATED_ITEM_TEMPLATES.filter((item) => item.category === selectedCategory).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      subtitle: item.subtitle,
      entityType: "item" as const,
      imageUrl: item.imageUrl,
      badge: item.featured ? "Featured" : item.rarity ? item.rarity.replace(/_/g, " ") : undefined,
      meta: [item.value || "Value varies", ...(item.meta ?? [])],
      searchText: item.searchText,
    }));

    const srdTemplates = srdItems
      .filter(categoryFilters[selectedCategory as Exclude<ItemCategory, "treasure">])
      .slice(0, 30)
      .map((item) => ({
        id: item.index,
        title: item.name,
        description: item.desc?.[0] || "SRD equipment template.",
        subtitle: item.cost ? `${item.cost.quantity} ${item.cost.unit}` : "SRD template",
        entityType: "item" as const,
        imageUrl: getEntityPlaceholderImage("item", item.name),
        meta: item.cost ? [`${item.cost.quantity} ${item.cost.unit}`] : [],
      }));

    const seen = new Set(curated.map((item) => item.title.toLowerCase()));
    return [...curated, ...srdTemplates.filter((item) => !seen.has(item.title.toLowerCase()))];
  }, [selectedCategory, srdItems]);

  function resetForm() {
    setName("");
    setDescription("");
    setLocation("");
    setRarity("common");
    setValue("");
    setQuantity(1);
    setItemImageUrl(null);
    setAssignments({});
    setSelectedCategory(null);
    setBuilderStep(0);
    setSearchFilter("");
    setEditingItemId(null);
  }

  function toggleAssignment(characterId: string) {
    setAssignments((prev) => {
      if (prev[characterId]) {
        const next = { ...prev };
        delete next[characterId];
        return next;
      }
      return { ...prev, [characterId]: 1 };
    });
  }

  function beginEditing(item: SessionItem) {
    setEditingItemId(item.id);
    setSelectedCategory((item.category as ItemCategory) || null);
    setBuilderStep(2);
    setName(item.name);
    setDescription(item.description || "");
    setLocation(item.location || "");
    setValue(item.value || "");
    setQuantity(item.quantity ?? 1);
    setItemImageUrl(item.imageUrl || null);
    setRarity(((item.rarity as Rarity) || "common"));
    setShowForm(true);
  }

  async function handleAddItem() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(
      editingItemId
        ? `/api/campaigns/${campaignId}/session-items/${editingItemId}`
        : `/api/campaigns/${campaignId}/session-items`,
      {
        method: editingItemId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          rarity,
          value: value.trim() || null,
          imageUrl: itemImageUrl,
          category: selectedCategory,
          quantity,
        }),
      }
    );

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const item = await res.json();

    const selectedAssignments = Object.entries(assignments).map(([characterId, qty]) => ({
      characterId,
      quantity: qty,
    }));

    if (!editingItemId && selectedAssignments.length > 0) {
      await fetch(`/api/campaigns/${campaignId}/session-items/${item.id}/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: selectedAssignments }),
      });
    }

    setLoading(false);
    if (res.ok) {
      onAddItem(item);
      resetForm();
      setShowForm(false);
    }
  }

  async function handleAddToCampaign(itemName: string, itemDesc: string, itemRarity?: Rarity) {
    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/session-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: itemName,
        description: itemDesc || null,
        location: null,
        rarity: itemRarity || "common",
        value: null,
        imageUrl: getEntityPlaceholderImage("item", itemName),
      }),
    });
    setLoading(false);
    if (res.ok) {
      const item = await res.json();
      onAddItem(item);
    }
  }

  function handleGenerateTreasure() {
    const treasure = generateTreasure(crRange);
    setGeneratedLoot(treasure);
  }

  async function fetchSrdItems() {
    setSrdLoading(true);
    try {
      const res = await fetch("/api/srd/equipment");
      if (res.ok) {
        const data = await res.json();
        setSrdItems(Array.isArray(data) ? data : data.results || []);
      }
    } catch {
      // Silently handle fetch errors
    }
    setSrdLoading(false);
  }

  useEffect(() => {
    if ((activeSection === "browser" || showForm) && srdItems.length === 0) {
      fetchSrdItems();
    }
  }, [activeSection, showForm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Icon name="inventory_2" size={24} className="text-secondary" />
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">
            Loot & Items ({sessionItems.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
              return;
            }
            resetForm();
            setShowForm(true);
          }}
          className="interactive-glow"
        >
          <Icon name={showForm ? "close" : "add"} size={14} />
          {showForm ? "Cancel" : "Add Item"}
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-surface-container-lowest p-1 rounded-sm border border-outline-variant/5">
        {([
          { key: "items" as const, label: "Session Items", icon: "deployed_code" },
          { key: "generator" as const, label: "Treasure Generator", icon: "casino" },
          { key: "browser" as const, label: "Magic Items", icon: "auto_awesome" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm font-label text-[10px] uppercase tracking-wider font-bold transition-all duration-300 ${
              activeSection === tab.key
                ? "bg-surface-container-high text-secondary border border-secondary/15"
                : "text-on-surface/40 hover:text-on-surface/60 border border-transparent"
            }`}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Item Form */}
      {showForm && (
        <div className="glass rounded-sm p-6 border border-secondary/10 space-y-3 animate-fade-in-up relative overflow-hidden">
          <div className="decorative-orb absolute -top-16 -right-16 w-48 h-48" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <p className="font-headline text-sm text-secondary uppercase tracking-wider">
              {editingItemId ? "Edit Item Card" : "Item Builder"}
            </p>
            <div className="flex-1" />
            <AIAssistButton
              label="Generate Magic Item"
              size="sm"
              systemPrompt={AI_PROMPTS.magicItemGenerator}
              userPrompt="Generate a unique D&D 5e magic item."
              onApply={(content) => {}}
              onApplyJSON={(data) => {
                const item = data as Record<string, unknown>;
                if (item.name) setName(item.name as string);
                if (item.description) setDescription(item.description as string);
                if (item.value) setValue(item.value as string);
                if (item.category) {
                  setSelectedCategory((item.category as ItemCategory) || null);
                }
                if (item.rarity) {
                  const rarityStr = (item.rarity as string).toLowerCase().replace(/ /g, "_");
                  if (["common", "uncommon", "rare", "very_rare", "legendary"].includes(rarityStr)) {
                    setRarity(rarityStr as Rarity);
                  }
                }
                setBuilderStep(2);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["Category", "Template", "Finalize"].map((label, index) => (
              <div
                key={label}
                className={`rounded-full px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] ${
                  builderStep === index
                    ? "bg-secondary/10 text-secondary"
                    : builderStep > index
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container-high text-on-surface-variant/45"
                }`}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>

          {builderStep === 0 && (
            <OptionGallery
              options={ITEM_CATEGORY_OPTIONS}
              selectedId={selectedCategory}
              onSelect={(option) => {
                setSelectedCategory(option.id as ItemCategory);
                setBuilderStep(1);
              }}
              featuredIds={["weapons", "potions", "treasure"]}
              featuredLabel="Common starting points"
              allLabel="Browse categories"
              searchPlaceholder="Search item categories"
            />
          )}

          {builderStep === 1 && (
            <div className="space-y-4">
              <OptionGallery
                options={builderTemplates}
                selectedId={name}
                onSelect={(option) => {
                  setName(option.title);
                  setDescription(option.description);
                  setValue(option.meta?.[0] ?? "");
                  setItemImageUrl(option.imageUrl ?? getEntityPlaceholderImage("item", option.title));
                  setBuilderStep(2);
                }}
                featuredIds={builderTemplates.slice(0, 6).map((option) => option.id)}
                featuredLabel="Suggested templates"
                allLabel="Template library"
                searchPlaceholder="Search templates"
                emptyMessage="No templates found for this category yet. Use AI generation or continue and create one manually."
              />
              <div className="flex justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(0)}>
                  <Icon name="arrow_back" size={14} />
                  Back
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setBuilderStep(2)}
                >
                  Continue manually
                  <Icon name="arrow_forward" size={14} />
                </Button>
              </div>
            </div>
          )}

          {builderStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-sm border border-outline-variant/10 bg-surface-container-low p-4">
                <ImageUpload
                  currentImage={itemImageUrl}
                  onUpload={(url) => setItemImageUrl(url)}
                  size="sm"
                  label="Item Art"
                />
                <div className="flex items-center gap-3">
                  <EntityImage imageUrl={itemImageUrl} entityType="item" name={name || "Item"} size="sm" />
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary">Item Card Art</p>
                    <p className="font-body text-xs text-on-surface-variant">
                      Upload custom art or keep the generated placeholder image.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input id="loot-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Flame Tongue Greatsword..." />
                <Input id="loot-loc" label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dragon's hoard, Room 12..." />
              </div>

              <Textarea
                id="loot-desc"
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A magical weapon wreathed in flame..."
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select
                  id="loot-rarity"
                  label="Rarity"
                  icon="auto_awesome"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value as Rarity)}
                >
                  {(Object.keys(RARITY_CONFIG) as Rarity[]).map((r) => (
                    <option key={r} value={r}>{RARITY_CONFIG[r].label}</option>
                  ))}
                </Select>
                <Input
                  id="loot-value"
                  label="Value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="500 gp"
                />
                <Input
                  id="loot-quantity"
                  label="Quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              {characters.length > 0 && !editingItemId && (
                <div className="space-y-3 rounded-sm border border-outline-variant/10 bg-surface-container-low p-4">
                  <div className="flex items-center gap-2">
                    <Icon name="person_add" size={16} className="text-secondary" />
                    <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                      Grant To Characters
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {characters.map((character) => {
                      const selected = Boolean(assignments[character.id]);
                      return (
                        <label
                          key={character.id}
                          className={`rounded-sm border p-3 transition-all duration-300 ${
                            selected
                              ? "border-secondary/25 bg-secondary/10"
                              : "border-outline-variant/10 bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleAssignment(character.id)}
                            />
                            <div className="flex-1">
                              <p className="font-body text-sm text-on-surface">{character.name}</p>
                              <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/45">
                                {[character.raceName, character.className].filter(Boolean).join(" · ") || "Character"}
                              </p>
                            </div>
                            {selected && (
                              <input
                                type="number"
                                min={1}
                                max={quantity}
                                value={assignments[character.id]}
                                onChange={(event) =>
                                  setAssignments((prev) => ({
                                    ...prev,
                                    [character.id]: Math.max(1, Math.min(quantity, parseInt(event.target.value) || 1)),
                                  }))
                                }
                                className="w-16 rounded-sm border border-outline-variant/10 bg-surface-container-high px-2 py-1 text-sm text-on-surface"
                              />
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(selectedCategory ? 1 : 0)}>
                  <Icon name="arrow_back" size={14} />
                  Back
                </Button>
                <Button size="sm" onClick={handleAddItem} disabled={loading || !name.trim()} className="glow-gold">
                  {loading ? (editingItemId ? "Saving..." : "Adding...") : editingItemId ? "Save Item Card" : "Create Item Card"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Items Section */}
      {activeSection === "items" && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Hidden Items */}
          {hidden.length > 0 && (
            <div className="space-y-2">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 flex items-center gap-1.5">
                <Icon name="visibility_off" size={12} />
                Hidden ({hidden.length})
              </span>
              {hidden.map((item) => (
                <div key={item.id} className="p-3 bg-surface-container-low rounded-sm flex items-center gap-3 border-l-2 border-outline-variant/30 interactive-glow shadow-whisper">
                  <EntityImage imageUrl={item.imageUrl} entityType="item" name={item.name} size="sm" className="shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm text-on-surface">{item.name}</span>
                      {(item.quantity ?? 1) > 1 && (
                        <span className="font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xl border border-outline-variant/10 bg-surface-container-high/40 text-on-surface/50">
                          x{item.quantity}
                        </span>
                      )}
                      {item.category && (
                        <span className="font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xl border border-outline-variant/10 bg-surface-container-high/40 text-on-surface/50">
                          {item.category}
                        </span>
                      )}
                      {item.rarity && getRarityConfig(item.rarity) && (
                        <span className={`font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xl border ${getRarityConfig(item.rarity)!.bgClass} ${getRarityConfig(item.rarity)!.color}`}>
                          {getRarityConfig(item.rarity)!.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.description && (
                        <span className="font-body text-xs text-on-surface-variant">{item.description}</span>
                      )}
                      {item.location && (
                        <span className="font-label text-[10px] text-on-surface/30">@ {item.location}</span>
                      )}
                    </div>
                  </div>
                  {item.value && (
                    <span className="font-label text-[10px] text-secondary">{item.value}</span>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => beginEditing(item)}>
                    <Icon name="edit" size={12} />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Revealed Items */}
          {revealed.length > 0 && (
            <div className="space-y-2">
              <span className="font-label text-[10px] uppercase tracking-widest text-secondary/60 flex items-center gap-1.5">
                <Icon name="visibility" size={12} />
                Revealed ({revealed.length})
              </span>
              {revealed.map((item) => (
                <div key={item.id} className="p-3 bg-surface-container-low rounded-sm flex items-center gap-3 border-l-2 border-secondary/30 interactive-glow glow-gold shadow-whisper">
                  <EntityImage imageUrl={item.imageUrl} entityType="item" name={item.name} size="sm" className="shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm text-on-surface">{item.name}</span>
                      {(item.quantity ?? 1) > 1 && (
                        <span className="font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xl border border-outline-variant/10 bg-surface-container-high/40 text-on-surface/50">
                          x{item.quantity}
                        </span>
                      )}
                      {item.category && (
                        <span className="font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xl border border-outline-variant/10 bg-surface-container-high/40 text-on-surface/50">
                          {item.category}
                        </span>
                      )}
                      {item.rarity && getRarityConfig(item.rarity) && (
                        <span className={`font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xl border ${getRarityConfig(item.rarity)!.bgClass} ${getRarityConfig(item.rarity)!.color}`}>
                          {getRarityConfig(item.rarity)!.label}
                        </span>
                      )}
                      {item.claimedById && (
                        <Chip variant="success" icon="person">Claimed</Chip>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.description && (
                        <span className="font-body text-xs text-on-surface-variant">{item.description}</span>
                      )}
                      {item.location && (
                        <span className="font-label text-[10px] text-on-surface/30">@ {item.location}</span>
                      )}
                    </div>
                  </div>
                  {item.value && (
                    <span className="font-label text-[10px] text-secondary">{item.value}</span>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => beginEditing(item)}>
                    <Icon name="edit" size={12} />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {sessionItems.length === 0 && (
            <EmptyState
              icon="inventory_2"
              title="No session items yet"
              description="Add items, or use the Treasure Generator"
              action={
                <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="glow-gold">
                  <Icon name="add" size={14} /> Add Item
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Treasure Generator Section */}
      {activeSection === "generator" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="glass rounded-sm p-6 border border-secondary/10 space-y-4 relative overflow-hidden">
            <div className="decorative-orb absolute -bottom-12 -left-12 w-40 h-40" />
            <div className="flex items-center gap-2 relative z-10">
              <Icon name="casino" size={20} className="text-secondary" />
              <span className="font-headline text-sm text-secondary uppercase tracking-wider">Random Treasure</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                CR Range
              </label>
              <div className="flex gap-2">
                {[
                  { value: "0-4", label: "CR 0-4" },
                  { value: "5-10", label: "CR 5-10" },
                  { value: "11-16", label: "CR 11-16" },
                  { value: "17+", label: "CR 17+" },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setCrRange(range.value)}
                    className={`flex-1 py-2 rounded-sm font-label text-[10px] uppercase tracking-wider font-bold border transition-all duration-300 ${
                      crRange === range.value
                        ? "bg-secondary/10 text-secondary border-secondary/20"
                        : "bg-surface-container-high/40 text-on-surface/40 border-outline-variant/10 hover:text-on-surface/60"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <Button size="sm" onClick={handleGenerateTreasure} className="glow-gold w-full">
              <Icon name="casino" size={14} />
              Roll Treasure
            </Button>
          </div>

          {/* Generated Results */}
          {generatedLoot.length > 0 && (
            <div className="space-y-2">
              <span className="font-label text-[10px] uppercase tracking-widest text-secondary/60">Generated Loot</span>
              {generatedLoot.map((item, i) => {
                const rarityConfig = RARITY_CONFIG[item.rarity];
                return (
                  <div key={i} className="p-3 bg-surface-container-low rounded-sm flex items-center gap-3 border border-outline-variant/8 animate-fade-in-up interactive-glow">
                    <Icon name="deployed_code" size={16} className={rarityConfig.color} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm text-on-surface font-semibold">{item.name}</span>
                        <span className={`font-label text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xl border ${rarityConfig.bgClass} ${rarityConfig.color}`}>
                          {rarityConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-body text-xs text-on-surface-variant">{item.description}</span>
                        <span className="font-label text-[10px] text-secondary/60">{item.value}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddToCampaign(item.name, item.description, item.rarity)}
                      disabled={loading}
                      className="shrink-0"
                    >
                      <Icon name="add" size={12} />
                      Add
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Magic Item Browser Section */}
      {activeSection === "browser" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="relative">
            <Input
              id="srd-search"
              icon="search"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search potions and magic items..."
            />
          </div>

          {srdLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-surface-container-high/30 rounded-sm animate-pulse" />
              ))}
            </div>
          )}

          {!srdLoading && filteredSrd.length > 0 && (
            <div className="space-y-2 stagger-children">
              {filteredSrd.map((item) => (
                <div key={item.index} className="p-3 bg-surface-container-low rounded-sm flex items-center gap-3 border border-outline-variant/8 interactive-glow">
                  <EntityImage imageUrl={getEntityPlaceholderImage("item", item.name)} entityType="item" name={item.name} size="sm" className="shrink-0" />
                  <div className="flex-1">
                    <span className="font-body text-sm text-on-surface font-semibold">{item.name}</span>
                    {item.desc && item.desc.length > 0 && (
                      <p className="font-body text-xs text-on-surface-variant line-clamp-1 mt-0.5">{item.desc[0]}</p>
                    )}
                    {item.cost && (
                      <span className="font-label text-[10px] text-secondary/60 mt-0.5 block">
                        {item.cost.quantity} {item.cost.unit}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddToCampaign(item.name, item.desc?.[0] || "")}
                    disabled={loading}
                    className="shrink-0"
                  >
                    <Icon name="add" size={12} />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!srdLoading && filteredSrd.length === 0 && srdItems.length > 0 && (
            <EmptyState
              icon="search_off"
              title="No items match your search"
              description="Try a different search term"
            />
          )}

          {!srdLoading && srdItems.length === 0 && (
            <EmptyState
              icon="cloud_off"
              title="Could not load magic items"
              description="Unable to fetch items from the SRD"
              action={
                <Button variant="ghost" size="sm" onClick={fetchSrdItems}>
                  <Icon name="refresh" size={14} /> Retry
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
