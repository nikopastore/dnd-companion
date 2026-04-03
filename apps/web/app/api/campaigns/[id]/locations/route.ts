import { NextResponse } from "next/server";
import { prisma, Prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

// GET /api/campaigns/:id/locations — list all locations with nested children
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;

  // Verify user is DM of this campaign
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
  }

  const locations = await prisma.location.findMany({
    where: { campaignId },
    include: {
      children: {
        include: {
          children: true,
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(locations);
}

// POST /api/campaigns/:id/locations — create a new location
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;

  // Verify user is DM of this campaign
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
  }

  const { name, type, description, notes, parentId, imageUrl, mapData } = await request.json();

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  const location = await prisma.location.create({
    data: {
      campaignId,
      name,
      type,
      description,
      notes,
      parentId,
      imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
      mapData: mapData == null ? undefined : (mapData as Prisma.InputJsonValue),
    },
    include: {
      children: true,
    },
  });

  return NextResponse.json(location, { status: 201 });
}
