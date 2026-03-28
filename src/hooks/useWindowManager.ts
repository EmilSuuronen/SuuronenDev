import { useEffect, useRef, useState } from "react";

import { createInitialWindows, isMobileDesktopViewport } from "../data/desktop";
import type {
  DesktopBounds,
  DesktopWindowState,
  FolderId,
  WindowAnimationState,
  WindowEntityId,
  WindowId,
  WindowRect,
} from "../types/desktop";
import { clampWindowToBounds, getMaximizedWindowRect } from "../utils/windowMath";

const WINDOW_EXIT_ANIMATION_MS = 220;

function applyWindowViewportMode(
  windowState: DesktopWindowState,
  bounds: DesktopBounds,
  isMobile: boolean,
) {
  if (!bounds.width || !bounds.height) {
    return windowState;
  }

  if (isMobile) {
    return {
      ...windowState,
      ...getMaximizedWindowRect(bounds),
      isMaximized: true,
      maximizeMode: windowState.maximizeMode ?? "mobile",
      restoreRect: windowState.restoreRect ?? {
        position: windowState.position,
        size: windowState.size,
      },
    };
  }

  if (windowState.maximizeMode === "mobile") {
    const restoredWindow = clampWindowToBounds(
      {
        ...windowState,
        isMaximized: false,
        maximizeMode: null,
        position: windowState.restoreRect?.position ?? windowState.position,
        restoreRect: null,
        size: windowState.restoreRect?.size ?? windowState.size,
      },
      bounds,
    );

    return restoredWindow;
  }

  return clampWindowToBounds(windowState, bounds);
}

export function useWindowManager(bounds: DesktopBounds) {
  const [windows, setWindows] = useState<DesktopWindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(10);
  const exitTimeoutsRef = useRef<Partial<Record<WindowEntityId, number>>>({});
  const isMobile = isMobileDesktopViewport(bounds);

  const clearExitTimeout = (windowId: WindowEntityId) => {
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

      return currentWindows.map((windowState) =>
        applyWindowViewportMode(windowState, bounds, isMobile),
      );
    });
  }, [bounds.height, bounds.width, isMobile]);

  useEffect(() => {
    return () => {
      Object.values(exitTimeoutsRef.current).forEach((timeoutId) => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      });
    };
  }, []);

  const bringToFront = (windowId: WindowEntityId, shouldOpen: boolean) => {
    clearExitTimeout(windowId);

    setNextZIndex((currentZIndex) => {
      const raisedZIndex = currentZIndex + 1;

      setWindows((currentWindows) =>
        currentWindows.map((windowState) =>
          windowState.id === windowId
            ? {
                ...applyWindowViewportMode(windowState, bounds, isMobile),
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

  const beginWindowExit = (windowId: WindowEntityId, animationState: WindowAnimationState) => {
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

  const closeWindow = (windowId: WindowEntityId) => {
    beginWindowExit(windowId, "closing");
  };

  const minimizeWindow = (windowId: WindowEntityId) => {
    beginWindowExit(windowId, "minimizing");
  };

  const restoreWindowFromDrag = (windowId: WindowEntityId, nextRect: WindowRect) => {
    if (isMobile) {
      return;
    }

    setWindows((currentWindows) =>
      currentWindows.map((windowState) =>
        windowState.id === windowId
          ? clampWindowToBounds(
              {
                ...windowState,
                ...nextRect,
                isMaximized: false,
                maximizeMode: null,
                restoreRect: null,
              },
              bounds,
            )
          : windowState,
      ),
    );

    bringToFront(windowId, false);
  };

  const toggleMaximizeWindow = (windowId: WindowEntityId) => {
    if (isMobile) {
      return;
    }

    setWindows((currentWindows) =>
      currentWindows.map((windowState) => {
        if (windowState.id !== windowId) {
          return windowState;
        }

        if (windowState.isMaximized) {
          const restoredWindow = {
            ...windowState,
            isMaximized: false,
            maximizeMode: null,
            position: windowState.restoreRect?.position ?? windowState.position,
            restoreRect: null,
            size: windowState.restoreRect?.size ?? windowState.size,
          };

          return clampWindowToBounds(restoredWindow, bounds);
        }

        return {
          ...windowState,
          ...getMaximizedWindowRect(bounds),
          isMaximized: true,
          maximizeMode: "manual",
          restoreRect: {
            position: windowState.position,
            size: windowState.size,
          },
        };
      }),
    );

    bringToFront(windowId, false);
  };

  const updateWindowRect = (windowId: WindowEntityId, nextRect: WindowRect) => {
    if (isMobile) {
      return;
    }

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

  const openFolderWindow = (folderEntry: { id: FolderId; label: string; icon?: DesktopWindowState["icon"] }) => {
    const folderWindowId = `folder:${folderEntry.id}` as const;

    clearExitTimeout(folderWindowId);

    setNextZIndex((currentZIndex) => {
      const raisedZIndex = currentZIndex + 1;

      setWindows((currentWindows) => {
        const existingWindow = currentWindows.find((windowState) => windowState.id === folderWindowId);

        if (existingWindow) {
          return currentWindows.map((windowState) =>
            windowState.id === folderWindowId
              ? {
                  ...windowState,
                animationState: "idle",
                icon: folderEntry.icon ?? windowState.icon,
                isOpen: true,
                ...(isMobile
                  ? {
                      ...getMaximizedWindowRect(bounds),
                      isMaximized: true,
                      maximizeMode: "mobile" as const,
                      restoreRect:
                        windowState.restoreRect ?? {
                          position: windowState.position,
                          size: windowState.size,
                        },
                    }
                  : {
                      isMaximized: false,
                      maximizeMode: null,
                    }),
                title: folderEntry.label,
                zIndex: raisedZIndex,
              }
              : windowState,
          );
        }

        const width = Math.min(560, Math.max(360, bounds.width * 0.36));
        const height = Math.min(420, Math.max(280, bounds.height * 0.42));

        const folderWindow: DesktopWindowState = clampWindowToBounds(
          {
            animationState: "idle",
            folderId: folderEntry.id as FolderId,
            icon: folderEntry.icon ?? "folder",
            id: folderWindowId,
            isOpen: true,
            isMaximized: isMobile,
            maximizeMode: isMobile ? "mobile" : null,
            kind: "folder",
            minSize: { width: 320, height: 240 },
            position: {
              x: Math.max(32, bounds.width / 2 - width / 2),
              y: Math.max(48, bounds.height / 2 - height / 2),
            },
            restoreRect: isMobile
              ? {
                  position: {
                    x: Math.max(32, bounds.width / 2 - width / 2),
                    y: Math.max(48, bounds.height / 2 - height / 2),
                  },
                  size: { width, height },
                }
              : null,
            size: { width, height },
            title: folderEntry.label,
            zIndex: raisedZIndex,
          },
          bounds,
        );

        return [...currentWindows, folderWindow];
      });

      return raisedZIndex;
    });
  };

  const focusWindow = (windowId: WindowEntityId) => {
    bringToFront(windowId, false);
  };

  return {
    windows,
    closeWindow,
    focusWindow,
    minimizeWindow,
    openWindow,
    openFolderWindow,
    restoreWindowFromDrag,
    toggleMaximizeWindow,
    updateWindowRect,
  };
}
