import { useSyncExternalStore } from "react";

// A one-slot mailbox: one part of the OS asks an app to do something, and the app picks it up when it
// renders, even if it was not mounted (or its lazy chunk not loaded) when the request was made.
export function createRequestChannel<T>() {
  let pending: T | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    request(value: T) {
      pending = value;
      emit();
    },
    take() {
      const value = pending;
      pending = null;
      emit();
      return value;
    },
    usePending() {
      return useSyncExternalStore(subscribe, () => pending);
    },
  };
}

// Commands typed into the terminal on someone else's behalf (the command palette).
export const terminalCommandRequests = createRequestChannel<string>();
