import { useEffect, useRef, useState } from "react";
import { Copy, Minus, Square, X } from "lucide-react";

import { isMobileDesktopViewport } from "../../data/desktop";
import { useLocale } from "../../i18n/locale";
import AppGlyph from "./AppGlyph";
import type {
  DesktopBounds,
  DesktopWindowState,
  ResizeEdge,
  SnapZone,
  WindowEntityId,
  WindowRect,
} from "../../types/desktop";
import { clamp, getSnapRect, getSnapZone, moveWindow, resizeWindow } from "../../utils/windowMath";

type Interaction =
  | {
      mode: "drag";
      // Workspace origin in client coordinates, to tell when the pointer reaches a screen edge.
      originX: number;
      originY: number;
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
  onSnap: (windowId: WindowEntityId, zone: SnapZone, restoreRect: WindowRect) => void;
  onTitleContextMenu?: (windowId: WindowEntityId, x: number, y: number) => void;
  onToggleMaximize: (windowId: WindowEntityId) => void;
  onRectChange: (windowId: WindowEntityId, nextRect: WindowRect) => void;
  // Window switcher preview: the highlighted window comes forward, the rest fade back.
  peek?: "focus" | "dim" | null;
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
  onSnap,
  onTitleContextMenu,
  onToggleMaximize,
  onRectChange,
  peek = null,
  windowState,
}: DesktopWindowProps) {
  const { t } = useLocale();
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [snapZone, setSnapZone] = useState<SnapZone | null>(null);
  const snapZoneRef = useRef<SnapZone | null>(null);
  const isAnimatingOut = windowState.animationState !== "idle";
  const isMobile = isMobileDesktopViewport(bounds);

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
        const zone = getSnapZone(event.clientX - interaction.originX, event.clientY - interaction.originY, bounds);
        snapZoneRef.current = zone;
        setSnapZone(zone);
        return;
      }

      onRectChange(
        windowState.id,
        resizeWindow(interaction.snapshot, interaction.edge, deltaX, deltaY, bounds),
      );
    };

    const handlePointerUp = () => {
      const zone = snapZoneRef.current;

      if (interaction.mode === "drag" && zone) {
        onSnap(windowState.id, zone, {
          position: interaction.snapshot.position,
          size: interaction.snapshot.size,
        });
      }

      snapZoneRef.current = null;
      setSnapZone(null);
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
  }, [bounds, interaction, isAnimatingOut, onRectChange, onSnap, windowState.id]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimatingOut || isMobile) {
      return;
    }

    event.preventDefault();
    onFocus(windowState.id);
    const windowRect = event.currentTarget.parentElement!.getBoundingClientRect();
    const origin = { originX: windowRect.left - windowState.position.x, originY: windowRect.top - windowState.position.y };

    // Maximized and tiled windows both pop back to their earlier size under the pointer.
    if ((windowState.isMaximized || windowState.snap) && windowState.restoreRect) {
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
        ...origin,
        startX: event.clientX,
        startY: event.clientY,
        snapshot: {
          ...windowState,
          ...restoredRect,
          isMaximized: false,
          restoreRect: null,
          snap: null,
        },
      });
      return;
    }

    setInteraction({
      mode: "drag",
      ...origin,
      startX: event.clientX,
      startY: event.clientY,
      snapshot: windowState,
    });
  };

  const snapPreview = snapZone ? getSnapRect(snapZone, bounds, windowState.minSize) : null;

  const startResize =
    (edge: ResizeEdge) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (isAnimatingOut || windowState.isMaximized || isMobile) {
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
    <>
    {snapPreview ? (
      <div
        aria-hidden="true"
        className="window-snap-preview"
        style={{
          height: snapPreview.size.height,
          transform: `translate(${snapPreview.position.x}px, ${snapPreview.position.y}px)`,
          width: snapPreview.size.width,
          zIndex: windowState.zIndex,
        }}
      />
    ) : null}
    <section
      className={`desktop-window desktop-window--${windowState.id} desktop-window--${windowState.animationState}${windowState.isMaximized ? " desktop-window--maximized" : ""}${interaction ? " desktop-window--interacting" : ""}${isMobile ? " desktop-window--mobile" : ""}${peek ? ` desktop-window--peek-${peek}` : ""}`}
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
      <header
        className="window-titlebar"
        onContextMenu={(event) => {
          if (onTitleContextMenu) {
            event.preventDefault();
            event.stopPropagation();
            onTitleContextMenu(windowState.id, event.clientX, event.clientY);
          }
        }}
        onPointerDown={startDrag}
      >
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
            <Minus aria-hidden="true" />
          </button>
          {!isMobile ? (
            <button
              className="window-control window-control--maximize"
              type="button"
              aria-label={`${t(windowState.isMaximized ? "Restore" : "Maximize")} ${t(windowState.title)}`}
              onPointerDown={handleControlPointerDown(onToggleMaximize)}
            >
              {windowState.isMaximized ? <Copy aria-hidden="true" /> : <Square aria-hidden="true" />}
            </button>
          ) : null}
          <button
            className="window-control window-control--close"
            type="button"
            aria-label={`${t("Close")} ${t(windowState.title)}`}
            onPointerDown={handleControlPointerDown(onClose)}
          >
            <X aria-hidden="true" />
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
    </>
  );
}

export default DesktopWindow;
