import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSocketToken } from "@/lib/socket-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    token: createSocketToken({
      id: session.user.id,
      name: session.user.name || session.user.email || "Unknown",
      email: session.user.email,
    }),
  });
}
