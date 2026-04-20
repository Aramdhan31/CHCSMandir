"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabase, supabaseEnvConfigured } from "@/lib/supabase";

type Item = {
  id: number;
  user_id: string;
  title: string;
  done: boolean;
  created_at: string;
};

const inputClass =
  "mt-1 block w-full max-w-md rounded-lg border border-earth/25 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2";

export default function SupabaseTestPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const envOk = supabaseEnvConfigured();

  const loadItems = useCallback(async () => {
    setMessage(null);
    if (!supabaseEnvConfigured()) return;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }
    setItems((data as Item[]) ?? []);
  }, []);

  useEffect(() => {
    if (!envOk) {
      setMessage("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.");
      return;
    }

    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
      void loadItems();
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionEmail(session?.user?.email ?? null);
      void loadItems();
    });

    return () => subscription.unsubscribe();
  }, [envOk, loadItems]);

  async function signUp() {
    setMessage(null);
    if (!supabaseEnvConfigured()) return;
    const supabase = getSupabase();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Check your email to confirm sign-up, or sign in if email confirmation is off.");
  }

  async function signIn() {
    setMessage(null);
    if (!supabaseEnvConfigured()) return;
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  }

  async function signOut() {
    setMessage(null);
    if (!supabaseEnvConfigured()) return;
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setItems([]);
  }

  async function addItem() {
    if (!title.trim()) return;
    setMessage(null);
    if (!supabaseEnvConfigured()) return;
    const supabase = getSupabase();
    const { error } = await supabase.from("items").insert({ title: title.trim() });
    if (error) {
      setMessage(error.message);
      return;
    }
    setTitle("");
    await loadItems();
  }

  return (
    <div className="min-h-screen bg-parchment px-4 py-10 text-ink">
      <div className="mx-auto max-w-xl space-y-8">
        <div>
          <p className="text-sm text-earth">
            <Link href="/" className="font-medium text-gold-dim underline-offset-2 hover:underline">
              ← Home
            </Link>
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-deep">Supabase test</h1>
          <p className="mt-2 text-earth">
            Sign up / sign in, then add items. With RLS, each user only sees their own rows.
          </p>
        </div>

        {!envOk ? (
          <p className="rounded-lg border border-amber-800/30 bg-amber-50 px-4 py-3 text-deep" role="status">
            Missing Supabase env vars. Copy <code className="text-sm">.env.example</code> into{" "}
            <code className="text-sm">.env.local</code> and fill URL + anon key, then restart{" "}
            <code className="text-sm">npm run dev</code>.
          </p>
        ) : null}

        {message ? (
          <p className="rounded-lg border border-earth/20 bg-white px-4 py-3 text-earth" role="status">
            {message}
          </p>
        ) : null}

        <section className="space-y-3 rounded-xl border border-gold/25 bg-white/80 p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-deep">Account</h2>
          {sessionEmail ? (
            <p className="text-earth">
              Signed in as <strong className="text-deep">{sessionEmail}</strong>
            </p>
          ) : (
            <p className="text-earth">Not signed in — items may be empty or blocked by RLS.</p>
          )}
          <label className="block text-sm font-medium text-deep">
            Email
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-deep">
            Password
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void signUp()}
              className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-deep hover:bg-saffron"
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => void signIn()}
              className="rounded-full border border-earth/25 px-4 py-2 text-sm font-semibold text-deep hover:border-gold"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full border border-earth/25 px-4 py-2 text-sm font-semibold text-deep hover:border-gold"
            >
              Sign out
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-gold/25 bg-white/80 p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-deep">Items</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className={`${inputClass} max-w-xs flex-1`}
              placeholder="New item title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void addItem()}
              className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-deep hover:bg-saffron"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => void loadItems()}
              className="rounded-full border border-earth/25 px-4 py-2 text-sm font-semibold text-deep hover:border-gold"
            >
              Refresh list
            </button>
          </div>
          <ul className="list-inside list-disc space-y-1 text-earth">
            {items.length === 0 ? (
              <li className="list-none text-earth">No items yet (or not allowed until you sign in).</li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <span className="text-deep">{item.title}</span> {item.done ? "✅" : ""}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
