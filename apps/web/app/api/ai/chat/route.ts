import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiChat, checkRateLimit, type AIMessage } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const rateCheck = checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", remaining: 0, resetAt: rateCheck.resetAt },
      { status: 429 }
    );
  }

  const { messages, model, maxTokens } = await request.json() as {
    messages: AIMessage[];
    model?: string;
    maxTokens?: number;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages are required" }, { status: 400 });
  }

  try {
    const response = await aiChat(messages, { model, maxTokens, stream: false });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `AI service error: ${response.status}`, details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      content,
      remaining: rateCheck.remaining,
      model: data.model,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "AI request failed", details: String(error) },
      { status: 500 }
    );
  }
}
