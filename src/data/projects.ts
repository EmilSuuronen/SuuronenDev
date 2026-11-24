export type Project = {
  description: string;
  links: { href: string; label: string }[];
  name: string;
  stack: string;
};

// Shown in text mode. The desktop presents the same projects as apps.
export const projects: Project[] = [
  {
    name: "Poplio",
    description:
      "One shared place for family and friends: a calendar, repeating tasks, a shopping list, chat and a fridge door for drawings that is wiped at midnight. Installs like an app and sends push notifications.",
    stack: "SvelteKit · TypeScript · SQLite",
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
  {
    name: "Cuboid Scene Builder",
    description:
      "Turns a single image into a simple 3D scene of cuboids, as JSON or a Blender scene with a render. Detection, segmentation and depth models all run locally.",
    stack: "Python · PyTorch · GroundingDINO · MobileSAM · Depth Anything V2",
    links: [{ label: "source", href: "https://github.com/EmilSuuronen/cuboid_scene_builder" }],
  },
];
