import { fuzzyScore } from "../../apps/code/sourceIndex";
import { desktopLaunchers } from "../../data/desktop";
import type { DesktopFilterId, DesktopFilterOption } from "../../data/desktopFilters";
import type { DesktopTheme } from "../../data/themes";
import type { AppLocale } from "../../i18n/locale";
import type { DesktopEntryId, DesktopIconKey, DesktopIconState } from "../../types/desktop";

export type PaletteGroup = "App" | "Folder" | "Note" | "Action" | "Theme" | "Effect" | "Language" | "Command" | "Source";

export type PaletteItem = {
  detail?: string;
  group: PaletteGroup;
  icon?: DesktopIconKey;
  id: string;
  // Extra words that should also find this item, e.g. "dark" for a theme.
  keywords?: string;
  label: string;
  run: () => void;
};

const MAX_RESULTS = 40;

export function rankPaletteItems(items: PaletteItem[], query: string) {
  const needle = query.trim();

  if (!needle) {
    return items;
  }

  return items
    .map((item) => ({
      item,
      score: Math.max(fuzzyScore(needle, item.label), item.keywords ? fuzzyScore(needle, item.keywords) - 4 : -1),
    }))
    .filter((result) => result.score >= 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RESULTS)
    .map((result) => result.item);
}

type PaletteContext = {
  entries: DesktopIconState[];
  filterOptions: DesktopFilterOption[];
  languageLabel: (locale: AppLocale) => string;
  t: (input: string) => string;
  themeName: (themeId: string) => string;
  themeOptions: DesktopTheme[];
  actions: {
    createFolder: () => void;
    createNote: () => void;
    openEntry: (entryId: DesktopEntryId) => void;
    reboot: () => void;
    runCommand: (input: string) => void;
    selectFilter: (filterId: DesktopFilterId) => void;
    selectTheme: (themeId: string) => void;
    setLocale: (locale: AppLocale) => void;
    textMode: () => void;
    viewSource: () => void;
  };
};

// Curated so the list shows what is worth trying, not every shell builtin.
const TERMINAL_COMMANDS: [string, string][] = [
  ["help", "List available commands"],
  ["neofetch", "System info"],
  ["cat about.txt", "Read about Emil"],
  ["cat stack.txt", "Tech stack"],
  ["contact", "Contact links"],
  ["ls -la", "List home files"],
  ["tree", "Show the home directory as a tree"],
  ["man intro", "Shell guide"],
  ["fortune | cowsay", "Wisdom from a cow"],
  ["coffee", "Brew a cup"],
  ["adventure", "A tiny text adventure"],
];

const LOCALES: AppLocale[] = ["en", "fi", "pirate", "alien"];

export function getPaletteItems({
  actions,
  entries,
  filterOptions,
  languageLabel,
  t,
  themeName,
  themeOptions,
}: PaletteContext): PaletteItem[] {
  const subtitles = new Map(desktopLaunchers.map((launcher) => [launcher.id, launcher.subtitle]));
  // Notes in the Trash are left out; everything else on the desktop or in folders is searchable.
  const liveEntries = entries.filter((entry) => entry.parentId !== "trash");

  return [
    ...liveEntries
      .filter((entry) => entry.kind === "app")
      .map((entry) => ({
        detail: entry.windowId ? t(subtitles.get(entry.windowId) ?? "") : entry.href?.startsWith("http") ? t("Opens in a new tab") : undefined,
        group: "App" as const,
        icon: entry.icon,
        id: `entry:${entry.id}`,
        label: t(entry.label),
        run: () => actions.openEntry(entry.id),
      })),
    {
      group: "Action",
      id: "action:new-note",
      keywords: "create write text file",
      label: t("New note"),
      run: actions.createNote,
    },
    {
      group: "Action",
      id: "action:new-folder",
      keywords: "create directory",
      label: t("New folder"),
      run: actions.createFolder,
    },
    {
      group: "Action",
      id: "action:view-source",
      keywords: "code inspect github",
      label: t("View source"),
      run: actions.viewSource,
    },
    {
      group: "Action",
      id: "action:text-mode",
      keywords: "simple boring one page portfolio",
      label: t("Text mode"),
      run: actions.textMode,
    },
    {
      group: "Action",
      id: "action:reboot",
      keywords: "restart boot",
      label: t("Reboot"),
      run: actions.reboot,
    },
    ...liveEntries
      .filter((entry) => entry.kind === "folder")
      .map((entry) => ({
        group: "Folder" as const,
        icon: entry.icon,
        id: `entry:${entry.id}`,
        label: t(entry.label),
        run: () => actions.openEntry(entry.id),
      })),
    ...liveEntries
      .filter((entry) => entry.kind === "file")
      .map((entry) => ({
        group: "Note" as const,
        icon: entry.icon,
        id: `entry:${entry.id}`,
        label: entry.label,
        run: () => actions.openEntry(entry.id),
      })),
    ...TERMINAL_COMMANDS.map(([input, description]) => ({
      detail: t(description),
      group: "Command" as const,
      id: `command:${input}`,
      keywords: `terminal shell ${description}`,
      label: input,
      run: () => actions.runCommand(input),
    })),
    ...themeOptions.map((theme) => ({
      group: "Theme" as const,
      id: `theme:${theme.id}`,
      keywords: `theme color ${theme.id}`,
      label: themeName(theme.id),
      run: () => actions.selectTheme(theme.id),
    })),
    ...filterOptions.map((filter) => ({
      detail: t(filter.description),
      group: "Effect" as const,
      id: `effect:${filter.id}`,
      keywords: "filter effect",
      label: t(filter.label),
      run: () => actions.selectFilter(filter.id),
    })),
    ...LOCALES.map((locale) => ({
      group: "Language" as const,
      id: `language:${locale}`,
      keywords: "language locale",
      label: languageLabel(locale),
      run: () => actions.setLocale(locale),
    })),
  ];
}
