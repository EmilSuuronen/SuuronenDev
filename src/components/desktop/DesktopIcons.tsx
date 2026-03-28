import { useEffect, useState } from "react";

import AppGlyph from "./AppGlyph";
import { DESKTOP_ICON_HEIGHT, DESKTOP_ICON_WIDTH } from "../../data/desktop";
import { useLocale } from "../../i18n/locale";
import type { DesktopEntryId, DesktopIconState, FolderId } from "../../types/desktop";

type DragState = {
  originX: number;
  originY: number;
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
  icons: DesktopIconState[];
  onMoveIcon: (iconId: DesktopEntryId, nextX: number, nextY: number) => void;
  onMoveIconToFolder: (iconId: DesktopEntryId, folderId: FolderId) => void;
  onPreviewMoveIcon: (iconId: DesktopEntryId, nextX: number, nextY: number) => void;
  onOpenIcon: (iconId: DesktopEntryId) => void;
  onSelectIcons: (iconIds: DesktopEntryId[]) => void;
  selectedIconIds: DesktopEntryId[];
};

type DesktopIconProps = {
  icon: DesktopIconState;
  folderDropTargets: DesktopIconState[];
  isSelected: boolean;
  onMoveIcon: (iconId: DesktopEntryId, nextX: number, nextY: number) => void;
  onMoveIconToFolder: (iconId: DesktopEntryId, folderId: FolderId) => void;
  onPreviewMoveIcon: (iconId: DesktopEntryId, nextX: number, nextY: number) => void;
  onOpenIcon: (iconId: DesktopEntryId) => void;
  onSelectIcons: (iconIds: DesktopEntryId[]) => void;
};

function DesktopIcon({
  icon,
  folderDropTargets,
  isSelected,
  onMoveIcon,
  onMoveIconToFolder,
  onPreviewMoveIcon,
  onOpenIcon,
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
      onPreviewMoveIcon(icon.id, dragState.originX + deltaX, dragState.originY + deltaY);
    };

    const handlePointerUp = () => {
      if (dragState) {
        const deltaX = lastPointerX - dragState.pointerStartX;
        const deltaY = lastPointerY - dragState.pointerStartY;
        const nextX = dragState.originX + deltaX;
        const nextY = dragState.originY + deltaY;
        const targetFolder = folderDropTargets.find((folderIcon) => {
          const iconCenterX = nextX + DESKTOP_ICON_WIDTH / 2;
          const iconCenterY = nextY + DESKTOP_ICON_HEIGHT / 2;
          return (
            iconCenterX >= folderIcon.position.x &&
            iconCenterX <= folderIcon.position.x + DESKTOP_ICON_WIDTH &&
            iconCenterY >= folderIcon.position.y &&
            iconCenterY <= folderIcon.position.y + DESKTOP_ICON_HEIGHT
          );
        });

        if (targetFolder && targetFolder.id !== icon.id) {
          onMoveIconToFolder(icon.id, targetFolder.id as FolderId);
        } else {
          onMoveIcon(icon.id, nextX, nextY);
        }
      }
      setDragState(null);
    };

    let lastPointerX = dragState.pointerStartX;
    let lastPointerY = dragState.pointerStartY;

    const trackPointerMove = (event: PointerEvent) => {
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      handlePointerMove(event);
    };

    window.addEventListener("pointermove", trackPointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", trackPointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragState, folderDropTargets, icon.id, onMoveIcon, onMoveIconToFolder, onPreviewMoveIcon]);

  return (
    <button
      className={`desktop-icon${isSelected ? " is-selected" : ""}`}
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
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelectIcons([icon.id]);
        setDragState({
          originX: icon.position.x,
          originY: icon.position.y,
          pointerStartX: event.clientX,
          pointerStartY: event.clientY,
        });
      }}
    >
      <span className="desktop-icon-art" aria-hidden="true">
        <AppGlyph iconKey={icon.icon} className="desktop-icon-glyph" />
      </span>
      <span className="desktop-icon-label">{t(icon.label)}</span>
    </button>
  );
}

function DesktopIcons({
  icons,
  onMoveIcon,
  onMoveIconToFolder,
  onPreviewMoveIcon,
  onOpenIcon,
  onSelectIcons,
  selectedIconIds,
}: DesktopIconsProps) {
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(null);

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
    if (event.target !== event.currentTarget) {
      return;
    }

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
          folderDropTargets={icons.filter((entry) => entry.kind === "folder" && entry.id !== icon.id)}
          icon={icon}
          isSelected={selectedIconIds.includes(icon.id)}
          onMoveIcon={onMoveIcon}
          onMoveIconToFolder={onMoveIconToFolder}
          onPreviewMoveIcon={onPreviewMoveIcon}
          onOpenIcon={onOpenIcon}
          onSelectIcons={onSelectIcons}
        />
      ))}
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
