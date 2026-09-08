import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MessageRole } from "@/types/schema";

const VALID_ROLES: MessageRole[] = ["user", "assistant"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { conversationId, role, content, modelUsed } = body as {
    conversationId?: string;
    role?: string;
    content?: string;
    modelUsed?: string;
  };

  if (!conversationId || !content || !role) {
    return NextResponse.json(
      { error: "conversationId, role, and content are required" },
      { status: 400 },
    );
  }

  if (!VALID_ROLES.includes(role as MessageRole)) {
    return NextResponse.json(
      { error: `role must be one of: ${VALID_ROLES.join(", ")}` },
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

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: role as MessageRole,
      content,
      model_used: modelUsed ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
