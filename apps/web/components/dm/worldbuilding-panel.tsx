"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type CalendarState,
  type FactionDirectoryEntry,
  type HistoricalEvent,
  type LoreEntry,
  type WorldRegion,
  parseCalendarState,
  parseFactionDirectory,
  parseHistoricalEvents,
  parseLoreEntries,
  parseWorldRegions,
} from "@/lib/worldbuilding";

interface WorldbuildingPanelProps {
  campaignId: string;
  worldName: string | null;
  worldSummary: string | null;
  worldRegions: unknown;
  factionDirectory: unknown;
  loreEntries: unknown;
  historicalEvents: unknown;
  calendarState: unknown;
  canManage: boolean;
  onSaved: () => void;
}

const REGION_KINDS = ["Region", "City", "Settlement", "Dungeon", "Wilderness", "Plane", "Sea"];
const FACTION_STATUSES = ["rising", "stable", "fractured", "dominant", "hostile"];
const LORE_CATEGORIES = ["Lore", "Culture", "Religion", "Law", "Myth", "Currency", "Language", "Secret"];

function toCsv(values: string[]) {
  return values.join(", ");
}

function fromCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} size={18} className="text-secondary" />
      <h3 className="font-headline text-lg text-on-surface">{title}</h3>
    </div>
  );
}

export function WorldbuildingPanel(props: WorldbuildingPanelProps) {
  const {
    campaignId,
    worldName,
    worldSummary,
    worldRegions,
    factionDirectory,
    loreEntries,
    historicalEvents,
    calendarState,
    canManage,
    onSaved,
  } = props;

  const [status, setStatus] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState<WorldRegion[]>(() => parseWorldRegions(worldRegions));
  const [factions, setFactions] = useState<FactionDirectoryEntry[]>(() => parseFactionDirectory(factionDirectory));
  const [lore, setLore] = useState<LoreEntry[]>(() => parseLoreEntries(loreEntries));
  const [events, setEvents] = useState<HistoricalEvent[]>(() => parseHistoricalEvents(historicalEvents));
  const [calendar, setCalendar] = useState<CalendarState>(() => parseCalendarState(calendarState));

  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [editingFactionId, setEditingFactionId] = useState<string | null>(null);
  const [editingLoreId, setEditingLoreId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [regionForm, setRegionForm] = useState({
    name: "",
    kind: "Region",
    summary: "",
    tags: "",
    notes: "",
    playerVisible: true,
  });
  const [factionForm, setFactionForm] = useState({
    name: "",
    type: "Faction",
    agenda: "",
    status: "stable",
    influence: 3,
    regions: "",
    notes: "",
    playerVisible: true,
  });
  const [loreForm, setLoreForm] = useState({
    title: "",
    category: "Lore",
    summary: "",
    dmTruth: "",
    relatedNames: "",
    playerVisible: true,
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    era: "",
    dateLabel: "",
    summary: "",
    impact: "",
    playerVisible: true,
  });

  useEffect(() => setRegions(parseWorldRegions(worldRegions)), [worldRegions]);
  useEffect(() => setFactions(parseFactionDirectory(factionDirectory)), [factionDirectory]);
  useEffect(() => setLore(parseLoreEntries(loreEntries)), [loreEntries]);
  useEffect(() => setEvents(parseHistoricalEvents(historicalEvents)), [historicalEvents]);
  useEffect(() => setCalendar(parseCalendarState(calendarState)), [calendarState]);

  const counts = useMemo(
    () => ({
      regions: regions.filter((entry) => entry.playerVisible).length,
      factions: factions.filter((entry) => entry.playerVisible).length,
      lore: lore.filter((entry) => entry.playerVisible).length,
      events: events.filter((entry) => entry.playerVisible).length,
    }),
    [events, factions, lore, regions]
  );

  function resetRegionForm() {
    setEditingRegionId(null);
    setRegionForm({
      name: "",
      kind: "Region",
      summary: "",
      tags: "",
      notes: "",
      playerVisible: true,
    });
  }

  function resetFactionForm() {
    setEditingFactionId(null);
    setFactionForm({
      name: "",
      type: "Faction",
      agenda: "",
      status: "stable",
      influence: 3,
      regions: "",
      notes: "",
      playerVisible: true,
    });
  }

  function resetLoreForm() {
    setEditingLoreId(null);
    setLoreForm({
      title: "",
      category: "Lore",
      summary: "",
      dmTruth: "",
      relatedNames: "",
      playerVisible: true,
    });
  }

  function resetEventForm() {
    setEditingEventId(null);
    setEventForm({
      title: "",
      era: "",
      dateLabel: "",
      summary: "",
      impact: "",
      playerVisible: true,
    });
  }

  function upsertRegion() {
    const name = regionForm.name.trim();
    if (!name) return setStatus({ kind: "error", message: "Region name is required." });
    const entry: WorldRegion = {
      id: editingRegionId || crypto.randomUUID(),
      name,
      kind: regionForm.kind,
      summary: regionForm.summary.trim(),
      tags: fromCsv(regionForm.tags),
      notes: regionForm.notes.trim() || null,
      playerVisible: regionForm.playerVisible,
    };
    setRegions((prev) => editingRegionId ? prev.map((item) => item.id === editingRegionId ? entry : item) : [entry, ...prev]);
    resetRegionForm();
    setStatus({ kind: "info", message: "Region draft updated. Save worldbuilding to persist it." });
  }

  function upsertFaction() {
    const name = factionForm.name.trim();
    if (!name) return setStatus({ kind: "error", message: "Faction name is required." });
    const entry: FactionDirectoryEntry = {
      id: editingFactionId || crypto.randomUUID(),
      name,
      type: factionForm.type.trim() || "Faction",
      agenda: factionForm.agenda.trim(),
      status: factionForm.status,
      influence: Math.min(5, Math.max(1, Number(factionForm.influence) || 3)),
      regions: fromCsv(factionForm.regions),
      notes: factionForm.notes.trim() || null,
      playerVisible: factionForm.playerVisible,
    };
    setFactions((prev) => editingFactionId ? prev.map((item) => item.id === editingFactionId ? entry : item) : [entry, ...prev]);
    resetFactionForm();
    setStatus({ kind: "info", message: "Faction draft updated. Save worldbuilding to persist it." });
  }

  function upsertLore() {
    const title = loreForm.title.trim();
    if (!title) return setStatus({ kind: "error", message: "Lore title is required." });
    const entry: LoreEntry = {
      id: editingLoreId || crypto.randomUUID(),
      title,
      category: loreForm.category,
      summary: loreForm.summary.trim(),
      dmTruth: loreForm.dmTruth.trim() || null,
      relatedNames: fromCsv(loreForm.relatedNames),
      playerVisible: loreForm.playerVisible,
    };
    setLore((prev) => editingLoreId ? prev.map((item) => item.id === editingLoreId ? entry : item) : [entry, ...prev]);
    resetLoreForm();
    setStatus({ kind: "info", message: "Lore draft updated. Save worldbuilding to persist it." });
  }

  function upsertEvent() {
    const title = eventForm.title.trim();
    if (!title) return setStatus({ kind: "error", message: "Timeline event title is required." });
    const entry: HistoricalEvent = {
      id: editingEventId || crypto.randomUUID(),
      title,
      era: eventForm.era.trim(),
      dateLabel: eventForm.dateLabel.trim(),
      summary: eventForm.summary.trim(),
      impact: eventForm.impact.trim() || null,
      playerVisible: eventForm.playerVisible,
    };
    setEvents((prev) => editingEventId ? prev.map((item) => item.id === editingEventId ? entry : item) : [entry, ...prev]);
    resetEventForm();
    setStatus({ kind: "info", message: "Timeline draft updated. Save worldbuilding to persist it." });
  }

  async function saveWorldbuilding() {
    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worldRegions: regions,
          factionDirectory: factions,
          loreEntries: lore,
          historicalEvents: events,
          calendarState: calendar,
        }),
      });
      if (response.ok) {
        setStatus({ kind: "success", message: "Worldbuilding updated." });
        onSaved();
      } else {
        const data = await response.json().catch(() => ({}));
        setStatus({ kind: "error", message: String(data.error || "Could not save worldbuilding.") });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {status && <FormStatus kind={status.kind} message={status.message} />}

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <SectionHeader icon="public" title="World Snapshot" />
          <p className="mt-3 font-headline text-xl text-primary">{worldName || "Unnamed World"}</p>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            {worldSummary ||
              "No world summary yet. Set one in campaign foundations, then use this hub to structure the living world around it."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Public Regions", value: counts.regions },
              { label: "Public Factions", value: counts.factions },
              { label: "Lore Entries", value: counts.lore },
              { label: "Timeline Events", value: counts.events },
            ].map((stat) => (
              <div key={stat.label} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">{stat.label}</p>
                <p className="mt-1 font-headline text-2xl text-on-surface">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <SectionHeader icon="calendar_month" title="Calendar and World State" />
          {canManage ? (
            <>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input id="world-current-date" label="Current Date" value={calendar.currentDateLabel} onChange={(event) => setCalendar((prev) => ({ ...prev, currentDateLabel: event.target.value }))} placeholder="14 Emberfall, 1493" />
                <Input id="world-season" label="Season" value={calendar.season} onChange={(event) => setCalendar((prev) => ({ ...prev, season: event.target.value }))} placeholder="Late Autumn" />
                <Input id="world-weather" label="Weather" value={calendar.weather} onChange={(event) => setCalendar((prev) => ({ ...prev, weather: event.target.value }))} placeholder="Cold rain on the coast" />
                <Input id="world-moon-phase" label="Moon Phase" value={calendar.moonPhase} onChange={(event) => setCalendar((prev) => ({ ...prev, moonPhase: event.target.value }))} placeholder="Waning crescent" />
              </div>
              <div className="mt-3">
                <Input id="world-next-holiday" label="Next Holiday / Omen" value={calendar.nextHoliday} onChange={(event) => setCalendar((prev) => ({ ...prev, nextHoliday: event.target.value }))} placeholder="Night of Ashes in 3 days" />
              </div>
            </>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[
                { label: "Current Date", value: calendar.currentDateLabel || "Unknown" },
                { label: "Season", value: calendar.season || "Untracked" },
                { label: "Weather", value: calendar.weather || "Untracked" },
                { label: "Moon Phase", value: calendar.moonPhase || "Untracked" },
                { label: "Next Holiday", value: calendar.nextHoliday || "No omen set" },
              ].map((item) => (
                <div key={item.label} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                  <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">{item.label}</p>
                  <p className="mt-1 text-sm text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <SectionHeader icon="map" title="Regions and Places" />
          {canManage && (
            <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                <Input id="region-name" label="Name" value={regionForm.name} onChange={(event) => setRegionForm((prev) => ({ ...prev, name: event.target.value }))} />
                <Select id="region-kind" label="Type" value={regionForm.kind} onChange={(event) => setRegionForm((prev) => ({ ...prev, kind: event.target.value }))}>
                  {REGION_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                </Select>
              </div>
              <div className="mt-3">
                <Textarea id="region-summary" label="Summary" rows={3} value={regionForm.summary} onChange={(event) => setRegionForm((prev) => ({ ...prev, summary: event.target.value }))} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input id="region-tags" label="Tags" value={regionForm.tags} onChange={(event) => setRegionForm((prev) => ({ ...prev, tags: event.target.value }))} placeholder="trade, haunted, frontier" />
                <Select id="region-visibility" label="Visibility" value={regionForm.playerVisible ? "public" : "dm"} onChange={(event) => setRegionForm((prev) => ({ ...prev, playerVisible: event.target.value === "public" }))}>
                  <option value="public">Player Visible</option>
                  <option value="dm">DM Only</option>
                </Select>
              </div>
              <div className="mt-3">
                <Textarea id="region-notes" label="DM Notes" rows={2} value={regionForm.notes} onChange={(event) => setRegionForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Threats, hidden rulers, secret entrances..." />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {editingRegionId && <Button variant="ghost" size="sm" onClick={resetRegionForm}><Icon name="close" size={16} />Cancel</Button>}
                <Button size="sm" variant="secondary" onClick={upsertRegion}><Icon name={editingRegionId ? "save" : "add"} size={16} />{editingRegionId ? "Update Region" : "Add Region"}</Button>
              </div>
            </div>
          )}
          {regions.length === 0 ? (
            <EmptyState icon="travel_explore" title="No regions yet" description="Build the atlas the party moves through so places carry context and visibility rules." />
          ) : (
            <div className="space-y-3">
              {regions.map((entry) => (
                <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{entry.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">{entry.kind} · {entry.playerVisible ? "Player visible" : "DM only"}</p>
                    </div>
                    {canManage && <div className="flex gap-1"><button type="button" className="text-on-surface-variant/50 transition-colors hover:text-secondary" onClick={() => { setEditingRegionId(entry.id); setRegionForm({ name: entry.name, kind: entry.kind, summary: entry.summary, tags: toCsv(entry.tags), notes: entry.notes || "", playerVisible: entry.playerVisible }); }}><Icon name="edit" size={18} /></button><button type="button" className="text-on-surface-variant/50 transition-colors hover:text-error" onClick={() => setRegions((prev) => prev.filter((item) => item.id !== entry.id))}><Icon name="delete" size={18} /></button></div>}
                  </div>
                  {entry.summary && <p className="mt-3 text-sm text-on-surface-variant">{entry.summary}</p>}
                  {entry.tags.length > 0 && <p className="mt-3 text-sm text-on-surface-variant/80">Tags: {entry.tags.join(", ")}</p>}
                  {canManage && entry.notes && <p className="mt-3 text-sm text-on-surface-variant/80">DM: {entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <SectionHeader icon="flag" title="Faction Directory" />
          {canManage && (
            <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                <Input id="faction-name" label="Faction Name" value={factionForm.name} onChange={(event) => setFactionForm((prev) => ({ ...prev, name: event.target.value }))} />
                <Input id="faction-type" label="Type" value={factionForm.type} onChange={(event) => setFactionForm((prev) => ({ ...prev, type: event.target.value }))} placeholder="Guild, cult, house..." />
              </div>
              <div className="mt-3">
                <Textarea id="faction-agenda" label="Agenda" rows={3} value={factionForm.agenda} onChange={(event) => setFactionForm((prev) => ({ ...prev, agenda: event.target.value }))} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Select id="faction-status" label="Status" value={factionForm.status} onChange={(event) => setFactionForm((prev) => ({ ...prev, status: event.target.value }))}>
                  {FACTION_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
                </Select>
                <Input id="faction-influence" label="Influence (1-5)" type="number" min={1} max={5} value={factionForm.influence} onChange={(event) => setFactionForm((prev) => ({ ...prev, influence: Math.min(5, Math.max(1, Number(event.target.value) || 3)) }))} />
                <Select id="faction-visibility" label="Visibility" value={factionForm.playerVisible ? "public" : "dm"} onChange={(event) => setFactionForm((prev) => ({ ...prev, playerVisible: event.target.value === "public" }))}>
                  <option value="public">Player Visible</option>
                  <option value="dm">DM Only</option>
                </Select>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input id="faction-regions" label="Operating Regions" value={factionForm.regions} onChange={(event) => setFactionForm((prev) => ({ ...prev, regions: event.target.value }))} placeholder="Capital, Coast, Underways" />
                <Textarea id="faction-notes" label="DM Notes" rows={2} value={factionForm.notes} onChange={(event) => setFactionForm((prev) => ({ ...prev, notes: event.target.value }))} />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {editingFactionId && <Button variant="ghost" size="sm" onClick={resetFactionForm}><Icon name="close" size={16} />Cancel</Button>}
                <Button size="sm" variant="secondary" onClick={upsertFaction}><Icon name={editingFactionId ? "save" : "add"} size={16} />{editingFactionId ? "Update Faction" : "Add Faction"}</Button>
              </div>
            </div>
          )}
          {factions.length === 0 ? (
            <EmptyState icon="flag" title="No factions tracked" description="Track motives, reach, and visibility so politics can evolve with the campaign." />
          ) : (
            <div className="space-y-3">
              {factions.map((entry) => (
                <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{entry.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">{entry.type} · {entry.status} · influence {entry.influence}/5</p>
                    </div>
                    {canManage && <div className="flex gap-1"><button type="button" className="text-on-surface-variant/50 transition-colors hover:text-secondary" onClick={() => { setEditingFactionId(entry.id); setFactionForm({ name: entry.name, type: entry.type, agenda: entry.agenda, status: entry.status, influence: entry.influence, regions: toCsv(entry.regions), notes: entry.notes || "", playerVisible: entry.playerVisible }); }}><Icon name="edit" size={18} /></button><button type="button" className="text-on-surface-variant/50 transition-colors hover:text-error" onClick={() => setFactions((prev) => prev.filter((item) => item.id !== entry.id))}><Icon name="delete" size={18} /></button></div>}
                  </div>
                  {entry.agenda && <p className="mt-3 text-sm text-on-surface-variant">{entry.agenda}</p>}
                  {entry.regions.length > 0 && <p className="mt-3 text-sm text-on-surface-variant/80">Active in: {entry.regions.join(", ")}</p>}
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-on-surface-variant/50">{entry.playerVisible ? "Player visible" : "DM only"}</p>
                  {canManage && entry.notes && <p className="mt-3 text-sm text-on-surface-variant/80">DM: {entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <SectionHeader icon="library_books" title="Lore Codex" />
          {canManage && (
            <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                <Input id="lore-title" label="Title" value={loreForm.title} onChange={(event) => setLoreForm((prev) => ({ ...prev, title: event.target.value }))} />
                <Select id="lore-category" label="Category" value={loreForm.category} onChange={(event) => setLoreForm((prev) => ({ ...prev, category: event.target.value }))}>
                  {LORE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </Select>
              </div>
              <div className="mt-3">
                <Textarea id="lore-summary" label="Player Summary" rows={3} value={loreForm.summary} onChange={(event) => setLoreForm((prev) => ({ ...prev, summary: event.target.value }))} />
              </div>
              <div className="mt-3">
                <Textarea id="lore-truth" label="DM Truth" rows={3} value={loreForm.dmTruth} onChange={(event) => setLoreForm((prev) => ({ ...prev, dmTruth: event.target.value }))} placeholder="What is actually true behind the rumor, custom, or history?" />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input id="lore-related" label="Related Names" value={loreForm.relatedNames} onChange={(event) => setLoreForm((prev) => ({ ...prev, relatedNames: event.target.value }))} placeholder="Raven Coast, Iron Choir, Queen Meris" />
                <Select id="lore-visibility" label="Visibility" value={loreForm.playerVisible ? "public" : "dm"} onChange={(event) => setLoreForm((prev) => ({ ...prev, playerVisible: event.target.value === "public" }))}>
                  <option value="public">Player Visible</option>
                  <option value="dm">DM Only</option>
                </Select>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {editingLoreId && <Button variant="ghost" size="sm" onClick={resetLoreForm}><Icon name="close" size={16} />Cancel</Button>}
                <Button size="sm" variant="secondary" onClick={upsertLore}><Icon name={editingLoreId ? "save" : "add"} size={16} />{editingLoreId ? "Update Entry" : "Add Lore"}</Button>
              </div>
            </div>
          )}
          {lore.length === 0 ? (
            <EmptyState icon="menu_book" title="No lore entries yet" description="Build a codex for myths, laws, religions, currencies, and cultural truths." />
          ) : (
            <div className="space-y-3">
              {lore.map((entry) => (
                <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{entry.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">{entry.category} · {entry.playerVisible ? "Player visible" : "DM only"}</p>
                    </div>
                    {canManage && <div className="flex gap-1"><button type="button" className="text-on-surface-variant/50 transition-colors hover:text-secondary" onClick={() => { setEditingLoreId(entry.id); setLoreForm({ title: entry.title, category: entry.category, summary: entry.summary, dmTruth: entry.dmTruth || "", relatedNames: toCsv(entry.relatedNames), playerVisible: entry.playerVisible }); }}><Icon name="edit" size={18} /></button><button type="button" className="text-on-surface-variant/50 transition-colors hover:text-error" onClick={() => setLore((prev) => prev.filter((item) => item.id !== entry.id))}><Icon name="delete" size={18} /></button></div>}
                  </div>
                  {entry.summary && <p className="mt-3 text-sm text-on-surface-variant">{entry.summary}</p>}
                  {entry.relatedNames.length > 0 && <p className="mt-3 text-sm text-on-surface-variant/80">Linked to: {entry.relatedNames.join(", ")}</p>}
                  {canManage && entry.dmTruth && <p className="mt-3 text-sm text-on-surface-variant/80">DM: {entry.dmTruth}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <SectionHeader icon="history_edu" title="Historical Timeline" />
          {canManage && (
            <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input id="event-title" label="Event Title" value={eventForm.title} onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))} />
                <Input id="event-date" label="Date Label" value={eventForm.dateLabel} onChange={(event) => setEventForm((prev) => ({ ...prev, dateLabel: event.target.value }))} placeholder="Year 912, Frostwane 2" />
              </div>
              <div className="mt-3">
                <Input id="event-era" label="Era / Age" value={eventForm.era} onChange={(event) => setEventForm((prev) => ({ ...prev, era: event.target.value }))} placeholder="Age of Salt Crowns" />
              </div>
              <div className="mt-3">
                <Textarea id="event-summary" label="Summary" rows={3} value={eventForm.summary} onChange={(event) => setEventForm((prev) => ({ ...prev, summary: event.target.value }))} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Textarea id="event-impact" label="Impact / Fallout" rows={2} value={eventForm.impact} onChange={(event) => setEventForm((prev) => ({ ...prev, impact: event.target.value }))} />
                <Select id="event-visibility" label="Visibility" value={eventForm.playerVisible ? "public" : "dm"} onChange={(event) => setEventForm((prev) => ({ ...prev, playerVisible: event.target.value === "public" }))}>
                  <option value="public">Player Visible</option>
                  <option value="dm">DM Only</option>
                </Select>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {editingEventId && <Button variant="ghost" size="sm" onClick={resetEventForm}><Icon name="close" size={16} />Cancel</Button>}
                <Button size="sm" variant="secondary" onClick={upsertEvent}><Icon name={editingEventId ? "save" : "add"} size={16} />{editingEventId ? "Update Event" : "Add Event"}</Button>
              </div>
            </div>
          )}
          {events.length === 0 ? (
            <EmptyState icon="history" title="No timeline events yet" description="Track wars, cataclysms, dynasties, betrayals, and other anchors the world still reacts to." />
          ) : (
            <div className="space-y-3">
              {events.map((entry) => (
                <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{entry.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">{[entry.dateLabel, entry.era].filter(Boolean).join(" · ") || "Undated"} · {entry.playerVisible ? "Player visible" : "DM only"}</p>
                    </div>
                    {canManage && <div className="flex gap-1"><button type="button" className="text-on-surface-variant/50 transition-colors hover:text-secondary" onClick={() => { setEditingEventId(entry.id); setEventForm({ title: entry.title, era: entry.era, dateLabel: entry.dateLabel, summary: entry.summary, impact: entry.impact || "", playerVisible: entry.playerVisible }); }}><Icon name="edit" size={18} /></button><button type="button" className="text-on-surface-variant/50 transition-colors hover:text-error" onClick={() => setEvents((prev) => prev.filter((item) => item.id !== entry.id))}><Icon name="delete" size={18} /></button></div>}
                  </div>
                  {entry.summary && <p className="mt-3 text-sm text-on-surface-variant">{entry.summary}</p>}
                  {entry.impact && <p className="mt-3 text-sm text-on-surface-variant/80">Impact: {entry.impact}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {canManage && (
        <div className="flex justify-end">
          <Button onClick={saveWorldbuilding} loading={saving} className="glow-gold">
            <Icon name="save" size={16} />
            Save Worldbuilding
          </Button>
        </div>
      )}
    </div>
  );
}
