import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { isCampaignJoinableRole } from "@/lib/campaign-access";

// POST /api/campaigns/:id/join — join a campaign (requires invite code)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const inviteCode = (body.inviteCode as string)?.toUpperCase?.();
  const requestedRole = isCampaignJoinableRole(body.role) ? body.role : "PLAYER";

  if (!inviteCode || inviteCode.length !== 6) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Verify invite code server-side
  if (campaign.inviteCode !== inviteCode) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 403 });
  }

  // Check if already a member
  const existing = campaign.members.find((m) => m.userId === session.user.id);
  if (existing) {
    return NextResponse.json(
      { error: "Already a member", campaignId: campaign.id, role: existing.role },
      { status: 409 }
    );
  }

  await prisma.campaignMember.create({
    data: {
      userId: session.user.id,
      campaignId: campaign.id,
      role: requestedRole,
    },
  });

  return NextResponse.json({ campaignId: campaign.id, role: requestedRole }, { status: 201 });
}
