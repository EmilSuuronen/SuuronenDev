import { useEffect, useRef, useState } from "react";

import { createInitialWindows } from "../data/desktop";
import type {
  DesktopBounds,
  DesktopWindowState,
  WindowAnimationState,
  WindowId,
  WindowRect,
} from "../types/desktop";
import { clampWindowToBounds } from "../utils/windowMath";

const WINDOW_EXIT_ANIMATION_MS = 220;

export function useWindowManager(bounds: DesktopBounds) {
  const [windows, setWindows] = useState<DesktopWindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(10);
  const exitTimeoutsRef = useRef<Partial<Record<WindowId, number>>>({});

  const clearExitTimeout = (windowId: WindowId) => {
    const timeoutId = exitTimeoutsRef.current[windowId];

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete exitTimeoutsRef.current[windowId];
    }
  };

  useEffect(() => {
    if (!bounds.width || !bounds.height) {
      return;
    }

    setWindows((currentWindows) => {
      if (currentWindows.length === 0) {
        return createInitialWindows(bounds);
      }

      return currentWindows.map((windowState) => clampWindowToBounds(windowState, bounds));
    });
  }, [bounds.height, bounds.width]);

  useEffect(() => {
    return () => {
      Object.values(exitTimeoutsRef.current).forEach((timeoutId) => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      });
    };
  }, []);

  const bringToFront = (windowId: WindowId, shouldOpen: boolean) => {
    clearExitTimeout(windowId);

    setNextZIndex((currentZIndex) => {
      const raisedZIndex = currentZIndex + 1;

      setWindows((currentWindows) =>
        currentWindows.map((windowState) =>
          windowState.id === windowId
            ? {
                ...windowState,
                animationState: "idle",
                isOpen: shouldOpen ? true : windowState.isOpen,
                zIndex: raisedZIndex,
              }
            : windowState,
        ),
      );

      return raisedZIndex;
    });
  };

  const beginWindowExit = (windowId: WindowId, animationState: WindowAnimationState) => {
    clearExitTimeout(windowId);

    setWindows((currentWindows) =>
      currentWindows.map((windowState) =>
        windowState.id === windowId
          ? {
              ...windowState,
              animationState,
              isOpen: true,
            }
          : windowState,
      ),
    );

    exitTimeoutsRef.current[windowId] = window.setTimeout(() => {
      setWindows((currentWindows) =>
        currentWindows.map((windowState) =>
          windowState.id === windowId
            ? {
                ...windowState,
                animationState: "idle",
                isOpen: false,
              }
            : windowState,
        ),
      );

      delete exitTimeoutsRef.current[windowId];
    }, WINDOW_EXIT_ANIMATION_MS);
  };

  const closeWindow = (windowId: WindowId) => {
    beginWindowExit(windowId, "closing");
  };

  const minimizeWindow = (windowId: WindowId) => {
    beginWindowExit(windowId, "minimizing");
  };

  const updateWindowRect = (windowId: WindowId, nextRect: WindowRect) => {
    setWindows((currentWindows) =>
      currentWindows.map((windowState) =>
        windowState.id === windowId
          ? clampWindowToBounds({ ...windowState, ...nextRect }, bounds)
          : windowState,
      ),
    );
  };

  const openWindow = (windowId: WindowId) => {
    bringToFront(windowId, true);
  };

  const focusWindow = (windowId: WindowId) => {
    bringToFront(windowId, false);
  };

  return {
    windows,
    closeWindow,
    focusWindow,
    minimizeWindow,
    openWindow,
    updateWindowRect,
  };
}
