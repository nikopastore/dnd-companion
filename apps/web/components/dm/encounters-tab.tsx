"use client";

import { useState, useMemo } from "react";
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
import { EncounterTrackerPanel } from "@/components/dm/encounter-tracker-panel";
import { type EncounterTrackerCharacter } from "@/lib/encounter-tracker";

type EncounterStatus = "active" | "prepared" | "completed";
type Difficulty = "easy" | "medium" | "hard" | "deadly";

interface Monster {
  name: string;
  cr: string;
  count: number;
  hp: number;
  ac: number;
}

interface LootItem {
  name: string;
  quantity: number;
  description: string;
}

interface Encounter {
  id: string;
  name: string;
  description: string | null;
  status: string;
  difficulty: string | null;
  monsters: Monster[] | unknown;
  loot: LootItem[] | unknown;
  liveState: unknown;
  notes: string | null;
}

interface Props {
  encounters: Encounter[];
  campaignId: string;
  characters: EncounterTrackerCharacter[];
  locations: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    mapData: unknown;
  }>;
  onAdd: () => void;
}

const STATUS_ORDER: EncounterStatus[] = ["active", "prepared", "completed"];

const STATUS_CONFIG: Record<EncounterStatus, { label: string; icon: string; color: string }> = {
  active: { label: "Active", icon: "swords", color: "text-error" },
  prepared: { label: "Prepared", icon: "inventory_2", color: "text-yellow-400" },
  completed: { label: "Completed", icon: "check_circle", color: "text-green-400" },
};

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bgClass: string; xpMultiplier: number }> = {
  easy: { label: "Easy", color: "text-green-400", bgClass: "bg-green-900/20 border-green-500/20", xpMultiplier: 1 },
  medium: { label: "Medium", color: "text-yellow-400", bgClass: "bg-yellow-900/20 border-yellow-500/20", xpMultiplier: 1.5 },
  hard: { label: "Hard", color: "text-orange-400", bgClass: "bg-orange-900/20 border-orange-500/20", xpMultiplier: 2 },
  deadly: { label: "Deadly", color: "text-error", bgClass: "bg-error-container/20 border-error/20", xpMultiplier: 3 },
};

// Standard 5e XP thresholds by party level (for a party of 4)
const XP_BUDGETS: Record<Difficulty, number> = {
  easy: 500,
  medium: 1000,
  hard: 1500,
  deadly: 2000,
};

const ENCOUNTER_STYLE_OPTIONS = [
  { id: "ambush", title: "Ambush", description: "Enemy pressure starts fast, with initiative and positioning as the hook.", subtitle: "Immediate danger", entityType: "encounter" as const, meta: ["Open strong"] },
  { id: "defense", title: "Defense", description: "Protect a chokepoint, ally, convoy, or ritual under pressure.", subtitle: "Hold the line", entityType: "encounter" as const, meta: ["Protection"] },
  { id: "chase", title: "Chase", description: "Movement and escalation drive the fight across changing terrain.", subtitle: "Mobile battle", entityType: "encounter" as const, meta: ["Pursuit"] },
  { id: "infiltration", title: "Infiltration", description: "Stealth, alarm states, and partial detection shape the scene.", subtitle: "Stealth tension", entityType: "encounter" as const, meta: ["Stealth"] },
  { id: "boss", title: "Boss Fight", description: "A signature villain or monster anchors the encounter structure.", subtitle: "Set-piece", entityType: "encounter" as const, meta: ["Payoff"] },
  { id: "gauntlet", title: "Gauntlet", description: "A sequence of attrition beats grinds the party before a payoff room.", subtitle: "Endurance", entityType: "encounter" as const, meta: ["Attrition"] },
];

// CR to XP mapping (standard 5e)
const CR_XP: Record<string, number> = {
  "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
  "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
  "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
  "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
  "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
  "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000,
  "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000,
};

function parseMonsters(data: Monster[] | unknown): Monster[] {
  if (Array.isArray(data)) return data as Monster[];
  return [];
}

function parseLoot(data: LootItem[] | unknown): LootItem[] {
  if (Array.isArray(data)) return data as LootItem[];
  return [];
}

function calculateTotalXP(monsters: Monster[]): number {
  return monsters.reduce((sum, m) => {
    const baseXP = CR_XP[m.cr] || 0;
    return sum + baseXP * m.count;
  }, 0);
}

function EncounterCard({
  encounter,
  campaignId,
  characters,
  locations,
  onRefresh,
}: {
  encounter: Encounter;
  campaignId: string;
  characters: EncounterTrackerCharacter[];
  locations: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    mapData: unknown;
  }>;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diffConfig = DIFFICULTY_CONFIG[(encounter.difficulty as Difficulty) || "medium"] || DIFFICULTY_CONFIG.medium;
  const monsters = parseMonsters(encounter.monsters);
  const lootItems = parseLoot(encounter.loot);
  const totalXP = calculateTotalXP(monsters);
  const monsterCount = monsters.reduce((sum, m) => sum + m.count, 0);

  return (
    <div
      className={`bg-surface-container-low rounded-sm border border-outline-variant/8 transition-all duration-300 cursor-pointer interactive-glow shadow-whisper ${
        expanded ? "border-secondary/20" : "hover:border-secondary/15"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Card Header */}
      <div className="p-4 flex items-center gap-3">
        <Icon name={(STATUS_CONFIG[encounter.status as EncounterStatus] || STATUS_CONFIG.prepared).icon} size={20} className={(STATUS_CONFIG[encounter.status as EncounterStatus] || STATUS_CONFIG.prepared).color} />

        <div className="flex-1 min-w-0">
          <span className="font-body font-semibold text-sm text-on-surface block truncate">
            {encounter.name}
          </span>
          {encounter.description && (
            <p className="font-body text-xs text-on-surface-variant line-clamp-1 mt-0.5">
              {encounter.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Difficulty Badge */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-xl font-label text-[9px] uppercase font-bold tracking-wider border ${diffConfig.bgClass} ${diffConfig.color}`}>
            {diffConfig.label}
          </span>

          {/* Monster Count */}
          <span className="font-label text-[10px] text-on-surface/40 flex items-center gap-0.5">
            <Icon name="pest_control" size={12} />
            {monsterCount}
          </span>

          {/* Loot Count */}
          {lootItems.length > 0 && (
            <span className="font-label text-[10px] text-secondary/60 flex items-center gap-0.5">
              <Icon name="deployed_code" size={12} />
              {lootItems.length}
            </span>
          )}

          <Icon name={expanded ? "expand_less" : "expand_more"} size={16} className="text-on-surface/30" />
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-outline-variant/5 pt-3 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
          {/* Monster Table */}
          {monsters.length > 0 && (
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 block mb-2">Monsters</span>
              <div className="bg-surface-container-lowest rounded-sm overflow-hidden border border-outline-variant/5">
                <div className="grid grid-cols-5 gap-2 px-3 py-1.5 bg-surface-container-high/30 font-label text-[9px] uppercase tracking-wider text-on-surface/40">
                  <span className="col-span-2">Name</span>
                  <span>CR</span>
                  <span>HP</span>
                  <span>AC</span>
                </div>
                {monsters.map((m, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 px-3 py-2 border-t border-outline-variant/5 font-body text-sm text-on-surface">
                    <span className="col-span-2 flex items-center gap-1">
                      <span className="text-error font-bold text-xs">{m.count}x</span> {m.name}
                    </span>
                    <span className="text-on-surface-variant">{m.cr}</span>
                    <span className="text-error">{m.hp}</span>
                    <span className="text-secondary">{m.ac}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-label text-[10px] text-on-surface/30">Total XP:</span>
                <span className="font-headline text-sm text-secondary">{totalXP.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Loot List */}
          {lootItems.length > 0 && (
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 block mb-2">Loot</span>
              <div className="space-y-1">
                {lootItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-surface-container-lowest rounded-sm border border-outline-variant/5">
                    <Icon name="deployed_code" size={14} className="text-secondary/60" />
                    <span className="font-body text-sm text-on-surface">
                      {item.quantity > 1 && <span className="text-secondary mr-1">{item.quantity}x</span>}
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="font-body text-xs text-on-surface-variant ml-auto">{item.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {encounter.notes && (
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 block mb-1">DM Notes</span>
              <p className="font-body text-sm text-on-surface-variant italic">{encounter.notes}</p>
            </div>
          )}

          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 block mb-3">Combat Runtime</span>
            <EncounterTrackerPanel
              campaignId={campaignId}
              encounter={encounter}
              characters={characters}
              locations={locations}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function EncountersTab({ encounters, campaignId, characters, locations, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [builderStep, setBuilderStep] = useState<0 | 1 | 2>(0);
  const [encounterStyle, setEncounterStyle] = useState("ambush");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [monsters, setMonsters] = useState<Monster[]>([{ name: "", cr: "1", count: 1, hp: 10, ac: 12 }]);
  const [loot, setLoot] = useState<LootItem[]>([]);
  const [notes, setNotes] = useState("");

  const grouped = useMemo(() => {
    const groups: Record<EncounterStatus, Encounter[]> = { active: [], prepared: [], completed: [] };
    encounters.forEach((e) => {
      const status = e.status as EncounterStatus;
      if (groups[status]) groups[status].push(e);
      else groups.prepared.push(e);
    });
    return groups;
  }, [encounters]);

  const formTotalXP = calculateTotalXP(monsters);
  const xpBudget = XP_BUDGETS[difficulty];

  function addMonster() {
    setMonsters([...monsters, { name: "", cr: "1", count: 1, hp: 10, ac: 12 }]);
  }

  function removeMonster(index: number) {
    setMonsters(monsters.filter((_, i) => i !== index));
  }

  function updateMonster(index: number, field: keyof Monster, value: string | number) {
    setMonsters(monsters.map((m, i) => i === index ? { ...m, [field]: value } : m));
  }

  function addLootItem() {
    setLoot([...loot, { name: "", quantity: 1, description: "" }]);
  }

  function removeLootItem(index: number) {
    setLoot(loot.filter((_, i) => i !== index));
  }

  function updateLootItem(index: number, field: keyof LootItem, value: string | number) {
    setLoot(loot.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function resetForm() {
    setName("");
    setDescription("");
    setDifficulty("medium");
    setMonsters([{ name: "", cr: "1", count: 1, hp: 10, ac: 12 }]);
    setLoot([]);
    setNotes("");
    setBuilderStep(0);
    setEncounterStyle("ambush");
  }

  async function handleAdd() {
    if (!name.trim()) return;
    const validMonsters = monsters.filter((m) => m.name.trim());
    const validLoot = loot.filter((l) => l.name.trim());

    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/encounters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        difficulty,
        monsters: validMonsters,
        loot: validLoot,
        notes: notes.trim() || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      await res.json();
      onAdd();
      resetForm();
      setShowForm(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Icon name="swords" size={24} className="text-secondary" />
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">
            Encounters ({encounters.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="interactive-glow"
        >
          <Icon name={showForm ? "close" : "add"} size={14} />
          {showForm ? "Cancel" : "Build Encounter"}
        </Button>
      </div>

      {/* Build Encounter Form */}
      {showForm && (
        <div className="glass rounded-sm p-6 border border-secondary/10 space-y-4 animate-fade-in-up relative overflow-hidden">
          <div className="decorative-orb absolute -top-16 -right-16 w-48 h-48" />
          <div className="flex items-center gap-2 relative z-10">
            <p className="font-headline text-sm text-secondary uppercase tracking-wider">Encounter Builder</p>
            <div className="flex-1" />
            <AIAssistButton
              label="AI Build Encounter"
              size="sm"
              systemPrompt={AI_PROMPTS.encounterBuilder}
              userPrompt={`Design a ${difficulty} encounter for a D&D party.`}
              context={`Desired difficulty: ${difficulty}${name ? `\nEncounter theme: ${name}` : ""}`}
              onApply={(content) => {}}
              onApplyJSON={(data) => {
                const enc = data as Record<string, unknown>;
                if (enc.name) setName(enc.name as string);
                if (enc.description) setDescription(enc.description as string);
                if (enc.difficulty && ["easy", "medium", "hard", "deadly"].includes(enc.difficulty as string)) {
                  setDifficulty(enc.difficulty as Difficulty);
                }
                if (enc.monsters && Array.isArray(enc.monsters)) {
                  const newMonsters = (enc.monsters as Array<Record<string, unknown>>).map((m) => ({
                    name: (m.name as string) || "",
                    cr: (m.cr as string) || "1",
                    count: (m.count as number) || 1,
                    hp: (m.hp as number) || 10,
                    ac: (m.ac as number) || 12,
                  }));
                  setMonsters(newMonsters);
                }
                if (enc.notes) setNotes(enc.notes as string);
                setBuilderStep(2);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["Difficulty", "Style", "Finalize"].map((label, index) => (
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
              options={(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => ({
                id: key,
                title: DIFFICULTY_CONFIG[key].label,
                description: `Target roughly ${XP_BUDGETS[key].toLocaleString()} XP for a balanced baseline party of four.`,
                subtitle: "Difficulty target",
                entityType: "encounter" as const,
                meta: [`${XP_BUDGETS[key].toLocaleString()} XP`, DIFFICULTY_CONFIG[key].label],
              }))}
              selectedId={difficulty}
              onSelect={(option) => {
                setDifficulty(option.id as Difficulty);
                setBuilderStep(1);
              }}
              featuredIds={["medium", "hard", "deadly"]}
              featuredLabel="Recommended challenge"
              allLabel="Encounter difficulty"
              searchPlaceholder="Search difficulty"
            />
          )}

          {builderStep === 1 && (
            <div className="space-y-4">
              <OptionGallery
                options={ENCOUNTER_STYLE_OPTIONS}
                selectedId={encounterStyle}
                onSelect={(option) => {
                  setEncounterStyle(option.id);
                  if (!description.trim()) {
                    setDescription(option.description);
                  }
                  setBuilderStep(2);
                }}
                featuredIds={["ambush", "boss", "defense"]}
                featuredLabel="Common battle structures"
                allLabel="Encounter frames"
                searchPlaceholder="Search encounter style"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(0)}>
                <Icon name="arrow_back" size={14} />
                Back
              </Button>
            </div>
          )}

          {builderStep === 2 && (
            <>
          <Input id="enc-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ambush at the Bridge..." />
          <Input id="enc-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="The party is ambushed while crossing..." />
          <Input id="enc-style" label="Builder Summary" value={`${difficulty} · ${encounterStyle}`} readOnly />

          {/* XP Budget Calculator */}
          <div className={`bg-surface-container-lowest p-3 rounded-sm border flex items-center justify-between transition-all duration-500 ${formTotalXP > xpBudget ? "border-error/30 glow-danger" : "border-secondary/15 glow-gold"}`}>
            <div className="flex items-center gap-4">
              <div>
                <span className="font-label text-[9px] uppercase text-on-surface/30 block">XP Budget</span>
                <span className="font-headline text-lg text-secondary">{xpBudget.toLocaleString()}</span>
              </div>
              <div className="w-px h-8 bg-outline-variant/10" />
              <div>
                <span className="font-label text-[9px] uppercase text-on-surface/30 block">Monster XP</span>
                <span className={`font-headline text-lg ${formTotalXP > xpBudget ? "text-error" : formTotalXP > xpBudget * 0.8 ? "text-yellow-400" : "text-green-400"}`}>
                  {formTotalXP.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-label text-[9px] uppercase text-on-surface/30 block">Balance</span>
              <span className={`font-headline text-sm ${formTotalXP > xpBudget ? "text-error" : "text-green-400"}`}>
                {formTotalXP > xpBudget ? "Over budget" : `${(xpBudget - formTotalXP).toLocaleString()} remaining`}
              </span>
            </div>
          </div>

          {/* Monster List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                Monsters
              </label>
              <Button variant="ghost" size="sm" onClick={addMonster}>
                <Icon name="add" size={12} /> Add Monster
              </Button>
            </div>
            {monsters.map((monster, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end animate-fade-in-up">
                <div className="col-span-4">
                  <Input
                    id={`monster-name-${i}`}
                    label={i === 0 ? "Name" : undefined}
                    icon="pest_control"
                    value={monster.name}
                    onChange={(e) => updateMonster(i, "name", e.target.value)}
                    placeholder="Goblin..."
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    id={`monster-cr-${i}`}
                    label={i === 0 ? "CR" : undefined}
                    value={monster.cr}
                    onChange={(e) => updateMonster(i, "cr", e.target.value)}
                  >
                    {Object.keys(CR_XP).map((cr) => (
                      <option key={cr} value={cr}>CR {cr}</option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-1">
                  <Input
                    id={`monster-qty-${i}`}
                    label={i === 0 ? "Qty" : undefined}
                    type="number"
                    min={1}
                    value={monster.count}
                    onChange={(e) => updateMonster(i, "count", parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    id={`monster-hp-${i}`}
                    label={i === 0 ? "HP" : undefined}
                    type="number"
                    min={1}
                    value={monster.hp}
                    onChange={(e) => updateMonster(i, "hp", parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    id={`monster-ac-${i}`}
                    label={i === 0 ? "AC" : undefined}
                    type="number"
                    min={1}
                    value={monster.ac}
                    onChange={(e) => updateMonster(i, "ac", parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {monsters.length > 1 && (
                    <button onClick={() => removeMonster(i)} className="text-on-surface/30 hover:text-error transition-colors p-1">
                      <Icon name="delete" size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Loot List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                Loot
              </label>
              <Button variant="ghost" size="sm" onClick={addLootItem}>
                <Icon name="add" size={12} /> Add Loot
              </Button>
            </div>
            {loot.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end animate-fade-in-up">
                <div className="col-span-4">
                  <Input
                    id={`loot-name-${i}`}
                    label={i === 0 ? "Name" : undefined}
                    icon="deployed_code"
                    value={item.name}
                    onChange={(e) => updateLootItem(i, "name", e.target.value)}
                    placeholder="Gold coins..."
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    id={`loot-qty-${i}`}
                    label={i === 0 ? "Qty" : undefined}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateLootItem(i, "quantity", parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    id={`loot-desc-${i}`}
                    label={i === 0 ? "Description" : undefined}
                    value={item.description}
                    onChange={(e) => updateLootItem(i, "description", e.target.value)}
                    placeholder="A pouch of gold..."
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => removeLootItem(i)} className="text-on-surface/30 hover:text-error transition-colors p-1">
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              </div>
            ))}
            {loot.length === 0 && (
              <EmptyState
                icon="deployed_code"
                title="No loot items"
                description='Click "Add Loot" to include treasure'
              />
            )}
          </div>

          {/* Notes */}
          <Textarea
            id="enc-notes"
            label="DM Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tactical notes, terrain features, traps..."
            rows={3}
          />

          <div className="flex justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(1)}>
              <Icon name="arrow_back" size={14} />
              Back
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={loading || !name.trim()} className="glow-gold">
              {loading ? "Creating..." : "Create Encounter"}
            </Button>
          </div>
            </>
          )}
        </div>
      )}

      {/* Encounter Groups */}
      <div className="space-y-6 stagger-children">
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const statusEncounters = grouped[status];

          if (statusEncounters.length === 0) return null;

          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
                <Icon name={config.icon} size={16} className={config.color} />
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/60 font-bold">
                  {config.label}
                </span>
                <span className={`font-label text-[10px] ml-auto ${config.color}`}>
                  {statusEncounters.length}
                </span>
              </div>

              <div className="space-y-2">
                {statusEncounters.map((encounter) => (
                  <EncounterCard
                    key={encounter.id}
                    encounter={encounter}
                    campaignId={campaignId}
                    characters={characters}
                    locations={locations}
                    onRefresh={onAdd}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {encounters.length === 0 && !showForm && (
        <EmptyState
          icon="swords"
          title="No encounters created yet"
          description="Build encounters with monsters, difficulty, and loot"
          action={
            <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="glow-gold">
              <Icon name="add" size={14} /> Build Encounter
            </Button>
          }
        />
      )}
    </div>
  );
}
