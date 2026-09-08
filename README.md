# Merge

A full-stack chat application starter built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase (database + auth).

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Supabase** — Postgres database, auth, and realtime subscriptions

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in your Supabase project credentials:

   ```bash
   cp .env.local.example .env.local
   ```

3. Apply the database schema in `supabase/migrations/0001_init.sql` to your Supabase project (via the SQL editor or the Supabase CLI).

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) — you should see a "Hello, world!" confirmation page.

## Project structure

```
src/
  app/
    (auth)/login/        Login page
    (auth)/signup/       Signup page
    chat/[roomId]/       Chat room page
    api/messages/        REST route for fetching/sending messages
    page.tsx             Home page
  components/
    chat/                MessageList, MessageInput, RoomList
    ui/                  Shared UI primitives
  hooks/
    useMessages.ts        Realtime message subscription hook
  lib/
    supabase/            Browser, server, and middleware Supabase clients
  types/
    chat.ts              Shared Profile/Room/Message types
supabase/
  migrations/            SQL schema + RLS policies
```
