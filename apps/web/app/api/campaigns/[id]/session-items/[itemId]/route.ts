import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, itemId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
  }

  const existing = await prisma.sessionItem.findUnique({ where: { id: itemId } });
  if (!existing || existing.campaignId !== campaignId) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "name",
    "description",
    "location",
    "isHidden",
    "rarity",
    "value",
    "imageUrl",
    "category",
    "claimedById",
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if ("quantity" in body) {
    updateData.quantity = Math.max(0, Number(body.quantity) || 0);
  }

  const item = await prisma.sessionItem.update({
    where: { id: itemId },
    data: updateData,
  });

  return NextResponse.json(item);
}
