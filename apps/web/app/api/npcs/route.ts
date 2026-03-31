import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// POST /api/npcs — create an NPC
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, name, description, statBlock, isEnemy, notes } = await request.json();

  // Verify user is DM of this campaign
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.dmId !== session.user.id) {
    return NextResponse.json({ error: "Not the DM of this campaign" }, { status: 403 });
  }

  const npc = await prisma.nPC.create({
    data: { campaignId, name, description, statBlock, isEnemy: isEnemy ?? false, notes },
  });

  return NextResponse.json(npc, { status: 201 });
}
