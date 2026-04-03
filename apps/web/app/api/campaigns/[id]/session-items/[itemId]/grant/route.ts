import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getCampaignAccess } from "@/lib/campaign-access";
import {
  appendCharacterNotification,
  createCharacterNotification,
} from "@/lib/character-notifications";
import { createItemHistoryEntry } from "@/lib/item-history";

interface GrantAssignmentInput {
  characterId: string;
  quantity: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, itemId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Not allowed to manage this campaign" }, { status: 403 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { members: { include: { character: true } } },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const sessionItem = await prisma.sessionItem.findUnique({ where: { id: itemId } });
  if (!sessionItem || sessionItem.campaignId !== campaignId) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const body = await request.json();
  const assignments: unknown[] = Array.isArray(body.assignments) ? body.assignments : [];

  if (assignments.length === 0) {
    return NextResponse.json({ error: "At least one assignment is required" }, { status: 400 });
  }

  const normalizedAssignments = assignments
    .map((assignment): GrantAssignmentInput => {
      const value = assignment as Partial<GrantAssignmentInput>;
      return {
        characterId: String(value.characterId || ""),
        quantity: Math.max(1, Number(value.quantity) || 1),
      };
    })
    .filter((assignment) => assignment.characterId);

  const totalQuantity = normalizedAssignments.reduce(
    (sum: number, assignment: GrantAssignmentInput) => sum + assignment.quantity,
    0
  );

  if (totalQuantity > sessionItem.quantity) {
    return NextResponse.json({ error: "Assigned quantity exceeds available amount" }, { status: 400 });
  }

  const validCharacterIds = new Set(
    campaign.members
      .map((member) => member.character?.id)
      .filter(Boolean)
  );

  if (!normalizedAssignments.every((assignment: GrantAssignmentInput) => validCharacterIds.has(assignment.characterId))) {
    return NextResponse.json({ error: "Invalid character selection" }, { status: 400 });
  }

  const createdItems = await prisma.$transaction(async (tx) => {
    const grants = [];
    const actor = session.user.name || session.user.email || "Unknown";

    for (const assignment of normalizedAssignments) {
      const targetCharacter = await tx.character.findUnique({ where: { id: assignment.characterId } });

      const createdItem = await tx.characterItem.create({
        data: {
          characterId: assignment.characterId,
          name: sessionItem.name,
          description: sessionItem.description,
          imageUrl: sessionItem.imageUrl,
          category: sessionItem.category,
          rarity: sessionItem.rarity,
          value: sessionItem.value,
          quantity: assignment.quantity,
          notes: sessionItem.location
            ? `Granted from campaign loot: ${sessionItem.location}`
            : "Granted from campaign loot",
          sourceSessionItemId: sessionItem.id,
          itemHistory: [
            createItemHistoryEntry(
              "grant",
              "Granted from campaign loot",
              sessionItem.location
                ? `${assignment.quantity} received from ${sessionItem.location}.`
                : `${assignment.quantity} granted from the campaign loot pool.`,
              actor
            ),
          ] as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.character.update({
        where: { id: assignment.characterId },
        data: {
          pendingNotifications: appendCharacterNotification(
            (targetCharacter as { pendingNotifications?: unknown } | null)?.pendingNotifications,
            createCharacterNotification(
              "item_received",
              `Received ${sessionItem.name}`,
              `${assignment.quantity} ${assignment.quantity === 1 ? "copy" : "copies"} added from campaign loot.`,
              {
                imageUrl: sessionItem.imageUrl,
                metadata: {
                  quantity: assignment.quantity,
                  itemName: sessionItem.name,
                },
              }
            )
          ) as unknown as Prisma.InputJsonValue,
        } as Prisma.CharacterUpdateInput,
      });

      grants.push(createdItem);
    }

    const remainingQuantity = sessionItem.quantity - totalQuantity;
    await tx.sessionItem.update({
      where: { id: sessionItem.id },
      data: {
        quantity: remainingQuantity,
        isHidden: remainingQuantity > 0 ? sessionItem.isHidden : false,
        claimedById:
          normalizedAssignments.length === 1 && remainingQuantity === 0
            ? normalizedAssignments[0].characterId
            : sessionItem.claimedById,
      },
    });

    return grants;
  });

  return NextResponse.json({ granted: createdItems }, { status: 201 });
}
