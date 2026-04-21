"use client";

import { useActionState } from "react";
import { loginUnifiedAdmin } from "@/app/admin/login/actions";

function pinHelperLine(nextPath: string): string {
  if (nextPath.startsWith("/admin/events")) {
    return "Use the events PIN you were given (you will return to Events admin).";
  }
  if (nextPath.startsWith("/admin/memberships")) {
    return "Use the memberships PIN you were given (you will return to Memberships admin).";
  }
  return "Use the committee PIN you were given.";
}

export function UnifiedAdminLoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginUnifiedAdmin, null);

  return (
    <form action={formAction} className="mx-auto max-w-md space-y-6">
      <input type="hidden" name="next" value={nextPath} />

      <label className="block">
        <span className="mb-2 block text-xl font-bold text-deep sm:text-2xl">PIN</span>
        <span className="mb-2 block text-base leading-relaxed text-earth sm:text-lg">
          {pinHelperLine(nextPath)}
        </span>
        <input
          type="password"
          name="pin"
          autoComplete="current-password"
          inputMode="numeric"
          enterKeyHint="go"
          required
          disabled={pending}
          className="w-full min-h-[3.5rem] rounded-xl border-2 border-earth/25 bg-white px-4 py-3 text-2xl text-ink outline-none ring-gold/50 focus:border-gold focus:ring-2 disabled:opacity-60 sm:min-h-[3.75rem] sm:text-3xl"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-4 rounded-xl border-2 border-earth/15 bg-parchment-muted/40 px-4 py-4 sm:px-5">
        <input
          type="checkbox"
          name="remember"
          value="on"
          className="mt-1 size-6 shrink-0 rounded border-earth/40 text-gold focus:ring-gold"
        />
        <span className="text-base leading-snug text-earth sm:text-lg">
          <span className="font-semibold text-deep">Remember this device</span> — stay signed in longer
          on this phone or laptop.
        </span>
      </label>

      {state?.error ? (
        <p
          className="rounded-xl border-2 border-red-800/25 bg-red-50 px-4 py-3 text-base text-red-950 sm:text-lg"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[3.75rem] w-full items-center justify-center rounded-full bg-gold px-8 text-xl font-bold text-deep transition hover:bg-saffron disabled:opacity-60 sm:text-2xl"
      >
        {pending ? "Please wait…" : "Continue"}
      </button>
    </form>
  );
}
