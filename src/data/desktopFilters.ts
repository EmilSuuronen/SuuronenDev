export type DesktopFilterId =
  | "none"
  | "invert"
  | "crt"
  | "glitch"
  | "noir"
  | "hologram"
  | "sunset-bloom"
  | "night-vision";

export type DesktopFilterOption = {
  description: string;
  id: DesktopFilterId;
  label: string;
};

export const desktopFilterOptions: DesktopFilterOption[] = [
  {
    id: "none",
    label: "No filter",
    description: "Clean desktop rendering with no extra post-processing.",
  },
  {
    id: "invert",
    label: "Inverted",
    description: "Full desktop inversion for a sharp negative-film look.",
  },
  {
    id: "crt",
    label: "CRT",
    description: "Scanlines, vignette, and a tiny bit of old-monitor flicker.",
  },
  {
    id: "glitch",
    label: "Glitch",
    description: "Chromatic drift, data bars, and noisy distortion on top of the shell.",
  },
  {
    id: "noir",
    label: "Noir",
    description: "Monochrome contrast pass with a cleaner editorial feel.",
  },
  {
    id: "hologram",
    label: "Hologram",
    description: "Cool-toned cyan and magenta treatment with a subtle sci-fi cast.",
  },
  {
    id: "sunset-bloom",
    label: "Sunset Bloom",
    description: "Warm bloom and haze that softens the desktop into a cinematic glow.",
  },
  {
    id: "night-vision",
    label: "Night Vision",
    description: "Green-tinted tactical display with scan noise and darker shadows.",
  },
];

export const defaultDesktopFilter = desktopFilterOptions[0];
