import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@dnd-companion/database";
import { getCampaignAccess } from "@/lib/campaign-access";

// PATCH /api/campaigns/:id/status — update campaign status (DM only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!["LOBBY", "ACTIVE", "ARCHIVED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const access = await getCampaignAccess(id, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Only a DM or co-DM can change campaign status" }, { status: 403 });
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
