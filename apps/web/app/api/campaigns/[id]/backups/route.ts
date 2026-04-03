import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";
import {
  createBackupEntry,
  normalizeStoredBackups,
  removeBackupEntry,
  restoreBackupEntry,
} from "@/lib/campaign-backups";
import { prisma } from "@dnd-companion/database";

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
  const backup = await createBackupEntry(
    id,
    session.user.name || session.user.email || session.user.id,
    typeof body.label === "string" ? body.label : undefined
  );

  if (!backup) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ backup }, { status: 201 });
}

export async function PATCH(
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
  const action = String(body.action || "");
  const backupId = String(body.backupId || "");

  if (!backupId) {
    return NextResponse.json({ error: "Backup id is required" }, { status: 400 });
  }

  if (action === "restore") {
    const restored = await restoreBackupEntry(id, backupId);
    if (!restored) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }
    return NextResponse.json({ restored });
  }

  if (action === "delete") {
    await removeBackupEntry(id, backupId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

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

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { backups: true },
  });
  const backups = normalizeStoredBackups(campaign?.backups);
  return NextResponse.json({ backups });
}
