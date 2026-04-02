"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";

type LocationType = "region" | "city" | "dungeon" | "wilderness" | "building" | "tavern" | "temple";

interface Location {
  id: string;
  name: string;
  type: string;
  description: string | null;
  notes: string | null;
  parentId: string | null;
  children?: Array<{ id: string; name: string; type: string }>;
}

interface Props {
  locations: Location[];
  campaignId: string;
  onAdd: (location: Location) => void;
}

const TYPE_CONFIG: Record<LocationType, { label: string; icon: string; color: string }> = {
  region: { label: "Region", icon: "public", color: "text-blue-400" },
  city: { label: "City", icon: "location_city", color: "text-yellow-400" },
  dungeon: { label: "Dungeon", icon: "castle", color: "text-error" },
  wilderness: { label: "Wilderness", icon: "forest", color: "text-green-400" },
  building: { label: "Building", icon: "home", color: "text-orange-400" },
  tavern: { label: "Tavern", icon: "sports_bar", color: "text-amber-400" },
  temple: { label: "Temple", icon: "church", color: "text-purple-400" },
};

interface TreeNode extends Location {
  children: TreeNode[];
}

function buildTree(locations: Location[]): TreeNode[] {
  const nodeMap: Record<string, TreeNode> = {};
  const roots: TreeNode[] = [];

  locations.forEach((loc) => {
    nodeMap[loc.id] = { ...loc, children: [] };
  });

  locations.forEach((loc) => {
    const node = nodeMap[loc.id];
    if (loc.parentId && nodeMap[loc.parentId]) {
      nodeMap[loc.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function LocationNode({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [showDetails, setShowDetails] = useState(false);
  const config = TYPE_CONFIG[node.type as LocationType] || TYPE_CONFIG.region;
  const hasChildren = node.children.length > 0;

  return (
    <div className="animate-fade-in-up">
      <div
        className={`flex items-center gap-2 p-3 rounded-sm transition-all duration-300 cursor-pointer interactive-glow shadow-whisper ${
          showDetails
            ? "bg-surface-container border border-secondary/15"
            : "bg-surface-container-low border border-outline-variant/8 hover:border-secondary/15"
        }`}
        style={{ marginLeft: depth * 20 }}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="text-on-surface/40 hover:text-on-surface transition-colors"
          >
            <Icon name={expanded ? "expand_more" : "chevron_right"} size={16} />
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Type Icon */}
        <Icon name={config.icon} size={18} className={config.color} />

        {/* Name */}
        <span className="font-body font-semibold text-sm text-on-surface flex-1">
          {node.name}
        </span>

        {/* Type Badge */}
        <span className={`font-label text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-xl border border-outline-variant/10 bg-surface-container-high/40 ${config.color}`}>
          {config.label}
        </span>

        {/* Children Count */}
        {hasChildren && (
          <span className="font-label text-[10px] text-on-surface/30">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div
          className="bg-surface-container-lowest p-4 rounded-sm border border-outline-variant/5 mt-1 space-y-2 animate-fade-in-up"
          style={{ marginLeft: depth * 20 + 24 }}
        >
          {node.description && (
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 block mb-1">Description</span>
              <p className="font-body text-sm text-on-surface-variant">{node.description}</p>
            </div>
          )}
          {node.notes && (
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 block mb-1">DM Notes</span>
              <p className="font-body text-sm text-on-surface-variant italic">{node.notes}</p>
            </div>
          )}
          {!node.description && !node.notes && (
            <p className="font-body text-xs text-on-surface/20 italic">No details yet.</p>
          )}
        </div>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 stagger-children">
          {node.children.map((child) => (
            <LocationNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationsTab({ locations, campaignId, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("region");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [parentId, setParentId] = useState("");

  const tree = useMemo(() => buildTree(locations), [locations]);

  function resetForm() {
    setName("");
    setType("region");
    setDescription("");
    setNotes("");
    setParentId("");
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        type,
        description: description.trim() || null,
        notes: notes.trim() || null,
        parentId: parentId || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const location = await res.json();
      onAdd(location);
      resetForm();
      setShowForm(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Icon name="map" size={24} className="text-secondary" />
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">
            Locations ({locations.length})
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)} className="interactive-glow">
          <Icon name={showForm ? "close" : "add"} size={14} />
          {showForm ? "Cancel" : "Add Location"}
        </Button>
      </div>

      {/* Add Location Form */}
      {showForm && (
        <div className="glass rounded-sm p-6 border border-secondary/10 space-y-3 animate-fade-in-up shadow-whisper relative overflow-hidden">
          <div className="decorative-orb absolute -top-10 -right-10 w-32 h-32" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <p className="font-headline text-sm text-secondary uppercase tracking-wider">New Location</p>
            <div className="decorative-line flex-1 ml-2" />
          </div>
          <Input id="loc-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Whispering Peaks..." />

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="loc-type"
              label="Type"
              icon="category"
              value={type}
              onChange={(e) => setType(e.target.value as LocationType)}
            >
              {(Object.keys(TYPE_CONFIG) as LocationType[]).map((t) => (
                <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
              ))}
            </Select>
            <Select
              id="loc-parent"
              label="Parent Location"
              icon="account_tree"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Top Level</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {(TYPE_CONFIG[loc.type as LocationType] || TYPE_CONFIG.region).label}: {loc.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold">
                Description
              </label>
              <AIAssistButton
                label="Describe Location"
                size="sm"
                systemPrompt={AI_PROMPTS.locationDescriber}
                userPrompt={name ? `Describe a ${type} called "${name}".` : `Describe a ${type} in a fantasy D&D setting.`}
                context={name ? `Location name: ${name}\nType: ${type}` : `Type: ${type}`}
                onApply={(content) => setDescription(content)}
              />
            </div>
            <Input id="loc-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A vast mountain range shrouded in mist..." />
          </div>

          <Textarea
            id="loc-notes"
            label="DM Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Secret passages, hidden treasures..."
            rows={3}
          />

          <Button size="sm" onClick={handleAdd} disabled={loading || !name.trim()} className="glow-gold">
            {loading ? "Creating..." : "Add Location"}
          </Button>
        </div>
      )}

      {/* Location Tree */}
      {tree.length > 0 ? (
        <div className="space-y-1 stagger-children">
          {tree.map((node) => (
            <LocationNode key={node.id} node={node} depth={0} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="map"
          title="No locations added yet"
          description="Create regions, cities, and dungeons for your world"
          action={
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)} className="glow-gold">
              <Icon name="add" size={16} />
              Add Location
            </Button>
          }
        />
      )}
    </div>
  );
}
