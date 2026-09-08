export type ApiKeyProvider = "openai" | "anthropic" | "google";

export type MessageRole = "user" | "assistant";

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type ApiKey = {
  id: string;
  user_id: string;
  provider: ApiKeyProvider;
  encrypted_key: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  model_used: string | null;
  created_at: string;
};

export type Memory = {
  id: string;
  user_id: string;
  fact: string;
  category: string | null;
  created_at: string;
  source_message_id: string | null;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<Pick<User, "created_at">> &
          Omit<User, "created_at">;
        Update: Partial<User>;
        Relationships: [];
      };
      api_keys: {
        Row: ApiKey;
        Insert: Partial<Pick<ApiKey, "id" | "created_at">> &
          Omit<ApiKey, "id" | "created_at">;
        Update: Partial<ApiKey>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Pick<Conversation, "id" | "title" | "created_at">> &
          Omit<Conversation, "id" | "title" | "created_at">;
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Partial<Pick<Message, "id" | "model_used" | "created_at">> &
          Omit<Message, "id" | "model_used" | "created_at">;
        Update: Partial<Message>;
        Relationships: [];
      };
      memories: {
        Row: Memory;
        Insert: Partial<
          Pick<Memory, "id" | "category" | "created_at" | "source_message_id">
        > &
          Omit<Memory, "id" | "category" | "created_at" | "source_message_id">;
        Update: Partial<Memory>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
};
