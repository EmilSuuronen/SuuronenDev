import type { BrowserSection } from "../types/desktop";

export const browserSections: BrowserSection[] = [
  {
    id: "about",
    label: "About",
    eyebrow: "Profile",
    heading: "Hi, im Emil.",
    description:
      "Currently working as a backend engineer, I spend most of my time around backend systems, infrastructure, and implementation details. Currently making software to make game development accessible for anyone",
    cards: [
      {
        title: "Backend engineering, first",
        description:
          "Delivering real world infrastructure with reliability and scalability in mind. Full end to end ownership of projects, from design to implementation.",
        label: "Currently working on",
      },
      {
        title: "AI with curiosity",
        description:
          "Interested in AI workflows and integrations. Experimenting with diffusion models and generative AI, and interested in integrating custom AI tooling to actual workflows.",
        label: "Focus area",
      },
      {
        title: "UX + frontend ❤️",
        description:
          "Frontend to impress. User experience to actually stick them around. The best software is accessible for anyone.",
        label: "Frontend",
      },
    ],
  },
  {
    id: "tech-stack",
    label: "Tech Stack",
    view: "tech-stack",
    eyebrow: "Stack map",
    heading: "The tools I’m most comfortable shipping with.",
    description:
      "Learning a lot of stuff and trying to keep up with the latest and greatest. Not a master of all, but confident in a few.",
    note:
      "Stacks if most often reach for and im most keen on.",
    highlights: ["Backend systems", "Cloud infrastructure", "AI + data tooling", "Frontend and apps"],
    cards: [],
  },
  {
    id: "contact",
    label: "Contact",
    view: "contact",
    eyebrow: "contact",
    heading: "Get in touch.",
    description:
      "Hit me up for collaboration or inquiries.",
    highlights: ["Email", "GitHub", "LinkedIn"],
    cards: [],
  },
];
