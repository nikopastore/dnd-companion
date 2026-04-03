import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { aiChatJSON, checkRateLimit } from "@/lib/ai";
import { getCampaignAccess } from "@/lib/campaign-access";
import {
  appendCharacterNotification,
  createCharacterNotification,
} from "@/lib/character-notifications";
import { getEntityPlaceholderImage } from "@/lib/entity-placeholder";
import { appendItemHistory, createItemHistoryEntry } from "@/lib/item-history";
import {
  resetClassResourcesForLongRest,
  resetClassResourcesForShortRest,
} from "@/lib/rest-automation";

type ParsedIntent = "short_rest_all" | "long_rest_all" | "grant_item";

interface ParsedCommand {
  intent: ParsedIntent;
  targetCharacterIds?: string[];
  summary?: string;
  item?: {
    name: string;
    description: string;
    category?: string | null;
    rarity?: string | null;
    value?: string | null;
    quantity: number;
    imageUrl?: string | null;
  };
}

function refillSlots(value: unknown) {
  if (!value || typeof value !== "object") return value;

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, { current: number; total: number }>>(
    (acc, [slotLevel, slotState]) => {
      if (!slotState || typeof slotState !== "object") return acc;
      const state = slotState as { total?: number };
      const total = Math.max(0, Number(state.total ?? 0) || 0);
      return {
        ...acc,
        [slotLevel]: { current: total, total },
      };
    },
    {}
  );
}

function buildShortRestUpdate(character: {
  classResources: unknown;
  pactSpellSlotsState: unknown;
}) {
  return {
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    pactSpellSlotsState: refillSlots(character.pactSpellSlotsState),
    classResources: resetClassResourcesForShortRest(
      (character.classResources as Record<string, unknown> | null) ?? null
    ),
  };
}

function buildLongRestUpdate(character: {
  maxHP: number;
  hitDiceTotal: number;
  exhaustionLevel: number;
  classResources: unknown;
  spellSlotsState: unknown;
  pactSpellSlotsState: unknown;
}) {
  return {
    currentHP: character.maxHP,
    tempHP: 0,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    hitDiceRemaining: character.hitDiceTotal,
    exhaustionLevel: Math.max(0, character.exhaustionLevel - 1),
    concentrationSpell: null,
    spellSlotsState: refillSlots(character.spellSlotsState),
    pactSpellSlotsState: refillSlots(character.pactSpellSlotsState),
    classResources: resetClassResourcesForLongRest(
      (character.classResources as Record<string, unknown> | null) ?? null
    ),
  };
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildBasicItem(itemPhrase: string, quantity: number) {
  const normalized = itemPhrase.trim().toLowerCase();
  if (normalized.includes("healing potion") || normalized.includes("potion of healing")) {
    return {
      name: "Potion of Healing",
      description: "A standard crimson restorative that restores a modest amount of health when consumed.",
      category: "potions",
      rarity: "common",
      value: "50 gp",
      quantity,
      imageUrl: getEntityPlaceholderImage("item", "Potion of Healing"),
    };
  }

  const name = titleCase(itemPhrase.replace(/\bpotions?\b/i, "potion").replace(/\s+/g, " ").trim());
  return {
    name,
    description: `A campaign item created from a DM AI command: ${name}.`,
    category: normalized.includes("potion")
      ? "potions"
      : normalized.includes("sword") || normalized.includes("bow") || normalized.includes("axe")
        ? "weapons"
        : "gear",
    rarity: "common",
    value: null,
    quantity,
    imageUrl: getEntityPlaceholderImage("item", name),
  };
}

function parseWithHeuristics(
  command: string,
  characters: Array<{ id: string; name: string }>
): ParsedCommand | null {
  const normalized = command.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("short rest") && /(all|party|players|everyone)/.test(normalized)) {
    return { intent: "short_rest_all", summary: "Applied a short rest to all player characters." };
  }

  if (normalized.includes("long rest") && /(all|party|players|everyone)/.test(normalized)) {
    return { intent: "long_rest_all", summary: "Applied a long rest to all player characters." };
  }

  if (/^(give|grant)\b/.test(normalized)) {
    const quantityMatch = normalized.match(/\b(\d+)\b/);
    const quantity = quantityMatch ? Math.max(1, Number(quantityMatch[1]) || 1) : 1;
    const beforeQuantity = quantityMatch
      ? normalized.slice(0, quantityMatch.index).replace(/^(give|grant)\s+/, "").trim()
      : normalized;
    const afterQuantity = quantityMatch
      ? normalized.slice((quantityMatch.index ?? 0) + quantityMatch[0].length).trim()
      : "";

    const targetedCharacters = characters.filter((character) => normalized.includes(character.name.toLowerCase()));
    const targetCharacterIds =
      targetedCharacters.length > 0
        ? targetedCharacters.map((character) => character.id)
        : /(all|party|players|everyone)/.test(beforeQuantity)
          ? characters.map((character) => character.id)
          : [];

    if (targetCharacterIds.length > 0 && afterQuantity) {
      return {
        intent: "grant_item",
        targetCharacterIds,
        item: buildBasicItem(afterQuantity, quantity),
        summary: `Granted ${quantity} ${afterQuantity} to ${targetedCharacters.map((character) => character.name).join(", ") || "the party"}.`,
      };
    }
  }

  return null;
}

async function parseWithAi(
  command: string,
  characters: Array<{ id: string; name: string }>
): Promise<ParsedCommand> {
  const response = await aiChatJSON<{
    intent?: string;
    targetCharacterNames?: string[];
    item?: {
      name?: string;
      description?: string;
      category?: string | null;
      rarity?: string | null;
      value?: string | null;
      quantity?: number;
    };
    summary?: string;
  }>([
    {
      role: "system",
      content: `You convert DM commands into supported action JSON. Only return valid JSON.
Supported intents are "short_rest_all", "long_rest_all", and "grant_item".
For item grants, targetCharacterNames must exactly match one of the provided campaign character names.`,
    },
    {
      role: "user",
      content: `Campaign characters: ${characters.map((character) => character.name).join(", ")}\nDM command: ${command}`,
    },
  ]);

  const intent =
    response.intent === "short_rest_all" || response.intent === "long_rest_all" || response.intent === "grant_item"
      ? response.intent
      : null;

  if (!intent) {
    throw new Error("Could not understand that campaign command.");
  }

  if (intent !== "grant_item") {
    return {
      intent,
      summary:
        typeof response.summary === "string" && response.summary.trim()
          ? response.summary.trim()
          : intent === "short_rest_all"
            ? "Applied a short rest to all player characters."
            : "Applied a long rest to all player characters.",
    };
  }

  const targetCharacterIds = Array.isArray(response.targetCharacterNames)
    ? response.targetCharacterNames
        .map((targetName) => characters.find((character) => character.name === targetName)?.id)
        .filter((value): value is string => Boolean(value))
    : [];

  if (targetCharacterIds.length === 0 || !response.item?.name) {
    throw new Error("The AI command did not resolve a valid target character and item.");
  }

  return {
    intent: "grant_item",
    targetCharacterIds,
    item: {
      name: response.item.name,
      description: response.item.description || `A DM AI command created item: ${response.item.name}.`,
      category: response.item.category || "gear",
      rarity: response.item.rarity || "common",
      value: response.item.value || null,
      quantity: Math.max(1, Number(response.item.quantity ?? 1) || 1),
      imageUrl: getEntityPlaceholderImage("item", response.item.name),
    },
    summary:
      typeof response.summary === "string" && response.summary.trim()
        ? response.summary.trim()
        : `Granted ${response.item.quantity ?? 1} ${response.item.name}.`,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const access = await getCampaignAccess(campaignId, session.user.id);
  if (!access.campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!access.canManageCampaign) {
    return NextResponse.json({ error: "Only the DM team can run campaign AI commands." }, { status: 403 });
  }

  const rate = checkRateLimit(session.user.id);
  if (!rate.allowed) {
    return NextResponse.json({ error: "AI rate limit reached for this hour." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const command = String(body.command || "").trim();
  if (!command) {
    return NextResponse.json({ error: "Command text is required." }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      members: {
        include: {
          character: true,
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const playerCharacters = campaign.members
    .filter((member) => member.role === "PLAYER" && member.character)
    .map((member) => member.character!)
    .filter(Boolean);

  if (playerCharacters.length === 0) {
    return NextResponse.json({ error: "This campaign has no player characters to target." }, { status: 400 });
  }

  let parsed = parseWithHeuristics(
    command,
    playerCharacters.map((character) => ({ id: character.id, name: character.name }))
  );

  if (!parsed) {
    try {
      parsed = await parseWithAi(
        command,
        playerCharacters.map((character) => ({ id: character.id, name: character.name }))
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "The campaign AI could not interpret that command." },
        { status: 400 }
      );
    }
  }

  const actor = session.user.name || session.user.email || "Unknown";

  if (parsed.intent === "short_rest_all" || parsed.intent === "long_rest_all") {
    const restIntent = parsed.intent;
    await prisma.$transaction(
      playerCharacters.map((character) =>
        prisma.character.update({
          where: { id: character.id },
          data: {
            ...(restIntent === "short_rest_all"
              ? buildShortRestUpdate(character)
              : buildLongRestUpdate(character)),
            pendingNotifications: appendCharacterNotification(
              (character as { pendingNotifications?: unknown }).pendingNotifications,
              createCharacterNotification(
                "rest_applied",
                restIntent === "short_rest_all" ? "Short Rest Granted" : "Long Rest Granted",
                restIntent === "short_rest_all"
                  ? "The DM applied a short rest to the party. Your recoverable resources were refreshed."
                  : "The DM applied a long rest to the party. Your sheet has been restored.",
                {
                  metadata: { restType: restIntent === "short_rest_all" ? "short rest" : "long rest" },
                }
              )
            ) as unknown as Prisma.InputJsonValue,
          } as Prisma.CharacterUpdateInput,
        })
      )
    );

    return NextResponse.json({
      ok: true,
      intent: parsed.intent,
      summary:
        parsed.summary ||
        `Applied ${parsed.intent === "short_rest_all" ? "a short rest" : "a long rest"} to ${playerCharacters.length} characters.`,
    });
  }

  const targetIds = new Set(parsed.targetCharacterIds || []);
  const targets = playerCharacters.filter((character) => targetIds.has(character.id));
  if (targets.length === 0 || !parsed.item) {
    return NextResponse.json({ error: "No valid target characters were resolved for that item grant." }, { status: 400 });
  }
  const item = parsed.item;

  await prisma.$transaction(async (tx) => {
    for (const character of targets) {
      const matchingItem = await tx.characterItem.findFirst({
        where: {
          characterId: character.id,
          name: item.name,
          category: item.category || undefined,
          rarity: item.rarity || undefined,
        },
      });

      if (matchingItem) {
        await tx.characterItem.update({
          where: { id: matchingItem.id },
          data: {
            quantity: matchingItem.quantity + item.quantity,
            itemHistory: appendItemHistory(
              matchingItem.itemHistory,
              createItemHistoryEntry(
                "grant",
                "Granted by campaign AI",
                `${item.quantity} added by ${actor} through the campaign AI command center.`,
                actor
              )
            ) as unknown as Prisma.InputJsonValue,
          },
        });
      } else {
        await tx.characterItem.create({
          data: {
            characterId: character.id,
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl || null,
            category: item.category || null,
            rarity: item.rarity || null,
            value: item.value || null,
            quantity: item.quantity,
            notes: "Granted by campaign AI",
            itemHistory: [
              createItemHistoryEntry(
                "grant",
                "Granted by campaign AI",
                `${item.quantity} granted by ${actor} through the campaign AI command center.`,
                actor
              ),
            ] as unknown as Prisma.InputJsonValue,
          },
        });
      }

      await tx.character.update({
        where: { id: character.id },
        data: {
          pendingNotifications: appendCharacterNotification(
            (character as { pendingNotifications?: unknown }).pendingNotifications,
            createCharacterNotification(
              "item_received",
              `Received ${item.name}`,
              `${item.quantity} ${item.quantity === 1 ? "copy" : "copies"} added to your inventory by the DM.`,
              {
                imageUrl: item.imageUrl || null,
                metadata: {
                  quantity: item.quantity,
                  itemName: item.name,
                },
              }
            )
          ) as unknown as Prisma.InputJsonValue,
        } as Prisma.CharacterUpdateInput,
      });
    }
  });

  return NextResponse.json({
    ok: true,
    intent: parsed.intent,
    summary:
      parsed.summary ||
      `Granted ${item.quantity} ${item.name} to ${targets.map((character) => character.name).join(", ")}.`,
  });
}
