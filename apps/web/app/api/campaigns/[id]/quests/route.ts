import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// GET /api/campaigns/:id/quests — list all quests ordered by status then priority
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
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.dmId !== session.user.id) {
    return NextResponse.json({ error: "Not the DM of this campaign" }, { status: 403 });
  }

  const quests = await prisma.quest.findMany({
    where: { campaignId },
    orderBy: [{ status: "asc" }, { priority: "asc" }],
  });

  return NextResponse.json(quests);
}

// POST /api/campaigns/:id/quests — create a new quest
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
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.dmId !== session.user.id) {
    return NextResponse.json({ error: "Not the DM of this campaign" }, { status: 403 });
  }

  const { title, description, status, priority, notes, giverNpcId } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const quest = await prisma.quest.create({
    data: {
      campaignId,
      title,
      description,
      status: status ?? "ACTIVE",
      priority: priority ?? "normal",
      notes,
      giverNpcId,
    },
  });

  return NextResponse.json(quest, { status: 201 });
}

// PATCH /api/campaigns/:id/quests — update a quest
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;

  // Verify user is DM of this campaign
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.dmId !== session.user.id) {
    return NextResponse.json({ error: "Not the DM of this campaign" }, { status: 403 });
  }

  const { questId, title, description, status, priority, notes, giverNpcId } = await request.json();

  if (!questId) {
    return NextResponse.json({ error: "questId is required" }, { status: 400 });
  }

  // Verify the quest belongs to this campaign
  const existingQuest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!existingQuest || existingQuest.campaignId !== campaignId) {
    return NextResponse.json({ error: "Quest not found in this campaign" }, { status: 404 });
  }

  const updatedQuest = await prisma.quest.update({
    where: { id: questId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(notes !== undefined && { notes }),
      ...(giverNpcId !== undefined && { giverNpcId }),
    },
  });

  return NextResponse.json(updatedQuest);
}
