export type ContactLink = {
  accent: string;
  description: string;
  href: string;
  label: string;
  subtitle: string;
  type: "email" | "github" | "linkedin";
};

export const contactLinks: ContactLink[] = [
  {
    type: "email",
    label: "Email",
    subtitle: "emilsuuronen@gmail.com",
    description: "Best route for collaboration, questions, or project discussion.",
    href: "mailto:emilsuuronen@gmail.com",
    accent: "#f08c2d",
  },
  {
    type: "github",
    label: "GitHub",
    subtitle: "github.com/EmilSuuronen",
    description: "Code, experiments, repositories, and technical side projects.",
    href: "https://github.com/EmilSuuronen",
    accent: "#505050",
  },
  {
    type: "linkedin",
    label: "LinkedIn",
    subtitle: "linkedin.com/in/emil-suuronen",
    description: "Professional background, current work, and public profile.",
    href: "https://www.linkedin.com/in/emil-suuronen/",
    accent: "#0a66c2",
  },
];
