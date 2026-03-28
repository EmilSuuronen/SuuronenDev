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

function mergeDefaultIcons(
  storedIcons: DesktopIconState[],
  bounds: DesktopBounds,
) {
  const defaultIcons = createInitialDesktopIcons(bounds);
  const storedIconMap = new Map(storedIcons.map((icon) => [icon.id, icon]));
  const mergedDefaultIcons = defaultIcons.map((defaultIcon) => {
    const storedIcon = storedIconMap.get(defaultIcon.id);

    if (!storedIcon) {
      return defaultIcon;
    }

    return {
      ...defaultIcon,
      ...storedIcon,
      icon: defaultIcon.icon,
      kind: defaultIcon.kind,
      label: storedIcon.label || defaultIcon.label,
      windowId: defaultIcon.windowId,
      href: defaultIcon.href,
    };
  });

  const dynamicIcons = storedIcons.filter(
    (icon) => !defaultIcons.some((defaultIcon) => defaultIcon.id === icon.id),
  );

  return [...mergedDefaultIcons, ...dynamicIcons];
}

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
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedIconIds, setSelectedIconIds] = useState<DesktopEntryId[]>([]);
  const STORAGE_KEY = "suuronen.desktop.icons";

  useEffect(() => {
    if (!bounds.width || !bounds.height) {
      return;
    }

    setIcons((currentIcons) => {
      if (!isHydrated) {
        try {
          const stored = window.localStorage.getItem(STORAGE_KEY);

          if (stored) {
            const parsed: unknown = JSON.parse(stored);

            if (Array.isArray(parsed)) {
              return resolveIconCollisions(
                mergeDefaultIcons(
                  [...(parsed as DesktopIconState[]), ...currentIcons].filter(
                    (icon, index, collection) =>
                      collection.findIndex((candidate) => candidate.id === icon.id) === index,
                  ),
                  bounds,
                ),
                bounds,
              );
            }
          }
        } catch {
          // ignore invalid stored icon state
        }

        return resolveIconCollisions(mergeDefaultIcons(currentIcons, bounds), bounds);
      }

      return resolveIconCollisions(currentIcons, bounds);
    });

    setIsHydrated(true);
  }, [bounds.height, bounds.width, isHydrated]);

  useEffect(() => {
    if (isHydrated && icons.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
    }
  }, [icons, isHydrated]);

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

  const addIcon = (icon: DesktopIconState) => {
    setIcons((currentIcons) => {
      if (currentIcons.some((existingIcon) => existingIcon.id === icon.id)) {
        return currentIcons;
      }

      return resolveIconCollisions([...currentIcons, icon], bounds, icon.id);
    });
  };

  const updateIcon = (iconId: DesktopEntryId, patch: Partial<DesktopIconState>) => {
    setIcons((currentIcons) =>
      currentIcons.map((icon) => (icon.id === iconId ? { ...icon, ...patch } : icon)),
    );
  };

  const removeIcon = (iconId: DesktopEntryId) => {
    setIcons((currentIcons) => currentIcons.filter((icon) => icon.id !== iconId));
    setSelectedIconIds((currentSelectedIds) => currentSelectedIds.filter((selectedId) => selectedId !== iconId));
  };

  return {
    addIcon,
    icons,
    getEntry,
    rootIcons,
    getFolderEntries,
    isHydrated,
    moveIcon,
    moveIconToFolder,
    previewMoveIcon,
    removeIcon,
    selectedIconIds,
    setSelectedIconIds,
    updateIcon,
  };
}
