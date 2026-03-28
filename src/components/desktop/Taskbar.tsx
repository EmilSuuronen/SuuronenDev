import { useEffect, useState } from "react";

import { desktopLaunchers } from "../../data/desktop";
import { useLocale } from "../../i18n/locale";
import AppGlyph from "./AppGlyph";
import StartMenu from "./StartMenu";
import type { DesktopEntryId, DesktopWindowState, WindowId } from "../../types/desktop";

type TaskbarProps = {
  activeWindowId: WindowId | null;
  isMobile: boolean;
  onOpenEntry: (entryId: DesktopEntryId) => void;
  onOpenWindow: (windowId: WindowId) => void;
  onFocusWindow: (windowId: WindowId) => void;
  windows: DesktopWindowState[];
};

function Taskbar({
  activeWindowId,
  isMobile,
  onFocusWindow,
  onOpenEntry,
  onOpenWindow,
  windows,
}: TaskbarProps) {
  const { t } = useLocale();
  const [clock, setClock] = useState(() => new Date());
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  return (
    <footer className={`taskbar${isMobile ? " taskbar--mobile" : ""}`}>
      <div className="taskbar-spacer" aria-hidden="true" />

      <div className="taskbar-center">
        <StartMenu
          isOpen={isStartMenuOpen}
          isMobile={isMobile}
          onClose={() => setIsStartMenuOpen(false)}
          onOpenEntry={onOpenEntry}
        />

        <button
          className={`taskbar-start${isStartMenuOpen ? " is-active" : ""}`}
          type="button"
          aria-label={t("Start")}
          aria-expanded={isStartMenuOpen}
          aria-haspopup="dialog"
          onClick={() => setIsStartMenuOpen((currentState) => !currentState)}
        >
          <span className="taskbar-start-logo" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
        </button>

        <div className="taskbar-launchers" role="toolbar" aria-label={t("Desktop launchers")}>
          {desktopLaunchers.map((launcher) => {
            const windowState = windows.find((item) => item.id === launcher.id);
            const isOpen = Boolean(windowState?.isOpen && windowState.animationState === "idle");
            const isActive = activeWindowId === launcher.id;

            return (
              <button
                key={launcher.id}
                className={`taskbar-launcher taskbar-launcher--${launcher.id}${isOpen ? " is-open" : ""}${isActive ? " is-active" : ""}`}
                type="button"
                aria-label={t(launcher.label)}
                title={t(launcher.label)}
                onClick={() => {
                  setIsStartMenuOpen(false);
                  if (isOpen) {
                    onFocusWindow(launcher.id);
                    return;
                  }

                  onOpenWindow(launcher.id);
                }}
              >
                <span className="taskbar-launcher-icon" aria-hidden="true">
                  <AppGlyph iconKey={launcher.icon} className="taskbar-icon-glyph" />
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
