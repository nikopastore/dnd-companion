import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// GET /api/campaigns/lookup?code=ABC123 — find campaign by invite code
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.toUpperCase();

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { inviteCode: code },
    include: {
      dm: { select: { name: true, image: true } },
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
      _count: { select: { members: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "No campaign found with this code" }, { status: 404 });
  }

  return NextResponse.json({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    dm: campaign.dm,
    memberCount: campaign._count.members,
    viewerRole: campaign.members[0]?.role ?? null,
  });
}
