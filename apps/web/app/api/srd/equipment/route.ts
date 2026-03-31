import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const equipment = await prisma.equipment.findMany({
    where: category ? { category: { contains: category, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(equipment);
}
