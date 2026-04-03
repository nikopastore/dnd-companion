import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";
import {
  filterPublicFactionDirectory,
  filterPublicHistoricalEvents,
  filterPublicLoreEntries,
  filterPublicWorldRegions,
  parseFactionDirectory,
  parseHistoricalEvents,
  parseLoreEntries,
  parseWorldRegions,
} from "@/lib/worldbuilding";

function toSnippet(value: string | Date | null | undefined) {
  if (!value) return "";
  const text = value instanceof Date ? value.toISOString() : value;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function normalizeMysteries(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((entry, index) => {
          if (typeof entry === "string") {
            return { id: `mystery-${index}`, title: entry, notes: "" };
          }
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Record<string, unknown>;
          const title = String(item.title || item.name || "").trim();
          if (!title) return null;
          return {
            id: String(item.id || `mystery-${index}`),
            title,
            notes: String(item.notes || item.summary || "").trim(),
          };
        })
        .filter((entry): entry is { id: string; title: string; notes: string } => Boolean(entry))
    : [];
}

function normalizeSchedulePolls(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Record<string, unknown>;
          const title = String(item.title || "").trim();
          if (!title) return null;
          const options = Array.isArray(item.options) ? item.options : [];
          return {
            id: String(item.id || `poll-${index}`),
            title,
            status: item.status === "closed" ? "closed" : "open",
            votes: options.reduce((count, option) => {
              if (!option || typeof option !== "object") return count;
              const record = option as Record<string, unknown>;
              return count + (Array.isArray(record.votes) ? record.votes.length : 0);
            }, 0),
          };
        })
        .filter((entry): entry is { id: string; title: string; status: string; votes: number } => Boolean(entry))
    : [];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!q) {
    const suggestionCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        handouts: true,
        unresolvedMysteries: true,
        schedulePolls: true,
      },
    });

    const [suggestedQuests, suggestedSessions] = await Promise.all([
      prisma.quest.findMany({
        where: {
          campaignId,
          ...(access.canViewDmContent ? { status: "ACTIVE" } : { status: "ACTIVE" }),
        },
        select: { id: true, title: true, description: true, priority: true },
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        take: 4,
      }),
      prisma.gameSession.findMany({
        where: {
          campaignId,
          ...(access.canViewDmContent ? {} : { status: "COMPLETED" }),
        },
        select: { id: true, number: true, title: true, publicRecap: true, dmRecap: true, date: true, status: true },
        orderBy: [{ status: "asc" }, { number: "desc" }],
        take: 3,
      }),
    ]);

    const suggestedHandouts = Array.isArray(suggestionCampaign?.handouts)
      ? suggestionCampaign.handouts
          .map((entry) => entry as Record<string, unknown>)
          .filter((entry) => {
            if (access.canViewDmContent) return true;
            return entry.visibility !== "dm";
          })
          .filter((entry) => Boolean(entry.isPinned))
          .slice(0, 4)
          .map((entry) => ({
            id: String(entry.id || crypto.randomUUID()),
            type: "handout",
            title: String(entry.title || "Handout"),
            subtitle: String(entry.type || "Pinned handout"),
            snippet: toSnippet(String(entry.content || "")),
            reason: "Recently relevant handout",
          }))
      : [];

    const suggestedMysteries = access.canViewDmContent
      ? normalizeMysteries(suggestionCampaign?.unresolvedMysteries)
          .slice(0, 3)
          .map((entry) => ({
            id: entry.id,
            type: "mystery",
            title: entry.title,
            subtitle: "Open mystery",
            snippet: toSnippet(entry.notes),
            reason: "Still unresolved",
          }))
      : [];

    const suggestedPolls = normalizeSchedulePolls(suggestionCampaign?.schedulePolls)
      .filter((entry) => entry.status === "open")
      .slice(0, 2)
      .map((entry) => ({
        id: entry.id,
        type: "schedule-poll",
        title: entry.title,
        subtitle: "Open schedule poll",
        snippet: `${entry.votes} total vote${entry.votes === 1 ? "" : "s"} recorded`,
        reason: "Needs table response",
      }));

    return NextResponse.json({
      results: [
        ...suggestedQuests.map((quest) => ({
          id: quest.id,
          type: "quest",
          title: quest.title,
          subtitle: `${quest.priority} priority`,
          snippet: toSnippet(quest.description),
          reason: "Active now",
        })),
        ...suggestedSessions.map((gameSession) => ({
          id: gameSession.id,
          type: "session",
          title: gameSession.title || `Session ${gameSession.number}`,
          subtitle: gameSession.status === "COMPLETED" ? "Latest recap" : gameSession.status.replace("_", " "),
          snippet: toSnippet(gameSession.publicRecap || gameSession.dmRecap || gameSession.date),
          reason: gameSession.status === "COMPLETED" ? "Most recent memory" : "Upcoming prep",
        })),
        ...suggestedHandouts,
        ...suggestedMysteries,
        ...suggestedPolls,
      ],
    });
  }

  const [
    npcs,
    locations,
    quests,
    sessionItems,
    sessions,
    notes,
    worldData,
  ] = await Promise.all([
    prisma.nPC.findMany({
      where: {
        campaignId,
        ...(access.canViewDmContent ? {} : { isEnemy: false }),
        OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, name: true, description: true },
      take: 8,
    }),
    prisma.location.findMany({
      where: {
        campaignId,
        OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, name: true, description: true, type: true },
      take: 8,
    }),
    prisma.quest.findMany({
      where: {
        campaignId,
        ...(access.canViewDmContent ? {} : { status: { not: "ON_HOLD" } }),
        OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, title: true, description: true, status: true },
      take: 8,
    }),
    prisma.sessionItem.findMany({
      where: {
        campaignId,
        ...(access.canViewDmContent ? {} : { isHidden: false }),
        OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, name: true, description: true, rarity: true },
      take: 8,
    }),
    prisma.gameSession.findMany({
      where: {
        campaignId,
        ...(access.canViewDmContent ? {} : { status: "COMPLETED" }),
        OR: access.canViewDmContent
          ? [{ title: { contains: q, mode: "insensitive" } }, { strongStart: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }]
          : [{ title: { contains: q, mode: "insensitive" } }, { publicRecap: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, number: true, title: true, notes: true, publicRecap: true },
      take: 8,
    }),
    access.canViewDmContent
      ? prisma.campaignNote.findMany({
          where: {
            campaignId,
            OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }],
          },
          select: { id: true, title: true, content: true, category: true },
          take: 8,
        })
      : Promise.resolve([]),
    prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        worldRegions: true,
        factionDirectory: true,
        loreEntries: true,
        historicalEvents: true,
        handouts: true,
        unresolvedMysteries: true,
        schedulePolls: true,
      },
    }),
  ]);

  const worldRegions = access.canViewDmContent
    ? parseWorldRegions(worldData?.worldRegions)
    : filterPublicWorldRegions(worldData?.worldRegions);
  const factionDirectory = access.canViewDmContent
    ? parseFactionDirectory(worldData?.factionDirectory)
    : filterPublicFactionDirectory(worldData?.factionDirectory);
  const loreEntries = access.canViewDmContent
    ? parseLoreEntries(worldData?.loreEntries)
    : filterPublicLoreEntries(worldData?.loreEntries);
  const historicalEvents = access.canViewDmContent
    ? parseHistoricalEvents(worldData?.historicalEvents)
    : filterPublicHistoricalEvents(worldData?.historicalEvents);
  const handouts = Array.isArray(worldData?.handouts)
    ? worldData.handouts.filter((entry) => {
        if (!entry || typeof entry !== "object") return false;
        if (access.canViewDmContent) return true;
        const item = entry as Record<string, unknown>;
        return item.visibility !== "dm";
      })
    : [];

  const normalizedQuery = q.toLowerCase();
  const worldResults = [
    ...worldRegions
      .filter((entry) =>
        [entry.name, entry.kind, entry.summary, entry.tags.join(" ")].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        )
      )
      .slice(0, 8)
      .map((entry) => ({
        id: entry.id,
        type: "world-region",
        title: entry.name,
        subtitle: entry.kind,
        snippet: toSnippet(entry.summary || entry.tags.join(", ")),
      })),
    ...factionDirectory
      .filter((entry) =>
        [entry.name, entry.type, entry.agenda, entry.regions.join(" "), entry.notes || ""].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        )
      )
      .slice(0, 8)
      .map((entry) => ({
        id: entry.id,
        type: "faction",
        title: entry.name,
        subtitle: `${entry.type} · ${entry.status}`,
        snippet: toSnippet(entry.agenda || entry.notes || entry.regions.join(", ")),
      })),
    ...loreEntries
      .filter((entry) =>
        [entry.title, entry.category, entry.summary, entry.relatedNames.join(" "), access.canViewDmContent ? entry.dmTruth || "" : ""].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        )
      )
      .slice(0, 8)
      .map((entry) => ({
        id: entry.id,
        type: "lore",
        title: entry.title,
        subtitle: entry.category,
        snippet: toSnippet(entry.summary || entry.dmTruth),
      })),
    ...historicalEvents
      .filter((entry) =>
        [entry.title, entry.era, entry.dateLabel, entry.summary, entry.impact || ""].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        )
      )
      .slice(0, 8)
      .map((entry) => ({
        id: entry.id,
        type: "timeline-event",
        title: entry.title,
        subtitle: entry.dateLabel || entry.era || "Timeline",
        snippet: toSnippet(entry.summary || entry.impact),
      })),
    ...handouts
      .map((entry) => entry as Record<string, unknown>)
      .filter((entry) =>
        [String(entry.title || ""), String(entry.type || ""), String(entry.content || "")]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, 8)
      .map((entry) => ({
        id: String(entry.id || crypto.randomUUID()),
        type: "handout",
        title: String(entry.title || "Handout"),
        subtitle: String(entry.type || "Handout"),
        snippet: toSnippet(String(entry.content || "")),
        reason: entry.isPinned ? "Pinned handout" : "Matched handout content",
      })),
  ];

  const results = [
    ...npcs.map((npc) => ({ id: npc.id, type: "npc", title: npc.name, subtitle: "NPC", snippet: toSnippet(npc.description), reason: "Matched NPC name or description" })),
    ...locations.map((location) => ({ id: location.id, type: "location", title: location.name, subtitle: location.type, snippet: toSnippet(location.description), reason: "Matched location details" })),
    ...quests.map((quest) => ({ id: quest.id, type: "quest", title: quest.title, subtitle: quest.status, snippet: toSnippet(quest.description), reason: "Matched quest details" })),
    ...sessionItems.map((item) => ({ id: item.id, type: "item", title: item.name, subtitle: item.rarity || "Item", snippet: toSnippet(item.description), reason: "Matched item details" })),
    ...sessions.map((gameSession) => ({ id: gameSession.id, type: "session", title: gameSession.title || `Session ${gameSession.number}`, subtitle: `Session ${gameSession.number}`, snippet: toSnippet(gameSession.publicRecap || gameSession.notes), reason: "Matched session notes or recap" })),
    ...notes.map((note) => ({ id: note.id, type: "note", title: note.title, subtitle: note.category, snippet: toSnippet(note.content), reason: "Matched DM note" })),
    ...worldResults,
  ];

  return NextResponse.json({ results });
}
