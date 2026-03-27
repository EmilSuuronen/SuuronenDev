import type { DesktopBounds, DesktopWindowState, ResizeEdge, WindowRect } from "../types/desktop";

export const WINDOW_GAP = 16;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampWindowToBounds(
  windowState: DesktopWindowState,
  bounds: DesktopBounds,
): DesktopWindowState {
  if (!bounds.width || !bounds.height) {
    return windowState;
  }

  const maxWidth = Math.max(windowState.minSize.width, bounds.width - WINDOW_GAP * 2);
  const maxHeight = Math.max(windowState.minSize.height, bounds.height - WINDOW_GAP * 2);
  const width = Math.min(windowState.size.width, maxWidth);
  const height = Math.min(windowState.size.height, maxHeight);
  const maxX = Math.max(WINDOW_GAP, bounds.width - width - WINDOW_GAP);
  const maxY = Math.max(WINDOW_GAP, bounds.height - height - WINDOW_GAP);

  return {
    ...windowState,
    size: { width, height },
    position: {
      x: clamp(windowState.position.x, WINDOW_GAP, maxX),
      y: clamp(windowState.position.y, WINDOW_GAP, maxY),
    },
  };
}

export function moveWindow(
  windowState: DesktopWindowState,
  deltaX: number,
  deltaY: number,
  bounds: DesktopBounds,
): WindowRect {
  const maxX = Math.max(WINDOW_GAP, bounds.width - windowState.size.width - WINDOW_GAP);
  const maxY = Math.max(WINDOW_GAP, bounds.height - windowState.size.height - WINDOW_GAP);

  return {
    size: windowState.size,
    position: {
      x: clamp(windowState.position.x + deltaX, WINDOW_GAP, maxX),
      y: clamp(windowState.position.y + deltaY, WINDOW_GAP, maxY),
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

  if (edge.includes("e")) {
    right = clamp(
      right + deltaX,
      left + windowState.minSize.width,
      bounds.width - WINDOW_GAP,
    );
  }

  if (edge.includes("s")) {
    bottom = clamp(
      bottom + deltaY,
      top + windowState.minSize.height,
      bounds.height - WINDOW_GAP,
    );
  }

  if (edge.includes("w")) {
    left = clamp(left + deltaX, WINDOW_GAP, right - windowState.minSize.width);
  }

  if (edge.includes("n")) {
    top = clamp(top + deltaY, WINDOW_GAP, bottom - windowState.minSize.height);
  }

  return {
    position: { x: left, y: top },
    size: { width: right - left, height: bottom - top },
  };
}
