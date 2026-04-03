import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess, getCampaignPermissions, getCampaignRoleForUser } from "@/lib/campaign-access";
import {
  filterPublicFactionDirectory,
  filterPublicHistoricalEvents,
  filterPublicLoreEntries,
  filterPublicWorldRegions,
} from "@/lib/worldbuilding";

function filterLocationMapData(value: unknown, canViewDmContent: boolean) {
  if (!value || typeof value !== "object") return null;
  const mapData = value as Record<string, unknown>;
  if (canViewDmContent) {
    return mapData;
  }

  const markers = Array.isArray(mapData.markers)
    ? mapData.markers.filter((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const marker = entry as Record<string, unknown>;
        return marker.visibility !== "dm";
      })
    : [];

  return {
    ...mapData,
    markers,
  };
}

function filterEncounterLiveState(value: unknown, canViewDmContent: boolean) {
  if (canViewDmContent || !value || typeof value !== "object") {
    return value;
  }

  const liveState = value as Record<string, unknown>;
  const combatants = Array.isArray(liveState.combatants)
    ? liveState.combatants
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const combatant = entry as Record<string, unknown>;
          return {
            id: combatant.id,
            name: combatant.name,
            kind: combatant.kind,
            sourceId: combatant.sourceId,
            initiative: combatant.initiative,
            currentHP: combatant.currentHP,
            maxHP: combatant.maxHP,
            armorClass: combatant.armorClass,
            conditions: combatant.conditions,
            concentrationSpell: combatant.concentrationSpell,
            defeated: combatant.defeated,
            legendaryActionsUsed: combatant.legendaryActionsUsed,
            tokenX: combatant.tokenX,
            tokenY: combatant.tokenY,
            visionRadius: combatant.visionRadius,
          };
        })
        .filter(Boolean)
    : [];

  return {
    ...liveState,
    combatants,
  };
}

// GET /api/campaigns/:id — get campaign details
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      dm: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          character: {
            select: {
              id: true,
              name: true,
              level: true,
              currentHP: true,
              maxHP: true,
              armorClass: true,
              initiative: true,
              concentrationSpell: true,
              conditions: { select: { condition: true } },
              race: { select: { name: true } },
              class: { select: { name: true } },
            },
          },
        },
      },
      npcs: true,
      sessionItems: true,
      gameSessions: {
        orderBy: { number: "desc" },
      },
      locations: {
        include: {
          children: {
            include: {
              children: true,
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      quests: {
        orderBy: [{ status: "asc" }, { priority: "asc" }],
      },
      encounters: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
      },
      campaignNotes: {
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Verify user is a member
  const viewerRole = getCampaignRoleForUser(campaign, session.user.id);
  const permissions = getCampaignPermissions(viewerRole);

  if (!permissions.isMember) {
    return NextResponse.json({ error: "Not a member of this campaign" }, { status: 403 });
  }

  const canViewDmContent = permissions.canViewDmContent;

  const filteredNpcs = canViewDmContent
    ? campaign.npcs
    : campaign.npcs
        .filter((npc) => !npc.isEnemy) // Players only see non-enemy NPCs
        .map(({ notes, isEnemy, ...rest }) => rest);

  const filteredSessionItems = canViewDmContent
    ? campaign.sessionItems
    : campaign.sessionItems.filter((item) => !item.isHidden);

  const filteredGameSessions = canViewDmContent
    ? campaign.gameSessions
    : campaign.gameSessions
        .filter((gs) => gs.status === "COMPLETED")
        .map(({ notes, secretsAndClues, strongStart, scenes, dmRecap, pacingNotes, preparedChecklist, liveNotes, ...rest }) => rest);

  // Locations: players see locations but without DM notes
  const filteredLocations = canViewDmContent
    ? campaign.locations
    : campaign.locations.map(({ notes, ...rest }) => ({
        ...rest,
        mapData: filterLocationMapData(rest.mapData, false),
        children: rest.children.map(({ notes: childNotes, ...childRest }) => ({
          ...childRest,
          mapData: filterLocationMapData(childRest.mapData, false),
          children: childRest.children.map(({ notes: grandChildNotes, ...grandChildRest }) => ({
            ...grandChildRest,
            mapData: filterLocationMapData(grandChildRest.mapData, false),
          })),
        })),
      }));

  // Quests: players see quests but without DM notes
  const filteredQuests = canViewDmContent
    ? campaign.quests
    : campaign.quests
        .filter((q) => q.status !== "ON_HOLD") // Players don't see on-hold quests
        .map(({ notes, giverNpcId, ...rest }) => rest);

  const filteredEncounters = canViewDmContent
    ? campaign.encounters
    : campaign.encounters
        .filter((e) => e.status !== "prepared")
        .map(({ monsters, notes, liveState, ...rest }) => ({
          ...rest,
          liveState: filterEncounterLiveState(liveState, false),
        }));

  const filteredCampaignNotes = canViewDmContent ? campaign.campaignNotes : [];
  const filteredWorldCanon = canViewDmContent ? campaign.worldCanon : [];
  const filteredStoryThreads = canViewDmContent ? campaign.storyThreads : [];
  const filteredBackups = canViewDmContent ? campaign.backups : [];
  const filteredHandouts = canViewDmContent
    ? campaign.handouts
    : Array.isArray(campaign.handouts)
      ? campaign.handouts.filter((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const item = entry as Record<string, unknown>;
          return item.visibility !== "dm";
        })
      : [];
  const filteredWorldRegions = canViewDmContent
    ? campaign.worldRegions
    : filterPublicWorldRegions(campaign.worldRegions);
  const filteredFactionDirectory = canViewDmContent
    ? campaign.factionDirectory
    : filterPublicFactionDirectory(campaign.factionDirectory);
  const filteredLoreEntries = canViewDmContent
    ? campaign.loreEntries
    : filterPublicLoreEntries(campaign.loreEntries);
  const filteredHistoricalEvents = canViewDmContent
    ? campaign.historicalEvents
    : filterPublicHistoricalEvents(campaign.historicalEvents);

  return NextResponse.json({
    ...campaign,
    viewerRole,
    viewerCanManage: permissions.canManageCampaign,
    viewerCanViewDmContent: permissions.canViewDmContent,
    worldCanon: filteredWorldCanon,
    storyThreads: filteredStoryThreads,
    backups: filteredBackups,
    worldRegions: filteredWorldRegions,
    factionDirectory: filteredFactionDirectory,
    loreEntries: filteredLoreEntries,
    historicalEvents: filteredHistoricalEvents,
    handouts: filteredHandouts,
    npcs: filteredNpcs,
    sessionItems: filteredSessionItems,
    gameSessions: filteredGameSessions,
    locations: filteredLocations,
    quests: filteredQuests,
    encounters: filteredEncounters,
    campaignNotes: filteredCampaignNotes,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getCampaignAccess(id, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowedFields = [
    "name",
    "description",
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
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
