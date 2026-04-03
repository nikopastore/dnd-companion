import { Prisma, prisma } from "@dnd-companion/database";
import { generateInviteCode } from "@/lib/utils";

type JsonRecord = Record<string, unknown>;

interface SnapshotCampaignData {
  campaign: JsonRecord;
  related: {
    npcs: JsonRecord[];
    sessionItems: JsonRecord[];
    gameSessions: JsonRecord[];
    locations: JsonRecord[];
    quests: JsonRecord[];
    encounters: JsonRecord[];
    campaignNotes: JsonRecord[];
  };
}

interface StoredBackupEntry {
  id: string;
  label: string;
  createdAt: string;
  createdBy: string;
  snapshot: SnapshotCampaignData;
}

const CAMPAIGN_FIELD_NAMES = [
  "name",
  "description",
  "status",
  "system",
  "edition",
  "setting",
  "tone",
  "onboardingMode",
  "worldName",
  "worldSummary",
  "houseRules",
  "worldCanon",
  "playerCanon",
  "rumors",
  "factions",
  "factionDirectory",
  "storyThreads",
  "scheduledEvents",
  "worldRegions",
  "loreEntries",
  "historicalEvents",
  "calendarState",
  "threatClocks",
  "unresolvedMysteries",
  "partyTreasury",
  "treasuryLedger",
  "partyStash",
  "craftingProjects",
  "announcements",
  "merchants",
  "economyLog",
  "schedulePolls",
  "campaignMessages",
  "handouts",
  "groupReputation",
  "groupRenown",
  "stronghold",
  "sharedPlans",
  "sessionZero",
  "accessibilityOptions",
] as const;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toNullableJsonInput(value: unknown) {
  return value == null ? undefined : (value as Prisma.InputJsonValue);
}

function pickCampaignFields(campaign: JsonRecord) {
  return Object.fromEntries(
    CAMPAIGN_FIELD_NAMES.map((field) => [field, campaign[field]])
  ) as JsonRecord;
}

function sortLocationsByDepth(locations: JsonRecord[]) {
  const byId = new Map(locations.map((location) => [String(location.id), location]));
  const getDepth = (location: JsonRecord): number => {
    let depth = 0;
    let currentParentId = typeof location.parentId === "string" ? location.parentId : null;
    const visited = new Set<string>();

    while (currentParentId && byId.has(currentParentId) && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      depth += 1;
      const parent = byId.get(currentParentId)!;
      currentParentId = typeof parent.parentId === "string" ? parent.parentId : null;
    }

    return depth;
  };

  return [...locations].sort((a, b) => getDepth(a) - getDepth(b));
}

function normalizeBackups(value: unknown): StoredBackupEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      if (!item.snapshot || typeof item.snapshot !== "object") return null;

      return {
        id: String(item.id || crypto.randomUUID()),
        label: String(item.label || "Backup").trim() || "Backup",
        createdAt: String(item.createdAt || new Date(0).toISOString()),
        createdBy: String(item.createdBy || "Unknown"),
        snapshot: cloneJson(item.snapshot as SnapshotCampaignData),
      } satisfies StoredBackupEntry;
    })
    .filter((entry): entry is StoredBackupEntry => Boolean(entry));
}

export function normalizeStoredBackups(value: unknown) {
  return normalizeBackups(value);
}

export async function buildCampaignSnapshot(campaignId: string): Promise<SnapshotCampaignData | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      npcs: { orderBy: { createdAt: "asc" } },
      sessionItems: { orderBy: { createdAt: "asc" } },
      gameSessions: { orderBy: { number: "asc" } },
      locations: { orderBy: { createdAt: "asc" } },
      quests: { orderBy: { createdAt: "asc" } },
      encounters: { orderBy: { createdAt: "asc" } },
      campaignNotes: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!campaign) {
    return null;
  }

  const snapshot = {
    campaign: pickCampaignFields(campaign as unknown as JsonRecord),
    related: {
      npcs: campaign.npcs.map((entry) => cloneJson(entry as unknown as JsonRecord)),
      sessionItems: campaign.sessionItems.map((entry) => cloneJson(entry as unknown as JsonRecord)),
      gameSessions: campaign.gameSessions.map((entry) => cloneJson(entry as unknown as JsonRecord)),
      locations: campaign.locations.map((entry) => cloneJson(entry as unknown as JsonRecord)),
      quests: campaign.quests.map((entry) => cloneJson(entry as unknown as JsonRecord)),
      encounters: campaign.encounters.map((entry) => cloneJson(entry as unknown as JsonRecord)),
      campaignNotes: campaign.campaignNotes.map((entry) => cloneJson(entry as unknown as JsonRecord)),
    },
  } satisfies SnapshotCampaignData;

  return cloneJson(snapshot);
}

async function nextInviteCode() {
  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const existing = await prisma.campaign.findUnique({ where: { inviteCode } });
    if (!existing) {
      return inviteCode;
    }
    inviteCode = generateInviteCode();
  }
  return `${generateInviteCode().slice(0, 5)}${Date.now().toString().slice(-1)}`;
}

async function recreateRelatedContent(
  tx: Prisma.TransactionClient,
  campaignId: string,
  snapshot: SnapshotCampaignData
) {
  const npcIdMap = new Map<string, string>();

  for (const npc of snapshot.related.npcs) {
    const created = await tx.nPC.create({
      data: {
        name: String(npc.name || "NPC"),
        imageUrl: typeof npc.imageUrl === "string" ? npc.imageUrl : null,
        description: typeof npc.description === "string" ? npc.description : null,
        statBlock: toNullableJsonInput(npc.statBlock),
        isEnemy: Boolean(npc.isEnemy),
        notes: typeof npc.notes === "string" ? npc.notes : null,
        race: typeof npc.race === "string" ? npc.race : null,
        npcClass: typeof npc.npcClass === "string" ? npc.npcClass : null,
        alignment: typeof npc.alignment === "string" ? npc.alignment : null,
        personality: typeof npc.personality === "string" ? npc.personality : null,
        appearance: typeof npc.appearance === "string" ? npc.appearance : null,
        voice: typeof npc.voice === "string" ? npc.voice : null,
        faction: typeof npc.faction === "string" ? npc.faction : null,
        locationName: typeof npc.locationName === "string" ? npc.locationName : null,
        relationship: typeof npc.relationship === "string" ? npc.relationship : null,
        isAlive: npc.isAlive !== false,
        cr: typeof npc.cr === "string" ? npc.cr : null,
        campaignId,
      },
    });
    if (typeof npc.id === "string") {
      npcIdMap.set(npc.id, created.id);
    }
  }

  for (const item of snapshot.related.sessionItems) {
    await tx.sessionItem.create({
      data: {
        name: String(item.name || "Item"),
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
        category: typeof item.category === "string" ? item.category : null,
        description: typeof item.description === "string" ? item.description : null,
        quantity: Math.max(0, Number(item.quantity ?? 1) || 1),
        location: typeof item.location === "string" ? item.location : null,
        isHidden: item.isHidden !== false,
        claimedById: typeof item.claimedById === "string" ? item.claimedById : null,
        rarity: typeof item.rarity === "string" ? item.rarity : null,
        value: typeof item.value === "string" ? item.value : null,
        campaignId,
      },
    });
  }

  for (const session of snapshot.related.gameSessions) {
    await tx.gameSession.create({
      data: {
        number: Math.max(1, Number(session.number ?? 1) || 1),
        title: typeof session.title === "string" ? session.title : null,
        date: typeof session.date === "string" && session.date ? new Date(session.date) : null,
        status:
          session.status === "IN_PROGRESS" || session.status === "COMPLETED" ? session.status : "PLANNED",
        strongStart: typeof session.strongStart === "string" ? session.strongStart : null,
        objectives: toNullableJsonInput(session.objectives),
        scenes: toNullableJsonInput(session.scenes),
        secretsAndClues: toNullableJsonInput(session.secretsAndClues),
        summary: typeof session.summary === "string" ? session.summary : null,
        notes: typeof session.notes === "string" ? session.notes : null,
        publicRecap: typeof session.publicRecap === "string" ? session.publicRecap : null,
        dmRecap: typeof session.dmRecap === "string" ? session.dmRecap : null,
        pacingNotes: typeof session.pacingNotes === "string" ? session.pacingNotes : null,
        attendance: toNullableJsonInput(session.attendance),
        preparedChecklist: toNullableJsonInput(session.preparedChecklist),
        liveNotes: toNullableJsonInput(session.liveNotes),
        campaignId,
      },
    });
  }

  const locationIdMap = new Map<string, string>();
  for (const location of sortLocationsByDepth(snapshot.related.locations)) {
    const oldParentId = typeof location.parentId === "string" ? location.parentId : null;
    const created = await tx.location.create({
      data: {
        name: String(location.name || "Location"),
        imageUrl: typeof location.imageUrl === "string" ? location.imageUrl : null,
        type: typeof location.type === "string" ? location.type : "location",
        description: typeof location.description === "string" ? location.description : null,
        notes: typeof location.notes === "string" ? location.notes : null,
        parentId: oldParentId ? locationIdMap.get(oldParentId) ?? null : null,
        campaignId,
      },
    });

    if (typeof location.id === "string") {
      locationIdMap.set(location.id, created.id);
    }
  }

  for (const quest of snapshot.related.quests) {
    const originalNpcId = typeof quest.giverNpcId === "string" ? quest.giverNpcId : null;
    await tx.quest.create({
      data: {
        title: String(quest.title || "Quest"),
        imageUrl: typeof quest.imageUrl === "string" ? quest.imageUrl : null,
        description: typeof quest.description === "string" ? quest.description : null,
        status:
          quest.status === "COMPLETED" || quest.status === "FAILED" || quest.status === "ON_HOLD"
            ? quest.status
            : "ACTIVE",
        priority: typeof quest.priority === "string" ? quest.priority : "normal",
        notes: typeof quest.notes === "string" ? quest.notes : null,
        giverNpcId: originalNpcId ? npcIdMap.get(originalNpcId) ?? originalNpcId : null,
        campaignId,
      },
    });
  }

  for (const encounter of snapshot.related.encounters) {
    await tx.encounter.create({
      data: {
        name: String(encounter.name || "Encounter"),
        imageUrl: typeof encounter.imageUrl === "string" ? encounter.imageUrl : null,
        description: typeof encounter.description === "string" ? encounter.description : null,
        difficulty: typeof encounter.difficulty === "string" ? encounter.difficulty : null,
        monsters: (encounter.monsters ?? []) as Prisma.InputJsonValue,
        loot: toNullableJsonInput(encounter.loot),
        liveState: toNullableJsonInput(encounter.liveState),
        notes: typeof encounter.notes === "string" ? encounter.notes : null,
        status: typeof encounter.status === "string" ? encounter.status : "prepared",
        campaignId,
      },
    });
  }

  for (const note of snapshot.related.campaignNotes) {
    await tx.campaignNote.create({
      data: {
        title: String(note.title || "Note"),
        content: typeof note.content === "string" ? note.content : "",
        category: typeof note.category === "string" ? note.category : "general",
        isPinned: Boolean(note.isPinned),
        campaignId,
      },
    });
  }
}

export async function createBackupEntry(campaignId: string, createdBy: string, label?: string) {
  const snapshot = await buildCampaignSnapshot(campaignId);
  if (!snapshot) return null;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { backups: true },
  });

  const backups = normalizeBackups(campaign?.backups);
  const nextEntry: StoredBackupEntry = {
    id: crypto.randomUUID(),
    label: label?.trim() || `Manual backup ${new Date().toLocaleString("en-US")}`,
    createdAt: new Date().toISOString(),
    createdBy,
    snapshot,
  };

  const nextBackups = [nextEntry, ...backups].slice(0, 12);

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      backups: nextBackups as unknown as Prisma.InputJsonValue,
    },
  });

  return nextEntry;
}

export async function removeBackupEntry(campaignId: string, backupId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { backups: true },
  });
  const backups = normalizeBackups(campaign?.backups).filter((entry) => entry.id !== backupId);
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { backups: backups as unknown as Prisma.InputJsonValue },
  });
}

export async function restoreBackupEntry(campaignId: string, backupId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { backups: true },
  });
  const backups = normalizeBackups(campaign?.backups);
  const target = backups.find((entry) => entry.id === backupId);
  if (!target) {
    return null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        ...(cloneJson(target.snapshot.campaign) as Prisma.CampaignUpdateInput),
      },
    });

    await tx.campaignNote.deleteMany({ where: { campaignId } });
    await tx.encounter.deleteMany({ where: { campaignId } });
    await tx.quest.deleteMany({ where: { campaignId } });
    await tx.location.deleteMany({ where: { campaignId } });
    await tx.gameSession.deleteMany({ where: { campaignId } });
    await tx.sessionItem.deleteMany({ where: { campaignId } });
    await tx.nPC.deleteMany({ where: { campaignId } });

    await recreateRelatedContent(tx, campaignId, target.snapshot);
  });

  return target;
}

export async function duplicateCampaignFromSnapshot(
  snapshot: SnapshotCampaignData,
  ownerUserId: string,
  nameOverride?: string
) {
  const inviteCode = await nextInviteCode();

  return prisma.$transaction(async (tx) => {
    const duplicated = await tx.campaign.create({
      data: {
        ...(cloneJson(snapshot.campaign) as Prisma.CampaignUncheckedCreateInput),
        name: nameOverride?.trim() || `${String(snapshot.campaign.name || "Campaign")} Sandbox`,
        status: "LOBBY",
        inviteCode,
        dmId: ownerUserId,
        backups: [] as Prisma.InputJsonValue,
        members: {
          create: {
            userId: ownerUserId,
            role: "DM",
          },
        },
      },
      select: { id: true, name: true, inviteCode: true },
    });

    await recreateRelatedContent(tx, duplicated.id, snapshot);
    return duplicated;
  });
}
