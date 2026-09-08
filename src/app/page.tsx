import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Hello, world!
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Merge is up and running — Next.js, TypeScript, Tailwind &amp; Supabase.
      </p>
      <Link
        href="/login"
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Log in to chat
      </Link>
    </main>
  );
}
