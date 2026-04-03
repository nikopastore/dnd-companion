import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { removeCharacterNotifications } from "@/lib/character-notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
  if (character.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const notificationIds = Array.isArray(body.notificationIds)
    ? body.notificationIds.map((entry: unknown) => String(entry)).filter(Boolean)
    : [];

  if (notificationIds.length === 0) {
    return NextResponse.json({ error: "Notification ids are required" }, { status: 400 });
  }

  const updated = await prisma.character.update({
    where: { id },
    data: {
      pendingNotifications: removeCharacterNotifications(
        character.pendingNotifications,
        notificationIds
      ) as unknown as Prisma.InputJsonValue,
    } as Prisma.CharacterUpdateInput,
  });

  return NextResponse.json({
    pendingNotifications: (updated as { pendingNotifications?: unknown }).pendingNotifications ?? null,
  });
}
