import { useRef } from "react";

import BrowserApp from "./apps/BrowserApp";
import TerminalApp from "./apps/TerminalApp";
import DesktopWindow from "./components/desktop/DesktopWindow";
import Taskbar from "./components/desktop/Taskbar";
import { useElementSize } from "./hooks/useElementSize";
import { useWindowManager } from "./hooks/useWindowManager";
import type { WindowId } from "./types/desktop";

function renderWindowApp(windowId: WindowId) {
  if (windowId === "terminal") {
    return <TerminalApp />;
  }

  return <BrowserApp />;
}

function App() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const bounds = useElementSize(workspaceRef);
  const { windows, closeWindow, focusWindow, minimizeWindow, openWindow, updateWindowRect } =
    useWindowManager(bounds);

  const openWindows = windows
    .filter((windowState) => windowState.isOpen)
    .sort((left, right) => left.zIndex - right.zIndex);

  const activeWindows = openWindows.filter((windowState) => windowState.animationState === "idle");
  const activeWindow = activeWindows[activeWindows.length - 1] ?? null;

  return (
    <div className="desktop-root">
      <main ref={workspaceRef} className="desktop-workspace">
        <div className="desktop-backdrop-copy">
          <p className="desktop-kicker">suuronen.dev / desktop prototype</p>
          <h1>Windowed web portfolio, not a scrolling landing page.</h1>
          <p>
            First pass: a fixed desktop, Ubuntu-like bottom bar, a browser workspace, and a
            terminal shell that can be dragged, resized, closed, and reopened.
          </p>
        </div>

        {openWindows.map((windowState) => (
          <DesktopWindow
            key={windowState.id}
            bounds={bounds}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMinimize={minimizeWindow}
            onRectChange={updateWindowRect}
            windowState={windowState}
          >
            {renderWindowApp(windowState.id)}
          </DesktopWindow>
        ))}
      </main>

      <Taskbar
        activeWindowId={activeWindow?.id ?? null}
        onFocusWindow={focusWindow}
        onOpenWindow={openWindow}
        windows={windows}
      />
    </div>
  );
}

export default App;
