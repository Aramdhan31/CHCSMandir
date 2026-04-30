/**
 * CHCS website copy — single source of truth (aligned with chcstemple.org).
 * Optional preview strip: set NEXT_PUBLIC_PREVIEW_BANNER in .env.local
 */

export const previewBanner =
  process.env.NEXT_PUBLIC_PREVIEW_BANNER?.trim() || null;

export const site = {
  nameShort: "CHCS",
  nameFull: "Caribbean Hindu Cultural Society",
  tagline:
    "A Hindu temple in Brixton, south London - open to all generations and backgrounds, honouring diverse traditions and cultures while nurturing unity, inclusion, and spiritual growth for all.",
} as const;

/**
 * Navbar uses `public/logo.png` as shown. Tab icons: prefer `public/favicon.png` → `npm run icons`; else `logo-nav.png` from `npm run logo`.
 */
export const brand = {
  /** Master asset: public/logo.png */
  logoSrc: "/logo.png",
  logoAlt: `${site.nameFull} — Om`,
  /** Ultra-short (e.g. legacy links); header uses site.nameFull */
  wordmark: site.nameShort,
  /** Browser tab, install name, Open Graph short line — `npm run icons` uses public/favicon.png */
  appName: "CHCS Mandir",
} as const;

export const hero = {
  eyebrow: "Welcome",
  /** Full line for metadata / accessibility; hero displays `titleLines` on two lines. */
  title: "Welcome to Caribbean Hindu Cultural Society",
  titleLines: ["Welcome to Caribbean", "Hindu Cultural Society"] as const,
  quote:
    "You are what you believe in — you become that which you believe you can become.",
  quoteCitation: "Bhagavad Gita 17.3",
  primaryCtaLabel: "See upcoming events",
  primaryCtaHash: "#events",
  /** Right column of the welcome row (original single hero image) */
  homeImageSrc: "/mandir-exterior.jpg",
  homeImageAlt:
    "Front of the CHCS mandir — 16 Ostade Road, London SW2",
  /** Gallery below the welcome row */
  templeGalleryTitle: "Our temple",
  templeGalleryId: "temple",
  templeGalleryIntro:
    "The face of our mandir in Brixton and the sanctuary where we gather.",
  homeImages: [
    {
      src: "/mandir-exterior.jpg",
      alt: "Front of the CHCS mandir — brick building and entrance at 16 Ostade Road, London SW2",
      label: "Front of the mandir",
      // Use contain so the full building (including bottom) is always visible.
      galleryImageClass: "object-contain object-center",
    },
    {
      src: "/mandir-interior.jpg",
      alt: "Inside the CHCS mandir — wooden shrine canopy with Rama, Sita and Lakshmana, flower garlands, framed pictures and golden Om decorations",
      label: "Inside the mandir",
    },
  ] as const,
} as const;

/** One card on the home page events grid — add objects to `events.items` when you have dates */
export type SiteEventItem = {
  dateLabel: string;
  title: string;
  summary?: string;
  imageSrc?: string;
  /** Optional ISO date used for sorting / calendar links. */
  dateIso?: string;
  /** Optional local time (24h) `HH:MM` or `HH:MM:SS` (as returned by Supabase). */
  time?: string;
  href?: string;
  cta?: string;
};

/**
 * Titles reserved for events that are always generated on the site
 * (not managed in the admin Events UI).
 */
export const recurringEventTitles = {
  monthlySatsang: "Next Monthly Satsang",
  bhajanSatsang: "Next Bhajan Satsang",
} as const;

function getLondonYmd(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: "year" | "month" | "day") =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const year = get("year");
  const month = get("month"); // 1-12
  const day = get("day"); // 1-31
  return { year, month, day };
}

function utcNoonDate(year: number, monthIndex0: number, day: number) {
  return new Date(Date.UTC(year, monthIndex0, day, 12, 0, 0));
}

function firstSundayOfMonthUtcNoon(year: number, monthIndex0: number) {
  const first = utcNoonDate(year, monthIndex0, 1);
  const dow = first.getUTCDay(); // 0=Sun
  const offset = (7 - dow) % 7;
  return utcNoonDate(year, monthIndex0, 1 + offset);
}

function firstSaturdayOfMonthUtcNoon(year: number, monthIndex0: number) {
  const first = utcNoonDate(year, monthIndex0, 1);
  const dow = first.getUTCDay(); // 0=Sun ... 6=Sat
  const offset = (6 - dow + 7) % 7;
  return utcNoonDate(year, monthIndex0, 1 + offset);
}

function formatLondonEventDateLabel(dateUtcNoon: Date, timeLabel: string) {
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dateUtcNoon);
  return `${date} · ${timeLabel}`;
}

export function getNextMonthlySatsangEvent(now = new Date()): SiteEventItem {
  const { year, month, day } = getLondonYmd(now);
  const thisMonthIndex0 = month - 1;
  const todayUtcNoon = utcNoonDate(year, thisMonthIndex0, day);

  const thisMonthFirstSunday = firstSundayOfMonthUtcNoon(year, thisMonthIndex0);
  const mondayAfter = new Date(thisMonthFirstSunday.getTime());
  mondayAfter.setUTCDate(mondayAfter.getUTCDate() + 1);

  const target = todayUtcNoon >= mondayAfter
    ? firstSundayOfMonthUtcNoon(
        thisMonthIndex0 === 11 ? year + 1 : year,
        (thisMonthIndex0 + 1) % 12,
      )
    : thisMonthFirstSunday;

  const y = target.getUTCFullYear();
  const m = String(target.getUTCMonth() + 1).padStart(2, "0");
  const d = String(target.getUTCDate()).padStart(2, "0");
  const icsParams = new URLSearchParams({
    title: "Monthly Satsang (CHCS)",
    date: `${y}-${m}-${d}`,
    time: "11:00",
    summary: "1st Sunday of every month. All are welcome.",
  });
  const href = `/events/ics?${icsParams.toString()}`;
  const dateIso = `${y}-${m}-${d}`;

  return {
    title: recurringEventTitles.monthlySatsang,
    dateLabel: formatLondonEventDateLabel(target, "11:00am"),
    summary: "1st Sunday of every month. All are welcome.",
    imageSrc: "/monthly-satsang-sanitized.jpg",
    dateIso,
    time: "11:00",
    href,
    cta: "Add to calendar",
  };
}

export function getNextBhajanSatsangEvent(now = new Date()): SiteEventItem {
  const { year, month, day } = getLondonYmd(now);
  const thisMonthIndex0 = month - 1;
  const todayUtcNoon = utcNoonDate(year, thisMonthIndex0, day);

  const thisMonthFirstSaturday = firstSaturdayOfMonthUtcNoon(year, thisMonthIndex0);
  const thisMonthSecondSaturday = new Date(thisMonthFirstSaturday.getTime());
  thisMonthSecondSaturday.setUTCDate(thisMonthSecondSaturday.getUTCDate() + 7);

  // Only mark ended the day after the event date (same convention as other cards).
  const mondayAfter = new Date(thisMonthSecondSaturday.getTime());
  mondayAfter.setUTCDate(mondayAfter.getUTCDate() + 2);

  const target = todayUtcNoon >= mondayAfter
    ? (() => {
        const nextMonthIndex0 = (thisMonthIndex0 + 1) % 12;
        const nextYear = thisMonthIndex0 === 11 ? year + 1 : year;
        const firstSat = firstSaturdayOfMonthUtcNoon(nextYear, nextMonthIndex0);
        const secondSat = new Date(firstSat.getTime());
        secondSat.setUTCDate(secondSat.getUTCDate() + 7);
        return secondSat;
      })()
    : thisMonthSecondSaturday;

  const y = target.getUTCFullYear();
  const m = String(target.getUTCMonth() + 1).padStart(2, "0");
  const d = String(target.getUTCDate()).padStart(2, "0");
  const icsParams = new URLSearchParams({
    title: "Bhajan Satsang (CHCS)",
    date: `${y}-${m}-${d}`,
    time: "15:00",
    summary: "2nd Saturday of every month, 3pm–5pm. All are welcome.",
  });
  const href = `/events/ics?${icsParams.toString()}`;
  const dateIso = `${y}-${m}-${d}`;

  return {
    title: recurringEventTitles.bhajanSatsang,
    dateLabel: formatLondonEventDateLabel(target, "3:00pm"),
    summary: "2nd Saturday of every month, 3pm–5pm. All are welcome.",
    imageSrc: "/Screenshot%202026-04-30%20at%2013.22.19.png",
    dateIso,
    time: "15:00",
    href,
    cta: "Add to calendar",
  };
}

export const events = {
  sectionTitle: "Upcoming events",
  /** Shown beside the section title while dated event cards are not on the site yet */
  comingSoonLabel: "Coming soon",
  intro: `All are welcome at ${site.nameFull}, 16 Ostade Road, London SW2.`,
  /** Shown when there are no `items` cards yet */
  comingSoonBody:
    "A short list of highlighted dates on this page is coming soon — scroll down for the live mandir Google Calendar.",
  items: [] as readonly SiteEventItem[],
} as const;

const MANDIR_CALENDAR_ID =
  "688493520a99bf5168987b9398726f53c8d3b0ede4b0f60bb4663474e234c76b@group.calendar.google.com";

/** Shared CHCS mandir calendar (hosted on Google; usable from Google, Apple, Outlook, etc.) */
export const mandirCalendar = {
  /** Opens in Google Calendar (browse on web or app) */
  openUrl:
    "https://calendar.google.com/calendar/u/0?cid=Njg4NDkzNTIwYTk5YmY1MTY4OTg3YjkzOTg3MjZmNTNjOGQzYjBlZGU0YjBmNjBiYjQ2NjM0NzRlMjM0Yzc2YkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t",
  /** Add this calendar inside Google Calendar (account sign-in may be required). */
  subscribeUrl:
    "https://calendar.google.com/calendar/render?cid=688493520a99bf5168987b9398726f53c8d3b0ede4b0f60bb4663474e234c76b%40group.calendar.google.com",
  embedTitle: "CHCS mandir — Google Calendar",
  openLabel: "Open in Google Calendar",
  subscribeGoogleLabel: "Add with Google Calendar",
  /** Public iCal feed — same mandir dates in Apple Calendar, Outlook, Samsung, etc. */
  icalSubscribeLabel: "Apple, Outlook & other apps (.ics)",
  /** Same feed; often prompts Apple devices to subscribe in Calendar. */
  webcalAppleLabel: "Apple Calendar (webcal subscribe)",
  /** Short intro above the embed (Google’s own controls change month / view) */
  embedIntro:
    "Browse below — use the arrows to change month. Add it in Google Calendar, or use the .ics / webcal links for Apple, Outlook, Samsung, and other calendar apps.\n\n⚠️ Note: festival dates shown are the traditional calendar observance dates — CHCS event/service dates may differ.",
} as const;

/** Optional: set `NEXT_PUBLIC_MANDIR_CALENDAR_EMBED_SRC` in `.env.local` to override the iframe `src`. */
export function getMandirCalendarEmbedSrc(): string {
  const raw = process.env.NEXT_PUBLIC_MANDIR_CALENDAR_EMBED_SRC?.trim();
  if (raw?.startsWith("https://")) return raw;
  const src = encodeURIComponent(MANDIR_CALENDAR_ID);
  return `https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23faf6ef&ctz=Europe%2FLondon&src=${src}&mode=MONTH&color=%23C62828`;
}

/** Public iCal (.ics) URL for the same mandir calendar — paste into Outlook “Internet calendar”, Apple “New calendar subscription”, etc. */
export function getMandirCalendarIcalUrl(): string {
  const id = encodeURIComponent(MANDIR_CALENDAR_ID);
  return `https://calendar.google.com/calendar/ical/${id}/public/basic.ics`;
}

/** Same feed as `webcal://` — often opens the default calendar app to subscribe (try on iPhone/Mac). */
export function getMandirCalendarWebcalUrl(): string {
  const id = encodeURIComponent(MANDIR_CALENDAR_ID);
  return `webcal://calendar.google.com/calendar/ical/${id}/public/basic.ics`;
}

export const aboutPageMeta = {
  path: "/about",
  documentTitle: "About us",
  breadcrumbHome: "Home",
  heroEyebrow: "Our mandir",
  description:
    "History and life of the Caribbean Hindu Cultural Society mandir — from 1959 to today at 16 Ostade Road, Brixton, London.",
} as const;

export const about = {
  sectionTitle: "About us",
  pageIntro:
    "Our temple today and the journey from 1959 to a registered Place of Worship in Brixton.",
  /** Home #about — photo beside summary (file in /public) */
  homeImage: {
    src: "/mandir-main-hall-2.jpg",
    alt: "CHCS mandir main hall — ornate wooden shrine with Rama, Sita, Lakshmana, flower garlands, framed pictures and golden Om decorations",
  },
  /** Home page — short version; full narrative lives on /about */
  homeSummaryParagraphs: [
    "The Caribbean Hindu Cultural Society (CHCS) was South London’s first Hindu organisation for promoting Hinduism and Hindu culture. Today we welcome everyone to Sunday Havan, major festivals with full English translation, and community life at 16 Ostade Road — open to every age and background.",
    "From the first meetings in 1959 and decades of fundraising, to buying and restoring our Ostade Road home and consecrating the mandir, members built a registered Place of Worship and a cohesive society. Membership is open to all, with benefits set out in our constitution.",
  ] as const,
  readMoreCta: "Read the full story",
  /**
   * Full /about page photo band — same building as elsewhere on the site, but a different layout
   * from the home “Our temple” strip (bento + captions, includes the community photo).
   */
  pageGallery: {
    title: "The mandir at Ostade Road",
    intro:
      "Photographs from our registered Place of Worship in Brixton — street frontage, main hall shrine, and the upstairs pooja room.",
    photos: [
      {
        src: "/mandir-exterior.jpg",
        alt: "Front of the CHCS mandir — brick building and entrance at 16 Ostade Road, London SW2",
        caption: "Street frontage",
        /** Slightly less wide on md than 16/9 — less vertical squeeze — plus object-top for roofline */
        frameClass: "aspect-[4/3] sm:aspect-[4/3] md:aspect-[16/11]",
        imageClass: "object-contain object-top",
      },
      {
        mainHallStack: {
          hero: {
            src: "/mandir-interior.jpg",
            alt:
              "CHCS mandir main hall — central shrine with maroon canopy, Rama, Sita and Lakshmana, flower garlands, framed deities and golden Om decorations",
          },
          bottomLeft: {
            src: "/mandir-main-hall-1.jpg",
            alt: "CHCS mandir main hall — Radha and Krishna shrine",
          },
          bottomRight: {
            src: "/mandir-main-hall-3.jpg",
            alt: "CHCS mandir main hall — Shiva and Parvati shrine",
          },
          caption: "Main hall shrine",
        },
      },
      {
        src: "/Upstairs Pooja room.JPEG",
        alt:
          "Upstairs pooja room at the CHCS mandir — ornate wooden shrine with Ram darbar (Rama, Sita, Lakshmana and Hanuman), Radha-Krishna, Durga with Saraswati, Ganesha, Shiva lingam and other deities",
        /** Wider-than-tall panorama — object-contain (below) avoids cropping edges. */
        frameClass: "aspect-[5/4] sm:aspect-[3/2] md:aspect-[16/10]",
        imageClass: "object-contain object-center",
        caption: "Upstairs Pooja Room",
        /** Secondary line under the caption — smaller bracketed detail on /about photo. */
        captionSub:
          "(historic Singhasan — Prana Pratishta, September 1985)",
        /** Shown beneath the upstairs photo on /about — names the murtis along the shrine. */
        murtisNote:
          "Along the shrine (left to right): a Shiv ling with Ganesha and Shiva beside it; Ram darbar in the centre—Hanuman kneeling before Rama, Sita and Lakshmana with bow; then Radha–Krishna standing together; Durga Mata on her vahana with Saraswati; and seated goddesses toward the far right.",
      },
    ] as const,
  },
  blocks: [
    {
      heading: "Our temple today",
      paragraphs: [
        "The Caribbean Hindu Cultural Society was the first Hindu organisation in South London for the promotion of Hinduism and Hindu Culture.",
        "Over the years it has evolved as a cohesive society reaching out to the wider community, providing a range of cultural programmes and activities which anyone of any age and cultural background may attend.",
        "In 2000, the name of the Society was changed to “Caribbean Hindu Cultural Society”. The Temple was formally registered with Lambeth Council as a Place of Worship and as a place for the Solemnisation of Marriages on 30th January 2001.",
        "In addition to regular Sunday Havan (four Sundays per month) all Hindu festivals are celebrated with full English translation. The audience is encouraged to participate as and when appropriate under the guidance of the officiating Pandit.",
        "Membership to the society is open to all sections of the community and provides specific benefits as outlined in its constitution.",
      ],
    },
    {
      heading: "Our temple's history",
      paragraphs: [
        "In May 1959, a group of young immigrants who came to the UK to further their academic and professional studies, held an inaugural meeting to establish a Hindu Organisation in London. This was successfully achieved and they named it the “HINDU DHARMA SABHA”. In 1961, the name was changed to “CARIBBEAN HINDU SOCIETY”.",
        "From 1959 to 1972, Committee Meetings of the group were held in their rented living accommodation whilst AGM’s and major religious festivals such as Divali, were held either at Hammersmith or Lambeth Town Hall.",
        "In 1966 the first Constitution of the Society was prepared and in 1967 it was approved by the Charity Commission and Charity status obtained. Fund raising to purchase a building was seen as a priority and in 1967, chartered flights to Guyana were organised. These proved to be very popular and therefore successful. However, in 1969 this operation had to cease because Charity Law did not permit permanent trading. By this time the management committee had acquired £11,000.00 for the purchase of a building.",
        "In 1972 a bid of £6,500.00 cash was made for the purchase of 16 Ostade Road. The building was last used by the Federation of Boys Scouts Incorporated but when it was obtained, it was in a derelict state and almost completely destroyed by fire some time previously .Refurbishment was started by the members. In 1978 a successful grant application was made to Lambeth Council and in 1982 building works were completed and the Temple became fully operational.",
        "In September 1983, the Singhasan in the upstairs Pooja room was commissioned and Murti Prana Pratishta (installation) performed on 22nd September 1985. The Singhasan in the main hall was commissioned on 26th August 1987 and Prana Pratishta for the first set of Murtis was performed on 3rd April 2008 and on 15th August 2010 for the second set.",
      ],
    },
  ],
} as const;

export const people = {
  sectionTitle: "Our people",
  paragraphs: [
    "Volunteers play a vital role in the service of the temple, dedicating their time and energy without any financial compensation. Their selfless contributions help maintain the temple's operations, support community events, and foster a welcoming environment for all visitors.",
    "These individuals often bring diverse skills and a shared passion for the temple's mission, creating a strong sense of community and belonging. They not only enrich the temple's activities but inspire others to get involved and give back.",
  ],
} as const;

export const leadership = {
  sectionTitle: "Executive Committee & Pandits",
  intro: "Caribbean Hindu Cultural Society Executive Committee (Managing Trustees)",
  patronsHeading: "Patrons",
  patrons: [
    "The Lord Alli",
    "Shree Laleshwar Singh (former High Commissioner for Guyana)",
  ],
  /** Privacy: keep data in code, but don't display committee names publicly yet. */
  showExecutiveNames: false,
  showCommitteeNames: false,
  showAdminNames: false,
  executiveTitle: "Executive committee",
  roles: [
    { role: "President", name: "Sri Khublall Lochan" },
    { role: "Vice President", name: "Srimati Cheetra Singh" },
    { role: "Secretary", name: "Srimati Sunita (Devi) Lochan" },
    { role: "Treasurer", name: "Srimati Cheetra Singh" },
    { role: "Organising Secretary", name: "Srimati Rose Alli" },
    { role: "Publicity Officer", name: "Sri Devin Singh" },
    {
      role: "Sampark (Social Media & Tech)",
      name: "Arjun Ramdhan",
      subtitle: "NHSF(UK) National Hindu Student Forum",
    },
  ],
  committeeHeading: "Committee members",
  committeeMembers: [
    "Srimati Rhia Alli",
    "Sri Laleshwar Singh",
    "Srimati Kashena Mohadawoo",
    "Sri Nain Singh",
  ],
  adminHeading: "Administrative staff",
  adminMembers: [
    "Srimati Lalita Nagawa — Committee Member",
    "Sri Mohan Lall — Committee Member",
  ],
  priestsTitle: "Pandits",
  priestsCurrent: [
    {
      role: "Current Pandit",
      name: "Pt. Bhisham Dindyal",
      imageSrc: "/Pt Bisham.jpeg",
      imageAlt: "Pt. Bhisham Dindyal — current pandit at CHCS mandir",
    },
  ],
  pastHeading: "Past pandits",
  pastPriests: [
    {
      years: "2019 – 2021",
      name: "Pt. Bish Persaud",
      imageSrc: "/Pandit Bish.webp",
      imageAlt: "Pt. Bish Persaud — past pandit at CHCS mandir",
    },
    {
      years: "2014 – 2019",
      name: "Pt. Jai Ramrattan",
      imageSrc: "/Pt Jai Ramrattan.png",
      imageAlt: "Pt. Jai Ramrattan — past pandit at CHCS mandir",
    },
    {
      years: "2003 – 2014",
      name: "Pt. R. Sankar",
      imageSrc: "/Pt R Sankar.png",
      imageAlt: "Pt. R. Sankar — past pandit at CHCS mandir",
      imageClass: "origin-center scale-[1.65] object-cover object-[50%_12%]",
    },
    {
      years: "1972 – 2003",
      name: "Pt. H. Tiwari",
      imageSrc: "/Pandit T.png",
      imageAlt: "Pt. H. Tiwari — past pandit at CHCS mandir",
      imageClass: "origin-center scale-[1.25] object-cover object-[65%_35%]",
    },
    { years: "1962 – 1972", name: "Pt. R. Maharaj" },
    {
      years: "1959 – 1962",
      name: "Pt. H. Tiwari",
      imageSrc: "/Pandit T.png",
      imageAlt: "Pt. H. Tiwari — past pandit at CHCS mandir",
      imageClass: "origin-center scale-[1.25] object-cover object-[65%_35%]",
    },
  ],
} as const;

export const leadershipPageMeta = {
  path: "/executive-committee",
  breadcrumbHome: "Home",
  documentTitle: "Executive Committee & Pandits",
  heroEyebrow: "Governance & sewa",
} as const;

/** Home page: only president, secretary, and current pandit — link to full page for the rest */
export const homeLeadership = {
  sectionTitle: "Leadership & spiritual guidance",
  intro:
    "Our mandir is run by Managing Trustees, elected every two years, and served by our elected Pandit. View the current Pandit here, or see previous Pandits on the full page.",
  ctaLabel: "View previous pandits",
  ctaHref: leadershipPageMeta.path,
} as const;

export function getLeadershipHomeSpotlights() {
  const president = leadership.roles.find((r) => r.role === "President");
  const secretary = leadership.roles.find((r) => r.role === "Secretary");
  const pandit = leadership.priestsCurrent.find((p) => p.role === "Current Pandit");
  if (!president || !secretary || !pandit) {
    throw new Error("home leadership spotlight: missing President, Secretary, or Current Pandit");
  }
  return { president, secretary, pandit };
}

export const visit = {
  sectionTitle: "Visit us",
  servicesHeading: "Services",
  communityHeading: "Community programmes",
  communityItems: [
    {
      title: "Wednesday Lunch Club",
      detail: "Wednesdays, 11:00am – 2:00pm (just turn up).",
    },
    {
      title: "School visits",
      detail: "Wednesdays, 10:30am – 11:30am (email to book a slot).",
    },
    {
      title: "Hall hire",
      detail: "Email for more details.",
    },
  ],
  addressLabel: "Address",
  addressLines: ["16 Ostade Road", "London, SW2 2BB"],
  directionsHeading: "Getting here",
  directionsIntro:
    "We’re in Brixton, South London. Use the map for the exact pin — these are the nearest public transport options.",
  directions: {
    walkingHint: "5–8 minute walk from Brixton Station.",
    bestRoutesHeading: "Best routes to get here",
    bestRoutes: [
      { from: "From Croydon", how: "109 or 250 → Brixton Hill (get off at New Park Road)" },
      { from: "From Central London", how: "133, 59, 159 → Brixton Hill (get off at New Park Road)" },
      { from: "From South London", how: "45 or 333 → Brixton Hill (get off at New Park Road)" },
    ],
    trainsLabel: "Nearest stations",
    trains: [
      "Brixton Station (Victoria line + National Rail)",
      "Loughborough Junction (National Rail)",
    ],
    busesLabel: "Buses nearby",
    buses: [
      {
        route: "45",
        href: "https://tfl.gov.uk/bus/route/45/",
        note: "towards Camberwell Green",
      },
      {
        route: "109",
        href: "https://tfl.gov.uk/bus/route/109/",
        note: "towards Brixton",
      },
      {
        route: "250",
        href: "https://tfl.gov.uk/bus/route/250/",
        note: "towards Brixton",
      },
      {
        route: "133",
        href: "https://tfl.gov.uk/bus/route/133/",
        note: "towards Central London (via Brixton)",
      },
      {
        route: "333",
        href: "https://tfl.gov.uk/bus/route/333/",
        note: "towards Central London (via Brixton)",
      },
      {
        route: "59",
        href: "https://tfl.gov.uk/bus/route/59/",
        note: "towards Brixton",
      },
      {
        route: "159",
        href: "https://tfl.gov.uk/bus/route/159/",
        note: "towards Brixton",
      },
      { route: "3", href: "https://tfl.gov.uk/bus/route/3/" },
      { route: "2", href: "https://tfl.gov.uk/bus/route/2/" },
      { route: "415", href: "https://tfl.gov.uk/bus/route/415/" },
    ],
    liveBusesLabel: "Check live buses",
    liveBusesHref: "https://tfl.gov.uk/modes/buses/",
    drivingLabel: "Driving",
    driving:
      "Parking is restricted. Weekdays between 12–2pm there are additional restrictions — please allow extra time and be respectful of neighbours. Consider public transport where possible.",
  },
  phoneLabel: "Phone number",
  phoneDisplay: "+44 (0)20 8674 0755",
  phoneHref: "tel:+442086740755",
  emailLabel: "Email",
  email: "om@chcstemple.org",
  membershipHeading: "CHCS membership",
  membershipParagraphs: [
    "Join us in supporting the temple with a yearly membership of just £15. Your contribution will help us maintain our community and continue our important work. Together, we can make a difference and ensure the temple remains a welcoming space for all.",
    "If you’d like to join, donate, or support the mandir in other ways, please email om@chcstemple.org or use the contact form in the Visit us section further down this page.",
    "Thank you for your support!",
  ],
  membershipPaymentLabel: "Pay membership / donate",
  membershipPaymentUrl: "https://pay.sumup.com/b2c/QNA3A6QO",
  membershipPaymentNote: "Secure online payment (SumUp).",
  contactFormHeading: "For any enquiries please contact us",
  formLabels: {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    messagePlaceholder: "Type your message here…",
    submit: "Send message (opens your email)",
  },
  formThankYou: "Thank you for contacting us, we endevour to answer as soon as we can.",
} as const;

export const footer = {
  /** Short label (e.g. Connect section) */
  facebookLabel: "Facebook",
  /** Footer link — formal wording */
  officialFacebookLabel: "Official Facebook page",
  rightsReserved: "All rights reserved.",
  facebookUrl: "https://www.facebook.com/CHCSLondon/",
} as const;

/** Facebook strip on the home page (map lives under Visit us). */
export const connect = {
  sectionTitle: "Facebook",
  intro:
    "Scroll down inside the box for more posts — the feed comes from Facebook, so new public posts appear automatically. Tap a post to view on Facebook. Very old posts may only show on the full Facebook page.",
  facebook: {
    heading: "CHCS on Facebook",
  },
  map: {
    heading: "Visit the mandir",
    /** One line before the first interaction so the page can scroll past the embed */
    mapOverlayCta: "Click or tap to use the map",
    openInMapsLabel: "Open in Google Maps",
    /** Plain Google Maps link (same location as the embed) */
    openInMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=16+Ostade+Road%2C+London+SW2+2BB",
  },
} as const;

/**
 * Google Maps iframe `src`. Optional: paste the full embed URL from Google Maps
 * (Share → Embed a map) into `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_SRC` in `.env.local`.
 */
export function getGoogleMapsEmbedSrc(): string {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_SRC?.trim();
  if (raw?.startsWith("https://")) return raw;
  const q = encodeURIComponent(
    "16 Ostade Road, London SW2 2BB, United Kingdom",
  );
  return `https://www.google.com/maps?q=${q}&hl=en&z=17&output=embed`;
}

/** Facebook Page plugin — vertical timeline; content loads from Facebook (updates when you post). */
export function getFacebookPluginSrc(): string {
  const params = new URLSearchParams({
    href: footer.facebookUrl,
    tabs: "timeline",
    width: "500",
    /** Tall timeline so visitors can scroll far down inside the embed for more posts. */
    height: "2000",
    small_header: "false",
    adapt_container_width: "true",
    hide_cover: "false",
    show_facepile: "true",
  });
  return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
}
