import type { Message } from "@/types/schema";

export function MessageList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No messages yet — say something to get started.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
            message.role === "user"
              ? "self-end bg-blue-600 text-white"
              : "self-start bg-gray-100 text-gray-900"
          }`}
        >
          {message.role === "assistant" && message.model_used && (
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              {message.model_used}
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </li>
      ))}
    </ul>
  );
}
