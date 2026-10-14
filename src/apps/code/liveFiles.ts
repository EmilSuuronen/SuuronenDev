import { browserSections } from "../../data/browserSections";
import { defaultDesktopTheme } from "../../data/themes";
import type { LiveValues } from "../../hooks/useLiveData";
import { parseExportedLiteral } from "./literalParser";

type LiveFile = {
  exportName: string;
  hint: string;
  key: keyof LiveValues;
  // Returns an error message (and a snippet to locate it), or null when the value is usable.
  validate: (value: unknown) => { message: string; near?: string } | null;
};

export type LiveEvaluation = { ok: true; value: unknown } | { ok: false; error: string; line: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const THEME_COLOR_KEYS = Object.keys(defaultDesktopTheme).filter((key) => key !== "id" && key !== "dockHeight");
const SECTION_TEXT_KEYS = ["id", "label", "eyebrow", "heading", "description"];
const CARD_TEXT_KEYS = ["title", "description", "label"];

function validateThemes(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return { message: "desktopThemes must be a non-empty array" };
  }

  const ids = new Set<string>();

  for (const theme of value) {
    if (!isRecord(theme) || typeof theme.id !== "string") {
      return { message: "Every theme needs a string id" };
    }

    if (ids.has(theme.id)) {
      return { message: `Duplicate theme id "${theme.id}"`, near: `"${theme.id}"` };
    }

    ids.add(theme.id);

    for (const key of THEME_COLOR_KEYS) {
      const color = theme[key];

      if (typeof color !== "string") {
        return { message: `${theme.id}: "${key}" is missing`, near: `"${theme.id}"` };
      }

      if (!CSS.supports("color", color)) {
        return { message: `${theme.id}.${key}: "${color}" isn't a valid CSS color`, near: `"${color}"` };
      }
    }
  }

  return null;
}

function validateBrowserSections(value: unknown) {
  if (!Array.isArray(value)) {
    return { message: "browserSections must be an array" };
  }

  const expectedIds = browserSections.map((section) => section.id).join(", ");

  if (value.map((section) => (isRecord(section) ? section.id : null)).join(", ") !== expectedIds) {
    return { message: `Section ids are wired into the Browser; keep them as: ${expectedIds}` };
  }

  for (const section of value as Record<string, unknown>[]) {
    const missingKey = SECTION_TEXT_KEYS.find((key) => typeof section[key] !== "string");

    if (missingKey) {
      return { message: `${section.id}: "${missingKey}" must be a string`, near: `"${section.id}"` };
    }

    if (!Array.isArray(section.cards) || !section.cards.every((card) => isRecord(card) && CARD_TEXT_KEYS.every((key) => typeof card[key] === "string"))) {
      return { message: `${section.id}: every card needs title, description and label strings`, near: `"${section.id}"` };
    }

    if (section.highlights !== undefined && (!Array.isArray(section.highlights) || !section.highlights.every((item) => typeof item === "string"))) {
      return { message: `${section.id}: highlights must be a list of strings`, near: `"${section.id}"` };
    }
  }

  return null;
}

export const liveFiles: Record<string, LiveFile> = {
  "src/data/themes.ts": {
    exportName: "desktopThemes",
    hint: "Edit the active theme's colors; the desktop repaints as you type.",
    key: "themes",
    validate: validateThemes,
  },
  "src/data/browserSections.ts": {
    exportName: "browserSections",
    hint: "Edit the portfolio copy; the Browser app updates as you type.",
    key: "browserSections",
    validate: validateBrowserSections,
  },
};

export function evaluateLiveFile(file: LiveFile, text: string): LiveEvaluation {
  const parsed = parseExportedLiteral(text, file.exportName);

  if (!parsed.ok) {
    return parsed;
  }

  const problem = file.validate(parsed.value);

  if (!problem) {
    return parsed;
  }

  const nearIndex = problem.near ? text.indexOf(problem.near) : -1;

  return {
    error: problem.message,
    line: nearIndex < 0 ? 1 : text.slice(0, nearIndex).split("\n").length,
    ok: false,
  };
}
