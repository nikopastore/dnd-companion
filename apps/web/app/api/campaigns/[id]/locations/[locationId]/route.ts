import { NextResponse } from "next/server";
import { prisma, Prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; locationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, locationId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
  }

  const existing = await prisma.location.findFirst({
    where: { id: locationId, campaignId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const updateData: Prisma.LocationUncheckedUpdateInput = {};

  if ("name" in body && typeof body.name === "string") updateData.name = body.name.trim() || existing.name;
  if ("type" in body && typeof body.type === "string") updateData.type = body.type.trim() || existing.type;
  if ("description" in body) updateData.description = typeof body.description === "string" ? body.description : null;
  if ("notes" in body) updateData.notes = typeof body.notes === "string" ? body.notes : null;
  if ("imageUrl" in body) updateData.imageUrl = typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;
  if ("parentId" in body) updateData.parentId = typeof body.parentId === "string" && body.parentId.trim() ? body.parentId : null;
  if ("mapData" in body) updateData.mapData = body.mapData == null ? Prisma.JsonNull : (body.mapData as Prisma.InputJsonValue);

  const location = await prisma.location.update({
    where: { id: locationId },
    data: updateData,
    include: {
      children: true,
    },
  });

  return NextResponse.json(location);
}
