import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.sessionItem.findMany({
    where: { campaignId },
    orderBy: [{ isHidden: "desc" }, { updatedAt: "desc" }],
  });

  const visibleItems = access.canViewDmContent ? items : items.filter((item) => !item.isHidden);

  return NextResponse.json(visibleItems);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
  }

  const {
    name,
    description,
    location,
    isHidden,
    rarity,
    value,
    imageUrl,
    category,
    quantity,
  } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const item = await prisma.sessionItem.create({
    data: {
      campaignId,
      name: name.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      isHidden: isHidden ?? true,
      rarity: rarity || null,
      value: value?.trim() || null,
      imageUrl: imageUrl || null,
      category: category?.trim() || null,
      quantity: Math.max(1, Number(quantity) || 1),
    },
  });

  return NextResponse.json(item, { status: 201 });
}
