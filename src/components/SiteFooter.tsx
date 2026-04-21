import { footer, site, visit } from "@/content/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const address = visit.addressLines.join(", ");
  return (
    <footer className="border-t border-gold/20 bg-deep text-parchment">
      <div className="mx-auto max-w-2xl px-4 py-10 text-center sm:px-6 sm:py-12">
        <p className="font-display text-base font-semibold leading-snug text-parchment sm:text-lg">
          {site.nameFull}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-parchment-muted">{address}</p>
        <p className="mt-6 text-xs leading-relaxed text-parchment-muted/90 sm:text-sm">
          Copyright © {year} {site.nameFull}. {footer.rightsReserved}
        </p>
        <p className="mt-5 text-xs text-parchment-muted/90">
          <a
            href={footer.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gold underline-offset-4 transition hover:text-parchment hover:underline"
          >
            {footer.officialFacebookLabel}
          </a>
        </p>
        <p className="mt-2 text-[0.7rem] text-parchment-muted/80">
          <a
            href="https://arpk.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gold underline-offset-4 transition hover:text-parchment hover:underline"
          >
            Built by Arjun Ramdhan
          </a>
        </p>
      </div>
    </footer>
  );
}
