import type { DesktopBounds, DesktopLauncher, DesktopWindowState } from "../types/desktop";
import { WINDOW_GAP, clamp } from "../utils/windowMath";

export const desktopLaunchers: DesktopLauncher[] = [
  {
    id: "terminal",
    label: "Terminal",
    icon: ">_",
    subtitle: "System shell",
  },
  {
    id: "browser",
    label: "Browser",
    icon: "[]",
    subtitle: "Content workspace",
  },
];

export function createInitialWindows(bounds: DesktopBounds): DesktopWindowState[] {
  const safeWidth = Math.max(bounds.width, 360);
  const safeHeight = Math.max(bounds.height, 420);
  const isCompact = safeWidth < 920;

  const browserWidth = clamp(
    Math.round(safeWidth * (isCompact ? 0.9 : 0.55)),
    340,
    safeWidth - WINDOW_GAP * 2,
  );
  const browserHeight = clamp(
    Math.round(safeHeight * (isCompact ? 0.56 : 0.66)),
    280,
    safeHeight - WINDOW_GAP * 2,
  );

  const terminalWidth = clamp(
    Math.round(safeWidth * (isCompact ? 0.9 : 0.38)),
    300,
    safeWidth - WINDOW_GAP * 2,
  );
  const terminalHeight = clamp(
    Math.round(safeHeight * (isCompact ? 0.3 : 0.42)),
    220,
    safeHeight - WINDOW_GAP * 2,
  );

  const browserX = isCompact ? WINDOW_GAP : safeWidth - browserWidth - 32;
  const browserY = isCompact ? 132 : 56;
  const terminalX = WINDOW_GAP;
  const terminalY = isCompact ? 28 : safeHeight - terminalHeight - 28;

  return [
    {
      animationState: "idle",
      id: "terminal",
      title: "emil@desktop: terminal",
      icon: ">_",
      isOpen: true,
      position: { x: terminalX, y: terminalY },
      size: { width: terminalWidth, height: terminalHeight },
      minSize: { width: 280, height: 200 },
      zIndex: 2,
    },
    {
      animationState: "idle",
      id: "browser",
      title: "workspace.browser",
      icon: "[]",
      isOpen: true,
      position: { x: browserX, y: browserY },
      size: { width: browserWidth, height: browserHeight },
      minSize: { width: 320, height: 260 },
      zIndex: 3,
    },
  ];
}
