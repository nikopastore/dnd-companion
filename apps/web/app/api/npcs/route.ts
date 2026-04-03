import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

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
    imageUrl,
  } = await request.json();

  if (!campaignId || !name) {
    return NextResponse.json({ error: "campaignId and name are required" }, { status: 400 });
  }

  // Verify user is DM of this campaign
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
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
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json(npc, { status: 201 });
}
