import { cookies } from "next/headers";
import { EventsAdminPanel } from "@/components/admin/EventsAdminPanel";
import { canManageEventsAdmin } from "@/lib/admin/eventsAccess";
import { supabaseServiceConfigured } from "@/lib/supabase/service";

export default async function EventsAdminPage() {
  const jar = await cookies();
  const authed = canManageEventsAdmin(jar);
  const useSupabase = supabaseServiceConfigured();
  return <EventsAdminPanel authed={authed} useSupabase={useSupabase} />;
}

