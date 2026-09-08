-- Initial schema for Merge: a personal AI assistant with per-user
-- provider API keys, conversations, and long-term memory.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic', 'google')),
  encrypted_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  model_used text,
  created_at timestamptz not null default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  fact text not null,
  category text,
  created_at timestamptz not null default now(),
  source_message_id uuid references messages (id) on delete set null
);

create index if not exists api_keys_user_id_idx on api_keys (user_id);
create index if not exists conversations_user_id_idx on conversations (user_id);
create index if not exists messages_conversation_id_idx on messages (conversation_id);
create index if not exists memories_user_id_idx on memories (user_id);
create index if not exists memories_source_message_id_idx on memories (source_message_id);

-- Keep public.users in sync with auth.users so foreign keys above have
-- something to point at as soon as a person signs up.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

alter table users enable row level security;
alter table api_keys enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table memories enable row level security;

create policy "Users can view their own row"
  on users for select to authenticated using (auth.uid() = id);

create policy "Users can update their own row"
  on users for update to authenticated using (auth.uid() = id);

create policy "Users can view their own API keys"
  on api_keys for select to authenticated using (auth.uid() = user_id);

create policy "Users can add their own API keys"
  on api_keys for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own API keys"
  on api_keys for update to authenticated using (auth.uid() = user_id);

create policy "Users can delete their own API keys"
  on api_keys for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view their own conversations"
  on conversations for select to authenticated using (auth.uid() = user_id);

create policy "Users can create their own conversations"
  on conversations for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on conversations for update to authenticated using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on conversations for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view messages in their own conversations"
  on messages for select to authenticated using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can add messages to their own conversations"
  on messages for insert to authenticated with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can delete messages in their own conversations"
  on messages for delete to authenticated using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can view their own memories"
  on memories for select to authenticated using (auth.uid() = user_id);

create policy "Users can add their own memories"
  on memories for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own memories"
  on memories for update to authenticated using (auth.uid() = user_id);

create policy "Users can delete their own memories"
  on memories for delete to authenticated using (auth.uid() = user_id);
