"use client";

import type { ApiKeyProvider } from "@/types/schema";

const MODEL_OPTIONS: { value: ApiKeyProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
];

export function ModelSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: ApiKeyProvider;
  onChange: (value: ApiKeyProvider) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as ApiKeyProvider)}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {MODEL_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
