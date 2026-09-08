import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessage, type ModelChoice } from "@/lib/memory/sendMessage";

const VALID_MODELS: ModelChoice[] = ["openai", "anthropic", "google"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { conversationId, message, modelChoice } = body as {
    conversationId?: string;
    message?: string;
    modelChoice?: string;
  };

  if (!conversationId || !message || !modelChoice) {
    return NextResponse.json(
      { error: "conversationId, message, and modelChoice are required" },
      { status: 400 },
    );
  }

  if (!VALID_MODELS.includes(modelChoice as ModelChoice)) {
    return NextResponse.json(
      { error: `modelChoice must be one of: ${VALID_MODELS.join(", ")}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await sendMessage(
      user.id,
      message,
      modelChoice as ModelChoice,
      { supabase, conversationId },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
