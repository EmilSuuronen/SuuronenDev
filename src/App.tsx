import { useRef } from "react";

import BrowserApp from "./apps/BrowserApp";
import CalculatorApp from "./apps/CalculatorApp";
import FolderApp from "./apps/FolderApp";
import TerminalApp from "./apps/TerminalApp";
import DesktopWallpaper from "./components/desktop/DesktopWallpaper";
import DesktopIcons from "./components/desktop/DesktopIcons";
import DesktopWindow from "./components/desktop/DesktopWindow";
import Taskbar from "./components/desktop/Taskbar";
import TopBar from "./components/desktop/TopBar";
import { useDesktopIcons } from "./hooks/useDesktopIcons";
import { useElementSize } from "./hooks/useElementSize";
import { useWindowManager } from "./hooks/useWindowManager";
import type { DesktopEntryId, FolderId, WindowId } from "./types/desktop";

function renderWindowApp(windowId: WindowId) {
  if (windowId === "terminal") {
    return <TerminalApp />;
  }

  if (windowId === "calculator") {
    return <CalculatorApp />;
  }

  return <BrowserApp />;
}

function App() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const bounds = useElementSize(workspaceRef);
  const {
    getEntry,
    getFolderEntries,
    moveIcon,
    moveIconToFolder,
    previewMoveIcon,
    rootIcons,
    selectedIconIds,
    setSelectedIconIds,
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

  const openWindows = windows
    .filter((windowState) => windowState.isOpen)
    .sort((left, right) => left.zIndex - right.zIndex);

  const activeWindows = openWindows.filter((windowState) => windowState.animationState === "idle");
  const activeWindow = activeWindows[activeWindows.length - 1] ?? null;

  const openDesktopEntry = (entryId: DesktopEntryId) => {
    const entry = getEntry(entryId);

    if (!entry) {
      return;
    }

    if (entry.kind === "folder") {
      openFolderWindow({
        id: entry.id as FolderId,
        label: entry.label,
      });
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

  return (
    <div className="desktop-root">
      <DesktopWallpaper />
      <TopBar onOpenWindow={openWindow} />

      <main ref={workspaceRef} className="desktop-workspace">
        <DesktopIcons
          icons={rootIcons}
          onMoveIcon={moveIcon}
          onMoveIconToFolder={moveIconToFolder}
          onPreviewMoveIcon={previewMoveIcon}
          onOpenIcon={openDesktopEntry}
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
              <FolderApp entries={getFolderEntries(windowState.folderId)} onOpenEntry={openDesktopEntry} />
            ) : (
              renderWindowApp(windowState.id as WindowId)
            )}
          </DesktopWindow>
        ))}
      </main>

      <Taskbar
        activeWindowId={activeWindow?.kind === "app" ? (activeWindow.id as WindowId) : null}
        onFocusWindow={focusWindow}
        onOpenWindow={openWindow}
        windows={windows}
      />
    </div>
  );
}

export default App;
