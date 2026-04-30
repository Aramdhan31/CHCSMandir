import { cookies } from "next/headers";
import Link from "next/link";
import { OnlinePaymentIntentsPanel } from "@/components/admin/OnlinePaymentIntentsPanel";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  parseMembershipsRole,
} from "@/lib/memberships/adminCookie";
import { supabaseServiceConfigured } from "@/lib/supabase/service";

export default async function OnlineMembershipsAdminPage() {
  const jar = await cookies();
  const raw = jar.get(MEMBERSHIPS_ADMIN_COOKIE)?.value;
  const role = parseMembershipsRole(raw);
  const signedIn = Boolean(role);
  const persistToSupabase = supabaseServiceConfigured();

  if (!signedIn) {
    return (
      <div className="rounded-2xl border-2 border-earth/20 bg-white/80 p-6 text-earth">
        <p className="font-semibold text-deep">Sign in required</p>
        <p className="mt-2 text-sm">
          Please sign in to memberships admin to view online submissions.
        </p>
        <Link
          href="/admin/memberships/login"
          className="mt-4 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-deep"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!persistToSupabase) {
    return (
      <div className="rounded-2xl border-2 border-amber-800/40 bg-amber-100/90 p-6 text-amber-950">
        <p className="font-semibold text-deep">Supabase is not configured</p>
        <p className="mt-2 text-sm">
          Online membership submissions require the server Supabase service role key.
        </p>
      </div>
    );
  }

  return <OnlinePaymentIntentsPanel />;
}

