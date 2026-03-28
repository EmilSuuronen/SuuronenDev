import type { StartMenuSection } from "../types/desktop";

export const startMenuSections: StartMenuSection[] = [
  {
    label: "Pinned",
    items: [
      {
        label: "Browser",
        description: "Content workspace",
        icon: "browser",
        action: {
          type: "open_entry",
          entryId: "browser",
        },
      },
      {
        label: "Terminal",
        description: "System shell",
        icon: "terminal",
        action: {
          type: "open_entry",
          entryId: "terminal",
        },
      },
      {
        label: "Calculator",
        description: "Quick math",
        icon: "calculator",
        action: {
          type: "open_entry",
          entryId: "calculator",
        },
      },
      {
        label: "Notes",
        description: "Text editor and desktop notes",
        icon: "notes",
        action: {
          type: "open_entry",
          entryId: "notes",
        },
      },
      {
        label: "Settings",
        description: "Themes and personalization",
        icon: "settings",
        action: {
          type: "open_entry",
          entryId: "settings",
        },
      },
      {
        label: "Applications",
        description: "Folder with additional apps",
        icon: "folder",
        action: {
          type: "open_entry",
          entryId: "applications",
        },
      },
    ],
  },
  {
    label: "Quick Links",
    items: [
      {
        label: "GitHub",
        description: "Open profile",
        icon: "github",
        action: {
          type: "open_link",
          href: "https://github.com/EmilSuuronen",
        },
      },
      {
        label: "LinkedIn",
        description: "Professional profile",
        icon: "linkedin",
        action: {
          type: "open_link",
          href: "https://www.linkedin.com/in/emil-suuronen/",
        },
      },
      {
        label: "Email",
        description: "Contact shortcut",
        icon: "mail",
        action: {
          type: "open_link",
          href: "mailto:emilsuuronen@gmail.com",
        },
      },
    ],
  },
];
