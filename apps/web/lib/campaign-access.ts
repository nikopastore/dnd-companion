import { prisma } from "@dnd-companion/database";

export const CAMPAIGN_MEMBER_ROLES = ["DM", "CO_DM", "PLAYER", "SPECTATOR"] as const;
export const CAMPAIGN_JOINABLE_ROLES = ["PLAYER", "SPECTATOR"] as const;

export type CampaignMemberRole = (typeof CAMPAIGN_MEMBER_ROLES)[number];
export type CampaignJoinableRole = (typeof CAMPAIGN_JOINABLE_ROLES)[number];

export function isCampaignMemberRole(value: unknown): value is CampaignMemberRole {
  return typeof value === "string" && CAMPAIGN_MEMBER_ROLES.includes(value as CampaignMemberRole);
}

export function isCampaignJoinableRole(value: unknown): value is CampaignJoinableRole {
  return typeof value === "string" && CAMPAIGN_JOINABLE_ROLES.includes(value as CampaignJoinableRole);
}

export function getCampaignPermissions(role: CampaignMemberRole | null | undefined) {
  const normalizedRole = role ?? null;

  return {
    role: normalizedRole,
    isMember: normalizedRole !== null,
    isOwner: normalizedRole === "DM",
    isSpectator: normalizedRole === "SPECTATOR",
    canManageCampaign: normalizedRole === "DM" || normalizedRole === "CO_DM",
    canViewDmContent: normalizedRole === "DM" || normalizedRole === "CO_DM",
    canPlayAsCharacter:
      normalizedRole === "DM" || normalizedRole === "CO_DM" || normalizedRole === "PLAYER",
  };
}

export function getCampaignRoleLabel(role: CampaignMemberRole | null | undefined) {
  switch (role) {
    case "DM":
      return "Dungeon Master";
    case "CO_DM":
      return "Co-DM";
    case "PLAYER":
      return "Player";
    case "SPECTATOR":
      return "Spectator";
    default:
      return "Guest";
  }
}

export function getCampaignRoleForUser(
  campaign: {
    dmId: string;
    members: Array<{ userId: string; role: string }>;
  },
  userId: string
): CampaignMemberRole | null {
  if (campaign.dmId === userId) {
    return "DM";
  }

  const memberRole = campaign.members.find((member) => member.userId === userId)?.role;
  return isCampaignMemberRole(memberRole) ? memberRole : null;
}

export async function getCampaignAccess(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      dmId: true,
      members: {
        where: { userId },
        select: {
          id: true,
          userId: true,
          role: true,
          characterId: true,
        },
      },
    },
  });

  if (!campaign) {
    return {
      campaign: null,
      membership: null,
      ...getCampaignPermissions(null),
    };
  }

  const membership = campaign.members[0] ?? null;
  const role =
    campaign.dmId === userId
      ? "DM"
      : isCampaignMemberRole(membership?.role)
        ? membership.role
        : null;

  return {
    campaign,
    membership,
    ...getCampaignPermissions(role),
  };
}
