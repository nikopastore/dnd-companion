import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

// GET /api/campaigns/:id/encounters — list all encounters ordered by status then name
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

  const encounters = await prisma.encounter.findMany({
    where: { campaignId },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(encounters);
}

// POST /api/campaigns/:id/encounters — create a new encounter
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

  const { name, description, difficulty, monsters, loot, notes, status } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const encounter = await prisma.encounter.create({
    data: {
      campaignId,
      name,
      description,
      difficulty,
      monsters: monsters ?? [],
      loot: loot ?? [],
      notes,
      status: status ?? "prepared",
    },
  });

  return NextResponse.json(encounter, { status: 201 });
}
