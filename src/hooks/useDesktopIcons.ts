import { useEffect, useState } from "react";

import { createInitialDesktopIcons } from "../data/desktop";
import type { DesktopBounds, DesktopIconState, WindowId } from "../types/desktop";
import { WINDOW_GAP, clamp } from "../utils/windowMath";

const DESKTOP_ICON_WIDTH = 88;
const DESKTOP_ICON_HEIGHT = 96;

function clampIconToBounds(icon: DesktopIconState, bounds: DesktopBounds): DesktopIconState {
  if (!bounds.width || !bounds.height) {
    return icon;
  }

  return {
    ...icon,
    position: {
      x: clamp(icon.position.x, WINDOW_GAP, Math.max(WINDOW_GAP, bounds.width - DESKTOP_ICON_WIDTH)),
      y: clamp(icon.position.y, WINDOW_GAP, Math.max(WINDOW_GAP, bounds.height - DESKTOP_ICON_HEIGHT)),
    },
  };
}

export function useDesktopIcons(bounds: DesktopBounds) {
  const [icons, setIcons] = useState<DesktopIconState[]>([]);
  const [selectedIconId, setSelectedIconId] = useState<WindowId | null>(null);

  useEffect(() => {
    if (!bounds.width || !bounds.height) {
      return;
    }

    setIcons((currentIcons) => {
      if (currentIcons.length === 0) {
        return createInitialDesktopIcons(bounds);
      }

      return currentIcons.map((icon) => clampIconToBounds(icon, bounds));
    });
  }, [bounds.height, bounds.width]);

  const moveIcon = (iconId: WindowId, nextX: number, nextY: number) => {
    setIcons((currentIcons) =>
      currentIcons.map((icon) =>
        icon.id === iconId
          ? clampIconToBounds(
              {
                ...icon,
                position: { x: nextX, y: nextY },
              },
              bounds,
            )
          : icon,
      ),
    );
  };

  return {
    icons,
    moveIcon,
    selectedIconId,
    setSelectedIconId,
  };
}
