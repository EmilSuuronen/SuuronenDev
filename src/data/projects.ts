export type Project = {
  description: string;
  links: { href: string; label: string }[];
  name: string;
  stack: string;
  // 16:9 picture for the projects page.
  image: string;
  // One or two lines for the cards there, when the description is longer.
  summary?: string;
  video?: string;
};

// Shown on the home page and the projects page. The desktop presents the same projects as apps.
export const projects: Project[] = [
  {
    name: "stepin",
    image: "/projects/stepin.jpg",
    summary: "Walk around inside a photo in your terminal, and use shell commands on the things in it.",
    description:
      "Walk around inside a photo in your terminal. Local AI turns any image into a 3D point cloud and names what's in it, and you explore it with WASD or shell commands: ls, cd sofa, rm chair, find red mug.",
    stack: "Python · PyTorch · Numba · SAM 2.1 · MoGe\u20112",
    links: [
      { label: "watch demo", href: "/stepin/demo.mp4" },
      { label: "source", href: "https://github.com/EmilSuuronen/stepin" },
    ],
    video: "/stepin/demo.mp4",
  },
  {
    name: "Poplio",
    image: "/projects/poplio.jpg",
    summary: "A shared calendar, tasks, shopping list, chat and fridge door for family and friends.",
    description:
      "One shared place for family and friends: a calendar, repeating tasks, a shopping list, chat and a fridge door for drawings that is wiped at midnight. Installs like an app and sends push notifications.",
    stack: "SvelteKit · TypeScript · SQLite",
    links: [{ label: "open", href: "https://poplio.suuronen.dev" }],
  },
  {
    name: "Discis",
    image: "/projects/discis.jpg",
    description: "Disc golf scorecard and course finder that keeps working offline on the course.",
    stack: "React · Vite · PWA",
    links: [
      { label: "open", href: "https://discis.suuronen.dev" },
      { label: "source", href: "https://github.com/EmilSuuronen/discis" },
    ],
  },
  {
    name: "Mölkkis",
    image: "/projects/molkkis.jpg",
    summary: "Set up players, draw the throwing order and keep track of your Mölkkis games.",
    description: "Mölkkis web application.",
    stack: "JavaScript",
    links: [
      { label: "open", href: "https://molkkis.suuronen.dev/" },
      { label: "source", href: "https://github.com/EmilSuuronen/molkkis" },
    ],
  },
  {
    name: "AR Lenses",
    image: "/projects/ar.jpg",
    summary: "More than 20 lenses, filters and AR games, made in Lens Studio.",
    description: "Lenses, filters and AR games made in Lens Studio.",
    stack: "Lens Studio",
    links: [{ label: "open", href: "/ar/" }],
  },
  {
    name: "Cuboid Scene Builder",
    image: "/projects/cuboid.jpg",
    summary: "Turns a single photo into a simple 3D scene of cuboids, with all models running locally.",
    description:
      "Turns a single image into a simple 3D scene of cuboids, as JSON or a Blender scene with a render. Detection, segmentation and depth models all run locally.",
    stack: "Python · PyTorch · GroundingDINO · MobileSAM · Depth Anything V2",
    links: [{ label: "source", href: "https://github.com/EmilSuuronen/cuboid_scene_builder" }],
  },
];

// Only on the projects page, at the very bottom.
export const schoolProjects: Project[] = [
  {
    name: "Tune-Mate",
    image: "/projects/tune-mate.jpg",
    description: "A guitar app for writing tabs, making custom tunings and tuning up.",
    stack: "React · TypeScript · Node.js · GraphQL · MongoDB",
    links: [
      { label: "open", href: "https://tune-mate.azurewebsites.net" },
      { label: "source", href: "https://github.com/EmilSuuronen/Tune-Mate" },
    ],
  },
  {
    name: "SlideMind",
    image: "/projects/slidemind.jpg",
    description: "A desktop app for finding your way around PowerPoints and PDFs, with some AI help. Made as a school project for HSY (Helsingin seudun ympäristöpalvelut -kuntayhtymä).",
    stack: "Electron · React · OpenAI API",
    links: [
      { label: "open", href: "https://emilsuuronen.github.io/slidemind-home/" },
      { label: "source", href: "https://github.com/EmilSuuronen/slidemind" },
    ],
  },
  {
    name: "AI-Blaze",
    image: "/projects/ai-blaze.jpg",
    description: "A team project that turns hand-drawn wireframes into HTML and CSS.",
    stack: "React · Node.js · Firebase · GPT-4 Vision",
    links: [{ label: "source", href: "https://github.com/EmilSuuronen/AI-Blaze" }],
  },
];
