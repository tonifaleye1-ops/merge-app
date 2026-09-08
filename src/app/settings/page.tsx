"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ApiKeyProvider } from "@/types/schema";

const PROVIDER_OPTIONS: { value: ApiKeyProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
];

export default function SettingsPage() {
  const [connectedProviders, setConnectedProviders] = useState<ApiKeyProvider[]>([]);
  const [provider, setProvider] = useState<ApiKeyProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => res.json())
      .then((body) => setConnectedProviders(body.connectedProviders ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to save key");
      }

      setConnectedProviders((current) => [...new Set([...current, provider])]);
      setApiKey("");
      setNotice(`${labelFor(provider)} key saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">API keys</h1>
        <Link href="/chat" className="text-sm text-blue-600">
          Back to chat
        </Link>
      </div>

      <div className="text-sm text-gray-600">
        {PROVIDER_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <span>{connectedProviders.includes(option.value) ? "✅" : "⬜"}</span>
            <span>{option.label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <select
          value={provider}
          onChange={(event) => setProvider(event.target.value as ApiKeyProvider)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PROVIDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="password"
          required
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="Paste your API key"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm text-green-600">{notice}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save key"}
        </button>
      </form>
    </main>
  );
}

function labelFor(provider: ApiKeyProvider): string {
  return PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider;
}
