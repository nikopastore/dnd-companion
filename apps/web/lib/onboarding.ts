import { prisma } from "@dnd-companion/database";

export interface OnboardingMembership {
  id: string;
  role: "PLAYER" | "DM" | "CO_DM" | "SPECTATOR";
  characterId: string | null;
  campaign: {
    id: string;
    name: string;
    status: string;
    system: string;
    edition: string;
    setting: string | null;
    description: string | null;
  };
}

export interface OnboardingCharacter {
  id: string;
  name: string;
  level: number;
}

export interface OnboardingState {
  memberships: OnboardingMembership[];
  characters: OnboardingCharacter[];
  manageableMemberships: OnboardingMembership[];
  playerMemberships: OnboardingMembership[];
  incompletePlayerMemberships: OnboardingMembership[];
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const [memberships, characters] = await Promise.all([
    prisma.campaignMember.findMany({
      where: { userId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
            system: true,
            edition: true,
            setting: true,
            description: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.character.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        level: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const manageableMemberships = memberships.filter(
    (membership) => membership.role === "DM" || membership.role === "CO_DM"
  );
  const playerMemberships = memberships.filter((membership) => membership.role === "PLAYER");
  const incompletePlayerMemberships = playerMemberships.filter(
    (membership) => !membership.characterId
  );

  return {
    memberships: memberships as OnboardingMembership[],
    characters,
    manageableMemberships: manageableMemberships as OnboardingMembership[],
    playerMemberships: playerMemberships as OnboardingMembership[],
    incompletePlayerMemberships: incompletePlayerMemberships as OnboardingMembership[],
  };
}

function buildBuilderRoute(membership: OnboardingMembership) {
  const params = new URLSearchParams({
    campaignId: membership.campaign.id,
    campaignName: membership.campaign.name,
  });
  return `/builder?${params.toString()}`;
}

export function getDefaultEntryRoute(state: OnboardingState): string | null {
  if (state.memberships.length === 0 && state.characters.length === 0) {
    return null;
  }

  if (state.incompletePlayerMemberships.length === 1) {
    return buildBuilderRoute(state.incompletePlayerMemberships[0]);
  }

  if (state.incompletePlayerMemberships.length > 1) {
    return null;
  }

  if (state.manageableMemberships.length === 1) {
    return `/lobby/${state.manageableMemberships[0].campaign.id}`;
  }

  if (state.manageableMemberships.length > 1) {
    return "/dm/dashboard";
  }

  if (state.characters.length === 1 && state.memberships.length === 0) {
    return `/character/${state.characters[0].id}`;
  }

  if (state.memberships.length > 0) {
    return "/campaigns";
  }

  if (state.characters.length > 0) {
    return `/character/${state.characters[0].id}`;
  }

  return null;
}

export function getBuilderRouteForMembership(membership: OnboardingMembership) {
  return buildBuilderRoute(membership);
}
