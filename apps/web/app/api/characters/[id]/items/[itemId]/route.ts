import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { appendItemHistory, createItemHistoryEntry } from "@/lib/item-history";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: characterId, itemId } = await params;

  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character || character.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.characterItem.findUnique({ where: { id: itemId } });
  if (!existing || existing.characterId !== characterId) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "name",
    "description",
    "imageUrl",
    "category",
    "rarity",
    "value",
    "weight",
    "isEquipped",
    "isAttuned",
    "notes",
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if ("quantity" in body) {
    updateData.quantity = Math.max(1, Number(body.quantity) || 1);
  }

  const actor = session.user.name || session.user.email || "Unknown";
  const changes: string[] = [];
  for (const field of [...allowedFields, "quantity"]) {
    if (!(field in body)) continue;
    const nextValue = field === "quantity" ? Math.max(1, Number(body.quantity) || 1) : body[field];
    const prevValue = existing[field as keyof typeof existing];
    if (JSON.stringify(prevValue ?? null) !== JSON.stringify(nextValue ?? null)) {
      changes.push(`${field} updated`);
    }
  }

  if (changes.length > 0) {
    updateData.itemHistory = appendItemHistory(
      existing.itemHistory,
      createItemHistoryEntry(
        "edit",
        "Item updated",
        changes.join(", "),
        actor
      )
    ) as unknown as Prisma.InputJsonValue;
  }

  const item = await prisma.characterItem.update({
    where: { id: itemId },
    data: updateData,
  });

  return NextResponse.json(item);
}
