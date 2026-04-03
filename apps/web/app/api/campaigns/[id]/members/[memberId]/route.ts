import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { isCampaignMemberRole, type CampaignMemberRole, getCampaignAccess } from "@/lib/campaign-access";

const MANAGEABLE_MEMBER_ROLES: CampaignMemberRole[] = ["PLAYER", "CO_DM", "SPECTATOR"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, memberId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);

  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!access.isOwner) {
    return NextResponse.json({ error: "Only the DM can change member roles" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedRole = body.role;

  if (!isCampaignMemberRole(requestedRole) || !MANAGEABLE_MEMBER_ROLES.includes(requestedRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const member = await prisma.campaignMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      campaignId: true,
      userId: true,
      role: true,
    },
  });

  if (!member || member.campaignId !== campaignId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.userId === session.user.id) {
    return NextResponse.json({ error: "The DM cannot demote themselves" }, { status: 400 });
  }

  const updated = await prisma.campaignMember.update({
    where: { id: memberId },
    data: { role: requestedRole },
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, image: true } },
      character: {
        select: {
          id: true,
          name: true,
          level: true,
          currentHP: true,
          maxHP: true,
          armorClass: true,
          race: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(updated);
}
