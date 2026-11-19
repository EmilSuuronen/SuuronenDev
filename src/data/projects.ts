export type Project = {
  description: string;
  links: { href: string; label: string }[];
  name: string;
  stack: string;
};

// Shown in text mode. The desktop presents the same projects as apps.
export const projects: Project[] = [
  {
    name: "suuronen.dev",
    description: "This site: a desktop OS in the browser with windows, a Unix-like shell, apps, games and a viewer for its own source code.",
    stack: "React · TypeScript · Vite · WebGL",
    links: [{ label: "source", href: "https://github.com/EmilSuuronen/SuuronenDev" }],
  },
  {
    name: "Poplio",
    description:
      "One shared place for family and friends: a calendar, repeating tasks, a shopping list, chat and a fridge door for drawings that is wiped at midnight. Installs like an app and sends push notifications.",
    stack: "SvelteKit · TypeScript · SQLite · Fly.io",
    links: [{ label: "open", href: "https://poplio.suuronen.dev" }],
  },
  {
    name: "Discis",
    description: "Disc golf scorecard and course finder that keeps working offline on the course.",
    stack: "React · Vite · PWA",
    links: [
      { label: "open", href: "https://discis.suuronen.dev" },
      { label: "source", href: "https://github.com/EmilSuuronen/discis" },
    ],
  },
  {
    name: "Mölkkis",
    description: "Mölkkis web application.",
    stack: "JavaScript",
    links: [
      { label: "open", href: "https://emilsuuronen.github.io/molkkis/" },
      { label: "source", href: "https://github.com/EmilSuuronen/molkkis" },
    ],
  },
  {
    name: "AR Lenses",
    description: "Lenses, filters and AR games made in Lens Studio.",
    stack: "Lens Studio",
    links: [{ label: "open", href: "/ar/" }],
  },
];
