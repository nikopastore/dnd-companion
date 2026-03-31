import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const withLevels = searchParams.get("levels") === "true";

  const classes = await prisma.characterClass.findMany({
    include: withLevels ? { levels: { orderBy: { level: "asc" } } } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(classes);
}
