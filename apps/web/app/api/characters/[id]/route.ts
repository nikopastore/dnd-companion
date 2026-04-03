import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// GET /api/characters/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      race: true,
      subrace: true,
      class: {
        include: {
          levels: { where: { level: { lte: 20 } }, orderBy: { level: "asc" } },
        },
      },
      multiclasses: {
        include: {
          class: {
            include: {
              levels: { where: { level: { lte: 20 } }, orderBy: { level: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      background: true,
      items: { include: { equipment: true }, orderBy: { name: "asc" } },
      spells: {
        include: {
          spell: true,
          sourceClass: { select: { id: true, name: true, primaryAbility: true } },
        },
        orderBy: { spell: { level: "asc" } },
      },
      features: { orderBy: { level: "asc" } },
      conditions: true,
      campaignMember: {
        include: {
          campaign: {
            include: {
              members: {
                include: {
                  character: {
                    select: {
                      id: true,
                      name: true,
                      race: { select: { name: true } },
                      class: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (character.userId !== session.user.id) {
    return NextResponse.json({ error: "Not your character" }, { status: 403 });
  }

  const partyMembers =
    character.campaignMember?.campaign.members
      .map((member) => member.character)
      .filter((member): member is NonNullable<typeof member> => Boolean(member))
      .filter((member) => member.id !== character.id) ?? [];
  const campaignContext = character.campaignMember?.campaign
    ? {
        name: character.campaignMember.campaign.name,
        system: character.campaignMember.campaign.system,
        edition: character.campaignMember.campaign.edition,
        houseRules: character.campaignMember.campaign.houseRules,
      }
    : null;

  return NextResponse.json({
    ...character,
    partyMembers,
    campaignContext,
  });
}

// PATCH /api/characters/:id — update character fields
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.character.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  // Allowlist of updatable fields
  const allowedFields = [
    "name", "imageUrl", "backstory", "currentHP", "tempHP", "maxHP", "armorClass", "initiative", "speed",
    "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
    "deathSaveSuccesses", "deathSaveFailures", "exhaustionLevel",
    "hitDiceRemaining", "classResources", "spellSlotsState", "pactSpellSlotsState", "concentrationSpell", "subclassName",
    "automationMode", "rulesBookmarks",
    "personalityTraits", "ideals", "bonds", "flaws", "personalGoals", "secrets", "voiceNotes", "lastSessionChanges", "characterTimeline",
    "copperPieces", "silverPieces", "electrumPieces", "goldPieces", "platinumPieces",
    "level", "experiencePoints", "proficiencyBonus", "primaryClassLevel",
    "skillProficiencies", "skillExpertise", "saveProficiencies",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updateData[field] = body[field];
  }

  const updated = await prisma.character.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
