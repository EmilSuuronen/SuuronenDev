import type { BrowserSection } from "../types/desktop";

export const browserSections: BrowserSection[] = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "Desktop concept",
    heading: "A personal site that behaves like a tiny operating system.",
    description:
      "This first pass focuses on the shell itself: reusable windows, a taskbar, and a page that stays inside one fixed desktop view.",
    cards: [
      {
        title: "Single-page desktop",
        description: "No long landing page. Everything lives inside windows and apps.",
        label: "Layout",
      },
      {
        title: "Reusable windows",
        description: "Drag, resize, close, and relaunch each app without rewriting the chrome.",
        label: "System",
      },
      {
        title: "Expandable foundation",
        description: "Projects, notes, media, experiments, and tools can become their own apps later.",
        label: "Roadmap",
      },
    ],
  },
  {
    id: "links",
    label: "Links",
    eyebrow: "Quick access",
    heading: "The browser window can hold structured content, navigation, and external links.",
    description:
      "For now it acts like a compact dashboard. Later you can turn each section into a richer in-window experience.",
    cards: [
      {
        title: "GitHub",
        description: "Code, experiments, and repository history.",
        label: "Open profile",
        href: "https://github.com/EmilSuuronen",
      },
      {
        title: "LinkedIn",
        description: "Background, studies, and professional context.",
        label: "Open profile",
        href: "https://www.linkedin.com/in/emil-suuronen/",
      },
      {
        title: "Email",
        description: "Direct route for collaboration or project discussions.",
        label: "Compose",
        href: "mailto:emilsuuronen@gmail.com",
      },
    ],
  },
  {
    id: "lab",
    label: "Lab",
    eyebrow: "Next apps",
    heading: "The long-term goal is a browser-based desktop with multiple purpose-built tools.",
    description:
      "Obvious next candidates are a projects app, a media player, a notes app, and a small file explorer or command palette.",
    cards: [
      {
        title: "Projects app",
        description: "Dedicated space for case studies, screenshots, and changelogs.",
        label: "Planned",
      },
      {
        title: "Media app",
        description: "A place for music links, visuals, and embedded content.",
        label: "Planned",
      },
      {
        title: "Command palette",
        description: "Fast navigation across apps and desktop actions.",
        label: "Planned",
      },
    ],
  },
];
