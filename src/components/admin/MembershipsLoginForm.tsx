"use client";

import { useActionState } from "react";
import { loginMembershipsAdmin } from "@/app/admin/memberships/actions";

export function MembershipsLoginForm() {
  const [state, formAction, pending] = useActionState(loginMembershipsAdmin, null);

  return (
    <form action={formAction} className="mx-auto max-w-md space-y-6">
      <label className="block">
        <span className="mb-2 block text-xl font-bold text-deep">PIN</span>
        <span className="mb-2 block text-lg text-earth">
          Enter the <strong className="text-deep">view</strong> or <strong className="text-deep">edit</strong> PIN you were given, then continue
        </span>
        <input
          type="password"
          name="pin"
          autoComplete="current-password"
          required
          disabled={pending}
          className="w-full min-h-[3.25rem] rounded-xl border-2 border-earth/25 bg-white px-4 py-3 text-xl text-ink outline-none ring-gold/50 focus:border-gold focus:ring-2 disabled:opacity-60"
        />
      </label>
      {state?.error ? (
        <p className="rounded-xl border-2 border-red-800/25 bg-red-50 px-4 py-3 text-lg text-red-950" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-gold px-8 text-xl font-bold text-deep transition hover:bg-saffron disabled:opacity-60"
      >
        {pending ? "Please wait…" : "Open membership list"}
      </button>
    </form>
  );
}
