"use client";

import { useMemo, useState } from "react";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatus } from "@/components/ui/form-status";

type CoinKey = "cp" | "sp" | "ep" | "gp" | "pp";

interface PartyMember {
  id: string;
  role: string;
  user: { name: string | null };
  character: {
    id: string;
    name: string;
    level: number;
  } | null;
}

interface SessionAttendance {
  characterId: string;
  name: string;
  status: string;
}

interface GameSessionLite {
  id: string;
  number: number;
  title: string | null;
  attendance?: SessionAttendance[] | null;
}

interface PartyHubPanelProps {
  campaignId: string;
  partyTreasury: unknown;
  treasuryLedger: unknown;
  partyStash: unknown;
  craftingProjects: unknown;
  announcements: unknown;
  merchants: unknown;
  economyLog: unknown;
  schedulePolls: unknown;
  campaignMessages: unknown;
  handouts: unknown;
  sharedPlans: unknown;
  members: PartyMember[];
  sessions: GameSessionLite[];
  canManage: boolean;
  canContributePlans: boolean;
  socketConnected?: boolean;
  emitSocketEvent?: (event: string, data: unknown) => void;
  onRefresh: () => void;
}

interface TreasuryEntry {
  id: string;
  note: string;
  direction: "deposit" | "withdraw";
  amounts: Record<CoinKey, number>;
  createdAt: string;
  createdBy: string;
}

interface PartyStashItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  notes: string;
  assignedTo: string;
  imageUrl: string | null;
  createdAt: string;
}

interface CraftingProject {
  id: string;
  title: string;
  category: string;
  assignee: string;
  status: "planned" | "in_progress" | "blocked" | "complete";
  progress: number;
  materials: string[];
  reward: string;
  dueDate: string;
  notes: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

interface MerchantInventoryItem {
  id: string;
  name: string;
  category: string;
  price: string;
  quantity: number;
  rarity: string;
  notes: string;
}

interface MerchantRecord {
  id: string;
  name: string;
  specialty: string;
  region: string;
  priceModifier: number;
  status: "open" | "limited" | "closed";
  notes: string;
  inventory: MerchantInventoryItem[];
  createdAt: string;
}

interface EconomyLogEntry {
  id: string;
  type: "treasury" | "merchant" | "trade";
  direction: "spent" | "earned" | "shared";
  title: string;
  detail: string;
  amounts: Record<CoinKey, number>;
  createdAt: string;
  createdBy: string;
}

interface SchedulePollOption {
  id: string;
  label: string;
  votes: string[];
}

interface SchedulePoll {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  createdAt: string;
  createdBy: string;
  options: SchedulePollOption[];
}

interface CampaignMessage {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;
  createdById: string;
}

interface CampaignHandout {
  id: string;
  title: string;
  content: string;
  type: string;
  imageUrl: string | null;
  visibility: "public" | "dm";
  isPinned: boolean;
  createdAt: string;
  createdBy: string;
}

interface SharedPlan {
  id: string;
  text: string;
  status: "open" | "done";
  author: string;
  createdAt: string;
}

const COIN_KEYS: CoinKey[] = ["cp", "sp", "ep", "gp", "pp"];

function toTreasury(value: unknown): Record<CoinKey, number> {
  const source = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  return {
    cp: Number(source.cp ?? 0),
    sp: Number(source.sp ?? 0),
    ep: Number(source.ep ?? 0),
    gp: Number(source.gp ?? 0),
    pp: Number(source.pp ?? 0),
  };
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizePlans(value: unknown): SharedPlan[] {
  return toArray<unknown>(value)
    .map((entry, index) => {
      if (typeof entry === "string") {
        return {
          id: `legacy-plan-${index}`,
          text: entry,
          status: "open" as const,
          author: "Legacy",
          createdAt: new Date(0).toISOString(),
        };
      }

      if (!entry || typeof entry !== "object") {
        return null;
      }

      const item = entry as Record<string, unknown>;
      return {
        id: String(item.id || `plan-${index}`),
        text: String(item.text || ""),
        status: item.status === "done" ? "done" : "open",
        author: String(item.author || "Unknown"),
        createdAt: String(item.createdAt || new Date(0).toISOString()),
      };
    })
    .filter((entry): entry is SharedPlan => Boolean(entry?.text));
}

function normalizeCraftingProjects(value: unknown): CraftingProject[] {
  return toArray<unknown>(value)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        title,
        category: String(item.category || "Crafting").trim() || "Crafting",
        assignee: String(item.assignee || "").trim(),
        status:
          item.status === "in_progress" || item.status === "blocked" || item.status === "complete"
            ? item.status
            : "planned",
        progress: Math.max(0, Math.min(100, Number(item.progress ?? 0) || 0)),
        materials: toArray<unknown>(item.materials).map((material) => String(material).trim()).filter(Boolean),
        reward: String(item.reward || "").trim(),
        dueDate: String(item.dueDate || "").trim(),
        notes: String(item.notes || "").trim(),
        createdAt: String(item.createdAt || new Date(0).toISOString()),
      } satisfies CraftingProject;
    })
    .filter((entry): entry is CraftingProject => Boolean(entry));
}

function normalizeMerchants(value: unknown): MerchantRecord[] {
  return toArray<unknown>(value)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const name = String(item.name || "").trim();
      if (!name) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        name,
        specialty: String(item.specialty || "").trim(),
        region: String(item.region || "").trim(),
        priceModifier: Number(item.priceModifier ?? 0) || 0,
        status: item.status === "limited" || item.status === "closed" ? item.status : "open",
        notes: String(item.notes || "").trim(),
        inventory: toArray<unknown>(item.inventory)
          .map((inventoryEntry) => {
            if (!inventoryEntry || typeof inventoryEntry !== "object") return null;
            const inventory = inventoryEntry as Record<string, unknown>;
            const inventoryName = String(inventory.name || "").trim();
            if (!inventoryName) return null;
            return {
              id: String(inventory.id || crypto.randomUUID()),
              name: inventoryName,
              category: String(inventory.category || "Gear").trim() || "Gear",
              price: String(inventory.price || "").trim(),
              quantity: Math.max(0, Number(inventory.quantity ?? 0) || 0),
              rarity: String(inventory.rarity || "common").trim() || "common",
              notes: String(inventory.notes || "").trim(),
            } satisfies MerchantInventoryItem;
          })
          .filter((inventoryEntry): inventoryEntry is MerchantInventoryItem => Boolean(inventoryEntry)),
        createdAt: String(item.createdAt || new Date(0).toISOString()),
      } satisfies MerchantRecord;
    })
    .filter((entry): entry is MerchantRecord => Boolean(entry));
}

function normalizeEconomyLog(value: unknown): EconomyLogEntry[] {
  return toArray<unknown>(value)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        type: item.type === "merchant" || item.type === "trade" ? item.type : "treasury",
        direction: item.direction === "earned" || item.direction === "shared" ? item.direction : "spent",
        title,
        detail: String(item.detail || "").trim(),
        amounts: toTreasury(item.amounts),
        createdAt: String(item.createdAt || new Date(0).toISOString()),
        createdBy: String(item.createdBy || "Unknown"),
      } satisfies EconomyLogEntry;
    })
    .filter((entry): entry is EconomyLogEntry => Boolean(entry));
}

function normalizeSchedulePolls(value: unknown): SchedulePoll[] {
  return toArray<unknown>(value)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        title,
        description: String(item.description || "").trim(),
        status: item.status === "closed" ? "closed" : "open",
        createdAt: String(item.createdAt || new Date(0).toISOString()),
        createdBy: String(item.createdBy || "Unknown"),
        options: toArray<unknown>(item.options)
          .map((optionEntry) => {
            if (!optionEntry || typeof optionEntry !== "object") return null;
            const option = optionEntry as Record<string, unknown>;
            const label = String(option.label || "").trim();
            if (!label) return null;
            return {
              id: String(option.id || crypto.randomUUID()),
              label,
              votes: toArray<unknown>(option.votes).map((vote) => String(vote)).filter(Boolean),
            } satisfies SchedulePollOption;
          })
          .filter((option): option is SchedulePollOption => Boolean(option)),
      } satisfies SchedulePoll;
    })
    .filter((entry): entry is SchedulePoll => Boolean(entry));
}

function normalizeCampaignMessages(value: unknown): CampaignMessage[] {
  return toArray<unknown>(value)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const text = String(item.text || "").trim();
      if (!text) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        text,
        createdAt: String(item.createdAt || new Date(0).toISOString()),
        createdBy: String(item.createdBy || "Unknown"),
        createdById: String(item.createdById || ""),
      } satisfies CampaignMessage;
    })
    .filter((entry): entry is CampaignMessage => Boolean(entry));
}

function normalizeHandouts(value: unknown): CampaignHandout[] {
  return toArray<unknown>(value)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const title = String(item.title || "").trim();
      if (!title) return null;
      return {
        id: String(item.id || crypto.randomUUID()),
        title,
        content: String(item.content || "").trim(),
        type: String(item.type || "note").trim() || "note",
        imageUrl: typeof item.imageUrl === "string" && item.imageUrl.trim() ? item.imageUrl.trim() : null,
        visibility: item.visibility === "dm" ? "dm" : "public",
        isPinned: Boolean(item.isPinned),
        createdAt: String(item.createdAt || new Date(0).toISOString()),
        createdBy: String(item.createdBy || "Unknown"),
      } satisfies CampaignHandout;
    })
    .filter((entry): entry is CampaignHandout => Boolean(entry));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PartyHubPanel({
  campaignId,
  partyTreasury,
  treasuryLedger,
  partyStash,
  craftingProjects,
  announcements,
  merchants,
  economyLog,
  schedulePolls,
  campaignMessages,
  handouts,
  sharedPlans,
  members,
  sessions,
  canManage,
  canContributePlans,
  socketConnected = false,
  emitSocketEvent,
  onRefresh,
}: PartyHubPanelProps) {
  const treasury = toTreasury(partyTreasury);
  const ledger = toArray<TreasuryEntry>(treasuryLedger);
  const stash = toArray<PartyStashItem>(partyStash);
  const crafting = normalizeCraftingProjects(craftingProjects);
  const notices = toArray<Announcement>(announcements);
  const merchantRecords = normalizeMerchants(merchants);
  const economyEntries = normalizeEconomyLog(economyLog);
  const polls = normalizeSchedulePolls(schedulePolls);
  const messages = normalizeCampaignMessages(campaignMessages);
  const handoutEntries = normalizeHandouts(handouts);
  const plans = normalizePlans(sharedPlans);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [treasuryDirection, setTreasuryDirection] = useState<"deposit" | "withdraw">("deposit");
  const [treasuryNote, setTreasuryNote] = useState("");
  const [treasuryAmounts, setTreasuryAmounts] = useState<Record<CoinKey, number>>({
    cp: 0,
    sp: 0,
    ep: 0,
    gp: 0,
    pp: 0,
  });
  const [stashForm, setStashForm] = useState({
    name: "",
    category: "Gear",
    quantity: 1,
    notes: "",
    assignedTo: "",
  });
  const [editingStashId, setEditingStashId] = useState<string | null>(null);
  const [editingCraftingId, setEditingCraftingId] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
  });
  const [craftingForm, setCraftingForm] = useState({
    title: "",
    category: "Crafting",
    assignee: "",
    status: "planned",
    progress: 0,
    materialsText: "",
    reward: "",
    dueDate: "",
    notes: "",
  });
  const [merchantForm, setMerchantForm] = useState({
    name: "",
    specialty: "",
    region: "",
    priceModifier: 0,
    status: "open",
    notes: "",
  });
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [expandedMerchantId, setExpandedMerchantId] = useState<string | null>(null);
  const [merchantItemForm, setMerchantItemForm] = useState({
    merchantId: "",
    itemId: "",
    name: "",
    category: "Gear",
    price: "",
    quantity: 1,
    rarity: "common",
    notes: "",
  });
  const [transactionForm, setTransactionForm] = useState({
    merchantId: "",
    itemId: "",
    direction: "buy",
    quantity: 1,
    detail: "",
    amounts: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 } as Record<CoinKey, number>,
  });
  const [pollForm, setPollForm] = useState({
    title: "",
    description: "",
    optionsText: "",
  });
  const [messageText, setMessageText] = useState("");
  const [editingHandoutId, setEditingHandoutId] = useState<string | null>(null);
  const [handoutForm, setHandoutForm] = useState({
    title: "",
    content: "",
    type: "note",
    imageUrl: "",
    visibility: "public",
    isPinned: false,
  });
  const [planText, setPlanText] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const attendanceSummary = useMemo(() => {
    const summary = members
      .filter((member) => member.character)
      .map((member) => ({
        id: member.character!.id,
        name: member.character!.name,
        present: 0,
        absent: 0,
        partial: 0,
      }));

    const index = new Map(summary.map((entry) => [entry.id, entry]));
    for (const session of sessions) {
      const attendance = Array.isArray(session.attendance) ? session.attendance : [];
      for (const entry of attendance) {
        const target = index.get(entry.characterId);
        if (!target) continue;
        if (entry.status === "present") target.present += 1;
        else if (entry.status === "absent") target.absent += 1;
        else target.partial += 1;
      }
    }

    return summary;
  }, [members, sessions]);

  function getPartyUpdateSummary(action: string) {
    switch (action) {
      case "addTreasuryEntry":
        return "updated the party treasury";
      case "addAnnouncement":
      case "removeAnnouncement":
        return "updated party announcements";
      case "addCampaignMessage":
      case "removeCampaignMessage":
        return "updated campaign chat";
      case "addHandout":
      case "updateHandout":
      case "removeHandout":
        return "updated campaign handouts";
      case "addSchedulePoll":
      case "voteSchedulePoll":
      case "closeSchedulePoll":
      case "removeSchedulePoll":
        return "updated scheduling";
      case "addSharedPlan":
      case "toggleSharedPlan":
      case "removeSharedPlan":
        return "updated the shared plan board";
      case "addCraftingProject":
      case "updateCraftingProject":
      case "removeCraftingProject":
        return "updated crafting projects";
      case "addMerchant":
      case "updateMerchant":
      case "removeMerchant":
      case "saveMerchantInventoryItem":
      case "removeMerchantInventoryItem":
      case "logMerchantTransaction":
        return "updated party economy";
      case "addStashItem":
      case "updateStashItem":
      case "removeStashItem":
        return "updated the party stash";
      default:
        return "updated the party hub";
    }
  }

  async function submitPartyAction(action: string, payload: Record<string, unknown>) {
    setLoadingAction(action);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/party`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        setStatus({ kind: "success", message: "Party hub updated." });
        if (socketConnected && emitSocketEvent) {
          emitSocketEvent("campaign:party-update", {
            campaignId,
            action,
            patch: data,
            summary: getPartyUpdateSummary(action),
          });
        } else {
          onRefresh();
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: String(data.error || "Could not update party hub.") });
      }
    } finally {
      setLoadingAction(null);
    }
  }

  function beginEdit(item: PartyStashItem) {
    setEditingStashId(item.id);
    setStashForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      notes: item.notes,
      assignedTo: item.assignedTo,
    });
  }

  function resetStashForm() {
    setEditingStashId(null);
    setStashForm({
      name: "",
      category: "Gear",
      quantity: 1,
      notes: "",
      assignedTo: "",
    });
  }

  return (
    <div className="space-y-6">
      {status && <FormStatus kind={status.kind} message={status.message} />}
      <AtmosphericHero
        eyebrow="Party Hub"
        title={canManage ? "Run the shared party space like a living camp ledger." : "Follow the party’s shared trail, stash, and table plans."}
        description="Treasury, stash, crafting, merchants, scheduling, handouts, and table communication now sit under a more visual party command surface."
        entityType="item"
        imageName="The Company Ledger"
        chips={[
          canManage ? "Manager View" : "Player View",
          `${members.filter((member) => member.character).length} characters`,
          `${stash.length} stash items`,
          `${merchantRecords.length} merchants`,
        ]}
        highlights={[
          { icon: "payments", label: "Treasury", value: `${treasury.gp} gp` },
          { icon: "inventory_2", label: "Stash", value: `${stash.length}` },
          { icon: "event_upcoming", label: "Polls", value: `${polls.length}` },
        ]}
        sideContent={
          <div className="space-y-3">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
              Shared State
            </p>
            <div className="grid gap-3 text-sm text-on-surface-variant">
              <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                {notices.length} announcements and {messages.length} recent campaign messages keep party communication in one place.
              </div>
              <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                Attendance, plans, crafting, and merchant activity now read more like a campaign ledger than a utility panel.
              </div>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
        {[
          { icon: "receipt_long", label: "Economy Entries", value: `${economyEntries.length}` },
          { icon: "construction", label: "Crafting", value: `${crafting.length}` },
          { icon: "campaign", label: "Handouts", value: `${handoutEntries.length}` },
          { icon: "checklist", label: "Shared Plans", value: `${plans.length}` },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-outline-variant/10 bg-surface-container/70 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 text-secondary">
              <Icon name={item.icon} size={16} />
              <p className="font-label text-[10px] uppercase tracking-[0.16em]">{item.label}</p>
            </div>
            <p className="mt-2 font-headline text-2xl text-on-surface">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="payments" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Party Treasury</h3>
            </div>
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              Shared funds
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {COIN_KEYS.map((coin) => (
              <div key={coin} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3 text-center">
                <p className="font-headline text-xl text-secondary">{treasury[coin]}</p>
                <p className="mt-1 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
                  {coin}
                </p>
              </div>
            ))}
          </div>

          {canManage && (
            <div className="mt-5 grid gap-3">
              <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                <Select
                  id="treasury-direction"
                  label="Ledger Action"
                  value={treasuryDirection}
                  onChange={(event) => setTreasuryDirection(event.target.value as "deposit" | "withdraw")}
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                </Select>
                <Input
                  id="treasury-note"
                  label="Ledger Note"
                  value={treasuryNote}
                  onChange={(event) => setTreasuryNote(event.target.value)}
                  placeholder="Sold relics, paid healer, split tavern bill..."
                />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {COIN_KEYS.map((coin) => (
                  <Input
                    key={coin}
                    id={`treasury-${coin}`}
                    label={coin.toUpperCase()}
                    type="number"
                    min={0}
                    value={treasuryAmounts[coin]}
                    onChange={(event) =>
                      setTreasuryAmounts((prev) => ({
                        ...prev,
                        [coin]: Math.max(0, Number(event.target.value) || 0),
                      }))
                    }
                  />
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  loading={loadingAction === "addTreasuryEntry"}
                  onClick={async () => {
                    await submitPartyAction("addTreasuryEntry", {
                      note: treasuryNote,
                      direction: treasuryDirection,
                      amounts: treasuryAmounts,
                    });
                    setTreasuryNote("");
                    setTreasuryAmounts({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
                  }}
                >
                  <Icon name="receipt_long" size={16} />
                  Log Treasury Change
                </Button>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              Recent Ledger
            </p>
            {ledger.length === 0 ? (
              <EmptyState icon="receipt_long" title="No treasury history yet" description="Treasury changes logged here will build a clear party economy trail." />
            ) : (
              ledger.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-body text-sm text-on-surface">{entry.note}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {entry.createdBy} · {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 font-label text-[10px] uppercase tracking-[0.16em] ${entry.direction === "deposit" ? "bg-green-900/20 text-green-400" : "bg-error/15 text-error"}`}>
                      {entry.direction}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {COIN_KEYS.filter((coin) => entry.amounts?.[coin] > 0)
                      .map((coin) => `${entry.amounts[coin]} ${coin}`)
                      .join(" · ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="campaign" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Announcements</h3>
          </div>

          {canManage && (
            <div className="mb-4 space-y-3">
              <Input
                id="announcement-title"
                label="Title"
                value={announcementForm.title}
                onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Next session moved to Saturday"
              />
              <Textarea
                id="announcement-content"
                label="Message"
                rows={3}
                value={announcementForm.content}
                onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="Bring level-up choices, review the faction notes, and post your next-step plans."
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  loading={loadingAction === "addAnnouncement"}
                  onClick={async () => {
                    await submitPartyAction("addAnnouncement", announcementForm);
                    setAnnouncementForm({ title: "", content: "" });
                  }}
                >
                  <Icon name="campaign" size={16} />
                  Post Announcement
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {notices.length === 0 ? (
              <EmptyState icon="campaign" title="No announcements yet" description="Use this space for table-wide updates, scheduling notes, or prep requests." />
            ) : (
              notices.map((item) => (
                <div key={item.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{item.title}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{item.content}</p>
                      <p className="mt-2 text-xs text-on-surface-variant/70">
                        {item.createdBy} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        className="text-on-surface-variant/50 transition-colors hover:text-error"
                        onClick={() => submitPartyAction("removeAnnouncement", { announcementId: item.id })}
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="inventory_2" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Shared Stash</h3>
            </div>
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              {stash.length} items
            </span>
          </div>

          {canManage && (
            <div className="mb-4 grid gap-3 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_120px]">
                <Input
                  id="stash-name"
                  label="Item"
                  value={stashForm.name}
                  onChange={(event) => setStashForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Potion of Healing"
                />
                <Input
                  id="stash-category"
                  label="Category"
                  value={stashForm.category}
                  onChange={(event) => setStashForm((prev) => ({ ...prev, category: event.target.value }))}
                />
                <Input
                  id="stash-quantity"
                  label="Quantity"
                  type="number"
                  min={1}
                  value={stashForm.quantity}
                  onChange={(event) => setStashForm((prev) => ({ ...prev, quantity: Math.max(1, Number(event.target.value) || 1) }))}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                <Input
                  id="stash-assigned"
                  label="Assigned To"
                  value={stashForm.assignedTo}
                  onChange={(event) => setStashForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
                  placeholder="Party stash, Kora, group mule..."
                />
                <Textarea
                  id="stash-notes"
                  label="Notes"
                  rows={2}
                  value={stashForm.notes}
                  onChange={(event) => setStashForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Found in the drowned vault."
                />
              </div>

              <div className="flex justify-end gap-2">
                {editingStashId && (
                  <Button variant="ghost" size="sm" onClick={resetStashForm}>
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  loading={loadingAction === (editingStashId ? "updateStashItem" : "addStashItem")}
                  onClick={async () => {
                    if (editingStashId) {
                      await submitPartyAction("updateStashItem", {
                        itemId: editingStashId,
                        ...stashForm,
                      });
                    } else {
                      await submitPartyAction("addStashItem", stashForm);
                    }
                    resetStashForm();
                  }}
                >
                  <Icon name={editingStashId ? "save" : "add"} size={16} />
                  {editingStashId ? "Save Stash Item" : "Add to Stash"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {stash.length === 0 ? (
              <EmptyState icon="inventory_2" title="No shared stash yet" description="Track group loot, communal supplies, mounts, and stash-only gear here." />
            ) : (
              stash.map((item) => (
                <div key={item.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline text-base text-on-surface">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                        {item.category} · Qty {item.quantity} {item.assignedTo ? `· ${item.assignedTo}` : ""}
                      </p>
                      {item.notes && (
                        <p className="mt-2 text-sm text-on-surface-variant">{item.notes}</p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button type="button" className="text-on-surface-variant/50 hover:text-secondary" onClick={() => beginEdit(item)}>
                          <Icon name="edit" size={18} />
                        </button>
                        <button type="button" className="text-on-surface-variant/50 hover:text-error" onClick={() => submitPartyAction("removeStashItem", { itemId: item.id })}>
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="checklist" size={18} className="text-secondary" />
                <h3 className="font-headline text-lg text-on-surface">Shared Plans</h3>
              </div>
              <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
                Party board
              </span>
            </div>

            {canContributePlans && (
              <div className="mb-4 flex gap-2">
                <Input
                  id="plan-text"
                  label="Add Plan"
                  value={planText}
                  onChange={(event) => setPlanText(event.target.value)}
                  placeholder="Scout the eastern gate before we trigger the heist."
                />
                <Button
                  size="sm"
                  className="self-end"
                  loading={loadingAction === "addSharedPlan"}
                  onClick={async () => {
                    await submitPartyAction("addSharedPlan", { text: planText });
                    setPlanText("");
                  }}
                >
                  <Icon name="add_task" size={16} />
                  Add
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {plans.length === 0 ? (
                <EmptyState icon="checklist" title="No shared plans yet" description="Track declared plans before the next session so everyone stays aligned." />
              ) : (
                plans.map((plan) => (
                  <div key={plan.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                    <div className="flex items-start gap-3">
                      {canContributePlans ? (
                        <button
                          type="button"
                          className={`mt-0.5 ${plan.status === "done" ? "text-green-400" : "text-on-surface-variant/50"}`}
                          onClick={() => submitPartyAction("toggleSharedPlan", { planId: plan.id })}
                        >
                          <Icon name={plan.status === "done" ? "check_circle" : "radio_button_unchecked"} size={18} />
                        </button>
                      ) : (
                        <Icon name={plan.status === "done" ? "check_circle" : "radio_button_unchecked"} size={18} className={plan.status === "done" ? "mt-0.5 text-green-400" : "mt-0.5 text-on-surface-variant/50"} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${plan.status === "done" ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                          {plan.text}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant/70">
                          {plan.author} · {formatDate(plan.createdAt)}
                        </p>
                      </div>
                      {canManage && (
                        <button type="button" className="text-on-surface-variant/50 hover:text-error" onClick={() => submitPartyAction("removeSharedPlan", { planId: plan.id })}>
                          <Icon name="delete" size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="event_available" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Attendance Snapshot</h3>
            </div>
            {attendanceSummary.length === 0 ? (
              <EmptyState icon="event_available" title="No attendance data yet" description="Session attendance will start building once sessions track present and absent characters." />
            ) : (
              <div className="grid gap-2">
                {attendanceSummary.map((entry) => (
                  <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-headline text-base text-on-surface">{entry.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        Present {entry.present} · Absent {entry.absent} · Partial {entry.partial}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon name="handyman" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Crafting Projects</h3>
          </div>
          <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
            {crafting.length} projects
          </span>
        </div>

        {canManage && (
          <div className="mb-4 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
              <Input id="craft-title" label="Project" value={craftingForm.title} onChange={(event) => setCraftingForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Silvered bolts for the crypt raid" />
              <Input id="craft-category" label="Category" value={craftingForm.category} onChange={(event) => setCraftingForm((prev) => ({ ...prev, category: event.target.value }))} />
              <Input id="craft-assignee" label="Assigned To" value={craftingForm.assignee} onChange={(event) => setCraftingForm((prev) => ({ ...prev, assignee: event.target.value }))} placeholder="Kora / party / hireling" />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[180px_120px_180px_minmax(0,1fr)]">
              <Select id="craft-status" label="Status" value={craftingForm.status} onChange={(event) => setCraftingForm((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="complete">Complete</option>
              </Select>
              <Input id="craft-progress" label="Progress %" type="number" min={0} max={100} value={craftingForm.progress} onChange={(event) => setCraftingForm((prev) => ({ ...prev, progress: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))} />
              <Input id="craft-due" label="Due Date" value={craftingForm.dueDate} onChange={(event) => setCraftingForm((prev) => ({ ...prev, dueDate: event.target.value }))} placeholder="Before Session 7" />
              <Input id="craft-reward" label="Reward / Output" value={craftingForm.reward} onChange={(event) => setCraftingForm((prev) => ({ ...prev, reward: event.target.value }))} placeholder="+1 focus, 20 bolts, antidotes..." />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Textarea id="craft-materials" label="Materials" rows={2} value={craftingForm.materialsText} onChange={(event) => setCraftingForm((prev) => ({ ...prev, materialsText: event.target.value }))} placeholder={"One material per line\nSilver dust\nAshwood shafts"} />
              <Textarea id="craft-notes" label="Notes" rows={2} value={craftingForm.notes} onChange={(event) => setCraftingForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Need access to a forge and 2 downtime days." />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              {editingCraftingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCraftingId(null);
                    setCraftingForm({ title: "", category: "Crafting", assignee: "", status: "planned", progress: 0, materialsText: "", reward: "", dueDate: "", notes: "" });
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                loading={loadingAction === "addCraftingProject" || loadingAction === "updateCraftingProject"}
                onClick={async () => {
                  await submitPartyAction(editingCraftingId ? "updateCraftingProject" : "addCraftingProject", {
                    projectId: editingCraftingId,
                    title: craftingForm.title,
                    category: craftingForm.category,
                    assignee: craftingForm.assignee,
                    status: craftingForm.status,
                    progress: craftingForm.progress,
                    reward: craftingForm.reward,
                    dueDate: craftingForm.dueDate,
                    notes: craftingForm.notes,
                    materials: craftingForm.materialsText.split("\n").map((entry) => entry.trim()).filter(Boolean),
                  });
                  setEditingCraftingId(null);
                  setCraftingForm({ title: "", category: "Crafting", assignee: "", status: "planned", progress: 0, materialsText: "", reward: "", dueDate: "", notes: "" });
                }}
              >
                <Icon name={editingCraftingId ? "save" : "add_task"} size={16} />
                {editingCraftingId ? "Save Project" : "Add Project"}
              </Button>
            </div>
          </div>
        )}

        {crafting.length === 0 ? (
          <EmptyState icon="handyman" title="No crafting projects yet" description="Track builds, upgrades, downtime work, and material requirements for the party here." />
        ) : (
          <div className="grid gap-3">
            {crafting.map((project) => (
              <div key={project.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-headline text-base text-on-surface">{project.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                      {[project.category, project.assignee, project.status].filter(Boolean).join(" · ")}
                    </p>
                    {project.reward && <p className="mt-2 text-sm text-secondary">{project.reward}</p>}
                    {project.notes && <p className="mt-2 text-sm text-on-surface-variant">{project.notes}</p>}
                    {project.materials.length > 0 && <p className="mt-2 text-xs text-on-surface-variant/70">Materials: {project.materials.join(", ")}</p>}
                    {project.dueDate && <p className="mt-1 text-xs text-on-surface-variant/70">Due: {project.dueDate}</p>}
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="text-on-surface-variant/50 hover:text-secondary"
                        onClick={() => {
                          setEditingCraftingId(project.id);
                          setCraftingForm({
                            title: project.title,
                            category: project.category,
                            assignee: project.assignee,
                            status: project.status,
                            progress: project.progress,
                            materialsText: project.materials.join("\n"),
                            reward: project.reward,
                            dueDate: project.dueDate,
                            notes: project.notes,
                          });
                        }}
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button type="button" className="text-on-surface-variant/50 hover:text-error" onClick={() => submitPartyAction("removeCraftingProject", { projectId: project.id })}>
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${project.progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">{project.progress}% complete</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="forum" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Campaign Chat</h3>
            </div>
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              Shared discussion
            </span>
          </div>

          {canContributePlans && (
            <div className="mb-4 flex gap-2">
              <Input
                id="campaign-message"
                label="Message"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="We should check the ruined tower before taking the bounty."
              />
              <Button
                size="sm"
                className="self-end"
                loading={loadingAction === "addCampaignMessage"}
                onClick={async () => {
                  await submitPartyAction("addCampaignMessage", { text: messageText });
                  setMessageText("");
                }}
              >
                <Icon name="send" size={16} />
                Post
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {messages.length === 0 ? (
              <EmptyState icon="forum" title="No campaign messages yet" description="Use the shared chat for table planning, recap follow-ups, and group discussion between sessions." />
            ) : (
              messages.slice(0, 25).map((message) => (
                <div key={message.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-on-surface">{message.text}</p>
                      <p className="mt-2 text-xs text-on-surface-variant/70">
                        {message.createdBy} · {formatDate(message.createdAt)}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        className="text-on-surface-variant/50 hover:text-error"
                        onClick={() => submitPartyAction("removeCampaignMessage", { messageId: message.id })}
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="collections_bookmark" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Handouts and Clues</h3>
            </div>
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              Shared references
            </span>
          </div>

          {canManage && (
            <div className="mb-4 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px]">
                <Input
                  id="handout-title"
                  label="Title"
                  value={handoutForm.title}
                  onChange={(event) => setHandoutForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Letter from the Black Ferry"
                />
                <Input
                  id="handout-type"
                  label="Type"
                  value={handoutForm.type}
                  onChange={(event) => setHandoutForm((prev) => ({ ...prev, type: event.target.value }))}
                  placeholder="letter, clue, map, rumor"
                />
                <Select
                  id="handout-visibility"
                  label="Visibility"
                  value={handoutForm.visibility}
                  onChange={(event) => setHandoutForm((prev) => ({ ...prev, visibility: event.target.value }))}
                >
                  <option value="public">Player Visible</option>
                  <option value="dm">DM Only</option>
                </Select>
              </div>
              <div className="mt-3">
                <Input
                  id="handout-image"
                  label="Image URL"
                  value={handoutForm.imageUrl}
                  onChange={(event) => setHandoutForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  placeholder="Optional image or clue art URL"
                />
              </div>
              <div className="mt-3">
                <Textarea
                  id="handout-content"
                  label="Content"
                  rows={4}
                  value={handoutForm.content}
                  onChange={(event) => setHandoutForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Paste the clue text, reveal note, dossier, prophecy, or scene handout..."
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={handoutForm.isPinned}
                    onChange={(event) => setHandoutForm((prev) => ({ ...prev, isPinned: event.target.checked }))}
                  />
                  Pin this handout
                </label>
                <div className="flex gap-2">
                  {editingHandoutId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingHandoutId(null);
                        setHandoutForm({ title: "", content: "", type: "note", imageUrl: "", visibility: "public", isPinned: false });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    loading={loadingAction === "addHandout" || loadingAction === "updateHandout"}
                    onClick={async () => {
                      await submitPartyAction(editingHandoutId ? "updateHandout" : "addHandout", {
                        handoutId: editingHandoutId,
                        ...handoutForm,
                      });
                      setEditingHandoutId(null);
                      setHandoutForm({ title: "", content: "", type: "note", imageUrl: "", visibility: "public", isPinned: false });
                    }}
                  >
                    <Icon name={editingHandoutId ? "save" : "note_add"} size={16} />
                    {editingHandoutId ? "Save Handout" : "Publish Handout"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {handoutEntries.length === 0 ? (
              <EmptyState icon="collections_bookmark" title="No handouts yet" description="Publish maps, letters, clue cards, and reveal documents for the table here." />
            ) : (
              handoutEntries
                .slice()
                .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
                .map((handout) => (
                  <div key={handout.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-headline text-base text-on-surface">{handout.title}</p>
                          {handout.isPinned && <span className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-secondary">Pinned</span>}
                          <span className="rounded-full bg-surface-container-high px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{handout.type}</span>
                          <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${handout.visibility === "dm" ? "bg-error/10 text-error" : "bg-green-900/20 text-green-400"}`}>
                            {handout.visibility === "dm" ? "DM only" : "Public"}
                          </span>
                        </div>
                        {handout.content && <p className="mt-2 whitespace-pre-wrap text-sm text-on-surface-variant">{handout.content}</p>}
                        {handout.imageUrl && <p className="mt-2 text-xs text-secondary break-all">{handout.imageUrl}</p>}
                        <p className="mt-2 text-xs text-on-surface-variant/70">
                          {handout.createdBy} · {formatDate(handout.createdAt)}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="text-on-surface-variant/50 hover:text-secondary"
                            onClick={() => {
                              setEditingHandoutId(handout.id);
                              setHandoutForm({
                                title: handout.title,
                                content: handout.content,
                                type: handout.type,
                                imageUrl: handout.imageUrl || "",
                                visibility: handout.visibility,
                                isPinned: handout.isPinned,
                              });
                            }}
                          >
                            <Icon name="edit" size={18} />
                          </button>
                          <button
                            type="button"
                            className="text-on-surface-variant/50 hover:text-error"
                            onClick={() => submitPartyAction("removeHandout", { handoutId: handout.id })}
                          >
                            <Icon name="delete" size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="storefront" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Merchants and Shops</h3>
            </div>
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              {merchantRecords.length} vendors
            </span>
          </div>

          {canManage && (
            <div className="mb-4 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input id="merchant-name" label="Merchant" value={merchantForm.name} onChange={(event) => setMerchantForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Velra the Quartermaster" />
                <Input id="merchant-specialty" label="Specialty" value={merchantForm.specialty} onChange={(event) => setMerchantForm((prev) => ({ ...prev, specialty: event.target.value }))} placeholder="Armor, reagents, black market..." />
                <Input id="merchant-region" label="Region" value={merchantForm.region} onChange={(event) => setMerchantForm((prev) => ({ ...prev, region: event.target.value }))} placeholder="Raven Coast" />
                <Input id="merchant-modifier" label="Price Modifier %" type="number" value={merchantForm.priceModifier} onChange={(event) => setMerchantForm((prev) => ({ ...prev, priceModifier: Number(event.target.value) || 0 }))} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                <Select id="merchant-status" label="Status" value={merchantForm.status} onChange={(event) => setMerchantForm((prev) => ({ ...prev, status: event.target.value }))}>
                  <option value="open">Open</option>
                  <option value="limited">Limited</option>
                  <option value="closed">Closed</option>
                </Select>
                <Textarea id="merchant-notes" label="Notes" rows={2} value={merchantForm.notes} onChange={(event) => setMerchantForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Favours the party, sells stolen relics, only opens at dusk..." />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {editingMerchantId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingMerchantId(null);
                      setMerchantForm({ name: "", specialty: "", region: "", priceModifier: 0, status: "open", notes: "" });
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  loading={loadingAction === "addMerchant" || loadingAction === "updateMerchant"}
                  onClick={async () => {
                    await submitPartyAction(editingMerchantId ? "updateMerchant" : "addMerchant", {
                      merchantId: editingMerchantId,
                      ...merchantForm,
                    });
                    setEditingMerchantId(null);
                    setMerchantForm({ name: "", specialty: "", region: "", priceModifier: 0, status: "open", notes: "" });
                  }}
                >
                  <Icon name={editingMerchantId ? "save" : "add_business"} size={16} />
                  {editingMerchantId ? "Save Merchant" : "Add Merchant"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {merchantRecords.length === 0 ? (
              <EmptyState icon="storefront" title="No merchants yet" description="Track shops, traveling traders, fenced goods, and regional price pressure here." />
            ) : (
              merchantRecords.map((merchant) => {
                const inventoryItems = merchant.inventory;
                const activeInventory = inventoryItems.filter((item) => item.quantity > 0).length;
                const isExpanded = expandedMerchantId === merchant.id;
                const selectedInventory = inventoryItems.find((item) => item.id === transactionForm.itemId);
                return (
                  <div key={merchant.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-headline text-base text-on-surface">{merchant.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                          {[merchant.specialty, merchant.region].filter(Boolean).join(" · ") || "General goods"} · {merchant.status} · {activeInventory} stocked
                        </p>
                        {merchant.notes && <p className="mt-2 text-sm text-on-surface-variant">{merchant.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="rounded-full bg-surface-container-high px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                          {merchant.priceModifier >= 0 ? `+${merchant.priceModifier}` : merchant.priceModifier}% pricing
                        </span>
                        <button type="button" className="text-on-surface-variant/50 hover:text-secondary" onClick={() => setExpandedMerchantId((prev) => prev === merchant.id ? null : merchant.id)}>
                          <Icon name={isExpanded ? "expand_less" : "expand_more"} size={18} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              className="text-on-surface-variant/50 hover:text-secondary"
                              onClick={() => {
                                setEditingMerchantId(merchant.id);
                                setMerchantForm({
                                  name: merchant.name,
                                  specialty: merchant.specialty,
                                  region: merchant.region,
                                  priceModifier: merchant.priceModifier,
                                  status: merchant.status,
                                  notes: merchant.notes,
                                });
                              }}
                            >
                              <Icon name="edit" size={18} />
                            </button>
                            <button type="button" className="text-on-surface-variant/50 hover:text-error" onClick={() => submitPartyAction("removeMerchant", { merchantId: merchant.id })}>
                              <Icon name="delete" size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-outline-variant/8 pt-4">
                        {canManage && (
                          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-4">
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_120px]">
                              <Input id={`merchant-item-name-${merchant.id}`} label="Inventory Item" value={merchantItemForm.merchantId === merchant.id ? merchantItemForm.name : ""} onChange={(event) => setMerchantItemForm((prev) => ({ ...prev, merchantId: merchant.id, name: event.target.value }))} placeholder="Potion of Healing" />
                              <Input id={`merchant-item-price-${merchant.id}`} label="Price" value={merchantItemForm.merchantId === merchant.id ? merchantItemForm.price : ""} onChange={(event) => setMerchantItemForm((prev) => ({ ...prev, merchantId: merchant.id, price: event.target.value }))} placeholder="50 gp" />
                              <Input id={`merchant-item-quantity-${merchant.id}`} label="Stock" type="number" min={0} value={merchantItemForm.merchantId === merchant.id ? merchantItemForm.quantity : 1} onChange={(event) => setMerchantItemForm((prev) => ({ ...prev, merchantId: merchant.id, quantity: Math.max(0, Number(event.target.value) || 0) }))} />
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-[160px_160px_minmax(0,1fr)]">
                              <Input id={`merchant-item-category-${merchant.id}`} label="Category" value={merchantItemForm.merchantId === merchant.id ? merchantItemForm.category : "Gear"} onChange={(event) => setMerchantItemForm((prev) => ({ ...prev, merchantId: merchant.id, category: event.target.value }))} />
                              <Input id={`merchant-item-rarity-${merchant.id}`} label="Rarity" value={merchantItemForm.merchantId === merchant.id ? merchantItemForm.rarity : "common"} onChange={(event) => setMerchantItemForm((prev) => ({ ...prev, merchantId: merchant.id, rarity: event.target.value }))} />
                              <Textarea id={`merchant-item-notes-${merchant.id}`} label="Notes" rows={2} value={merchantItemForm.merchantId === merchant.id ? merchantItemForm.notes : ""} onChange={(event) => setMerchantItemForm((prev) => ({ ...prev, merchantId: merchant.id, notes: event.target.value }))} placeholder="Imported from the capital, cursed lot, buyer beware..." />
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              {merchantItemForm.merchantId === merchant.id && merchantItemForm.itemId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setMerchantItemForm({ merchantId: "", itemId: "", name: "", category: "Gear", price: "", quantity: 1, rarity: "common", notes: "" })}
                                >
                                  Cancel
                                </Button>
                              )}
                              <Button
                                size="sm"
                                loading={loadingAction === "saveMerchantInventoryItem"}
                                onClick={async () => {
                                  await submitPartyAction("saveMerchantInventoryItem", merchantItemForm.merchantId === merchant.id ? merchantItemForm : { ...merchantItemForm, merchantId: merchant.id });
                                  setMerchantItemForm({ merchantId: "", itemId: "", name: "", category: "Gear", price: "", quantity: 1, rarity: "common", notes: "" });
                                }}
                              >
                                <Icon name={merchantItemForm.merchantId === merchant.id && merchantItemForm.itemId ? "save" : "playlist_add"} size={16} />
                                {merchantItemForm.merchantId === merchant.id && merchantItemForm.itemId ? "Save Inventory Item" : "Add Inventory Item"}
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          {inventoryItems.length === 0 ? (
                            <EmptyState icon="inventory_2" title="No stock listed" description="Add a merchant inventory to track prices, rarity, and stock." />
                          ) : (
                            inventoryItems.map((item) => (
                              <div key={item.id} className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-body font-semibold text-on-surface">{item.name}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant/60">
                                      {item.category} · {item.rarity} · {item.quantity} in stock · {item.price || "Price TBD"}
                                    </p>
                                    {item.notes && <p className="mt-2 text-sm text-on-surface-variant">{item.notes}</p>}
                                  </div>
                                  {canManage && (
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        className="text-on-surface-variant/50 hover:text-secondary"
                                        onClick={() => setMerchantItemForm({ merchantId: merchant.id, itemId: item.id, name: item.name, category: item.category, price: item.price, quantity: item.quantity, rarity: item.rarity, notes: item.notes })}
                                      >
                                        <Icon name="edit" size={18} />
                                      </button>
                                      <button type="button" className="text-on-surface-variant/50 hover:text-error" onClick={() => submitPartyAction("removeMerchantInventoryItem", { merchantId: merchant.id, itemId: item.id })}>
                                        <Icon name="delete" size={18} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {canManage && inventoryItems.length > 0 && (
                          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-4">
                            <div className="grid gap-3 md:grid-cols-[180px_140px_1fr]">
                              <Select id={`merchant-transaction-item-${merchant.id}`} label="Inventory Item" value={transactionForm.merchantId === merchant.id ? transactionForm.itemId : ""} onChange={(event) => setTransactionForm((prev) => ({ ...prev, merchantId: merchant.id, itemId: event.target.value }))}>
                                <option value="">Select item</option>
                                {inventoryItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                              </Select>
                              <Select id={`merchant-transaction-direction-${merchant.id}`} label="Direction" value={transactionForm.merchantId === merchant.id ? transactionForm.direction : "buy"} onChange={(event) => setTransactionForm((prev) => ({ ...prev, merchantId: merchant.id, direction: event.target.value }))}>
                                <option value="buy">Party buys</option>
                                <option value="sell">Party sells</option>
                              </Select>
                              <Input id={`merchant-transaction-detail-${merchant.id}`} label="Transaction Note" value={transactionForm.merchantId === merchant.id ? transactionForm.detail : ""} onChange={(event) => setTransactionForm((prev) => ({ ...prev, merchantId: merchant.id, detail: event.target.value }))} placeholder="Bought before the siege / sold looted blades..." />
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-[120px_repeat(5,minmax(0,1fr))]">
                              <Input id={`merchant-transaction-quantity-${merchant.id}`} label="Qty" type="number" min={1} value={transactionForm.merchantId === merchant.id ? transactionForm.quantity : 1} onChange={(event) => setTransactionForm((prev) => ({ ...prev, merchantId: merchant.id, quantity: Math.max(1, Number(event.target.value) || 1) }))} />
                              {COIN_KEYS.map((coin) => (
                                <Input key={coin} id={`merchant-transaction-${merchant.id}-${coin}`} label={coin.toUpperCase()} type="number" min={0} value={transactionForm.merchantId === merchant.id ? transactionForm.amounts[coin] : 0} onChange={(event) => setTransactionForm((prev) => ({ ...prev, merchantId: merchant.id, amounts: { ...prev.amounts, [coin]: Math.max(0, Number(event.target.value) || 0) } }))} />
                              ))}
                            </div>
                            {selectedInventory && (
                              <p className="mt-3 text-xs text-on-surface-variant">
                                Selected price reference: {selectedInventory.price || "No listed price"} · current stock {selectedInventory.quantity}
                              </p>
                            )}
                            <div className="mt-3 flex justify-end">
                              <Button
                                size="sm"
                                loading={loadingAction === "logMerchantTransaction"}
                                onClick={async () => {
                                  await submitPartyAction("logMerchantTransaction", transactionForm.merchantId === merchant.id ? transactionForm : { ...transactionForm, merchantId: merchant.id });
                                  setTransactionForm({ merchantId: "", itemId: "", direction: "buy", quantity: 1, detail: "", amounts: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 } });
                                }}
                              >
                                <Icon name="point_of_sale" size={16} />
                                Log Transaction
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="event_upcoming" size={18} className="text-secondary" />
                <h3 className="font-headline text-lg text-on-surface">Scheduling Polls</h3>
              </div>
              <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
                {polls.length} polls
              </span>
            </div>

            {canManage && (
              <div className="mb-4 rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                <Input id="poll-title" label="Poll Title" value={pollForm.title} onChange={(event) => setPollForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Next session date" />
                <div className="mt-3">
                  <Textarea id="poll-description" label="Description" rows={2} value={pollForm.description} onChange={(event) => setPollForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Choose the best time slot for the next session." />
                </div>
                <div className="mt-3">
                  <Textarea id="poll-options" label="Options" rows={3} value={pollForm.optionsText} onChange={(event) => setPollForm((prev) => ({ ...prev, optionsText: event.target.value }))} placeholder={"One option per line\nFri 7pm MST\nSat 1pm MST"} />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    loading={loadingAction === "addSchedulePoll"}
                    onClick={async () => {
                      await submitPartyAction("addSchedulePoll", {
                        title: pollForm.title,
                        description: pollForm.description,
                        options: pollForm.optionsText.split("\n").map((entry) => entry.trim()).filter(Boolean),
                      });
                      setPollForm({ title: "", description: "", optionsText: "" });
                    }}
                  >
                    <Icon name="how_to_vote" size={16} />
                    Create Poll
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {polls.length === 0 ? (
                <EmptyState icon="event_upcoming" title="No schedule polls yet" description="Use polls to coordinate next-session availability and reschedules." />
              ) : (
                polls.map((poll) => (
                  <div key={poll.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-headline text-base text-on-surface">{poll.title}</p>
                        {poll.description && <p className="mt-1 text-sm text-on-surface-variant">{poll.description}</p>}
                        <p className="mt-2 text-xs text-on-surface-variant/70">
                          {poll.createdBy} · {formatDate(poll.createdAt)} · {poll.status}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-1">
                          <button type="button" className="text-on-surface-variant/50 hover:text-secondary" onClick={() => submitPartyAction("closeSchedulePoll", { pollId: poll.id })}>
                            <Icon name={poll.status === "closed" ? "lock_open" : "lock"} size={18} />
                          </button>
                          <button type="button" className="text-on-surface-variant/50 hover:text-error" onClick={() => submitPartyAction("removeSchedulePoll", { pollId: poll.id })}>
                            <Icon name="delete" size={18} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {poll.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={!canContributePlans || poll.status !== "open"}
                          className="flex w-full items-center justify-between rounded-sm border border-outline-variant/8 bg-surface-container-low px-3 py-2 text-left transition-colors hover:border-secondary/20 disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={() => submitPartyAction("voteSchedulePoll", { pollId: poll.id, optionId: option.id })}
                        >
                          <span className="text-sm text-on-surface">{option.label}</span>
                          <span className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-secondary">
                            {option.votes.length} vote{option.votes.length === 1 ? "" : "s"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="receipt_long" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Economy Log</h3>
            </div>
            {economyEntries.length === 0 ? (
              <EmptyState icon="receipt_long" title="No economy activity yet" description="Treasury updates, merchant transactions, and player trades will accumulate here." />
            ) : (
              <div className="space-y-3">
                {economyEntries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body font-semibold text-on-surface">{entry.title}</p>
                        {entry.detail && <p className="mt-1 text-sm text-on-surface-variant">{entry.detail}</p>}
                        <p className="mt-2 text-xs text-on-surface-variant/70">
                          {entry.createdBy} · {formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${entry.direction === "earned" ? "bg-green-900/20 text-green-400" : entry.direction === "shared" ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
                        {entry.direction}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {COIN_KEYS.filter((coin) => entry.amounts[coin] > 0).map((coin) => `${entry.amounts[coin]} ${coin}`).join(" · ") || "No currency recorded"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
