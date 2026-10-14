import { useSyncExternalStore } from "react";

// Lets other apps ask the Source Code app to show a file, even before its lazy chunk has loaded.
export type SourceRequest = { line?: number; query: string };

let pending: SourceRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function requestSource(query: string, line?: number) {
  pending = { line, query };
  emit();
}

export function takeSourceRequest() {
  const request = pending;
  pending = null;
  emit();
  return request;
}

export function useSourceRequest() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pending,
  );
}

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
