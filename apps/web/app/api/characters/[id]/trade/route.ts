import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { appendItemHistory, createItemHistoryEntry } from "@/lib/item-history";

type CurrencyType = "copperPieces" | "silverPieces" | "electrumPieces" | "goldPieces" | "platinumPieces";
type CoinKey = "cp" | "sp" | "ep" | "gp" | "pp";

interface ItemTradePayload {
  kind: "item";
  targetCharacterId: string;
  itemId: string;
  quantity: number;
}

interface CurrencyTradePayload {
  kind: "currency";
  targetCharacterId: string;
  currencyType: CurrencyType;
  amount: number;
}

function sameCampaign(sourceCampaignId: string | null | undefined, targetCampaignId: string | null | undefined) {
  return Boolean(sourceCampaignId && targetCampaignId && sourceCampaignId === targetCampaignId);
}

function currencyTypeToCoinKey(currencyType: CurrencyType): CoinKey {
  switch (currencyType) {
    case "copperPieces":
      return "cp";
    case "silverPieces":
      return "sp";
    case "electrumPieces":
      return "ep";
    case "platinumPieces":
      return "pp";
    default:
      return "gp";
  }
}

function toEconomyLog(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sourceCharacterId } = await params;
  const body = (await request.json()) as ItemTradePayload | CurrencyTradePayload;

  const sourceCharacter = await prisma.character.findUnique({
    where: { id: sourceCharacterId },
    include: { campaignMember: true },
  });

  if (!sourceCharacter || sourceCharacter.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetCharacter = await prisma.character.findUnique({
    where: { id: body.targetCharacterId },
    include: { campaignMember: true },
  });

  if (
    !targetCharacter ||
    !sameCampaign(
      sourceCharacter.campaignMember?.campaignId,
      targetCharacter.campaignMember?.campaignId
    )
  ) {
    return NextResponse.json({ error: "Characters must belong to the same campaign" }, { status: 400 });
  }

  if (body.kind === "currency") {
    const amount = Math.max(1, Number(body.amount) || 0);
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    const currentAmount = sourceCharacter[body.currencyType];
    if (currentAmount < amount) {
      return NextResponse.json({ error: "Not enough currency to transfer" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.character.update({
        where: { id: sourceCharacterId },
        data: { [body.currencyType]: currentAmount - amount },
      }),
      prisma.character.update({
        where: { id: targetCharacter.id },
        data: { [body.currencyType]: targetCharacter[body.currencyType] + amount },
      }),
    ]);

    const campaignId = sourceCharacter.campaignMember?.campaignId;
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { economyLog: true },
      });
      const coin = currencyTypeToCoinKey(body.currencyType);
      const amounts: Record<CoinKey, number> = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
      amounts[coin] = amount;
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          economyLog: [
            {
              id: crypto.randomUUID(),
              type: "trade",
              direction: "shared",
              title: `${sourceCharacter.name} shared currency with ${targetCharacter.name}`,
              detail: `${amount} ${coin} transferred between party members.`,
              amounts,
              createdAt: new Date().toISOString(),
              createdBy: session.user.name || session.user.email || "Unknown",
            },
            ...toEconomyLog(campaign?.economyLog),
          ].slice(0, 80) as Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json({ ok: true });
  }

  const quantity = Math.max(1, Number(body.quantity) || 0);
  if (quantity <= 0) {
    return NextResponse.json({ error: "Quantity must be greater than zero" }, { status: 400 });
  }

  const sourceItem = await prisma.characterItem.findUnique({
    where: { id: body.itemId },
  });

  if (!sourceItem || sourceItem.characterId !== sourceCharacterId) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (sourceItem.quantity < quantity) {
    return NextResponse.json({ error: "Not enough quantity to transfer" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const actor = session.user.name || session.user.email || "Unknown";
    const matchingTargetItem = await tx.characterItem.findFirst({
      where: {
        characterId: targetCharacter.id,
        name: sourceItem.name,
        equipmentId: sourceItem.equipmentId,
        sourceSessionItemId: sourceItem.sourceSessionItemId,
      },
    });

    if (matchingTargetItem) {
      await tx.characterItem.update({
        where: { id: matchingTargetItem.id },
        data: {
          quantity: matchingTargetItem.quantity + quantity,
          itemHistory: appendItemHistory(
            matchingTargetItem.itemHistory,
            createItemHistoryEntry(
              "trade-received",
              "Received in trade",
              `${quantity} received from ${sourceCharacter.name}.`,
              actor
            )
          ) as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await tx.characterItem.create({
        data: {
          characterId: targetCharacter.id,
          name: sourceItem.name,
          description: sourceItem.description,
          imageUrl: sourceItem.imageUrl,
          category: sourceItem.category,
          rarity: sourceItem.rarity,
          value: sourceItem.value,
          quantity,
          weight: sourceItem.weight,
          isEquipped: false,
          isAttuned: false,
          notes: sourceItem.notes,
          sourceSessionItemId: sourceItem.sourceSessionItemId,
          equipmentId: sourceItem.equipmentId,
          itemHistory: [
            createItemHistoryEntry(
              "trade-received",
              "Received in trade",
              `${quantity} received from ${sourceCharacter.name}.`,
              actor
            ),
          ] as unknown as Prisma.InputJsonValue,
        },
      });
    }

    if (sourceItem.quantity === quantity) {
      await tx.characterItem.delete({ where: { id: sourceItem.id } });
    } else {
      await tx.characterItem.update({
        where: { id: sourceItem.id },
        data: {
          quantity: sourceItem.quantity - quantity,
          itemHistory: appendItemHistory(
            sourceItem.itemHistory,
            createItemHistoryEntry(
              "trade-sent",
              "Shared with party member",
              `${quantity} sent to ${targetCharacter.name}.`,
              actor
            )
          ) as unknown as Prisma.InputJsonValue,
        },
      });
    }
  });

  const campaignId = sourceCharacter.campaignMember?.campaignId;
  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { economyLog: true },
    });
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        economyLog: [
          {
            id: crypto.randomUUID(),
            type: "trade",
            direction: "shared",
            title: `${sourceCharacter.name} shared ${sourceItem.name} with ${targetCharacter.name}`,
            detail: `${quantity} item(s) moved between party members.`,
            amounts: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
            createdAt: new Date().toISOString(),
            createdBy: session.user.name || session.user.email || "Unknown",
          },
          ...toEconomyLog(campaign?.economyLog),
        ].slice(0, 80) as Prisma.InputJsonValue,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
