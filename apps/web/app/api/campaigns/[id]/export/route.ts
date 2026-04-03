import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";
import { buildCampaignSnapshot } from "@/lib/campaign-backups";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getCampaignAccess(id, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await buildCampaignSnapshot(id);
  if (!snapshot) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    campaignId: id,
    exportedBy: session.user.email || session.user.id,
    snapshot,
  });
}
