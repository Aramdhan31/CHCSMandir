import { cookies } from "next/headers";
import { MembershipRecordsPanel } from "@/components/admin/MembershipRecordsPanel";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  parseMembershipsRole,
} from "@/lib/memberships/adminCookie";

export default async function MembershipsAdminPage() {
  const jar = await cookies();
  const raw = jar.get(MEMBERSHIPS_ADMIN_COOKIE)?.value;
  const role = parseMembershipsRole(raw);
  const canEdit = role === "edit";

  return <MembershipRecordsPanel canEdit={canEdit} />;
}
