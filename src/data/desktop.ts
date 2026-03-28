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
    icon: "terminal",
    subtitle: "System shell",
  },
  {
    id: "browser",
    label: "Browser",
    icon: "browser",
    subtitle: "Content workspace",
  },
  {
    id: "calculator",
    label: "Calculator",
    icon: "calculator",
    subtitle: "Quick math",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
    subtitle: "Themes and personalization",
  },
  {
    id: "notes",
    label: "Notes",
    icon: "notes",
    subtitle: "Text editor and desktop notes",
  },
];

export const DESKTOP_ICON_WIDTH = 88;
export const DESKTOP_ICON_HEIGHT = 96;
export const DESKTOP_ICON_START_X = WINDOW_GAP + 6;
export const DESKTOP_ICON_START_Y = 28;
export const DESKTOP_ICON_X_GAP = 18;
export const DESKTOP_ICON_Y_GAP = 12;
export const MOBILE_DESKTOP_BREAKPOINT = 820;

export function isMobileDesktopViewport(bounds: Pick<DesktopBounds, "width">) {
  return bounds.width <= MOBILE_DESKTOP_BREAKPOINT;
}

export function isMobileDesktopIconLayout(bounds: Pick<DesktopBounds, "width">) {
  return isMobileDesktopViewport(bounds);
}

function getMobileDesktopIconColumns(bounds: Pick<DesktopBounds, "width">) {
  return Math.max(
    1,
    Math.floor(
      (Math.max(bounds.width, DESKTOP_ICON_WIDTH) - DESKTOP_ICON_START_X * 2 + DESKTOP_ICON_X_GAP) /
        (DESKTOP_ICON_WIDTH + DESKTOP_ICON_X_GAP),
    ),
  );
}

export function getDefaultDesktopRootIconPosition(index: number, bounds: Pick<DesktopBounds, "width">) {
  if (isMobileDesktopIconLayout(bounds)) {
    const columnCount = getMobileDesktopIconColumns(bounds);

    return {
      x: DESKTOP_ICON_START_X + (index % columnCount) * (DESKTOP_ICON_WIDTH + DESKTOP_ICON_X_GAP),
      y: DESKTOP_ICON_START_Y + Math.floor(index / columnCount) * (DESKTOP_ICON_HEIGHT + DESKTOP_ICON_Y_GAP),
    };
  }

  return {
    x: DESKTOP_ICON_START_X,
    y: DESKTOP_ICON_START_Y + index * (DESKTOP_ICON_HEIGHT + DESKTOP_ICON_Y_GAP),
  };
}

export function createInitialDesktopIcons(bounds: DesktopBounds): DesktopIconState[] {
  const desktopIconApps: DesktopIconState[] = [
    ...desktopLaunchers.map((launcher) => ({
      id: launcher.id,
      icon: launcher.icon,
      kind: "app" as const,
      label: launcher.label,
      parentId: null,
      position: { x: 0, y: 0 },
      windowId: launcher.id,
    })),
    {
      id: "applications",
      icon: "folder",
      kind: "folder" as const,
      label: "Applications",
      parentId: null,
      position: { x: 0, y: 0 },
    },
    {
      id: "trash",
      icon: "trash",
      kind: "folder" as const,
      label: "Trash",
      parentId: null,
      position: { x: 0, y: 0 },
    },
    {
      id: "molkkis",
      href: "https://emilsuuronen.github.io/molkkis/",
      icon: "molkkis",
      kind: "app" as const,
      label: "Mölkkis",
      parentId: "applications",
      position: { x: 0, y: 0 },
    },
  ];

  let rootIndex = 0;

  return desktopIconApps.map((app) => {
    if (app.parentId !== null) {
      return app;
    }

    if (app.id === "trash" && !isMobileDesktopIconLayout(bounds)) {
      return {
        ...app,
        position: {
          x: Math.max(
            DESKTOP_ICON_START_X,
            bounds.width - DESKTOP_ICON_WIDTH - WINDOW_GAP - 10,
          ),
          y: Math.max(
            DESKTOP_ICON_START_Y,
            bounds.height - DESKTOP_ICON_HEIGHT - WINDOW_GAP - 10,
          ),
        },
      };
    }

    const position = getDefaultDesktopRootIconPosition(rootIndex, bounds);
    rootIndex += 1;

    return {
      ...app,
      position,
    };
  });
}

export function createInitialWindows(bounds: DesktopBounds): DesktopWindowState[] {
  const safeWidth = Math.max(bounds.width, 360);
  const safeHeight = Math.max(bounds.height, 420);
  const isMobile = isMobileDesktopViewport(bounds);
  const isCompact = safeWidth < 920;
  const browserHorizontalPadding = 116;
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
    isCompact ? 320 : 344,
    300,
    Math.min(360, safeWidth - WINDOW_GAP * 2),
  );
  const calculatorHeight = clamp(
    isCompact ? 492 : 508,
    460,
    Math.min(540, safeHeight - WINDOW_GAP * 2),
  );
  const calculatorX = isCompact
    ? WINDOW_GAP
    : Math.max(WINDOW_GAP, safeWidth / 2 - calculatorWidth / 2 + 120);
  const calculatorY = isCompact ? 84 : 84;
  const settingsWidth = clamp(
    isCompact ? 360 : 760,
    340,
    Math.min(860, safeWidth - WINDOW_GAP * 2),
  );
  const settingsHeight = clamp(
    isCompact ? 520 : 560,
    420,
    Math.min(620, safeHeight - WINDOW_GAP * 2),
  );
  const settingsX = isCompact
    ? WINDOW_GAP
    : Math.max(WINDOW_GAP, safeWidth / 2 - settingsWidth / 2 + 40);
  const settingsY = isCompact ? 60 : 62;
  const notesWidth = clamp(
    isCompact ? 360 : 820,
    360,
    Math.min(960, safeWidth - WINDOW_GAP * 2),
  );
  const notesHeight = clamp(
    isCompact ? 520 : 620,
    420,
    Math.min(720, safeHeight - WINDOW_GAP * 2),
  );
  const notesX = isCompact ? WINDOW_GAP : Math.max(WINDOW_GAP, safeWidth / 2 - notesWidth / 2 - 30);
  const notesY = isCompact ? 72 : 50;

  return [
    {
      animationState: "idle",
      id: "terminal",
      kind: "app",
      title: "emil@desktop: terminal",
      icon: "terminal",
      isOpen: !isMobile,
      isMaximized: false,
      maximizeMode: null,
      position: { x: terminalX, y: terminalY },
      restoreRect: null,
      size: { width: terminalWidth, height: terminalHeight },
      minSize: { width: 280, height: 200 },
      zIndex: 3,
    },
    {
      animationState: "idle",
      id: "browser",
      kind: "app",
      title: "workspace.browser",
      icon: "browser",
      isOpen: !isMobile,
      isMaximized: false,
      maximizeMode: null,
      position: { x: browserX, y: browserY },
      restoreRect: null,
      size: { width: browserWidth, height: browserHeight },
      minSize: { width: 320, height: 260 },
      zIndex: 2,
    },
    {
      animationState: "idle",
      id: "calculator",
      kind: "app",
      title: "calc.app",
      icon: "calculator",
      isOpen: false,
      isMaximized: false,
      maximizeMode: null,
      position: { x: calculatorX, y: calculatorY },
      restoreRect: null,
      size: { width: calculatorWidth, height: calculatorHeight },
      minSize: { width: 300, height: 460 },
      maxSize: { width: 360, height: 540 },
      zIndex: 1,
    },
    {
      animationState: "idle",
      id: "settings",
      kind: "app",
      title: "system.settings",
      icon: "settings",
      isOpen: false,
      isMaximized: false,
      maximizeMode: null,
      position: { x: settingsX, y: settingsY },
      restoreRect: null,
      size: { width: settingsWidth, height: settingsHeight },
      minSize: { width: 520, height: 420 },
      maxSize: { width: 980, height: 760 },
      zIndex: 0,
    },
    {
      animationState: "idle",
      id: "notes",
      kind: "app",
      title: "notes.app",
      icon: "notes",
      isOpen: false,
      isMaximized: false,
      maximizeMode: null,
      position: { x: notesX, y: notesY },
      restoreRect: null,
      size: { width: notesWidth, height: notesHeight },
      minSize: { width: 560, height: 420 },
      maxSize: { width: 1180, height: 860 },
      zIndex: -1,
    },
  ];
}
