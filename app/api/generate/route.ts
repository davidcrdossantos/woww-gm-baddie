import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, system } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system:
          system ||
          "You are a world-class direct response copywriter. Be specific, punchy, outcome-led. Never be vague.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Anthropic API error:", res.status, errorBody);
      return NextResponse.json(
        { error: `Anthropic API error: ${res.status} — ${errorBody}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (data.error) {
      console.error("Anthropic returned error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const text = data.content?.[0]?.text || "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Generate route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
