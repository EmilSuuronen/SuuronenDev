import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import AppGlyph from "./AppGlyph";
import DesktopContextMenu from "./DesktopContextMenu";
import { DESKTOP_ICON_HEIGHT, DESKTOP_ICON_WIDTH } from "../../data/desktop";
import { useLocale } from "../../i18n/locale";
import type { DesktopEntryId, DesktopIconState, FolderId } from "../../types/desktop";

type DragState = {
  currentClientX: number;
  currentClientY: number;
  currentX: number;
  currentY: number;
  originX: number;
  originY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  pointerStartX: number;
  pointerStartY: number;
};

type SelectionBoxState = {
  offsetLeft: number;
  offsetTop: number;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
};

type DesktopIconsProps = {
  folderWindowDropTargets: Array<{
    bottom: number;
    folderId: FolderId;
    left: number;
    right: number;
    top: number;
  }>;
  onDeleteNote: (noteId: `note:${string}`) => void;
  icons: DesktopIconState[];
  onMoveIcon: (iconId: DesktopEntryId, nextX: number, nextY: number) => void;
  onMoveIconToFolder: (iconId: DesktopEntryId, folderId: FolderId) => void;
  onDeleteFolder: (folderId: FolderId) => void;
  onPreviewMoveIcon: (iconId: DesktopEntryId, nextX: number, nextY: number) => void;
  onOpenIcon: (iconId: DesktopEntryId) => void;
  onRenameFolder: (folderId: FolderId) => void;
  onRenameNote: (noteId: `note:${string}`) => void;
  onSelectIcons: (iconIds: DesktopEntryId[]) => void;
  selectedIconIds: DesktopEntryId[];
};

type DesktopIconProps = {
  folderWindowDropTargets: Array<{
    bottom: number;
    folderId: FolderId;
    left: number;
    right: number;
    top: number;
  }>;
  icon: DesktopIconState;
  folderDropTargets: DesktopIconState[];
  isSelected: boolean;
  onDeleteNote: (noteId: `note:${string}`) => void;
  onMoveIcon: (iconId: DesktopEntryId, nextX: number, nextY: number) => void;
  onMoveIconToFolder: (iconId: DesktopEntryId, folderId: FolderId) => void;
  onPreviewMoveIcon: (iconId: DesktopEntryId, nextX: number, nextY: number) => void;
  onOpenIcon: (iconId: DesktopEntryId) => void;
  onOpenContextMenu: (icon: DesktopIconState, clientX: number, clientY: number) => void;
  onSelectIcons: (iconIds: DesktopEntryId[]) => void;
};

type ContextMenuState = {
  icon?: DesktopIconState;
  type: "icon";
  x: number;
  y: number;
};

function DesktopIcon({
  folderWindowDropTargets,
  icon,
  folderDropTargets,
  isSelected,
  onDeleteNote,
  onMoveIcon,
  onMoveIconToFolder,
  onPreviewMoveIcon,
  onOpenIcon,
  onOpenContextMenu,
  onSelectIcons,
}: DesktopIconProps) {
  const { t } = useLocale();
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - dragState.pointerStartX;
      const deltaY = event.clientY - dragState.pointerStartY;
      setDragState((currentDragState) =>
        currentDragState
          ? {
              ...currentDragState,
              currentClientX: event.clientX,
              currentClientY: event.clientY,
              currentX: currentDragState.originX + deltaX,
              currentY: currentDragState.originY + deltaY,
            }
          : null,
      );
    };

    const handlePointerUp = () => {
      if (dragState) {
        const nextX = dragState.currentX;
        const nextY = dragState.currentY;
        const targetFolderWindow = folderWindowDropTargets.find((folderWindow) => {
          if (icon.kind !== "file" && folderWindow.folderId === "trash") {
            return false;
          }

          if (icon.kind === "folder" && icon.id === folderWindow.folderId) {
            return false;
          }

          return (
            dragState.currentClientX >= folderWindow.left &&
            dragState.currentClientX <= folderWindow.right &&
            dragState.currentClientY >= folderWindow.top &&
            dragState.currentClientY <= folderWindow.bottom
          );
        });
        const targetFolderIcon = folderDropTargets.find((folderIcon) => {
          if (icon.kind !== "file" && folderIcon.id === "trash") {
            return false;
          }

          const iconCenterX = nextX + DESKTOP_ICON_WIDTH / 2;
          const iconCenterY = nextY + DESKTOP_ICON_HEIGHT / 2;
          return (
            iconCenterX >= folderIcon.position.x &&
            iconCenterX <= folderIcon.position.x + DESKTOP_ICON_WIDTH &&
            iconCenterY >= folderIcon.position.y &&
            iconCenterY <= folderIcon.position.y + DESKTOP_ICON_HEIGHT
          );
        });

        if (targetFolderWindow) {
          if (targetFolderWindow.folderId === "trash" && icon.noteId) {
            onDeleteNote(icon.noteId);
          } else {
            onMoveIconToFolder(icon.id, targetFolderWindow.folderId);
          }
        } else if (targetFolderIcon && targetFolderIcon.id !== icon.id) {
          if (targetFolderIcon.id === "trash" && icon.noteId) {
            onDeleteNote(icon.noteId);
          } else {
            onMoveIconToFolder(icon.id, targetFolderIcon.id as FolderId);
          }
        } else {
          onMoveIcon(icon.id, nextX, nextY);
        }
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
  }, [dragState, folderDropTargets, folderWindowDropTargets, icon.id, icon.kind, icon.noteId, onDeleteNote, onMoveIcon, onMoveIconToFolder]);

  return (
    <>
      <button
        className={`desktop-icon desktop-icon--${icon.kind}${isSelected ? " is-selected" : ""}${dragState ? " is-drag-origin" : ""}`}
        style={{
          transform: `translate(${icon.position.x}px, ${icon.position.y}px)`,
        }}
        type="button"
        title={t(icon.label)}
        onClick={(event) => {
          event.stopPropagation();
          onSelectIcons([icon.id]);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onOpenIcon(icon.id);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelectIcons([icon.id]);
          onOpenContextMenu(icon, event.clientX, event.clientY);
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          event.stopPropagation();
        onSelectIcons([icon.id]);
        const itemBounds = event.currentTarget.getBoundingClientRect();
        setDragState({
          currentClientX: event.clientX,
          currentClientY: event.clientY,
          currentX: icon.position.x,
          currentY: icon.position.y,
          originX: icon.position.x,
          originY: icon.position.y,
          pointerOffsetX: event.clientX - itemBounds.left,
          pointerOffsetY: event.clientY - itemBounds.top,
          pointerStartX: event.clientX,
          pointerStartY: event.clientY,
        });
      }}
      >
        <span className={`desktop-icon-art desktop-icon-art--${icon.kind}`} aria-hidden="true">
          <AppGlyph iconKey={icon.icon} className="desktop-icon-glyph" />
        </span>
        <span className="desktop-icon-label">{t(icon.label)}</span>
      </button>

      {dragState
        ? createPortal(
            <div
              className={`desktop-icon desktop-icon--${icon.kind} desktop-icon--drag-preview`}
              style={{
                left: `${dragState.currentClientX - dragState.pointerOffsetX}px`,
                top: `${dragState.currentClientY - dragState.pointerOffsetY}px`,
              }}
            >
              <span className={`desktop-icon-art desktop-icon-art--${icon.kind}`} aria-hidden="true">
                <AppGlyph iconKey={icon.icon} className="desktop-icon-glyph" />
              </span>
              <span className="desktop-icon-label">{t(icon.label)}</span>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function DesktopIcons({
  folderWindowDropTargets,
  onDeleteFolder,
  onDeleteNote,
  icons,
  onMoveIcon,
  onMoveIconToFolder,
  onPreviewMoveIcon,
  onOpenIcon,
  onRenameFolder,
  onRenameNote,
  onSelectIcons,
  selectedIconIds,
}: DesktopIconsProps) {
  const { t } = useLocale();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(null);

  useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    const closeMenu = () => setContextMenu(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("contextmenu", closeMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("contextmenu", closeMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!selectionBox) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setSelectionBox((currentBox) =>
        currentBox
          ? {
              ...currentBox,
              currentX: event.clientX - currentBox.offsetLeft,
              currentY: event.clientY - currentBox.offsetTop,
            }
          : null,
      );
    };

    const handlePointerUp = () => {
      setSelectionBox(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [selectionBox]);

  const normalizedSelectionBox = selectionBox
    ? {
        left: Math.min(selectionBox.originX, selectionBox.currentX),
        top: Math.min(selectionBox.originY, selectionBox.currentY),
        width: Math.abs(selectionBox.currentX - selectionBox.originX),
        height: Math.abs(selectionBox.currentY - selectionBox.originY),
      }
    : null;

  const handleSelectionStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target !== event.currentTarget) {
      return;
    }

    setContextMenu(null);
    const workspaceBounds = event.currentTarget.getBoundingClientRect();

    onSelectIcons([]);
    setSelectionBox({
      offsetLeft: workspaceBounds.left,
      offsetTop: workspaceBounds.top,
      originX: event.clientX - workspaceBounds.left,
      originY: event.clientY - workspaceBounds.top,
      currentX: event.clientX - workspaceBounds.left,
      currentY: event.clientY - workspaceBounds.top,
    });
  };

  useEffect(() => {
    if (!normalizedSelectionBox || (normalizedSelectionBox.width < 4 && normalizedSelectionBox.height < 4)) {
      return;
    }

    const nextSelectedIds = icons
      .filter((icon) => {
        const iconLeft = icon.position.x;
        const iconTop = icon.position.y;
        const iconRight = iconLeft + DESKTOP_ICON_WIDTH;
        const iconBottom = iconTop + DESKTOP_ICON_HEIGHT;
        const selectionRight = normalizedSelectionBox.left + normalizedSelectionBox.width;
        const selectionBottom = normalizedSelectionBox.top + normalizedSelectionBox.height;

        return !(
          iconRight < normalizedSelectionBox.left ||
          iconLeft > selectionRight ||
          iconBottom < normalizedSelectionBox.top ||
          iconTop > selectionBottom
        );
      })
      .map((icon) => icon.id);

      onSelectIcons(nextSelectedIds);
  }, [icons, normalizedSelectionBox, onSelectIcons]);

  return (
    <div className="desktop-icons-layer" onPointerDown={handleSelectionStart}>
      {icons.map((icon) => (
        <DesktopIcon
          key={icon.id}
          folderWindowDropTargets={folderWindowDropTargets}
          folderDropTargets={icons.filter((entry) => entry.kind === "folder" && entry.id !== icon.id)}
          icon={icon}
          isSelected={selectedIconIds.includes(icon.id)}
          onDeleteNote={onDeleteNote}
          onMoveIcon={onMoveIcon}
          onMoveIconToFolder={onMoveIconToFolder}
          onPreviewMoveIcon={onPreviewMoveIcon}
          onOpenIcon={onOpenIcon}
          onOpenContextMenu={(targetIcon, x, y) => setContextMenu({ icon: targetIcon, type: "icon", x, y })}
          onSelectIcons={onSelectIcons}
        />
      ))}
      {contextMenu?.type === "icon" && contextMenu.icon?.kind === "file" && contextMenu.icon.noteId ? (
        <DesktopContextMenu
          sections={[
            {
              items: [
                {
                  label: t("Rename"),
                  onSelect: () => {
                    onRenameNote(contextMenu.icon!.noteId as `note:${string}`);
                    setContextMenu(null);
                  },
                },
                {
                  danger: true,
                  label: t("Delete"),
                  onSelect: () => {
                    onDeleteNote(contextMenu.icon!.noteId as `note:${string}`);
                    setContextMenu(null);
                  },
                },
              ],
            },
          ]}
          x={contextMenu.x}
          y={contextMenu.y}
        />
      ) : null}
      {contextMenu?.type === "icon" && contextMenu.icon?.kind === "folder" && contextMenu.icon.id !== "trash" ? (
        <DesktopContextMenu
          sections={[
            {
              items: [
                {
                  label: t("Rename"),
                  onSelect: () => {
                    onRenameFolder(contextMenu.icon!.id as FolderId);
                    setContextMenu(null);
                  },
                },
              ],
            },
            {
              items: [
                {
                  danger: true,
                  label: t("Move to Trash"),
                  onSelect: () => {
                    onDeleteFolder(contextMenu.icon!.id as FolderId);
                    setContextMenu(null);
                  },
                },
              ],
            },
          ]}
          x={contextMenu.x}
          y={contextMenu.y}
        />
      ) : null}
      {normalizedSelectionBox && (normalizedSelectionBox.width >= 4 || normalizedSelectionBox.height >= 4) ? (
        <div
          aria-hidden="true"
          className="desktop-selection-box"
          style={{
            left: `${normalizedSelectionBox.left}px`,
            top: `${normalizedSelectionBox.top}px`,
            width: `${normalizedSelectionBox.width}px`,
            height: `${normalizedSelectionBox.height}px`,
          }}
        />
      ) : null}
    </div>
  );
}

export default DesktopIcons;
