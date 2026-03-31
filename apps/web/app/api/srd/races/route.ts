import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";

export async function GET() {
  const races = await prisma.race.findMany({
    include: { subraces: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(races);
}
