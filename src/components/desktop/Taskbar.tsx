import { useEffect, useState } from "react";

import { desktopLaunchers } from "../../data/desktop";
import type { DesktopWindowState, WindowId } from "../../types/desktop";

type TaskbarProps = {
  activeWindowId: WindowId | null;
  onOpenWindow: (windowId: WindowId) => void;
  onFocusWindow: (windowId: WindowId) => void;
  windows: DesktopWindowState[];
};

function Taskbar({ activeWindowId, onFocusWindow, onOpenWindow, windows }: TaskbarProps) {
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  return (
    <footer className="taskbar">
      <div className="taskbar-spacer" aria-hidden="true" />

      <div className="taskbar-center">
        <button
          className="taskbar-start"
          type="button"
          aria-label="Home"
          onClick={() => onOpenWindow("browser")}
        >
          <span className="taskbar-start-logo" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
        </button>

        <div className="taskbar-launchers" role="toolbar" aria-label="Desktop launchers">
          {desktopLaunchers.map((launcher) => {
            const windowState = windows.find((item) => item.id === launcher.id);
            const isOpen = Boolean(windowState?.isOpen && windowState.animationState === "idle");
            const isActive = activeWindowId === launcher.id;

            return (
              <button
                key={launcher.id}
                className={`taskbar-launcher taskbar-launcher--${launcher.id}${isOpen ? " is-open" : ""}${isActive ? " is-active" : ""}`}
                type="button"
                aria-label={launcher.label}
                title={launcher.label}
                onClick={() => (isOpen ? onFocusWindow(launcher.id) : onOpenWindow(launcher.id))}
              >
                <span className="taskbar-launcher-icon" aria-hidden="true">
                  <span className="taskbar-icon-glyph">{launcher.icon}</span>
                </span>
                <span className="taskbar-launcher-indicator" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="taskbar-clock" aria-label="Current time">
        <strong>
          {clock.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </strong>
        <span>
          {clock.toLocaleDateString([], {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </footer>
  );
}

export default Taskbar;
