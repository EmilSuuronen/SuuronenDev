import { useEffect, useRef, useState } from "react";

import { useLocale } from "../../i18n/locale";
import type { DesktopWindowState, WindowEntityId } from "../../types/desktop";
import AppGlyph from "./AppGlyph";

type WindowSwitcherProps = {
  onPeek: (windowId: WindowEntityId | null) => void;
  onSwitch: (windowId: WindowEntityId) => void;
  windows: DesktopWindowState[];
};

// Most operating systems keep Alt+Tab for themselves, so Alt+` is the reliable shortcut in a browser.
const isSwitchKey = (event: KeyboardEvent) => event.altKey && (event.code === "Backquote" || event.key === "Tab");

function WindowSwitcher({ onPeek, onSwitch, windows }: WindowSwitcherProps) {
  const { t } = useLocale();
  const [cycle, setCycle] = useState<{ index: number; order: DesktopWindowState[] } | null>(null);
  const stateRef = useRef({ cycle, onPeek, onSwitch, windows });
  stateRef.current = { cycle, onPeek, onSwitch, windows };

  useEffect(() => {
    const finish = (switchTo: boolean) => {
      const current = stateRef.current;

      if (!current.cycle) {
        return;
      }

      if (switchTo) {
        current.onSwitch(current.cycle.order[current.cycle.index].id);
      }

      current.onPeek(null);
      setCycle(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const current = stateRef.current;

      if (current.cycle && event.key === "Escape") {
        event.preventDefault();
        finish(false);
        return;
      }

      if (!isSwitchKey(event)) {
        return;
      }

      event.preventDefault();
      const step = event.shiftKey ? -1 : 1;
      // Most recently focused first, like a real OS.
      const order = current.cycle?.order ?? [...current.windows].sort((left, right) => right.zIndex - left.zIndex);

      if (order.length === 0) {
        return;
      }

      const start = current.cycle ? current.cycle.index : 0;
      const index = (start + step + order.length) % order.length;
      setCycle({ index, order });
      current.onPeek(order[index].id);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        finish(true);
      }
    };
    const handleBlur = () => finish(false);

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  if (!cycle) {
    return null;
  }

  return (
    <div aria-label={t("Switch window")} className="window-switcher" role="listbox">
      {cycle.order.map((windowState, index) => (
        <button
          key={windowState.id}
          aria-selected={index === cycle.index}
          className={`window-switcher-item ${index === cycle.index ? "is-active" : ""}`}
          onPointerDown={(event) => {
            event.preventDefault();
            onSwitch(windowState.id);
            onPeek(null);
            setCycle(null);
          }}
          role="option"
          type="button"
        >
          <AppGlyph className="window-switcher-glyph" iconKey={windowState.icon} />
          <span className="window-switcher-title">{t(windowState.title)}</span>
        </button>
      ))}
      <p className="window-switcher-hint">{t("Hold Alt, press ` to cycle, release to switch")}</p>
    </div>
  );
}

export default WindowSwitcher;
