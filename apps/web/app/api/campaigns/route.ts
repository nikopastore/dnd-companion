import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignPermissions, getCampaignRoleForUser } from "@/lib/campaign-access";
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
      dm: { select: { id: true, name: true, image: true } },
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

  return NextResponse.json(
    campaigns.map((campaign) => {
      const viewerRole = getCampaignRoleForUser(campaign, session.user.id);
      const permissions = getCampaignPermissions(viewerRole);

      return {
        ...campaign,
        viewerRole,
        viewerCanManage: permissions.canManageCampaign,
      };
    })
  );
}

// POST /api/campaigns — create a new campaign
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    name,
    description,
    system,
    edition,
    setting,
    tone,
    onboardingMode,
    worldName,
    worldSummary,
      houseRules,
  } = await request.json();

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
      system: system?.trim() || "D&D",
      edition: edition?.trim() || "5e",
      setting: setting?.trim() || null,
      tone: tone?.trim() || null,
      onboardingMode: onboardingMode === "advanced" ? "advanced" : "beginner",
      worldName: worldName?.trim() || null,
      worldSummary: worldSummary?.trim() || null,
      houseRules: (Array.isArray(houseRules) ? houseRules : []) as Prisma.InputJsonValue,
      partyTreasury: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      treasuryLedger: [] as Prisma.InputJsonValue,
      partyStash: [] as Prisma.InputJsonValue,
      craftingProjects: [] as Prisma.InputJsonValue,
      announcements: [] as Prisma.InputJsonValue,
      merchants: [] as Prisma.InputJsonValue,
      economyLog: [] as Prisma.InputJsonValue,
      schedulePolls: [] as Prisma.InputJsonValue,
      campaignMessages: [] as Prisma.InputJsonValue,
      handouts: [] as Prisma.InputJsonValue,
      factions: [] as Prisma.InputJsonValue,
      factionDirectory: [] as Prisma.InputJsonValue,
      storyThreads: [] as Prisma.InputJsonValue,
      scheduledEvents: [] as Prisma.InputJsonValue,
      worldRegions: [] as Prisma.InputJsonValue,
      loreEntries: [] as Prisma.InputJsonValue,
      historicalEvents: [] as Prisma.InputJsonValue,
      calendarState: {
        currentDateLabel: "",
        season: "",
        weather: "",
        moonPhase: "",
        nextHoliday: "",
      } as Prisma.InputJsonValue,
      threatClocks: [] as Prisma.InputJsonValue,
      unresolvedMysteries: [] as Prisma.InputJsonValue,
      worldCanon: [] as Prisma.InputJsonValue,
      playerCanon: [] as Prisma.InputJsonValue,
      rumors: [] as Prisma.InputJsonValue,
      sharedPlans: [] as Prisma.InputJsonValue,
      backups: [] as Prisma.InputJsonValue,
      sessionZero: [] as Prisma.InputJsonValue,
      accessibilityOptions: [] as Prisma.InputJsonValue,
      members: {
        create: {
          userId: session.user.id,
          role: "DM",
        },
      },
    } as Prisma.CampaignUncheckedCreateInput,
    include: {
      dm: { select: { name: true, image: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
