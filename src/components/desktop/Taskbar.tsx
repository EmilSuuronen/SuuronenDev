import { useEffect, useState } from "react";

import { desktopLaunchers } from "../../data/desktop";
import { useLocale } from "../../i18n/locale";
import AppGlyph from "./AppGlyph";
import StartMenu from "./StartMenu";
import type { DesktopEntryId, DesktopWindowState, WindowEntityId, WindowId } from "../../types/desktop";

type TaskbarProps = {
  activeWindowId: WindowEntityId | null;
  isMobile: boolean;
  onFocusWindow: (windowId: WindowEntityId) => void;
  onMinimizeWindow: (windowId: WindowEntityId) => void;
  onOpenEntry: (entryId: DesktopEntryId) => void;
  onOpenWindow: (windowId: WindowId) => void;
  windows: DesktopWindowState[];
};

const launcherIds = new Set<WindowEntityId>(desktopLaunchers.map((launcher) => launcher.id));

function Taskbar({
  activeWindowId,
  isMobile,
  onFocusWindow,
  onMinimizeWindow,
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

  const isRunning = (windowState?: DesktopWindowState) =>
    Boolean(windowState?.isOpen && windowState.animationState === "idle");

  // Like Windows: clicking the focused app minimizes it, clicking any other open app focuses it.
  const handleWindowButton = (windowId: WindowEntityId, isOpen: boolean, open: () => void) => {
    setIsStartMenuOpen(false);

    if (!isOpen) {
      open();
    } else if (activeWindowId === windowId) {
      onMinimizeWindow(windowId);
    } else {
      onFocusWindow(windowId);
    }
  };

  // Open windows without a pinned launcher (folders, games) still get a taskbar button.
  const otherWindows = windows.filter((windowState) => !launcherIds.has(windowState.id) && isRunning(windowState));

  const renderButton = (
    id: WindowEntityId,
    label: string,
    icon: DesktopWindowState["icon"],
    isOpen: boolean,
    open: () => void,
  ) => (
    <button
      key={id}
      aria-label={t(label)}
      aria-pressed={activeWindowId === id}
      className={`taskbar-launcher${isOpen ? " is-open" : ""}${activeWindowId === id ? " is-active" : ""}`}
      onClick={() => handleWindowButton(id, isOpen, open)}
      title={t(label)}
      type="button"
    >
      <span className="taskbar-launcher-icon" aria-hidden="true">
        <AppGlyph iconKey={icon} className="taskbar-icon-glyph" />
      </span>
      <span className="taskbar-launcher-indicator" aria-hidden="true" />
    </button>
  );

  return (
    <footer className={`taskbar${isMobile ? " taskbar--mobile" : ""}`}>
      <div className="taskbar-start-area">
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
      </div>

      <div className="taskbar-launchers" role="toolbar" aria-label={t("Desktop launchers")}>
        {desktopLaunchers.map((launcher) => {
          const windowState = windows.find((item) => item.id === launcher.id);
          return renderButton(launcher.id, launcher.label, launcher.icon, isRunning(windowState), () =>
            onOpenWindow(launcher.id),
          );
        })}
        {otherWindows.length ? <span className="taskbar-divider" aria-hidden="true" /> : null}
        {otherWindows.map((windowState) =>
          renderButton(windowState.id, windowState.title, windowState.icon, true, () => onFocusWindow(windowState.id)),
        )}
      </div>

      <time className="taskbar-clock" dateTime={clock.toISOString()} aria-label={t("Current time")}>
        <span className="taskbar-clock-time">
          {clock.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="taskbar-clock-date">
          {clock.toLocaleDateString([], {
            day: "numeric",
            month: "numeric",
            year: "numeric",
          })}
        </span>
      </time>
    </footer>
  );
}

export default Taskbar;
