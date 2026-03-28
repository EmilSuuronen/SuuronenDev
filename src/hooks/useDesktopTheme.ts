import { useEffect, useMemo, useState } from "react";

import {
  defaultDesktopTheme,
  desktopThemes,
  type DesktopTheme,
} from "../data/themes";

const STORAGE_KEY = "suuronen.desktop.theme";

type ThemeState = {
  currentTheme: DesktopTheme;
  resetTheme: () => void;
  selectTheme: (themeId: string) => void;
  setThemeColor: (
    key:
      | "accent"
      | "panel"
      | "surfaceDark"
      | "wallpaperColor1"
      | "wallpaperColor2"
      | "wallpaperColor3",
    value: string,
  ) => void;
  themeOptions: DesktopTheme[];
};

function isTheme(value: unknown): value is DesktopTheme {
  return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string";
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(240, 140, 45, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function useDesktopTheme(): ThemeState {
  const [currentTheme, setCurrentTheme] = useState<DesktopTheme>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return defaultDesktopTheme;
      }

      const parsed: unknown = JSON.parse(stored);

      if (isTheme(parsed)) {
        return parsed;
      }
    } catch {
      // ignore invalid stored theme
    }

    return defaultDesktopTheme;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTheme));
  }, [currentTheme]);

  const themeOptions = useMemo(() => desktopThemes, []);

  return {
    currentTheme,
    themeOptions,
    selectTheme: (themeId) => {
      const nextTheme = desktopThemes.find((theme) => theme.id === themeId);

      if (nextTheme) {
        setCurrentTheme(nextTheme);
      }
    },
    setThemeColor: (key, value) => {
      setCurrentTheme((current) => ({
        ...current,
        id: "custom",
        [key]: value,
        ...(key === "accent"
          ? {
              accentSoft: hexToRgba(value, 0.16),
              accentStrong: value,
            }
          : {}),
      }));
    },
    resetTheme: () => setCurrentTheme(defaultDesktopTheme),
  };
}
