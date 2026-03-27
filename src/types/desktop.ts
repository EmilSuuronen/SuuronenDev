export type WindowId = "terminal" | "browser" | "calculator";

export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type DesktopBounds = Size;

export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
export type WindowAnimationState = "idle" | "minimizing" | "closing";

export type DesktopWindowState = {
  animationState: WindowAnimationState;
  id: WindowId;
  title: string;
  icon: string;
  isOpen: boolean;
  position: Point;
  size: Size;
  minSize: Size;
  zIndex: number;
};

export type WindowRect = Pick<DesktopWindowState, "position" | "size">;

export type DesktopLauncher = {
  id: WindowId;
  label: string;
  icon: string;
  subtitle: string;
};

export type DesktopIconState = {
  id: WindowId;
  icon: string;
  label: string;
  position: Point;
};

export type DesktopMenuItem = {
  action?:
    | {
        type: "open_window";
        windowId: WindowId;
      }
    | {
        type: "none";
      };
  description?: string;
  href?: string;
  icon?:
    | "mail"
    | "github"
    | "linkedin";
  label: string;
};

export type DesktopMenu = {
  items: DesktopMenuItem[];
  label: string;
};

export type BrowserCard = {
  title: string;
  description: string;
  label: string;
  href?: string;
};

export type BrowserSection = {
  id: string;
  label: string;
  eyebrow: string;
  heading: string;
  description: string;
  cards: BrowserCard[];
};

export type TerminalLine =
  | {
      kind: "prompt";
      value: string;
    }
  | {
      kind: "output" | "accent" | "error";
      value: string;
    }
  | {
      href: string;
      kind: "link";
      label: string;
      value: string;
    };

export type TerminalCommandDefinition = {
  description: string;
  input: string;
  output: TerminalLine[];
};
