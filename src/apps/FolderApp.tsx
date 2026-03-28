import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import AppGlyph from "../components/desktop/AppGlyph";
import { useLocale } from "../i18n/locale";
import type { DesktopEntryId, DesktopIconState } from "../types/desktop";

type DragState = {
  currentClientX: number;
  currentClientY: number;
  entry: DesktopIconState;
  pointerOffsetX: number;
  pointerOffsetY: number;
};

type FolderAppProps = {
  entries: DesktopIconState[];
  onExtractEntry: (entryId: DesktopEntryId, clientX: number, clientY: number) => void;
  onOpenEntry: (entryId: DesktopEntryId) => void;
  onReorderEntry: (entryId: DesktopEntryId, targetIndex: number) => void;
};

const FOLDER_ITEM_WIDTH = 104;
const FOLDER_ITEM_HEIGHT = 104;
const FOLDER_ITEM_GAP = 12;

function FolderApp({ entries, onExtractEntry, onOpenEntry, onReorderEntry }: FolderAppProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setDragState((currentDragState) =>
        currentDragState
          ? {
              ...currentDragState,
              currentClientX: event.clientX,
              currentClientY: event.clientY,
            }
          : null,
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const bounds = containerRef.current?.getBoundingClientRect();

      if (
        bounds &&
        (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
      ) {
        onExtractEntry(dragState.entry.id, event.clientX, event.clientY);
      } else if (bounds) {
        const relativeX = event.clientX - bounds.left - 16;
        const relativeY = event.clientY - bounds.top - 16;
        const columns = Math.max(1, Math.floor((bounds.width + FOLDER_ITEM_GAP) / (FOLDER_ITEM_WIDTH + FOLDER_ITEM_GAP)));
        const targetColumn = Math.max(0, Math.floor(relativeX / (FOLDER_ITEM_WIDTH + FOLDER_ITEM_GAP)));
        const targetRow = Math.max(0, Math.floor(relativeY / (FOLDER_ITEM_HEIGHT + FOLDER_ITEM_GAP)));
        const targetIndex = Math.min(entries.length - 1, targetRow * columns + targetColumn);

        onReorderEntry(dragState.entry.id, targetIndex);
      }

      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragState, entries.length, onExtractEntry, onReorderEntry]);

  return (
    <div ref={containerRef} className="folder-app">
      {entries.length === 0 ? (
        <div className="folder-empty-state">{t("This folder is empty.")}</div>
      ) : (
        <div className="folder-grid" role="list">
          {entries.map((entry) => {
            const isDragging = dragState?.entry.id === entry.id;

            return (
              <button
                key={entry.id}
                className={`folder-item${isDragging ? " is-drag-origin" : ""}`}
                type="button"
                onDoubleClick={() => onOpenEntry(entry.id)}
                onPointerDown={(event) => {
                  if (event.button !== 0) {
                    return;
                  }

                  const itemBounds = event.currentTarget.getBoundingClientRect();

                  setDragState({
                    currentClientX: event.clientX,
                    currentClientY: event.clientY,
                    entry,
                    pointerOffsetX: event.clientX - itemBounds.left,
                    pointerOffsetY: event.clientY - itemBounds.top,
                  });
                }}
              >
                <span className="folder-item-art" aria-hidden="true">
                  <AppGlyph iconKey={entry.icon} className="folder-item-glyph" />
                </span>
                <span className="folder-item-label">{t(entry.label)}</span>
              </button>
            );
          })}
        </div>
      )}

      {dragState
        ? createPortal(
            <div
              className="folder-item folder-item--drag-preview"
              style={{
                left: `${dragState.currentClientX - dragState.pointerOffsetX}px`,
                top: `${dragState.currentClientY - dragState.pointerOffsetY}px`,
              }}
            >
              <span className="folder-item-art" aria-hidden="true">
                <AppGlyph iconKey={dragState.entry.icon} className="folder-item-glyph" />
              </span>
              <span className="folder-item-label">{t(dragState.entry.label)}</span>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default FolderApp;
