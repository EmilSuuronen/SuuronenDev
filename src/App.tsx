import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import BrowserApp from "./apps/BrowserApp";
import CalculatorApp from "./apps/CalculatorApp";
import FolderApp from "./apps/FolderApp";
import NotesApp from "./apps/NotesApp";
import SettingsApp from "./apps/SettingsApp";
import TerminalApp from "./apps/TerminalApp";
import DesktopFilterOverlay from "./components/desktop/DesktopFilterOverlay";
import DesktopContextMenu from "./components/desktop/DesktopContextMenu";
import DesktopWallpaper from "./components/desktop/DesktopWallpaper";
import DesktopIcons from "./components/desktop/DesktopIcons";
import DesktopTextDialog from "./components/desktop/DesktopTextDialog";
import DesktopWindow from "./components/desktop/DesktopWindow";
import Taskbar from "./components/desktop/Taskbar";
import TopBar from "./components/desktop/TopBar";
import type { DesktopFilterId, DesktopFilterOption } from "./data/desktopFilters";
import { isMobileDesktopViewport } from "./data/desktop";
import { useDesktopFilter } from "./hooks/useDesktopFilter";
import { useDesktopIcons } from "./hooks/useDesktopIcons";
import { useNotes } from "./hooks/useNotes";
import { useDesktopTheme } from "./hooks/useDesktopTheme";
import { useElementSize } from "./hooks/useElementSize";
import { useWindowManager } from "./hooks/useWindowManager";
import type { DesktopEntryId, FolderId, WindowId } from "./types/desktop";
import { useLocale } from "./i18n/locale";

type RenderWindowAppProps = {
  activeFilterId: string;
  currentTheme: ReturnType<typeof useDesktopTheme>["currentTheme"];
  filterOptions: DesktopFilterOption[];
  notesState: {
    activeNote: ReturnType<typeof useNotes>["activeNote"];
    allNotes: ReturnType<typeof useNotes>["allNotes"];
    notes: ReturnType<typeof useNotes>["notes"];
    onCreateNote: () => void;
    onDeleteNote: ReturnType<typeof useNotes>["deleteNote"];
    onOpenNote: ReturnType<typeof useNotes>["openNote"];
    onRenameNote: ReturnType<typeof useNotes>["renameNote"];
    onUpdateNoteContent: ReturnType<typeof useNotes>["updateNoteContent"];
  };
  onSelectFilter: (filterId: DesktopFilterId) => void;
  onResetTheme: ReturnType<typeof useDesktopTheme>["resetTheme"];
  onSelectTheme: ReturnType<typeof useDesktopTheme>["selectTheme"];
  onSetThemeColor: ReturnType<typeof useDesktopTheme>["setThemeColor"];
  themeOptions: ReturnType<typeof useDesktopTheme>["themeOptions"];
  windowId: WindowId;
};

function renderWindowApp({
  activeFilterId,
  currentTheme,
  filterOptions,
  notesState,
  onSelectFilter,
  onResetTheme,
  onSelectTheme,
  onSetThemeColor,
  themeOptions,
  windowId,
}: RenderWindowAppProps) {
  if (windowId === "terminal") {
    return <TerminalApp />;
  }

  if (windowId === "calculator") {
    return <CalculatorApp />;
  }

  if (windowId === "settings") {
    return (
      <SettingsApp
        activeFilterId={activeFilterId}
        currentTheme={currentTheme}
        filterOptions={filterOptions}
        onSelectFilter={onSelectFilter}
        onResetTheme={onResetTheme}
        onSelectTheme={onSelectTheme}
        onSetThemeColor={onSetThemeColor}
        themeOptions={themeOptions}
      />
    );
  }

    if (windowId === "notes") {
      return (
        <NotesApp
          activeNote={notesState.activeNote}
          notes={notesState.notes}
        onCreateNote={notesState.onCreateNote}
        onDeleteNote={notesState.onDeleteNote}
        onOpenNote={notesState.onOpenNote}
        onRenameNote={notesState.onRenameNote}
        onUpdateNoteContent={notesState.onUpdateNoteContent}
      />
    );
  }

  return <BrowserApp />;
}

function App() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const bounds = useElementSize(workspaceRef);
  const isMobile = isMobileDesktopViewport(bounds);
  const { t } = useLocale();
  const { currentTheme, resetTheme, selectTheme, setThemeColor, themeOptions } = useDesktopTheme();
  const { activeFilterId, filterOptions, setActiveFilterId } = useDesktopFilter();
  const notesState = useNotes();
  const [desktopContextMenu, setDesktopContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [folderDialog, setFolderDialog] = useState<{ initialValue: string } | null>(null);
  const [renameDialog, setRenameDialog] = useState<
    | { kind: "folder"; folderId: FolderId; title: string }
    | { kind: "note"; noteId: `note:${string}`; title: string }
    | null
  >(null);
  const {
    addIcon,
    getEntry,
    getFolderEntries,
    icons,
    isHydrated: iconsHydrated,
    moveIcon,
    moveIconToDesktop,
    moveIconToFolder,
    previewMoveIcon,
    reorderFolderEntry,
    removeIcon,
    rootIcons,
    selectedIconIds,
    setSelectedIconIds,
    updateIcon,
  } = useDesktopIcons(bounds);
  const {
    windows,
    closeWindow,
    focusWindow,
    minimizeWindow,
    openFolderWindow,
    openWindow,
    restoreWindowFromDrag,
    toggleMaximizeWindow,
    updateWindowRect,
  } = useWindowManager(bounds);

  const desktopThemeStyle = useMemo(
    () =>
      ({
        "--bg": currentTheme.background,
        "--panel": currentTheme.panel,
        "--panel-strong": currentTheme.panelStrong,
        "--panel-border": currentTheme.panelBorder,
        "--ink": currentTheme.ink,
        "--ink-soft": currentTheme.inkSoft,
        "--surface-dark": currentTheme.surfaceDark,
        "--surface-dark-strong": currentTheme.surfaceDarkStrong,
        "--surface-dark-border": currentTheme.surfaceDarkBorder,
        "--text-light": currentTheme.textLight,
        "--text-light-soft": currentTheme.textLightSoft,
        "--accent": currentTheme.accent,
        "--accent-soft": currentTheme.accentSoft,
        "--accent-strong": currentTheme.accentStrong,
        "--wallpaper-glow-a": currentTheme.wallpaperGlowA,
        "--wallpaper-glow-b": currentTheme.wallpaperGlowB,
        "--wallpaper-glow-c": currentTheme.wallpaperGlowC,
      }) as CSSProperties,
    [currentTheme],
  );

  const openWindows = windows
    .filter((windowState) => windowState.isOpen)
    .sort((left, right) => left.zIndex - right.zIndex);
  const workspaceClientBounds = workspaceRef.current?.getBoundingClientRect();
  const folderWindowDropTargets = openWindows
    .filter((windowState) => windowState.kind === "folder" && windowState.folderId)
    .map((windowState) => ({
      bottom:
        (workspaceClientBounds?.top ?? 0) + windowState.position.y + windowState.size.height,
      folderId: windowState.folderId as FolderId,
      left: (workspaceClientBounds?.left ?? 0) + windowState.position.x,
      right:
        (workspaceClientBounds?.left ?? 0) + windowState.position.x + windowState.size.width,
      top:
        (workspaceClientBounds?.top ?? 0) + windowState.position.y + 48,
    }));

  const activeWindows = openWindows.filter((windowState) => windowState.animationState === "idle");
  const activeWindow = activeWindows[activeWindows.length - 1] ?? null;

  useEffect(() => {
    if (!iconsHydrated) {
      return;
    }

    const noteIds = new Set(notesState.allNotes.map((note) => note.id));
    const fileIcons = icons.filter((icon) => icon.kind === "file");

    fileIcons.forEach((icon) => {
      if (!noteIds.has(icon.id as `note:${string}`)) {
        removeIcon(icon.id);
      }
    });

    notesState.allNotes.forEach((note) => {
      const existingIcon = icons.find((icon) => icon.id === note.id);
      const noteParentId = note.trashedAt ? "trash" : existingIcon?.parentId ?? null;

      if (!existingIcon) {
        addIcon({
          id: note.id,
          icon: "textfile",
          kind: "file",
          label: note.title,
          noteId: note.id,
          parentId: noteParentId,
          position: { x: 0, y: 0 },
        });
        return;
      }

      if (
        existingIcon.label !== note.title ||
        existingIcon.parentId !== noteParentId ||
        existingIcon.noteId !== note.id
      ) {
        updateIcon(note.id, {
          label: note.title,
          noteId: note.id,
          parentId: noteParentId,
        });
      }
    });
  }, [addIcon, icons, iconsHydrated, notesState.allNotes, removeIcon, updateIcon]);

  const handleCreateNote = () => {
    const note = notesState.createNote();
    addIcon({
      id: note.id,
      icon: "textfile",
      kind: "file",
      label: note.title,
      noteId: note.id,
      parentId: null,
      position: { x: 0, y: 0 },
    });
    openWindow("notes");
  };

  const handleDeleteNote = (noteId: `note:${string}`) => {
    notesState.deleteNote(noteId);
  };

  const handleRenameNote = (noteId: `note:${string}`) => {
    const targetNote = notesState.allNotes.find((note) => note.id === noteId);

    if (!targetNote) {
      return;
    }

    setRenameDialog({
      kind: "note",
      noteId,
      title: targetNote.title,
    });
  };

  const handleRenameFolder = (folderId: FolderId) => {
    const targetFolder = icons.find((icon) => icon.id === folderId && icon.kind === "folder");

    if (!targetFolder) {
      return;
    }

    setRenameDialog({
      folderId,
      kind: "folder",
      title: targetFolder.label,
    });
  };

  const handleDeleteFolder = (folderId: FolderId) => {
    moveIconToFolder(folderId, "trash");
  };

  const openDesktopEntry = (entryId: DesktopEntryId) => {
    const entry = getEntry(entryId);

    if (!entry) {
      return;
    }

    if (entry.kind === "folder") {
      openFolderWindow({
        id: entry.id as FolderId,
        icon: entry.icon,
        label: entry.label,
      });
      return;
    }

    if (entry.kind === "file" && entry.noteId) {
      notesState.openNote(entry.noteId);
      openWindow("notes");
      return;
    }

    if (entry.href) {
      window.open(entry.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (entry.windowId) {
      openWindow(entry.windowId);
    }
  };

  const handleExtractEntryToDesktop = (entryId: DesktopEntryId, clientX: number, clientY: number) => {
    const workspaceBounds = workspaceRef.current?.getBoundingClientRect();

    if (!workspaceBounds) {
      return;
    }

    moveIconToDesktop(
      entryId,
      clientX - workspaceBounds.left - 44,
      clientY - workspaceBounds.top - 48,
    );
  };

  const handleCreateFolderRequest = () => {
    setFolderDialog({ initialValue: t("New folder") });
  };

  const handleCreateFolder = (value: string) => {
    const trimmed = value.trim() || t("New folder");
    const folderId = `user-folder:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}` as FolderId;

    addIcon({
      id: folderId,
      icon: "folder",
      kind: "folder",
      label: trimmed,
      parentId: null,
      position: { x: 0, y: 0 },
    });
    setDesktopContextMenu(null);
    setFolderDialog(null);
  };

  useEffect(() => {
    if (!desktopContextMenu) {
      return undefined;
    }

    const closeMenu = () => setDesktopContextMenu(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopContextMenu(null);
      }
    };

    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("contextmenu", closeMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("contextmenu", closeMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [desktopContextMenu]);

  useEffect(() => {
    const workspaceElement = workspaceRef.current;

    if (!workspaceElement) {
      return undefined;
    }

    const handleWorkspaceContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.closest(".desktop-window") ||
        target?.closest(".desktop-icon") ||
        target?.closest(".desktop-context-menu")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setDesktopContextMenu({
        x: event.clientX,
        y: event.clientY,
      });
    };

    workspaceElement.addEventListener("contextmenu", handleWorkspaceContextMenu);

    return () => {
      workspaceElement.removeEventListener("contextmenu", handleWorkspaceContextMenu);
    };
  }, []);

  return (
    <div className={`desktop-root desktop-root--filter-${activeFilterId}`} style={desktopThemeStyle}>
      <DesktopWallpaper theme={currentTheme} />
      <DesktopFilterOverlay filterId={activeFilterId} />
      <TopBar onOpenWindow={openWindow} />

      <main
        ref={workspaceRef}
        className="desktop-workspace"
      >
        <DesktopIcons
          folderWindowDropTargets={folderWindowDropTargets}
          onDeleteFolder={handleDeleteFolder}
          icons={rootIcons}
          onDeleteNote={handleDeleteNote}
          onMoveIcon={moveIcon}
          onMoveIconToFolder={moveIconToFolder}
          onPreviewMoveIcon={previewMoveIcon}
          onOpenIcon={openDesktopEntry}
          onRenameFolder={handleRenameFolder}
          onRenameNote={handleRenameNote}
          onSelectIcons={setSelectedIconIds}
          selectedIconIds={selectedIconIds}
        />

        {openWindows.map((windowState) => (
          <DesktopWindow
            key={windowState.id}
            bounds={bounds}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMinimize={minimizeWindow}
            onRestoreFromDrag={restoreWindowFromDrag}
            onToggleMaximize={toggleMaximizeWindow}
            onRectChange={updateWindowRect}
            windowState={windowState}
          >
            {windowState.kind === "folder" && windowState.folderId ? (
              <FolderApp
                entries={getFolderEntries(windowState.folderId)}
                onExtractEntry={handleExtractEntryToDesktop}
                onOpenEntry={openDesktopEntry}
                onReorderEntry={(entryId, targetIndex) => reorderFolderEntry(entryId, windowState.folderId!, targetIndex)}
              />
            ) : (
              renderWindowApp({
                activeFilterId,
                currentTheme,
                filterOptions,
                notesState: {
                activeNote: notesState.activeNote,
                allNotes: notesState.allNotes,
                notes: notesState.notes,
                onCreateNote: handleCreateNote,
                onDeleteNote: handleDeleteNote,
                  onOpenNote: notesState.openNote,
                  onRenameNote: notesState.renameNote,
                  onUpdateNoteContent: notesState.updateNoteContent,
                },
                onSelectFilter: setActiveFilterId,
                onResetTheme: resetTheme,
                onSelectTheme: selectTheme,
                onSetThemeColor: setThemeColor,
                themeOptions,
                windowId: windowState.id as WindowId,
              })
            )}
          </DesktopWindow>
        ))}
      </main>

      <Taskbar
        activeWindowId={activeWindow?.kind === "app" ? (activeWindow.id as WindowId) : null}
        isMobile={isMobile}
        onOpenEntry={openDesktopEntry}
        onFocusWindow={focusWindow}
        onOpenWindow={openWindow}
        windows={windows}
      />

      {desktopContextMenu ? (
        <DesktopContextMenu
          sections={[
            {
              items: [
                {
                  label: t("New folder"),
                  onSelect: () => {
                    handleCreateFolderRequest();
                  },
                },
              ],
            },
            {
              items: [
                {
                  label: t("Open Settings"),
                  onSelect: () => {
                    openWindow("settings");
                    setDesktopContextMenu(null);
                  },
                },
                {
                  label: t("Open Terminal"),
                  onSelect: () => {
                    openWindow("terminal");
                    setDesktopContextMenu(null);
                  },
                },
              ],
            },
          ]}
          x={desktopContextMenu.x}
          y={desktopContextMenu.y}
        />
      ) : null}

      {renameDialog ? (
        <DesktopTextDialog
          cancelLabel={t("Cancel")}
          confirmLabel={renameDialog.kind === "folder" ? t("Rename") : t("Rename")}
          initialValue={renameDialog.title}
          message={
            renameDialog.kind === "folder"
              ? t("Enter a new name for this folder.")
              : t("Enter a new filename for this desktop note.")
          }
          onCancel={() => setRenameDialog(null)}
          onConfirm={(value) => {
            if (renameDialog.kind === "folder") {
              updateIcon(renameDialog.folderId, { label: value.trim() || t("New folder") });
            } else {
              notesState.renameNote(renameDialog.noteId, value);
            }
            setRenameDialog(null);
          }}
          title={renameDialog.kind === "folder" ? t("Rename folder") : t("Rename note")}
        />
      ) : null}

      {folderDialog ? (
        <DesktopTextDialog
          cancelLabel={t("Cancel")}
          confirmLabel={t("Create")}
          initialValue={folderDialog.initialValue}
          message={t("Enter a name for the new folder.")}
          onCancel={() => setFolderDialog(null)}
          onConfirm={handleCreateFolder}
          title={t("Create folder")}
        />
      ) : null}
    </div>
  );
}

export default App;
