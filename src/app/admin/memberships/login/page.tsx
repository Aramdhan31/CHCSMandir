import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function MembershipsLoginRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = sp.next?.trim();
  const candidate = raw && raw.startsWith("/") ? raw : "/admin/memberships";
  const safe =
    candidate.startsWith("/admin") && !candidate.startsWith("//")
      ? candidate
      : "/admin/memberships";
  redirect(`/admin/login?next=${encodeURIComponent(safe)}`);
}
