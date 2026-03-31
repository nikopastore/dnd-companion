import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// POST /api/session-items — create a session item
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, name, description, location, isHidden } = await request.json();

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.dmId !== session.user.id) {
    return NextResponse.json({ error: "Not the DM of this campaign" }, { status: 403 });
  }

  const item = await prisma.sessionItem.create({
    data: { campaignId, name, description, location, isHidden: isHidden ?? true },
  });

  return NextResponse.json(item, { status: 201 });
}
