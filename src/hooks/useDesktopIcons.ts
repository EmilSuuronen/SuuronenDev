import { useEffect, useState } from "react";

import {
  createInitialDesktopIcons,
  DESKTOP_ICON_HEIGHT,
  DESKTOP_ICON_WIDTH,
} from "../data/desktop";
import type {
  DesktopBounds,
  DesktopEntryId,
  DesktopIconState,
  FolderId,
} from "../types/desktop";
import { WINDOW_GAP, clamp } from "../utils/windowMath";

const POSITION_SEARCH_STEP = 16;
const POSITION_SEARCH_ANGLES = 16;
const POSITION_SEARCH_RADIUS_LIMIT = 640;

function clampIconToBounds(icon: DesktopIconState, bounds: DesktopBounds): DesktopIconState {
  if (icon.parentId !== null) {
    return icon;
  }

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

function rectanglesOverlap(left: DesktopIconState, right: DesktopIconState) {
  return !(
    left.position.x + DESKTOP_ICON_WIDTH <= right.position.x ||
    right.position.x + DESKTOP_ICON_WIDTH <= left.position.x ||
    left.position.y + DESKTOP_ICON_HEIGHT <= right.position.y ||
    right.position.y + DESKTOP_ICON_HEIGHT <= left.position.y
  );
}

function isPositionAvailable(
  iconToPlace: DesktopIconState,
  placedIcons: DesktopIconState[],
) {
  return placedIcons.every((placedIcon) => !rectanglesOverlap(iconToPlace, placedIcon));
}

function findNearestAvailablePosition(
  preferredPosition: { x: number; y: number },
  placedIcons: DesktopIconState[],
  iconToPlace: DesktopIconState,
  bounds: DesktopBounds,
) {
  const clampedPreferredIcon = clampIconToBounds(
    {
      ...iconToPlace,
      position: preferredPosition,
    },
    bounds,
  );

  if (isPositionAvailable(clampedPreferredIcon, placedIcons)) {
    return clampedPreferredIcon.position;
  }

  for (
    let radius = POSITION_SEARCH_STEP;
    radius <= POSITION_SEARCH_RADIUS_LIMIT;
    radius += POSITION_SEARCH_STEP
  ) {
    for (let angleIndex = 0; angleIndex < POSITION_SEARCH_ANGLES; angleIndex += 1) {
      const angle = (Math.PI * 2 * angleIndex) / POSITION_SEARCH_ANGLES;
      const candidateIcon = clampIconToBounds(
        {
          ...iconToPlace,
          position: {
            x: preferredPosition.x + Math.cos(angle) * radius,
            y: preferredPosition.y + Math.sin(angle) * radius,
          },
        },
        bounds,
      );

      if (isPositionAvailable(candidateIcon, placedIcons)) {
        return candidateIcon.position;
      }
    }
  }

  return clampedPreferredIcon.position;
}

function resolveIconCollisions(
  icons: DesktopIconState[],
  bounds: DesktopBounds,
  prioritizedIconId?: DesktopEntryId,
) {
  const placedIcons: DesktopIconState[] = [];
  const rootIcons = icons.filter((icon) => icon.parentId === null);
  const orderedIcons = prioritizedIconId
    ? [
        ...rootIcons.filter((icon) => icon.id === prioritizedIconId),
        ...rootIcons.filter((icon) => icon.id !== prioritizedIconId),
      ]
    : rootIcons;

  for (const icon of orderedIcons) {
    const clampedIcon = clampIconToBounds(icon, bounds);
    const nearestAvailablePosition = findNearestAvailablePosition(
      clampedIcon.position,
      placedIcons,
      clampedIcon,
      bounds,
    );
    placedIcons.push({
      ...icon,
      position: nearestAvailablePosition,
    });
  }

  return icons.map((icon) =>
    icon.parentId === null ? placedIcons.find((placedIcon) => placedIcon.id === icon.id) ?? icon : icon,
  );
}

export function useDesktopIcons(bounds: DesktopBounds) {
  const [icons, setIcons] = useState<DesktopIconState[]>([]);
  const [selectedIconIds, setSelectedIconIds] = useState<DesktopEntryId[]>([]);

  useEffect(() => {
    if (!bounds.width || !bounds.height) {
      return;
    }

    setIcons((currentIcons) => {
      if (currentIcons.length === 0) {
        return resolveIconCollisions(createInitialDesktopIcons(bounds), bounds);
      }

      return resolveIconCollisions(currentIcons, bounds);
    });
  }, [bounds.height, bounds.width]);

  const previewMoveIcon = (iconId: DesktopEntryId, nextX: number, nextY: number) => {
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

  const moveIcon = (iconId: DesktopEntryId, nextX: number, nextY: number) => {
    setIcons((currentIcons) =>
      resolveIconCollisions(
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
        bounds,
        iconId,
      ),
    );
  };

  const moveIconToFolder = (iconId: DesktopEntryId, folderId: FolderId) => {
    setIcons((currentIcons) =>
      currentIcons.map((icon) =>
        icon.id === iconId
          ? {
              ...icon,
              parentId: folderId,
            }
          : icon,
      ),
    );
    setSelectedIconIds((currentSelectedIds) => currentSelectedIds.filter((selectedId) => selectedId !== iconId));
  };

  const rootIcons = icons.filter((icon) => icon.parentId === null);

  const getFolderEntries = (folderId: FolderId) =>
    icons
      .filter((icon) => icon.parentId === folderId)
      .sort((left, right) => left.label.localeCompare(right.label));

  const getEntry = (entryId: DesktopEntryId) => icons.find((icon) => icon.id === entryId) ?? null;

  return {
    icons,
    getEntry,
    rootIcons,
    getFolderEntries,
    moveIcon,
    moveIconToFolder,
    previewMoveIcon,
    selectedIconIds,
    setSelectedIconIds,
  };
}
