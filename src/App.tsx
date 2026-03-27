import { useRef } from "react";

import BrowserApp from "./apps/BrowserApp";
import CalculatorApp from "./apps/CalculatorApp";
import TerminalApp from "./apps/TerminalApp";
import DesktopIcons from "./components/desktop/DesktopIcons";
import DesktopWindow from "./components/desktop/DesktopWindow";
import Taskbar from "./components/desktop/Taskbar";
import TopBar from "./components/desktop/TopBar";
import { useDesktopIcons } from "./hooks/useDesktopIcons";
import { useElementSize } from "./hooks/useElementSize";
import { useWindowManager } from "./hooks/useWindowManager";
import type { WindowId } from "./types/desktop";

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
  const { icons, moveIcon, selectedIconId, setSelectedIconId } = useDesktopIcons(bounds);
  const { windows, closeWindow, focusWindow, minimizeWindow, openWindow, updateWindowRect } =
    useWindowManager(bounds);

  const openWindows = windows
    .filter((windowState) => windowState.isOpen)
    .sort((left, right) => left.zIndex - right.zIndex);

  const activeWindows = openWindows.filter((windowState) => windowState.animationState === "idle");
  const activeWindow = activeWindows[activeWindows.length - 1] ?? null;

  return (
    <div className="desktop-root">
      <TopBar onOpenWindow={openWindow} />

      <main ref={workspaceRef} className="desktop-workspace">
        <DesktopIcons
          icons={icons}
          onMoveIcon={moveIcon}
          onOpenIcon={openWindow}
          onSelectIcon={setSelectedIconId}
          selectedIconId={selectedIconId}
        />

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
