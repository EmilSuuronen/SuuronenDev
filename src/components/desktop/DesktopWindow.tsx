import { useEffect, useState } from "react";

import { useLocale } from "../../i18n/locale";
import AppGlyph from "./AppGlyph";
import type {
  DesktopBounds,
  DesktopWindowState,
  ResizeEdge,
  WindowEntityId,
  WindowRect,
} from "../../types/desktop";
import { clamp, moveWindow, resizeWindow } from "../../utils/windowMath";

type Interaction =
  | {
      mode: "drag";
      startX: number;
      startY: number;
      snapshot: DesktopWindowState;
    }
  | {
      mode: "resize";
      edge: ResizeEdge;
      startX: number;
      startY: number;
      snapshot: DesktopWindowState;
    };

type DesktopWindowProps = {
  bounds: DesktopBounds;
  children: React.ReactNode;
  onClose: (windowId: WindowEntityId) => void;
  onFocus: (windowId: WindowEntityId) => void;
  onMinimize: (windowId: WindowEntityId) => void;
  onRestoreFromDrag: (windowId: WindowEntityId, nextRect: WindowRect) => void;
  onToggleMaximize: (windowId: WindowEntityId) => void;
  onRectChange: (windowId: WindowEntityId, nextRect: WindowRect) => void;
  windowState: DesktopWindowState;
};

const resizeEdges: ResizeEdge[] = ["n", "e", "s", "w", "ne", "nw", "se", "sw"];

function DesktopWindow({
  bounds,
  children,
  onClose,
  onFocus,
  onMinimize,
  onRestoreFromDrag,
  onToggleMaximize,
  onRectChange,
  windowState,
}: DesktopWindowProps) {
  const { t } = useLocale();
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const isAnimatingOut = windowState.animationState !== "idle";

  const handleControlPointerDown =
    (action: (windowId: WindowEntityId) => void) =>
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onFocus(windowState.id);
      action(windowState.id);
    };

  useEffect(() => {
    if (!interaction || isAnimatingOut) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - interaction.startX;
      const deltaY = event.clientY - interaction.startY;

      if (interaction.mode === "drag") {
        onRectChange(windowState.id, moveWindow(interaction.snapshot, deltaX, deltaY, bounds));
        return;
      }

      onRectChange(
        windowState.id,
        resizeWindow(interaction.snapshot, interaction.edge, deltaX, deltaY, bounds),
      );
    };

    const handlePointerUp = () => {
      setInteraction(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [bounds, interaction, isAnimatingOut, onRectChange, windowState.id]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimatingOut) {
      return;
    }

    event.preventDefault();
    onFocus(windowState.id);

    if (windowState.isMaximized && windowState.restoreRect) {
      const restoredWidth = windowState.restoreRect.size.width;
      const restoredHeight = windowState.restoreRect.size.height;
      const pointerRatioX =
        (event.clientX - windowState.position.x) / Math.max(windowState.size.width, 1);
      const pointerOffsetY = event.clientY - windowState.position.y;
      const restoredRect = {
        position: {
          x: clamp(
            event.clientX - restoredWidth * pointerRatioX,
            0,
            Math.max(0, bounds.width - restoredWidth),
          ),
          y: clamp(
            event.clientY - Math.min(pointerOffsetY, 32),
            0,
            Math.max(0, bounds.height - restoredHeight),
          ),
        },
        size: windowState.restoreRect.size,
      };

      onRestoreFromDrag(windowState.id, restoredRect);
      setInteraction({
        mode: "drag",
        startX: event.clientX,
        startY: event.clientY,
        snapshot: {
          ...windowState,
          ...restoredRect,
          isMaximized: false,
          restoreRect: null,
        },
      });
      return;
    }

    setInteraction({
      mode: "drag",
      startX: event.clientX,
      startY: event.clientY,
      snapshot: windowState,
    });
  };

  const startResize =
    (edge: ResizeEdge) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (isAnimatingOut || windowState.isMaximized) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onFocus(windowState.id);
      setInteraction({
        mode: "resize",
        edge,
        startX: event.clientX,
        startY: event.clientY,
        snapshot: windowState,
      });
    };

  return (
    <section
      className={`desktop-window desktop-window--${windowState.id} desktop-window--${windowState.animationState}${windowState.isMaximized ? " desktop-window--maximized" : ""}${interaction ? " desktop-window--interacting" : ""}`}
      style={{
        width: `${windowState.size.width}px`,
        height: `${windowState.size.height}px`,
        transform:
          windowState.animationState === "minimizing"
            ? `translate(${windowState.position.x}px, ${windowState.position.y}px) translateY(160px) scale(0.18)`
            : windowState.animationState === "closing"
              ? `translate(${windowState.position.x}px, ${windowState.position.y}px) translateY(24px) scale(0.92)`
              : `translate(${windowState.position.x}px, ${windowState.position.y}px)`,
        zIndex: windowState.zIndex,
      }}
      onPointerDown={() => {
        if (!isAnimatingOut) {
          onFocus(windowState.id);
        }
      }}
    >
      <header className="window-titlebar" onPointerDown={startDrag}>
        <div className="window-title">
          <span className="window-icon">
            <AppGlyph iconKey={windowState.icon} className="window-icon-glyph" />
          </span>
          <span>{t(windowState.title)}</span>
        </div>
        <div className="window-controls">
          <button
            className="window-control window-control--minimize"
            type="button"
            aria-label={`${t("Minimize")} ${t(windowState.title)}`}
            onPointerDown={handleControlPointerDown(onMinimize)}
          >
            _
          </button>
          <button
            className="window-control window-control--maximize"
            type="button"
            aria-label={`${t(windowState.isMaximized ? "Restore" : "Maximize")} ${t(windowState.title)}`}
            onPointerDown={handleControlPointerDown(onToggleMaximize)}
          >
            {windowState.isMaximized ? "❐" : "□"}
          </button>
          <button
            className="window-control window-control--close"
            type="button"
            aria-label={`${t("Close")} ${t(windowState.title)}`}
            onPointerDown={handleControlPointerDown(onClose)}
          >
            x
          </button>
        </div>
      </header>

      <div className="window-content">{children}</div>

      {!windowState.isMaximized
        ? resizeEdges.map((edge) => (
            <div
              key={edge}
              className={`resize-handle resize-handle--${edge}`}
              onPointerDown={startResize(edge)}
            />
          ))
        : null}
    </section>
  );
}

export default DesktopWindow;
