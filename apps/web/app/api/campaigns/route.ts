import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { generateInviteCode } from "@/lib/utils";

// GET /api/campaigns — list user's campaigns
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { dmId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      dm: { select: { name: true, image: true } },
      members: {
        include: {
          user: { select: { name: true, image: true } },
          character: { select: { id: true, name: true, level: true } },
        },
      },
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(campaigns);
}

// POST /api/campaigns — create a new campaign
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await request.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.campaign.findUnique({ where: { inviteCode } });
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      inviteCode,
      dmId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "DM",
        },
      },
    },
    include: {
      dm: { select: { name: true, image: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
