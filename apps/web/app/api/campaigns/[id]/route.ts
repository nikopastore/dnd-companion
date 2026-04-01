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

  return NextResponse.json({
    ...campaign,
    npcs: filteredNpcs,
    sessionItems: filteredSessionItems,
  });
}
