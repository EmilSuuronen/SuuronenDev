export type Project = {
  description: string;
  links: { href: string; label: string }[];
  name: string;
  stack: string;
  // 16:9 picture for the projects page.
  image: string;
  video?: string;
};

// Shown on the home page and the projects page. The desktop presents the same projects as apps.
export const projects: Project[] = [
  {
    name: "stepin",
    image: "/projects/stepin.jpg",
    description: "Render a photo into 3D point cloud in terminal. Interact with commands, and walk around with WASD.",
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
    description: "Shared everything tracking app, with mobile install.",
    stack: "SvelteKit · TypeScript · SQLite",
    links: [{ label: "open", href: "https://poplio.suuronen.dev" }],
  },
  {
    name: "Discis",
    image: "/projects/discis.jpg",
    description: "Disc Golf scorecard app, with some routes.",
    stack: "React · Vite · PWA",
    links: [
      { label: "open", href: "https://discis.suuronen.dev" },
      { label: "source", href: "https://github.com/EmilSuuronen/discis" },
    ],
  },
  {
    name: "Mölkkis",
    image: "/projects/molkkis.jpg",
    description: "The best Mölkky score keeper ever. PWA + web",
    stack: "JavaScript",
    links: [
      { label: "open", href: "https://molkkis.suuronen.dev/" },
      { label: "source", href: "https://github.com/EmilSuuronen/molkkis" },
    ],
  },
  {
    name: "AR Lenses",
    image: "/projects/ar.jpg",
    description: "Some AR lenses and games made for Snapchat.",
    stack: "Lens Studio",
    links: [{ label: "open", href: "/ar/" }],
  },
  {
    name: "Cuboid Scene Builder",
    image: "/projects/cuboid.jpg",
    description: "A experimental thing that turns a single photo into a 3D scene of cubes with AI, for AR and 3D reconstruction. ",
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
