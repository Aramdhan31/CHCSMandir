import { previewBanner } from "@/content/site";

export function PreviewBanner() {
  if (!previewBanner) return null;
  return (
    <div
      className="border-b border-gold/40 bg-deep px-4 py-2 text-center text-sm text-parchment"
      role="status"
    >
      {previewBanner}
    </div>
  );
}
