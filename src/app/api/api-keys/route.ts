import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptApiKey } from "@/lib/memory/apiKeyEncryption";
import type { ApiKeyProvider } from "@/types/schema";

const VALID_PROVIDERS: ApiKeyProvider[] = ["openai", "anthropic", "google"];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("provider")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const connectedProviders = [...new Set(data.map((row) => row.provider))];
  return NextResponse.json({ connectedProviders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { provider, apiKey } = body as { provider?: string; apiKey?: string };

  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: "provider and apiKey are required" },
      { status: 400 },
    );
  }

  if (!VALID_PROVIDERS.includes(provider as ApiKeyProvider)) {
    return NextResponse.json(
      { error: `provider must be one of: ${VALID_PROVIDERS.join(", ")}` },
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

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    provider: provider as ApiKeyProvider,
    encrypted_key: encryptApiKey(apiKey),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
