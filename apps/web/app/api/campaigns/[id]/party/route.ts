import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

type CoinKey = "cp" | "sp" | "ep" | "gp" | "pp";

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

function normalizeAmounts(value: unknown): Record<CoinKey, number> {
  const source = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  return COIN_KEYS.reduce(
    (acc, coin) => ({
      ...acc,
      [coin]: Math.max(0, Number(source[coin] ?? 0)),
    }),
    { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
  );
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeSharedPlans(value: unknown): SharedPlan[] {
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
        id: String(item.id || crypto.randomUUID()),
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
      const inventory = toArray<unknown>(item.inventory)
        .map((inventoryEntry) => {
          if (!inventoryEntry || typeof inventoryEntry !== "object") return null;
          const record = inventoryEntry as Record<string, unknown>;
          const itemName = String(record.name || "").trim();
          if (!itemName) return null;
          return {
            id: String(record.id || crypto.randomUUID()),
            name: itemName,
            category: String(record.category || "Gear").trim() || "Gear",
            price: String(record.price || "").trim(),
            quantity: Math.max(0, Number(record.quantity ?? 0) || 0),
            rarity: String(record.rarity || "common").trim() || "common",
            notes: String(record.notes || "").trim(),
          } satisfies MerchantInventoryItem;
        })
        .filter((inventoryEntry): inventoryEntry is MerchantInventoryItem => Boolean(inventoryEntry));

      return {
        id: String(item.id || crypto.randomUUID()),
        name,
        specialty: String(item.specialty || "").trim(),
        region: String(item.region || "").trim(),
        priceModifier: Number(item.priceModifier ?? 0) || 0,
        status: item.status === "limited" || item.status === "closed" ? item.status : "open",
        notes: String(item.notes || "").trim(),
        inventory,
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
        amounts: normalizeAmounts(item.amounts),
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
      const options = toArray<unknown>(item.options)
        .map((option) => {
          if (!option || typeof option !== "object") return null;
          const optionRecord = option as Record<string, unknown>;
          const label = String(optionRecord.label || "").trim();
          if (!label) return null;
          return {
            id: String(optionRecord.id || crypto.randomUUID()),
            label,
            votes: toArray<unknown>(optionRecord.votes).map((vote) => String(vote)).filter(Boolean),
          } satisfies SchedulePollOption;
        })
        .filter((option): option is SchedulePollOption => Boolean(option));

      return {
        id: String(item.id || crypto.randomUUID()),
        title,
        description: String(item.description || "").trim(),
        status: item.status === "closed" ? "closed" : "open",
        createdAt: String(item.createdAt || new Date(0).toISOString()),
        createdBy: String(item.createdBy || "Unknown"),
        options,
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);

  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!access.isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      partyTreasury: true,
      treasuryLedger: true,
      partyStash: true,
      craftingProjects: true,
      announcements: true,
      merchants: true,
      economyLog: true,
      schedulePolls: true,
      campaignMessages: true,
      handouts: true,
      sharedPlans: true,
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  const currentTreasury = toTreasury(campaign.partyTreasury);
  const currentLedger = toArray<TreasuryEntry>(campaign.treasuryLedger);
  const currentStash = toArray<PartyStashItem>(campaign.partyStash);
  const currentCraftingProjects = normalizeCraftingProjects(campaign.craftingProjects);
  const currentAnnouncements = toArray<Announcement>(campaign.announcements);
  const currentMerchants = normalizeMerchants(campaign.merchants);
  const currentEconomyLog = normalizeEconomyLog(campaign.economyLog);
  const currentSchedulePolls = normalizeSchedulePolls(campaign.schedulePolls);
  const currentMessages = normalizeCampaignMessages(campaign.campaignMessages);
  const currentHandouts = normalizeHandouts(campaign.handouts);
  const currentPlans = normalizeSharedPlans(campaign.sharedPlans);

  if (action === "addTreasuryEntry") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage treasury" }, { status: 403 });
    }

    const note = String(body.note || "").trim();
    const direction = body.direction === "withdraw" ? "withdraw" : "deposit";
    const amounts = normalizeAmounts(body.amounts);
    const hasValue = COIN_KEYS.some((coin) => amounts[coin] > 0);

    if (!note || !hasValue) {
      return NextResponse.json({ error: "A note and at least one coin amount are required" }, { status: 400 });
    }

    const nextTreasury = { ...currentTreasury };
    for (const coin of COIN_KEYS) {
      const delta = direction === "withdraw" ? -amounts[coin] : amounts[coin];
      nextTreasury[coin] += delta;
      if (nextTreasury[coin] < 0) {
        return NextResponse.json({ error: "Treasury cannot go below zero" }, { status: 400 });
      }
    }

    const nextEntry: TreasuryEntry = {
      id: crypto.randomUUID(),
      note,
      direction,
      amounts,
      createdAt: new Date().toISOString(),
      createdBy: session.user.name || session.user.email || "Unknown",
    };

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        partyTreasury: nextTreasury,
        treasuryLedger: [nextEntry, ...currentLedger].slice(0, 40) as unknown as Prisma.InputJsonValue,
        economyLog: [
          {
            id: crypto.randomUUID(),
            type: "treasury",
            direction: direction === "deposit" ? "earned" : "spent",
            title: note,
            detail: "Party treasury updated.",
            amounts,
            createdAt: new Date().toISOString(),
            createdBy: session.user.name || session.user.email || "Unknown",
          },
          ...currentEconomyLog,
        ].slice(0, 80) as unknown as Prisma.InputJsonValue,
      },
      select: {
        partyTreasury: true,
        treasuryLedger: true,
        economyLog: true,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "addStashItem") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage the shared stash" }, { status: 403 });
    }

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const nextItem: PartyStashItem = {
      id: crypto.randomUUID(),
      name,
      category: String(body.category || "Gear").trim() || "Gear",
      quantity: Math.max(1, Number(body.quantity) || 1),
      notes: String(body.notes || "").trim(),
      assignedTo: String(body.assignedTo || "").trim(),
      imageUrl: typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null,
      createdAt: new Date().toISOString(),
    };

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        partyStash: [nextItem, ...currentStash] as unknown as Prisma.InputJsonValue,
      },
      select: {
        partyStash: true,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "updateStashItem") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage the shared stash" }, { status: 403 });
    }

    const itemId = String(body.itemId || "");
    const nextStash = currentStash.map((item) =>
      item.id === itemId
        ? {
            ...item,
            name: String(body.name ?? item.name).trim() || item.name,
            category: String(body.category ?? item.category).trim() || item.category,
            quantity: Math.max(1, Number(body.quantity ?? item.quantity) || item.quantity),
            notes: String(body.notes ?? item.notes).trim(),
            assignedTo: String(body.assignedTo ?? item.assignedTo).trim(),
            imageUrl:
              typeof body.imageUrl === "string"
                ? body.imageUrl.trim() || null
                : item.imageUrl,
          }
        : item
    );

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        partyStash: nextStash as unknown as Prisma.InputJsonValue,
      },
      select: {
        partyStash: true,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "removeStashItem") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage the shared stash" }, { status: 403 });
    }

    const itemId = String(body.itemId || "");
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        partyStash: currentStash.filter((item) => item.id !== itemId) as unknown as Prisma.InputJsonValue,
      },
      select: {
        partyStash: true,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "addCraftingProject" || action === "updateCraftingProject") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage crafting projects" }, { status: 403 });
    }

    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    const projectId = String(body.projectId || "");
    const existingProject = currentCraftingProjects.find((project) => project.id === projectId);
    const nextProject: CraftingProject = {
      id: existingProject?.id || crypto.randomUUID(),
      title,
      category: String(body.category || "Crafting").trim() || "Crafting",
      assignee: String(body.assignee || "").trim(),
      status:
        body.status === "in_progress" || body.status === "blocked" || body.status === "complete"
          ? body.status
          : "planned",
      progress: Math.max(0, Math.min(100, Number(body.progress ?? 0) || 0)),
      materials: toArray<unknown>(body.materials).map((material) => String(material).trim()).filter(Boolean),
      reward: String(body.reward || "").trim(),
      dueDate: String(body.dueDate || "").trim(),
      notes: String(body.notes || "").trim(),
      createdAt: existingProject?.createdAt || new Date().toISOString(),
    };

    const nextProjects =
      existingProject
        ? currentCraftingProjects.map((project) => (project.id === existingProject.id ? nextProject : project))
        : [nextProject, ...currentCraftingProjects];

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        craftingProjects: nextProjects.slice(0, 40) as unknown as Prisma.InputJsonValue,
      },
      select: { craftingProjects: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "removeCraftingProject") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage crafting projects" }, { status: 403 });
    }

    const projectId = String(body.projectId || "");
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        craftingProjects: currentCraftingProjects.filter((project) => project.id !== projectId) as unknown as Prisma.InputJsonValue,
      },
      select: { craftingProjects: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "addAnnouncement") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to post announcements" }, { status: 403 });
    }

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    if (!title || !content) {
      return NextResponse.json({ error: "Announcement title and content are required" }, { status: 400 });
    }

    const nextAnnouncement: Announcement = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: new Date().toISOString(),
      createdBy: session.user.name || session.user.email || "Unknown",
    };

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        announcements: [nextAnnouncement, ...currentAnnouncements].slice(0, 20) as unknown as Prisma.InputJsonValue,
      },
      select: {
        announcements: true,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "removeAnnouncement") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage announcements" }, { status: 403 });
    }

    const announcementId = String(body.announcementId || "");
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        announcements: currentAnnouncements.filter((item) => item.id !== announcementId) as unknown as Prisma.InputJsonValue,
      },
      select: {
        announcements: true,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "addCampaignMessage") {
    if (!access.canPlayAsCharacter) {
      return NextResponse.json({ error: "Spectators cannot post messages" }, { status: 403 });
    }

    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const nextMessage: CampaignMessage = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      createdBy: session.user.name || session.user.email || "Unknown",
      createdById: session.user.id,
    };

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        campaignMessages: [nextMessage, ...currentMessages].slice(0, 80) as unknown as Prisma.InputJsonValue,
      },
      select: { campaignMessages: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "removeCampaignMessage") {
    const messageId = String(body.messageId || "");
    const target = currentMessages.find((message) => message.id === messageId);
    if (!target) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (!access.canManageCampaign && target.createdById !== session.user.id) {
      return NextResponse.json({ error: "Not allowed to remove this message" }, { status: 403 });
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        campaignMessages: currentMessages.filter((message) => message.id !== messageId) as unknown as Prisma.InputJsonValue,
      },
      select: { campaignMessages: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "addHandout" || action === "updateHandout") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage handouts" }, { status: 403 });
    }

    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Handout title is required" }, { status: 400 });
    }

    const handoutId = String(body.handoutId || "");
    const existingHandout = currentHandouts.find((handout) => handout.id === handoutId);
    const nextHandout: CampaignHandout = {
      id: action === "updateHandout" && handoutId ? handoutId : crypto.randomUUID(),
      title,
      content: String(body.content || "").trim(),
      type: String(body.type || "note").trim() || "note",
      imageUrl: typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null,
      visibility: body.visibility === "dm" ? "dm" : "public",
      isPinned: Boolean(body.isPinned),
      createdAt: existingHandout?.createdAt || new Date().toISOString(),
      createdBy: existingHandout?.createdBy || session.user.name || session.user.email || "Unknown",
    };

    const nextHandouts =
      action === "updateHandout" && handoutId
        ? currentHandouts.map((handout) => (handout.id === handoutId ? nextHandout : handout))
        : [nextHandout, ...currentHandouts];

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        handouts: nextHandouts.slice(0, 60) as unknown as Prisma.InputJsonValue,
      },
      select: { handouts: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "removeHandout") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage handouts" }, { status: 403 });
    }

    const handoutId = String(body.handoutId || "");
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        handouts: currentHandouts.filter((handout) => handout.id !== handoutId) as unknown as Prisma.InputJsonValue,
      },
      select: { handouts: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "addMerchant" || action === "updateMerchant") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage merchants" }, { status: 403 });
    }

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Merchant name is required" }, { status: 400 });
    }

    const nextMerchant: MerchantRecord = {
      id: action === "updateMerchant" ? String(body.merchantId || "") : crypto.randomUUID(),
      name,
      specialty: String(body.specialty || "").trim(),
      region: String(body.region || "").trim(),
      priceModifier: Number(body.priceModifier ?? 0) || 0,
      status: body.status === "limited" || body.status === "closed" ? body.status : "open",
      notes: String(body.notes || "").trim(),
      inventory:
        action === "updateMerchant"
          ? currentMerchants.find((merchant) => merchant.id === String(body.merchantId || ""))?.inventory || []
          : [],
      createdAt:
        action === "updateMerchant"
          ? currentMerchants.find((merchant) => merchant.id === String(body.merchantId || ""))?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
    };

    const nextMerchants =
      action === "updateMerchant"
        ? currentMerchants.map((merchant) => (merchant.id === nextMerchant.id ? nextMerchant : merchant))
        : [nextMerchant, ...currentMerchants];

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        merchants: nextMerchants as unknown as Prisma.InputJsonValue,
      },
      select: { merchants: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "removeMerchant") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage merchants" }, { status: 403 });
    }

    const merchantId = String(body.merchantId || "");
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        merchants: currentMerchants.filter((merchant) => merchant.id !== merchantId) as unknown as Prisma.InputJsonValue,
      },
      select: { merchants: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "saveMerchantInventoryItem") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage merchants" }, { status: 403 });
    }

    const merchantId = String(body.merchantId || "");
    const merchant = currentMerchants.find((entry) => entry.id === merchantId);
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Inventory item name is required" }, { status: 400 });
    }

    const itemId = String(body.itemId || "").trim();
    const nextItem: MerchantInventoryItem = {
      id: itemId || crypto.randomUUID(),
      name,
      category: String(body.category || "Gear").trim() || "Gear",
      price: String(body.price || "").trim(),
      quantity: Math.max(0, Number(body.quantity ?? 0) || 0),
      rarity: String(body.rarity || "common").trim() || "common",
      notes: String(body.notes || "").trim(),
    };

    const nextMerchants = currentMerchants.map((entry) =>
      entry.id !== merchantId
        ? entry
        : {
            ...entry,
            inventory: itemId
              ? entry.inventory.map((inventoryItem) => (inventoryItem.id === itemId ? nextItem : inventoryItem))
              : [nextItem, ...entry.inventory],
          }
    );

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        merchants: nextMerchants as unknown as Prisma.InputJsonValue,
      },
      select: { merchants: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "removeMerchantInventoryItem") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage merchants" }, { status: 403 });
    }

    const merchantId = String(body.merchantId || "");
    const itemId = String(body.itemId || "");
    const nextMerchants = currentMerchants.map((entry) =>
      entry.id !== merchantId
        ? entry
        : {
            ...entry,
            inventory: entry.inventory.filter((inventoryItem) => inventoryItem.id !== itemId),
          }
    );

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        merchants: nextMerchants as unknown as Prisma.InputJsonValue,
      },
      select: { merchants: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "logMerchantTransaction") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage merchant transactions" }, { status: 403 });
    }

    const merchantId = String(body.merchantId || "");
    const merchant = currentMerchants.find((entry) => entry.id === merchantId);
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const direction = body.direction === "sell" ? "sell" : "buy";
    const itemId = String(body.itemId || "");
    const item = merchant.inventory.find((inventoryItem) => inventoryItem.id === itemId);
    const quantity = Math.max(1, Number(body.quantity ?? 1) || 1);
    const amounts = normalizeAmounts(body.amounts);
    const detail = String(body.detail || "").trim();
    const hasValue = COIN_KEYS.some((coin) => amounts[coin] > 0);

    if (!item || !hasValue) {
      return NextResponse.json({ error: "Select a merchant item and record a currency amount" }, { status: 400 });
    }
    if (direction === "buy" && item.quantity < quantity) {
      return NextResponse.json({ error: "Merchant does not have enough stock" }, { status: 400 });
    }

    const nextTreasury = { ...currentTreasury };
    for (const coin of COIN_KEYS) {
      nextTreasury[coin] += direction === "buy" ? -amounts[coin] : amounts[coin];
      if (nextTreasury[coin] < 0) {
        return NextResponse.json({ error: "Treasury cannot go below zero" }, { status: 400 });
      }
    }

    const nextMerchants = currentMerchants.map((entry) =>
      entry.id !== merchantId || !item
        ? entry
        : {
            ...entry,
            inventory: entry.inventory.map((inventoryItem) =>
              inventoryItem.id !== itemId
                ? inventoryItem
                : {
                    ...inventoryItem,
                    quantity: Math.max(0, inventoryItem.quantity + (direction === "buy" ? -quantity : quantity)),
                  }
            ),
          }
    );

    const logEntry: EconomyLogEntry = {
      id: crypto.randomUUID(),
      type: "merchant",
      direction: direction === "buy" ? "spent" : "earned",
      title: `${direction === "buy" ? "Bought" : "Sold"} ${item?.name || "item"} ${direction === "buy" ? "from" : "to"} ${merchant.name}`,
      detail: detail || `${quantity} item(s) ${direction === "buy" ? "purchased" : "sold"} through merchant inventory.`,
      amounts,
      createdAt: new Date().toISOString(),
      createdBy: session.user.name || session.user.email || "Unknown",
    };

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        merchants: nextMerchants as unknown as Prisma.InputJsonValue,
        partyTreasury: nextTreasury,
        economyLog: [logEntry, ...currentEconomyLog].slice(0, 80) as unknown as Prisma.InputJsonValue,
      },
      select: { merchants: true, partyTreasury: true, economyLog: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "addSchedulePoll") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage scheduling" }, { status: 403 });
    }

    const title = String(body.title || "").trim();
    const options = toArray<unknown>(body.options)
      .map((option) => String(option).trim())
      .filter(Boolean);
    if (!title || options.length < 2) {
      return NextResponse.json({ error: "A title and at least two options are required" }, { status: 400 });
    }

    const nextPoll: SchedulePoll = {
      id: crypto.randomUUID(),
      title,
      description: String(body.description || "").trim(),
      status: "open",
      createdAt: new Date().toISOString(),
      createdBy: session.user.name || session.user.email || "Unknown",
      options: options.map((option) => ({ id: crypto.randomUUID(), label: option, votes: [] })),
    };

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        schedulePolls: [nextPoll, ...currentSchedulePolls].slice(0, 12) as unknown as Prisma.InputJsonValue,
      },
      select: { schedulePolls: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "voteSchedulePoll") {
    if (!access.canPlayAsCharacter) {
      return NextResponse.json({ error: "Spectators cannot vote in schedule polls" }, { status: 403 });
    }

    const pollId = String(body.pollId || "");
    const optionId = String(body.optionId || "");
    const voterId = session.user.id;

    const nextPolls = currentSchedulePolls.map((poll) =>
      poll.id !== pollId || poll.status !== "open"
        ? poll
        : {
            ...poll,
            options: poll.options.map((option) => ({
              ...option,
              votes:
                option.id === optionId
                  ? Array.from(new Set([...option.votes.filter((vote) => vote !== voterId), voterId]))
                  : option.votes.filter((vote) => vote !== voterId),
            })),
          }
    );

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        schedulePolls: nextPolls as unknown as Prisma.InputJsonValue,
      },
      select: { schedulePolls: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "closeSchedulePoll" || action === "removeSchedulePoll") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Not allowed to manage scheduling" }, { status: 403 });
    }

    const pollId = String(body.pollId || "");
    const nextPolls =
      action === "removeSchedulePoll"
        ? currentSchedulePolls.filter((poll) => poll.id !== pollId)
        : currentSchedulePolls.map((poll) =>
            poll.id === pollId
              ? {
                  ...poll,
                  status: poll.status === "closed" ? "open" : "closed",
                }
              : poll
          );

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        schedulePolls: nextPolls as unknown as Prisma.InputJsonValue,
      },
      select: { schedulePolls: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "addSharedPlan") {
    if (!access.canPlayAsCharacter) {
      return NextResponse.json({ error: "Spectators cannot edit the shared plan board" }, { status: 403 });
    }

    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Plan text is required" }, { status: 400 });
    }

    const nextPlan: SharedPlan = {
      id: crypto.randomUUID(),
      text,
      status: "open",
      author: session.user.name || session.user.email || "Unknown",
      createdAt: new Date().toISOString(),
    };

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sharedPlans: [nextPlan, ...currentPlans].slice(0, 30) as unknown as Prisma.InputJsonValue,
      },
      select: {
        sharedPlans: true,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "toggleSharedPlan") {
    if (!access.canPlayAsCharacter) {
      return NextResponse.json({ error: "Spectators cannot edit the shared plan board" }, { status: 403 });
    }

    const planId = String(body.planId || "");
    const nextPlans = currentPlans.map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            status: plan.status === "done" ? "open" : "done",
          }
        : plan
    );

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sharedPlans: nextPlans as unknown as Prisma.InputJsonValue,
      },
      select: {
        sharedPlans: true,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "removeSharedPlan") {
    if (!access.canManageCampaign) {
      return NextResponse.json({ error: "Only the DM team can clear shared plans" }, { status: 403 });
    }

    const planId = String(body.planId || "");
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sharedPlans: currentPlans.filter((plan) => plan.id !== planId) as unknown as Prisma.InputJsonValue,
      },
      select: {
        sharedPlans: true,
      },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
