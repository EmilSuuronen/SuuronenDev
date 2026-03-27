import type {
  DesktopBounds,
  DesktopIconState,
  DesktopLauncher,
  DesktopWindowState,
} from "../types/desktop";
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
  {
    id: "calculator",
    label: "Calculator",
    icon: "+/-",
    subtitle: "Quick math",
  },
];

const DESKTOP_ICON_WIDTH = 88;
const DESKTOP_ICON_HEIGHT = 96;

export function createInitialDesktopIcons(bounds: DesktopBounds): DesktopIconState[] {
  const iconX = WINDOW_GAP + 6;

  return desktopLaunchers.map((launcher, index) => ({
    id: launcher.id,
    icon: launcher.icon,
    label: launcher.label,
    position: {
      x: iconX,
      y: 28 + index * (DESKTOP_ICON_HEIGHT + 12),
    },
  }));
}

export function createInitialWindows(bounds: DesktopBounds): DesktopWindowState[] {
  const safeWidth = Math.max(bounds.width, 360);
  const safeHeight = Math.max(bounds.height, 420);
  const isCompact = safeWidth < 920;
  const browserHorizontalPadding = 28;
  const browserTopPadding = 30;
  const terminalRightPadding = 28;
  const terminalTopPadding = 340;

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

  const browserX = isCompact ? WINDOW_GAP : browserHorizontalPadding;
  const browserY = isCompact ? 132 : browserTopPadding;
  const terminalX = isCompact
    ? WINDOW_GAP
    : Math.max(WINDOW_GAP, safeWidth - terminalWidth - terminalRightPadding);
  const terminalY = isCompact ? 28 : Math.min(safeHeight - terminalHeight - 28, terminalTopPadding);
  const calculatorWidth = clamp(
    Math.round(safeWidth * (isCompact ? 0.78 : 0.24)),
    280,
    Math.min(360, safeWidth - WINDOW_GAP * 2),
  );
  const calculatorHeight = clamp(
    Math.round(safeHeight * (isCompact ? 0.42 : 0.56)),
    360,
    Math.min(520, safeHeight - WINDOW_GAP * 2),
  );
  const calculatorX = isCompact
    ? WINDOW_GAP
    : Math.max(WINDOW_GAP, safeWidth / 2 - calculatorWidth / 2 + 120);
  const calculatorY = isCompact ? 84 : 84;

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
      zIndex: 3,
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
      zIndex: 2,
    },
    {
      animationState: "idle",
      id: "calculator",
      title: "calc.app",
      icon: "+/-",
      isOpen: false,
      position: { x: calculatorX, y: calculatorY },
      size: { width: calculatorWidth, height: calculatorHeight },
      minSize: { width: 260, height: 360 },
      zIndex: 1,
    },
  ];
}
