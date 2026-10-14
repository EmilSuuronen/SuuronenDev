import { useSyncExternalStore } from "react";

import type { DesktopTheme } from "../data/themes";
import type { BrowserSection } from "../types/desktop";

// Values edited live in the Source Code app. Session-only: a reload restores the shipped data.
export type LiveValues = {
  browserSections?: BrowserSection[];
  themes?: DesktopTheme[];
};

export type LiveState = {
  drafts: Record<string, string>;
  values: LiveValues;
};

let state: LiveState = { drafts: {}, values: {} };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateLiveState(update: (current: LiveState) => LiveState) {
  state = update(state);
  listeners.forEach((listener) => listener());
}

export function useLiveState() {
  return useSyncExternalStore(subscribe, () => state);
}
