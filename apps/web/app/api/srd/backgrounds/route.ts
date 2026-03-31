import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";

export async function GET() {
  const backgrounds = await prisma.background.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(backgrounds);
}
