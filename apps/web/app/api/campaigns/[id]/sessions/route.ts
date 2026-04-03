import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";

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
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
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
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
  }

  const {
    title,
    date,
    strongStart,
    objectives,
    scenes,
    secretsAndClues,
    notes,
    publicRecap,
    dmRecap,
    pacingNotes,
    attendance,
    preparedChecklist,
    liveNotes,
  } = await request.json();

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
      objectives,
      scenes,
      secretsAndClues,
      notes,
      publicRecap,
      dmRecap,
      pacingNotes,
      attendance,
      preparedChecklist,
      liveNotes,
    },
  });

  return NextResponse.json(gameSession, { status: 201 });
}

// PATCH /api/campaigns/:id/sessions — update session details
export async function PATCH(
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

  const { sessionId, ...body } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const existing = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!existing || existing.campaignId !== campaignId) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const allowedFields = [
    "title",
    "date",
    "status",
    "strongStart",
    "objectives",
    "scenes",
    "secretsAndClues",
    "summary",
    "notes",
    "publicRecap",
    "dmRecap",
    "pacingNotes",
    "attendance",
    "preparedChecklist",
    "liveNotes",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = field === "date" && body[field] ? new Date(body[field]) : body[field];
    }
  }

  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  return NextResponse.json(updated);
}
