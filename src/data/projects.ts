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
  {
    name: "Ant Exterminator",
    description: "A pixel-art arcade game with a WebGL renderer. Lives in the desktop's Applications folder.",
    stack: "TypeScript · WebGL",
    links: [],
  },
];
