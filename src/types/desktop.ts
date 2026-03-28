export type WindowId = "terminal" | "browser" | "calculator" | "settings" | "notes";
export type DesktopFileId = `note:${string}`;
export type DesktopAppId = WindowId | "molkkis";
export type FolderId = "applications" | "trash" | `user-folder:${string}`;
export type DesktopEntryId = DesktopAppId | DesktopFileId | FolderId;
export type DesktopIconKey =
  | "terminal"
  | "browser"
  | "calculator"
  | "settings"
  | "notes"
  | "textfile"
  | "molkkis"
  | "trash"
  | "folder";
export type WindowEntityId = WindowId | `folder:${FolderId}`;

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
  folderId?: FolderId;
  icon: DesktopIconKey;
  id: WindowEntityId;
  isOpen: boolean;
  isMaximized: boolean;
  kind: "app" | "folder";
  maxSize?: Size;
  position: Point;
  restoreRect?: WindowRect | null;
  size: Size;
  minSize: Size;
  title: string;
  zIndex: number;
};

export type WindowRect = Pick<DesktopWindowState, "position" | "size">;

export type DesktopLauncher = {
  id: WindowId;
  label: string;
  icon: DesktopIconKey;
  subtitle: string;
};

export type DesktopIconState = {
  id: DesktopEntryId;
  icon: DesktopIconKey;
  kind: "app" | "folder" | "file";
  label: string;
  parentId: FolderId | null;
  position: Point;
  noteId?: DesktopFileId;
  windowId?: WindowId;
  href?: string;
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

export type StartMenuItem =
  | {
      action:
        | {
            type: "open_entry";
            entryId: DesktopEntryId;
          }
        | {
            type: "none";
          };
      description?: string;
      icon: DesktopIconKey;
      label: string;
    }
  | {
      action:
        | {
            type: "open_link";
            href: string;
          }
        | {
            type: "none";
          };
      description?: string;
      icon: "mail" | "github" | "linkedin";
      label: string;
    };

export type StartMenuSection = {
  items: StartMenuItem[];
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
  note?: string;
  highlights?: string[];
  view?: "cards" | "tech-stack" | "contact";
};

export type NoteFile = {
  content: string;
  createdAt: string;
  id: DesktopFileId;
  title: string;
  trashedAt?: string | null;
  updatedAt: string;
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
  run: (context: TerminalCommandContext) => TerminalCommandResult;
};

export type TerminalCommandContext = {
  now: Date;
  useCompactArt: boolean;
};

export type TerminalCommandResult =
  | {
      type: "clear";
    }
  | {
      lines: TerminalLine[];
      type: "output";
    };
