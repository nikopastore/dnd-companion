import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// POST /api/campaigns/:id/join — join a campaign by ID (after lookup by invite code)
export async function POST(
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
    include: { members: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Check if already a member
  const existing = campaign.members.find((m) => m.userId === session.user.id);
  if (existing) {
    return NextResponse.json({ error: "Already a member", campaignId: campaign.id }, { status: 409 });
  }

  // Join as player
  await prisma.campaignMember.create({
    data: {
      userId: session.user.id,
      campaignId: campaign.id,
      role: "PLAYER",
    },
  });

  return NextResponse.json({ campaignId: campaign.id }, { status: 201 });
}
