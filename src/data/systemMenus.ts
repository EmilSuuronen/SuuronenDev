import { desktopLaunchers } from "./desktop";
import type { DesktopMenu } from "../types/desktop";

export const systemMenus: DesktopMenu[] = [
  {
    label: "Applications",
    items: desktopLaunchers.map((launcher) => ({
      label: launcher.label,
      description: launcher.subtitle,
      action: {
        type: "open_window",
        windowId: launcher.id,
      },
    })),
  },
  {
    label: "Desktop",
    items: [
      {
        label: "Open Browser",
        description: "Content workspace",
        action: {
          type: "open_window",
          windowId: "browser",
        },
      },
      {
        label: "Open Terminal",
        description: "System shell",
        action: {
          type: "open_window",
          windowId: "terminal",
        },
      },
      {
        label: "Open Calculator",
        description: "Quick math",
        action: {
          type: "open_window",
          windowId: "calculator",
        },
      },
      {
        label: "Open Notes",
        description: "Text editor and desktop notes",
        action: {
          type: "open_window",
          windowId: "notes",
        },
      },
      {
        label: "Open Settings",
        description: "Themes and personalization",
        action: {
          type: "open_window",
          windowId: "settings",
        },
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "suuronen.dev desktop",
        description: "Personal web workspace",
        action: { type: "none" },
      },
      {
        label: "Version 1.0.0",
        description: "Current shell build",
        action: { type: "none" },
      },
    ],
  },
  {
    label: "Contact",
    items: [
      {
        label: "emilsuuronen@gmail.com",
        description: "Email",
        href: "mailto:emilsuuronen@gmail.com",
        icon: "mail",
        action: { type: "none" },
      },
      {
        label: "GitHub",
        description: "github.com/EmilSuuronen",
        href: "https://github.com/EmilSuuronen",
        icon: "github",
        action: { type: "none" },
      },
      {
        label: "LinkedIn",
        description: "linkedin.com/in/emil-suuronen",
        href: "https://www.linkedin.com/in/emil-suuronen/",
        icon: "linkedin",
        action: { type: "none" },
      },
    ],
  },
];
