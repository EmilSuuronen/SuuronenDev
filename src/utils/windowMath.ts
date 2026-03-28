import type { DesktopBounds, DesktopWindowState, ResizeEdge, WindowRect } from "../types/desktop";

export const WINDOW_GAP = 16;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getMaximizedWindowRect(bounds: DesktopBounds): WindowRect {
  return {
    position: { x: 0, y: 0 },
    size: {
      width: Math.max(0, bounds.width),
      height: Math.max(0, bounds.height),
    },
  };
}

export function clampWindowToBounds(
  windowState: DesktopWindowState,
  bounds: DesktopBounds,
): DesktopWindowState {
  if (!bounds.width || !bounds.height) {
    return windowState;
  }

  if (windowState.isMaximized) {
    const maximizedRect = getMaximizedWindowRect(bounds);

    return {
      ...windowState,
      ...maximizedRect,
    };
  }

  const maxWidth = Math.max(
    windowState.minSize.width,
    Math.min(windowState.maxSize?.width ?? Number.POSITIVE_INFINITY, bounds.width),
  );
  const maxHeight = Math.max(
    windowState.minSize.height,
    Math.min(windowState.maxSize?.height ?? Number.POSITIVE_INFINITY, bounds.height),
  );
  const width = Math.min(windowState.size.width, maxWidth);
  const height = Math.min(windowState.size.height, maxHeight);
  const maxX = Math.max(0, bounds.width - width);
  const maxY = Math.max(0, bounds.height - height);

  return {
    ...windowState,
    size: { width, height },
    position: {
      x: clamp(windowState.position.x, 0, maxX),
      y: clamp(windowState.position.y, 0, maxY),
    },
  };
}

export function moveWindow(
  windowState: DesktopWindowState,
  deltaX: number,
  deltaY: number,
  bounds: DesktopBounds,
): WindowRect {
  const maxX = Math.max(0, bounds.width - windowState.size.width);
  const maxY = Math.max(0, bounds.height - windowState.size.height);

  return {
    size: windowState.size,
    position: {
      x: clamp(windowState.position.x + deltaX, 0, maxX),
      y: clamp(windowState.position.y + deltaY, 0, maxY),
    },
  };
}

export function resizeWindow(
  windowState: DesktopWindowState,
  edge: ResizeEdge,
  deltaX: number,
  deltaY: number,
  bounds: DesktopBounds,
): WindowRect {
  let left = windowState.position.x;
  let top = windowState.position.y;
  let right = windowState.position.x + windowState.size.width;
  let bottom = windowState.position.y + windowState.size.height;
  const maxWidth = Math.min(
    windowState.maxSize?.width ?? Number.POSITIVE_INFINITY,
    bounds.width,
  );
  const maxHeight = Math.min(
    windowState.maxSize?.height ?? Number.POSITIVE_INFINITY,
    bounds.height,
  );

  if (edge.includes("e")) {
    right = clamp(
      right + deltaX,
      left + windowState.minSize.width,
      Math.min(bounds.width, left + maxWidth),
    );
  }

  if (edge.includes("s")) {
    bottom = clamp(
      bottom + deltaY,
      top + windowState.minSize.height,
      Math.min(bounds.height, top + maxHeight),
    );
  }

  if (edge.includes("w")) {
    left = clamp(
      left + deltaX,
      Math.max(0, right - maxWidth),
      right - windowState.minSize.width,
    );
  }

  if (edge.includes("n")) {
    top = clamp(
      top + deltaY,
      Math.max(0, bottom - maxHeight),
      bottom - windowState.minSize.height,
    );
  }

  return {
    position: { x: left, y: top },
    size: { width: right - left, height: bottom - top },
  };
}
