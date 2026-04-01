import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

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
  const isMember = campaign.members.some((m) => m.userId === session.user.id);
  if (!isMember) {
    return NextResponse.json({ error: "Not a member of this campaign" }, { status: 403 });
  }

  // Filter DM-only data for non-DM members
  const isDM = campaign.dm.id === session.user.id;

  const filteredNpcs = isDM
    ? campaign.npcs
    : campaign.npcs
        .filter((npc) => !npc.isEnemy) // Players only see non-enemy NPCs
        .map(({ notes, isEnemy, ...rest }) => rest);

  const filteredSessionItems = isDM
    ? campaign.sessionItems
    : campaign.sessionItems.filter((item) => !item.isHidden);

  // Game sessions: players see only completed sessions, DM sees all
  const filteredGameSessions = isDM
    ? campaign.gameSessions
    : campaign.gameSessions
        .filter((gs) => gs.status === "COMPLETED")
        .map(({ notes, secretsAndClues, strongStart, scenes, ...rest }) => rest);

  // Locations: players see locations but without DM notes
  const filteredLocations = isDM
    ? campaign.locations
    : campaign.locations.map(({ notes, ...rest }) => ({
        ...rest,
        children: rest.children.map(({ notes: childNotes, ...childRest }) => ({
          ...childRest,
          children: childRest.children.map(({ notes: grandChildNotes, ...grandChildRest }) => grandChildRest),
        })),
      }));

  // Quests: players see quests but without DM notes
  const filteredQuests = isDM
    ? campaign.quests
    : campaign.quests
        .filter((q) => q.status !== "ON_HOLD") // Players don't see on-hold quests
        .map(({ notes, giverNpcId, ...rest }) => rest);

  // Encounters: players don't see prepared encounters, and don't see monster details
  const filteredEncounters = isDM
    ? campaign.encounters
    : campaign.encounters
        .filter((e) => e.status !== "prepared")
        .map(({ monsters, notes, ...rest }) => rest);

  // Campaign notes: only visible to DM
  const filteredCampaignNotes = isDM ? campaign.campaignNotes : [];

  return NextResponse.json({
    ...campaign,
    npcs: filteredNpcs,
    sessionItems: filteredSessionItems,
    gameSessions: filteredGameSessions,
    locations: filteredLocations,
    quests: filteredQuests,
    encounters: filteredEncounters,
    campaignNotes: filteredCampaignNotes,
  });
}
