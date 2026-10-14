import { createRequestChannel } from "./requestChannel";

// Lets other apps ask the Source Code app to show a file, even before its lazy chunk has loaded.
export type SourceRequest = { line?: number; query: string };

const sourceRequests = createRequestChannel<SourceRequest>();

export const requestSource = (query: string, line?: number) => sourceRequests.request({ line, query });
export const takeSourceRequest = sourceRequests.take;
export const useSourceRequest = sourceRequests.usePending;

const WINDOW_SOURCES: Record<string, string> = {
  antgame: "src/apps/antgame/AntGameApp.tsx",
  browser: "src/apps/BrowserApp.tsx",
  calculator: "src/apps/CalculatorApp.tsx",
  code: "src/apps/code/CodeApp.tsx",
  notes: "src/apps/NotesApp.tsx",
  settings: "src/apps/SettingsApp.tsx",
  terminal: "src/apps/TerminalApp.tsx",
};

export function getWindowSource(windowId: string) {
  return WINDOW_SOURCES[windowId] ?? "src/apps/FolderApp.tsx";
}
