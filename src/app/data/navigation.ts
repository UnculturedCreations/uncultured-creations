// Single source of truth for the hub's primary navigation.
// Used by the site header, footer and not-found page.
// Keep labels and routes in sync with the landing-page carousel.

export interface NavItem {
  label: string;
  href: string;
}

export const pillars: NavItem[] = [
  { label: "Reality Reloaded", href: "/fanzone" },
  { label: "Stories", href: "/stories" },
  { label: "Lyrics & Spoken Word", href: "/music" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "The Lab", href: "/the-lab" },
];
