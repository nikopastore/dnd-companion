import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";
import { buildCampaignSnapshot, duplicateCampaignFromSnapshot } from "@/lib/campaign-backups";

export async function POST(
  request: Request,
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

  const body = await request.json().catch(() => ({}));
  const snapshot = await buildCampaignSnapshot(id);
  if (!snapshot) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const duplicated = await duplicateCampaignFromSnapshot(
    snapshot,
    session.user.id,
    typeof body.name === "string" ? body.name : undefined
  );

  return NextResponse.json(duplicated, { status: 201 });
}
