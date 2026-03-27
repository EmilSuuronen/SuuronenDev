import { useEffect, useState } from "react";

import AppGlyph from "./AppGlyph";
import type { DesktopIconState, WindowId } from "../../types/desktop";

type DragState = {
  originX: number;
  originY: number;
  pointerStartX: number;
  pointerStartY: number;
};

type DesktopIconsProps = {
  icons: DesktopIconState[];
  onMoveIcon: (iconId: WindowId, nextX: number, nextY: number) => void;
  onOpenIcon: (iconId: WindowId) => void;
  onSelectIcon: (iconId: WindowId | null) => void;
  selectedIconId: WindowId | null;
};

type DesktopIconProps = {
  icon: DesktopIconState;
  isSelected: boolean;
  onMoveIcon: (iconId: WindowId, nextX: number, nextY: number) => void;
  onOpenIcon: (iconId: WindowId) => void;
  onSelectIcon: (iconId: WindowId | null) => void;
};

function DesktopIcon({
  icon,
  isSelected,
  onMoveIcon,
  onOpenIcon,
  onSelectIcon,
}: DesktopIconProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - dragState.pointerStartX;
      const deltaY = event.clientY - dragState.pointerStartY;
      onMoveIcon(icon.id, dragState.originX + deltaX, dragState.originY + deltaY);
    };

    const handlePointerUp = () => {
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
  }, [dragState, icon.id, onMoveIcon]);

  return (
    <button
      className={`desktop-icon${isSelected ? " is-selected" : ""}`}
      style={{
        transform: `translate(${icon.position.x}px, ${icon.position.y}px)`,
      }}
      type="button"
      title={icon.label}
      onClick={(event) => {
        event.stopPropagation();
        onSelectIcon(icon.id);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onOpenIcon(icon.id);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelectIcon(icon.id);
        setDragState({
          originX: icon.position.x,
          originY: icon.position.y,
          pointerStartX: event.clientX,
          pointerStartY: event.clientY,
        });
      }}
    >
      <span className="desktop-icon-art" aria-hidden="true">
        <AppGlyph appId={icon.id} className="desktop-icon-glyph" />
      </span>
      <span className="desktop-icon-label">{icon.label}</span>
    </button>
  );
}

function DesktopIcons({
  icons,
  onMoveIcon,
  onOpenIcon,
  onSelectIcon,
  selectedIconId,
}: DesktopIconsProps) {
  return (
    <div
      className="desktop-icons-layer"
      onClick={() => {
        onSelectIcon(null);
      }}
    >
      {icons.map((icon) => (
        <DesktopIcon
          key={icon.id}
          icon={icon}
          isSelected={selectedIconId === icon.id}
          onMoveIcon={onMoveIcon}
          onOpenIcon={onOpenIcon}
          onSelectIcon={onSelectIcon}
        />
      ))}
    </div>
  );
}

export default DesktopIcons;
