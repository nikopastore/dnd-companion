import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// GET /api/campaigns/:id/notes — list all campaign notes, pinned first then by updatedAt
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

  const notes = await prisma.campaignNote.findMany({
    where: { campaignId },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(notes);
}

// POST /api/campaigns/:id/notes — create a new campaign note
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

  const { title, content, category, isPinned } = await request.json();

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const note = await prisma.campaignNote.create({
    data: {
      campaignId,
      title,
      content,
      category: category ?? "general",
      isPinned: isPinned ?? false,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
