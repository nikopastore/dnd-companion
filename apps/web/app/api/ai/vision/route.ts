import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiVision, checkRateLimit } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", remaining: 0 },
      { status: 429 }
    );
  }

  const { image, prompt } = await request.json() as {
    image: string; // base64 encoded
    prompt: string;
  };

  if (!image || !prompt) {
    return NextResponse.json({ error: "Image and prompt are required" }, { status: 400 });
  }

  try {
    const content = await aiVision(image, prompt);

    return NextResponse.json({
      content,
      remaining: rateCheck.remaining,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Vision request failed", details: String(error) },
      { status: 500 }
    );
  }
}
