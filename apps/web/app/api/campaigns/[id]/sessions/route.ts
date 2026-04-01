import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// GET /api/campaigns/:id/sessions — list all game sessions for campaign
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

  const gameSessions = await prisma.gameSession.findMany({
    where: { campaignId },
    orderBy: { number: "desc" },
  });

  return NextResponse.json(gameSessions);
}

// POST /api/campaigns/:id/sessions — create a new game session
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

  const { title, date, strongStart, scenes, secretsAndClues, notes } = await request.json();

  // Auto-increment session number based on existing count
  const count = await prisma.gameSession.count({ where: { campaignId } });
  const nextNumber = count + 1;

  const gameSession = await prisma.gameSession.create({
    data: {
      campaignId,
      number: nextNumber,
      title,
      date: date ? new Date(date) : null,
      strongStart,
      scenes,
      secretsAndClues,
      notes,
    },
  });

  return NextResponse.json(gameSession, { status: 201 });
}
