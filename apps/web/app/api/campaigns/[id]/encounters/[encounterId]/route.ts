import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; encounterId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, encounterId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if ("status" in body) updateData.status = body.status;
  if ("liveState" in body) updateData.liveState = body.liveState;
  if ("difficulty" in body) updateData.difficulty = body.difficulty;
  if ("notes" in body) updateData.notes = body.notes;

  const existing = await prisma.encounter.findFirst({
    where: { id: encounterId, campaignId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const updated = await prisma.encounter.update({
    where: { id: encounterId },
    data: updateData,
  });

  return NextResponse.json(updated);
}
