import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classFilter = searchParams.get("class");
  const levelFilter = searchParams.get("level");

  const spells = await prisma.spell.findMany({
    where: {
      ...(classFilter ? { classes: { has: classFilter.toLowerCase() } } : {}),
      ...(levelFilter ? { level: parseInt(levelFilter) } : {}),
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(spells);
}
