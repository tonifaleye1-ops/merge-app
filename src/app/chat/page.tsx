"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { ModelSelect } from "@/components/chat/ModelSelect";
import { createClient } from "@/lib/supabase/client";
import type { ApiKeyProvider, Message } from "@/types/schema";

export default function ChatPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [modelChoice, setModelChoice] = useState<ApiKeyProvider>("anthropic");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const conversationRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "Test conversation" }),
        });

        if (conversationRes.status === 401) {
          router.push("/login");
          return;
        }

        const conversationBody = await conversationRes.json();

        if (!conversationRes.ok) {
          throw new Error(conversationBody.error ?? "Failed to start a conversation");
        }

        setConversationId(conversationBody.conversation.id);

        const messagesRes = await fetch(
          `/api/messages?conversationId=${conversationBody.conversation.id}`,
        );
        if (messagesRes.ok) {
          const { messages: existing } = await messagesRes.json();
          setMessages(existing ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start chat");
      }
    }

    init();
  }, [router]);

  async function handleSend(content: string) {
    if (!conversationId) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId, message: content, modelChoice }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to send message");
      }

      setMessages((current) => [...current, body.userMessage, body.assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  async function handleLogOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Merge chat (test)</h1>
        <div className="flex items-center gap-3">
          <ModelSelect
            value={modelChoice}
            onChange={setModelChoice}
            disabled={isSending}
          />
          <Link href="/settings" className="text-sm text-blue-600">
            API keys
          </Link>
          <button
            type="button"
            onClick={handleLogOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 p-4">
        <MessageList messages={messages} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <MessageInput onSend={handleSend} disabled={!conversationId || isSending} />
    </main>
  );
}
