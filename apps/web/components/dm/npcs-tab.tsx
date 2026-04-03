"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Chip } from "@/components/ui/chip";
import { EntityImage } from "@/components/ui/entity-image";
import { ImageUpload } from "@/components/ui/image-upload";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";
import { OptionGallery } from "@/components/builder/option-gallery";

interface NPC {
  id: string;
  name: string;
  description: string | null;
  statBlock: Record<string, unknown> | null;
  isEnemy: boolean;
  notes: string | null;
  race: string | null;
  npcClass: string | null;
  alignment: string | null;
  personality: string | null;
  appearance: string | null;
  voice: string | null;
  faction: string | null;
  locationName: string | null;
  relationship: string | null;
  isAlive: boolean;
  cr: string | null;
}

interface NPCsTabProps {
  npcs: NPC[];
  campaignId: string;
  onAdd: (npc: NPC) => void;
  onUpdate: (npc: NPC) => void;
}

const relationships = ["ally", "enemy", "neutral", "patron", "rival"] as const;

const relationshipConfig: Record<
  string,
  { label: string; icon: string; color: string; chipVariant: "default" | "active" | "condition" | "success" }
> = {
  ally: { label: "Ally", icon: "handshake", color: "text-green-400", chipVariant: "success" },
  enemy: { label: "Enemy", icon: "swords", color: "text-error", chipVariant: "condition" },
  neutral: { label: "Neutral", icon: "remove", color: "text-on-surface-variant", chipVariant: "default" },
  patron: { label: "Patron", icon: "star", color: "text-secondary", chipVariant: "active" },
  rival: { label: "Rival", icon: "local_fire_department", color: "text-primary", chipVariant: "active" },
};

const alignments = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
];

const NPC_ROLE_OPTIONS = relationships.map((relationship) => ({
  id: relationship,
  title: relationshipConfig[relationship].label,
  description:
    relationship === "ally"
      ? "Friendly support character, quest contact, or trusted recurring face."
      : relationship === "enemy"
        ? "Opposing force, threat, saboteur, or combat-facing rival."
        : relationship === "neutral"
          ? "Observer, merchant, witness, or socially flexible world character."
          : relationship === "patron"
            ? "Sponsor, noble, guild contact, or mission-giving authority figure."
            : "Competitive foil, recurring challenger, or personal counterweight.",
  subtitle: "NPC role",
  entityType: "npc" as const,
  meta: [relationshipConfig[relationship].label],
}));

const ALIGNMENT_OPTIONS = alignments.map((alignment) => ({
  id: alignment,
  title: alignment,
  description: `Use ${alignment} as the NPC's moral and behavioral baseline for dialogue and decisions.`,
  subtitle: "Alignment",
  entityType: "npc" as const,
  meta: [alignment.split(" ")[0], alignment.split(" ")[1]],
}));

export function NPCsTab({ npcs, campaignId, onAdd, onUpdate }: NPCsTabProps) {
  // Filter state
  const [filterFaction, setFilterFaction] = useState<string | null>(null);
  const [filterRelationship, setFilterRelationship] = useState<string | null>(null);
  const [filterAlive, setFilterAlive] = useState<boolean | null>(null);

  // Detail view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [builderStep, setBuilderStep] = useState<0 | 1 | 2>(0);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formRace, setFormRace] = useState("");
  const [formNpcClass, setFormNpcClass] = useState("");
  const [formAlignment, setFormAlignment] = useState("");
  const [formPersonality, setFormPersonality] = useState("");
  const [formAppearance, setFormAppearance] = useState("");
  const [formVoice, setFormVoice] = useState("");
  const [formFaction, setFormFaction] = useState("");
  const [formLocationName, setFormLocationName] = useState("");
  const [formRelationship, setFormRelationship] = useState("");
  const [formIsEnemy, setFormIsEnemy] = useState(false);
  const [formCr, setFormCr] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);

  // Derived filter values
  const factions = useMemo(() => {
    const set = new Set<string>();
    npcs.forEach((npc) => {
      if (npc.faction) set.add(npc.faction);
    });
    return Array.from(set).sort();
  }, [npcs]);

  // Apply filters
  const filteredNpcs = useMemo(() => {
    return npcs.filter((npc) => {
      if (filterFaction && npc.faction !== filterFaction) return false;
      if (filterRelationship && npc.relationship !== filterRelationship) return false;
      if (filterAlive !== null && npc.isAlive !== filterAlive) return false;
      return true;
    });
  }, [npcs, filterFaction, filterRelationship, filterAlive]);

  const hasActiveFilters =
    filterFaction !== null ||
    filterRelationship !== null ||
    filterAlive !== null;

  function clearFilters() {
    setFilterFaction(null);
    setFilterRelationship(null);
    setFilterAlive(null);
  }

  function resetForm() {
    setFormName("");
    setFormRace("");
    setFormNpcClass("");
    setFormAlignment("");
    setFormPersonality("");
    setFormAppearance("");
    setFormVoice("");
    setFormFaction("");
    setFormLocationName("");
    setFormRelationship("");
    setFormIsEnemy(false);
    setFormCr("");
    setFormDescription("");
    setFormNotes("");
    setFormImageUrl(null);
    setBuilderStep(0);
  }

  async function handleCreate() {
    if (!formName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/npcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          name: formName.trim(),
          race: formRace.trim() || null,
          npcClass: formNpcClass.trim() || null,
          alignment: formAlignment || null,
          personality: formPersonality.trim() || null,
          appearance: formAppearance.trim() || null,
          voice: formVoice.trim() || null,
          faction: formFaction.trim() || null,
          locationName: formLocationName.trim() || null,
          relationship: formRelationship || null,
          isEnemy: formIsEnemy,
          cr: formCr.trim() || null,
          description: formDescription.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });

      if (res.ok) {
        const npc = await res.json();
        onAdd(npc);
        resetForm();
        setShowForm(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-xl text-on-surface">
          NPC Management
        </h2>
        <Button
          variant={showForm ? "ghost" : "primary"}
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
          className={showForm ? "" : "glow-gold"}
        >
          <Icon name={showForm ? "close" : "person_add"} size={16} />
          {showForm ? "Cancel" : "Create NPC"}
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-low p-4 rounded-sm border border-outline-variant/8 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-bold">
            Filters
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="font-label text-[10px] uppercase tracking-wider text-secondary hover:text-secondary/80 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Faction filter */}
          {factions.length > 0 && (
            <>
              {factions.map((faction) => (
                <Chip
                  key={`faction-${faction}`}
                  variant={filterFaction === faction ? "active" : "default"}
                  icon="flag"
                  onClick={() =>
                    setFilterFaction(
                      filterFaction === faction ? null : faction
                    )
                  }
                  className="cursor-pointer"
                >
                  {faction}
                </Chip>
              ))}
            </>
          )}

          {/* Relationship filter */}
          {relationships.map((rel) => (
            <Chip
              key={`rel-${rel}`}
              variant={filterRelationship === rel ? relationshipConfig[rel].chipVariant : "default"}
              icon={relationshipConfig[rel].icon}
              onClick={() =>
                setFilterRelationship(
                  filterRelationship === rel ? null : rel
                )
              }
              className="cursor-pointer"
            >
              {relationshipConfig[rel].label}
            </Chip>
          ))}

          {/* Alive/Dead filter */}
          <Chip
            variant={filterAlive === true ? "success" : "default"}
            icon="favorite"
            onClick={() =>
              setFilterAlive(filterAlive === true ? null : true)
            }
            className="cursor-pointer"
          >
            Alive
          </Chip>
          <Chip
            variant={filterAlive === false ? "condition" : "default"}
            icon="skull"
            onClick={() =>
              setFilterAlive(filterAlive === false ? null : false)
            }
            className="cursor-pointer"
          >
            Dead
          </Chip>
        </div>
      </div>

      {/* Create NPC Form */}
      {showForm && (
        <div className="glass rounded-sm p-6 border border-secondary/10 space-y-5 animate-fade-in-up shadow-whisper relative overflow-hidden">
          <div className="decorative-orb absolute -top-10 -right-10 w-32 h-32" />
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <Icon name="person_add" size={20} className="text-secondary" />
            <h3 className="font-headline text-base text-secondary">
              NPC Builder
            </h3>
            <div className="decorative-line flex-1 ml-2" />
            <AIAssistButton
              label="Generate NPC"
              size="sm"
              systemPrompt={AI_PROMPTS.npcGenerator}
              userPrompt="Generate a unique and interesting D&D 5e NPC."
              context={formFaction ? `Faction context: ${formFaction}` : undefined}
              onApply={(content) => {}}
              onApplyJSON={(data) => {
                const npc = data as Record<string, unknown>;
                if (npc.name) setFormName(npc.name as string);
                if (npc.race) setFormRace(npc.race as string);
                if (npc.npcClass) setFormNpcClass(npc.npcClass as string);
                if (npc.alignment) setFormAlignment(npc.alignment as string);
                if (npc.personality) setFormPersonality(npc.personality as string);
                if (npc.appearance) setFormAppearance(npc.appearance as string);
                if (npc.voice) setFormVoice(npc.voice as string);
                if (npc.faction) setFormFaction(npc.faction as string);
                if (npc.relationship) setFormRelationship(npc.relationship as string);
                if (npc.description) setFormDescription(npc.description as string);
                if (npc.cr) setFormCr(npc.cr as string);
                setBuilderStep(2);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["Role", "Alignment", "Finalize"].map((label, index) => (
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
              options={NPC_ROLE_OPTIONS}
              selectedId={formRelationship}
              onSelect={(option) => {
                setFormRelationship(option.id);
                setFormIsEnemy(option.id === "enemy");
                setBuilderStep(1);
              }}
              featuredIds={["ally", "enemy", "patron"]}
              featuredLabel="Common NPC roles"
              allLabel="Relationship roles"
              searchPlaceholder="Search NPC roles"
            />
          )}

          {builderStep === 1 && (
            <div className="space-y-4">
              <OptionGallery
                options={ALIGNMENT_OPTIONS}
                selectedId={formAlignment}
                onSelect={(option) => {
                  setFormAlignment(option.id);
                  setBuilderStep(2);
                }}
                featuredIds={["Lawful Good", "True Neutral", "Chaotic Evil"]}
                featuredLabel="Common alignments"
                allLabel="Moral baselines"
                searchPlaceholder="Search alignments"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderStep(0)}>
                <Icon name="arrow_back" size={14} />
                Back
              </Button>
            </div>
          )}

          {builderStep === 2 && (
            <>

          {/* NPC Portrait Upload */}
          <div className="flex items-center gap-4">
            <ImageUpload
              currentImage={formImageUrl}
              onUpload={(url) => setFormImageUrl(url)}
              size="sm"
              label="NPC Portrait"
            />
            <p className="font-body text-xs text-on-surface-variant/50 italic">
              Upload a portrait for this NPC (optional)
            </p>
          </div>

          {/* Row 1: Name, Race, Class */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="npc-name"
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Elminster..."
              icon="badge"
            />
            <Input
              id="npc-race"
              label="Race"
              value={formRace}
              onChange={(e) => setFormRace(e.target.value)}
              placeholder="Human, Elf..."
            />
            <Input
              id="npc-class"
              label="Class"
              value={formNpcClass}
              onChange={(e) => setFormNpcClass(e.target.value)}
              placeholder="Wizard, Fighter..."
            />
          </div>

          {/* Row 2: Alignment, Faction, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              id="npc-alignment"
              label="Alignment"
              icon="balance"
              value={formAlignment}
              onChange={(e) => setFormAlignment(e.target.value)}
            >
              <option value="">Select alignment...</option>
              {alignments.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
            <Input
              id="npc-faction"
              label="Faction"
              value={formFaction}
              onChange={(e) => setFormFaction(e.target.value)}
              placeholder="Harpers, Zhentarim..."
              icon="flag"
            />
            <Input
              id="npc-location"
              label="Location"
              value={formLocationName}
              onChange={(e) => setFormLocationName(e.target.value)}
              placeholder="Neverwinter..."
              icon="map"
            />
          </div>

          {/* Row 3: Relationship, CR, Enemy */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              id="npc-relationship"
              label="Relationship"
              icon="handshake"
              value={formRelationship}
              onChange={(e) => setFormRelationship(e.target.value)}
            >
              <option value="">Select relationship...</option>
              {relationships.map((r) => (
                <option key={r} value={r}>
                  {relationshipConfig[r].label}
                </option>
              ))}
            </Select>
            <Input
              id="npc-cr"
              label="Challenge Rating"
              value={formCr}
              onChange={(e) => setFormCr(e.target.value)}
              placeholder="1/4, 1, 5..."
            />
            <div className="space-y-1.5">
              <span className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold block">
                Threat
              </span>
              <label className="flex items-center gap-3 bg-surface-container-highest/80 rounded-sm px-4 py-3 border border-outline-variant/10 cursor-pointer hover:border-error/20 transition-all duration-300">
                <input
                  type="checkbox"
                  checked={formIsEnemy}
                  onChange={(e) => setFormIsEnemy(e.target.checked)}
                  className="accent-error w-4 h-4"
                />
                <span className="font-body text-sm text-on-surface">
                  Mark as Enemy
                </span>
              </label>
            </div>
          </div>

          {/* Personality & Appearance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              id="npc-personality"
              label="Personality"
              value={formPersonality}
              onChange={(e) => setFormPersonality(e.target.value)}
              rows={3}
              placeholder="Personality traits, mannerisms, motivations..."
            />
            <Textarea
              id="npc-appearance"
              label="Appearance"
              value={formAppearance}
              onChange={(e) => setFormAppearance(e.target.value)}
              rows={3}
              placeholder="Physical description, distinguishing features..."
            />
          </div>

          {/* Voice & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="npc-voice"
              label="Voice / Accent Notes"
              value={formVoice}
              onChange={(e) => setFormVoice(e.target.value)}
              placeholder="Deep, gravelly, speaks slowly..."
              icon="record_voice_over"
            />
            <Input
              id="npc-description"
              label="Short Description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="One-line summary..."
            />
          </div>

          {/* Notes */}
          <Textarea
            id="npc-notes"
            label="DM Notes"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            rows={3}
            placeholder="Secret motivations, plot hooks, combat tactics..."
          />

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setBuilderStep(1)}
            >
              <Icon name="arrow_back" size={14} />
              Back
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || !formName.trim()}
              loading={loading}
              className="glow-gold"
            >
              <Icon name="person_add" size={16} />
              Create NPC
            </Button>
          </div>
            </>
          )}
        </div>
      )}

      {/* NPC Grid */}
      {filteredNpcs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filteredNpcs.map((npc) => {
            const isExpanded = expandedId === npc.id;
            const relConf = npc.relationship
              ? relationshipConfig[npc.relationship]
              : null;

            return (
              <div
                key={npc.id}
                className={`bg-surface-container-low rounded-sm border overflow-hidden transition-all duration-300 shadow-whisper ${
                  isExpanded
                    ? "sm:col-span-2 lg:col-span-3 border-secondary/20"
                    : npc.isEnemy
                      ? "border-error/15 hover:border-error/30"
                      : "border-outline-variant/8 hover:border-secondary/15"
                } ${!isExpanded ? "interactive-lift cursor-pointer" : ""}`}
                onClick={() => {
                  if (!isExpanded) setExpandedId(npc.id);
                }}
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <EntityImage entityType="npc" name={npc.name} size="sm" className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Alive/Dead indicator */}
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              npc.isAlive ? "bg-green-400" : "bg-on-surface-variant/30"
                            }`}
                          />
                          <h3 className="font-headline text-base font-bold text-on-surface truncate">
                            {npc.name}
                          </h3>
                        </div>

                      {/* Race / Class */}
                      {(npc.race || npc.npcClass) && (
                        <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant/50">
                          {[npc.race, npc.npcClass].filter(Boolean).join(" ")}
                        </p>
                      )}

                      {/* Alignment */}
                      {npc.alignment && (
                        <p className="font-body text-xs text-on-surface-variant/40 mt-0.5">
                          {npc.alignment}
                        </p>
                      )}
                      </div>
                    </div>

                    {/* Expand/Collapse button (when expanded) */}
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(null);
                        }}
                        className="text-on-surface-variant/30 hover:text-on-surface-variant transition-colors shrink-0"
                      >
                        <Icon name="close" size={20} />
                      </button>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {npc.faction && (
                      <Chip icon="flag" variant="default">
                        {npc.faction}
                      </Chip>
                    )}
                    {relConf && (
                      <Chip
                        icon={relConf.icon}
                        variant={relConf.chipVariant}
                      >
                        {relConf.label}
                      </Chip>
                    )}
                    {!npc.isAlive && (
                      <Chip icon="skull" variant="condition">
                        Dead
                      </Chip>
                    )}
                    {npc.cr && (
                      <Chip variant="default">
                        CR {npc.cr}
                      </Chip>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-outline-variant/5 p-5 space-y-4 animate-fade-in-up">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Personality */}
                      {npc.personality && (
                        <div>
                          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                            <Icon name="psychology" size={12} />
                            Personality
                          </p>
                          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                            {npc.personality}
                          </p>
                        </div>
                      )}

                      {/* Appearance */}
                      {npc.appearance && (
                        <div>
                          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                            <Icon name="face" size={12} />
                            Appearance
                          </p>
                          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                            {npc.appearance}
                          </p>
                        </div>
                      )}

                      {/* Voice */}
                      {npc.voice && (
                        <div>
                          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-1.5">
                            <Icon name="record_voice_over" size={12} />
                            Voice Notes
                          </p>
                          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                            {npc.voice}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    {npc.locationName && (
                      <div className="flex items-center gap-2 bg-surface-container p-3 rounded-sm border border-outline-variant/5">
                        <Icon name="map" size={16} className="text-secondary/50" />
                        <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant/50">
                          Found at:
                        </span>
                        <span className="font-body text-sm text-on-surface">
                          {npc.locationName}
                        </span>
                      </div>
                    )}

                    {/* Stat Block */}
                    {npc.statBlock && Object.keys(npc.statBlock).length > 0 && (
                      <div>
                        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-secondary/70 font-bold flex items-center gap-1 mb-2">
                          <Icon name="shield" size={12} />
                          Stat Block
                        </p>
                        <div className="bg-surface-container p-4 rounded-sm border border-outline-variant/5 font-mono text-xs text-on-surface-variant overflow-x-auto">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(npc.statBlock, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {npc.description && (
                      <div>
                        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/50 font-bold flex items-center gap-1 mb-1.5">
                          <Icon name="description" size={12} />
                          Description
                        </p>
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed pl-4 border-l border-secondary/20">
                          {npc.description}
                        </p>
                      </div>
                    )}

                    {/* DM Notes */}
                    {npc.notes && (
                      <div>
                        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/50 font-bold flex items-center gap-1 mb-1.5">
                          <Icon name="lock" size={12} />
                          DM Notes
                        </p>
                        <p className="font-body text-sm text-on-surface-variant/70 leading-relaxed pl-4 border-l border-error/15 bg-error-container/5 p-3 rounded-sm">
                          {npc.notes}
                        </p>
                      </div>
                    )}

                    {/* Empty expanded state */}
                    {!npc.personality &&
                      !npc.appearance &&
                      !npc.voice &&
                      !npc.description &&
                      !npc.notes &&
                      !npc.locationName &&
                      (!npc.statBlock || Object.keys(npc.statBlock as Record<string, unknown>).length === 0) && (
                        <p className="font-body text-sm text-on-surface-variant/30 italic text-center py-4">
                          No additional details recorded for this NPC
                        </p>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          hasActiveFilters ? (
            <EmptyState
              icon="person_search"
              title="No NPCs match your filters"
              description="Try adjusting or clearing your filters"
              action={
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="person_search"
              title="No NPCs yet"
              description="Create your first NPC to populate the world"
              action={
                <Button variant="primary" size="sm" onClick={() => setShowForm(true)} className="glow-gold">
                  <Icon name="person_add" size={16} />
                  Create NPC
                </Button>
              }
            />
          )
        )
      )}
    </div>
  );
}
