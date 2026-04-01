import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// POST /api/npcs — create an NPC
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    campaignId,
    name,
    description,
    statBlock,
    isEnemy,
    notes,
    // Enhanced NPC fields
    race,
    npcClass,
    alignment,
    personality,
    appearance,
    voice,
    faction,
    locationName,
    relationship,
    isAlive,
    cr,
  } = await request.json();

  if (!campaignId || !name) {
    return NextResponse.json({ error: "campaignId and name are required" }, { status: 400 });
  }

  // Verify user is DM of this campaign
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.dmId !== session.user.id) {
    return NextResponse.json({ error: "Not the DM of this campaign" }, { status: 403 });
  }

  const npc = await prisma.nPC.create({
    data: {
      campaignId,
      name,
      description,
      statBlock,
      isEnemy: isEnemy ?? false,
      notes,
      race,
      npcClass,
      alignment,
      personality,
      appearance,
      voice,
      faction,
      locationName,
      relationship,
      isAlive: isAlive ?? true,
      cr,
    },
  });

  return NextResponse.json(npc, { status: 201 });
}
