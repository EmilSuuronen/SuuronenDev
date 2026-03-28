import { useEffect, useRef, useState } from "react";

import {
  createInitialDesktopIcons,
  DESKTOP_ICON_HEIGHT,
  DESKTOP_ICON_START_X,
  DESKTOP_ICON_START_Y,
  DESKTOP_ICON_WIDTH,
  DESKTOP_ICON_X_GAP,
  DESKTOP_ICON_Y_GAP,
  getDefaultDesktopRootIconPosition,
  isMobileDesktopViewport,
} from "../data/desktop";
import type {
  DesktopBounds,
  DesktopEntryId,
  DesktopIconState,
  FolderId,
} from "../types/desktop";
import { clamp } from "../utils/windowMath";

const STORAGE_KEY = "suuronen.desktop.icons";
const GRID_STEP_X = DESKTOP_ICON_WIDTH + DESKTOP_ICON_X_GAP;
const GRID_STEP_Y = DESKTOP_ICON_HEIGHT + DESKTOP_ICON_Y_GAP;

function mergeDefaultIcons(storedIcons: DesktopIconState[], bounds: DesktopBounds) {
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

function sortFolderIcons(icons: DesktopIconState[]) {
  return [...icons].sort((left, right) => {
    if (left.position.y !== right.position.y) {
      return left.position.y - right.position.y;
    }

    if (left.position.x !== right.position.x) {
      return left.position.x - right.position.x;
    }

    return left.label.localeCompare(right.label);
  });
}

function normalizeFolderOrder(icons: DesktopIconState[], folderId: FolderId) {
  const orderedFolderIcons = sortFolderIcons(icons.filter((icon) => icon.parentId === folderId));
  const orderMap = new Map(
    orderedFolderIcons.map((icon, index) => [
      icon.id,
      {
        x: index,
        y: 0,
      },
    ]),
  );

  return icons.map((icon) =>
    icon.parentId === folderId
      ? {
          ...icon,
          position: orderMap.get(icon.id) ?? icon.position,
        }
      : icon,
  );
}

function getGridDimensions(bounds: DesktopBounds) {
  return {
    columns: Math.max(
      1,
      Math.floor((bounds.width - DESKTOP_ICON_START_X - DESKTOP_ICON_WIDTH) / GRID_STEP_X) + 1,
    ),
    rows: Math.max(
      1,
      Math.floor((bounds.height - DESKTOP_ICON_START_Y - DESKTOP_ICON_HEIGHT) / GRID_STEP_Y) + 1,
    ),
  };
}

function getGridPosition(column: number, row: number) {
  return {
    x: DESKTOP_ICON_START_X + column * GRID_STEP_X,
    y: DESKTOP_ICON_START_Y + row * GRID_STEP_Y,
  };
}

function getNearestGridCell(position: { x: number; y: number }, bounds: DesktopBounds) {
  const { columns, rows } = getGridDimensions(bounds);

  return {
    column: clamp(Math.round((position.x - DESKTOP_ICON_START_X) / GRID_STEP_X), 0, columns - 1),
    row: clamp(Math.round((position.y - DESKTOP_ICON_START_Y) / GRID_STEP_Y), 0, rows - 1),
  };
}

function slotKey(column: number, row: number) {
  return `${column}:${row}`;
}

function clampIconToBounds(icon: DesktopIconState, bounds: DesktopBounds): DesktopIconState {
  if (icon.parentId !== null || !bounds.width || !bounds.height) {
    return icon;
  }

  return {
    ...icon,
    position: {
      x: clamp(
        icon.position.x,
        DESKTOP_ICON_START_X,
        Math.max(DESKTOP_ICON_START_X, bounds.width - DESKTOP_ICON_WIDTH),
      ),
      y: clamp(
        icon.position.y,
        DESKTOP_ICON_START_Y,
        Math.max(DESKTOP_ICON_START_Y, bounds.height - DESKTOP_ICON_HEIGHT),
      ),
    },
  };
}

function findNearestAvailablePosition(
  preferredPosition: { x: number; y: number },
  occupiedSlots: Set<string>,
  bounds: DesktopBounds,
) {
  const { columns, rows } = getGridDimensions(bounds);
  const preferredCell = getNearestGridCell(preferredPosition, bounds);

  if (!occupiedSlots.has(slotKey(preferredCell.column, preferredCell.row))) {
    return getGridPosition(preferredCell.column, preferredCell.row);
  }

  const maxRadius = Math.max(columns, rows);

  for (let radius = 1; radius <= maxRadius; radius += 1) {
    const candidates: Array<{ column: number; row: number; distance: number }> = [];

    for (let column = preferredCell.column - radius; column <= preferredCell.column + radius; column += 1) {
      for (let row = preferredCell.row - radius; row <= preferredCell.row + radius; row += 1) {
        if (column < 0 || row < 0 || column >= columns || row >= rows) {
          continue;
        }

        const isOnRing =
          column === preferredCell.column - radius ||
          column === preferredCell.column + radius ||
          row === preferredCell.row - radius ||
          row === preferredCell.row + radius;

        if (!isOnRing) {
          continue;
        }

        candidates.push({
          column,
          row,
          distance: Math.hypot(column - preferredCell.column, row - preferredCell.row),
        });
      }
    }

    candidates.sort((left, right) => left.distance - right.distance);

    const availableCandidate = candidates.find(
      (candidate) => !occupiedSlots.has(slotKey(candidate.column, candidate.row)),
    );

    if (availableCandidate) {
      return getGridPosition(availableCandidate.column, availableCandidate.row);
    }
  }

  return getGridPosition(preferredCell.column, preferredCell.row);
}

function resolveRootIconPositions(
  icons: DesktopIconState[],
  bounds: DesktopBounds,
  prioritizedIconId?: DesktopEntryId,
) {
  const rootIcons = icons.filter((icon) => icon.parentId === null);
  const orderedIcons = prioritizedIconId
    ? [
        ...rootIcons.filter((icon) => icon.id === prioritizedIconId),
        ...rootIcons.filter((icon) => icon.id !== prioritizedIconId),
      ]
    : rootIcons;
  const occupiedSlots = new Set<string>();
  const resolvedPositions = new Map<DesktopEntryId, { x: number; y: number }>();

  orderedIcons.forEach((icon) => {
    const clampedIcon = clampIconToBounds(icon, bounds);
    const snappedPosition = findNearestAvailablePosition(clampedIcon.position, occupiedSlots, bounds);
    const snappedCell = getNearestGridCell(snappedPosition, bounds);

    occupiedSlots.add(slotKey(snappedCell.column, snappedCell.row));
    resolvedPositions.set(icon.id, snappedPosition);
  });

  return icons.map((icon) =>
    icon.parentId === null
      ? {
          ...icon,
          position: resolvedPositions.get(icon.id) ?? clampIconToBounds(icon, bounds).position,
        }
      : icon,
  );
}

function packRootIconsForMobile(icons: DesktopIconState[], bounds: DesktopBounds) {
  if (!isMobileDesktopViewport(bounds)) {
    return icons;
  }

  let rootIndex = 0;

  return icons.map((icon) => {
    if (icon.parentId !== null) {
      return icon;
    }

    const position = getDefaultDesktopRootIconPosition(rootIndex, bounds);
    rootIndex += 1;

    return {
      ...icon,
      position,
    };
  });
}

export function useDesktopIcons(bounds: DesktopBounds) {
  const [icons, setIcons] = useState<DesktopIconState[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedIconIds, setSelectedIconIds] = useState<DesktopEntryId[]>([]);
  const wasMobileLayoutRef = useRef(isMobileDesktopViewport(bounds));

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
              const mergedIcons = mergeDefaultIcons(
                [...(parsed as DesktopIconState[]), ...currentIcons].filter(
                  (icon, index, collection) =>
                    collection.findIndex((candidate) => candidate.id === icon.id) === index,
                ),
                bounds,
              );

              return resolveRootIconPositions(
                packRootIconsForMobile(mergedIcons, bounds),
                bounds,
              );
            }
          }
        } catch {
          // ignore invalid stored icon state
        }

        return resolveRootIconPositions(mergeDefaultIcons(currentIcons, bounds), bounds);
      }

      return resolveRootIconPositions(currentIcons, bounds);
    });

    setIsHydrated(true);
  }, [bounds.height, bounds.width, isHydrated]);

  useEffect(() => {
    const isMobileLayout = isMobileDesktopViewport(bounds);

    if (!isHydrated) {
      wasMobileLayoutRef.current = isMobileLayout;
      return;
    }

    if (isMobileLayout && !wasMobileLayoutRef.current) {
      setIcons((currentIcons) => resolveRootIconPositions(packRootIconsForMobile(currentIcons, bounds), bounds));
    }

    wasMobileLayoutRef.current = isMobileLayout;
  }, [bounds, isHydrated]);

  useEffect(() => {
    if (isHydrated && icons.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
    }
  }, [icons, isHydrated]);

  const previewMoveIcon = () => {};

  const moveIcon = (iconId: DesktopEntryId, nextX: number, nextY: number) => {
    setIcons((currentIcons) =>
      resolveRootIconPositions(
        currentIcons.map((icon) =>
          icon.id === iconId
            ? {
                ...clampIconToBounds(icon, bounds),
                position: { x: nextX, y: nextY },
              }
            : icon,
        ),
        bounds,
        iconId,
      ),
    );
  };

  const moveIconToFolder = (iconId: DesktopEntryId, folderId: FolderId) => {
    if (iconId === folderId) {
      return;
    }

    setIcons((currentIcons) => {
      const nextIcons = currentIcons.map((icon) =>
        icon.id === iconId
          ? {
              ...icon,
              parentId: folderId,
              position: { x: Number.MAX_SAFE_INTEGER, y: 0 },
            }
          : icon,
      );

      return normalizeFolderOrder(nextIcons, folderId);
    });
    setSelectedIconIds((currentSelectedIds) => currentSelectedIds.filter((selectedId) => selectedId !== iconId));
  };

  const moveIconToDesktop = (iconId: DesktopEntryId, nextX: number, nextY: number) => {
    setIcons((currentIcons) => {
      const sourceIcon = currentIcons.find((icon) => icon.id === iconId);
      const sourceFolderId = sourceIcon?.parentId ?? null;
      const nextIcons = currentIcons.map((icon) =>
        icon.id === iconId
          ? {
              ...icon,
              parentId: null,
              position: { x: nextX, y: nextY },
            }
          : icon,
      );
      const withRootPositions = resolveRootIconPositions(nextIcons, bounds, iconId);

      return sourceFolderId ? normalizeFolderOrder(withRootPositions, sourceFolderId) : withRootPositions;
    });
  };

  const rootIcons = icons.filter((icon) => icon.parentId === null);

  const getFolderEntries = (folderId: FolderId) =>
    sortFolderIcons(icons.filter((icon) => icon.parentId === folderId));

  const reorderFolderEntry = (iconId: DesktopEntryId, folderId: FolderId, targetIndex: number) => {
    setIcons((currentIcons) => {
      const folderIcons = sortFolderIcons(currentIcons.filter((icon) => icon.parentId === folderId));
      const draggedIcon = folderIcons.find((icon) => icon.id === iconId);

      if (!draggedIcon) {
        return currentIcons;
      }

      const remainingFolderIcons = folderIcons.filter((icon) => icon.id !== iconId);
      const clampedIndex = clamp(targetIndex, 0, remainingFolderIcons.length);
      remainingFolderIcons.splice(clampedIndex, 0, draggedIcon);
      const reorderedMap = new Map(
        remainingFolderIcons.map((icon, index) => [
          icon.id,
          {
            x: index,
            y: 0,
          },
        ]),
      );

      return currentIcons.map((icon) =>
        icon.parentId === folderId && reorderedMap.has(icon.id)
          ? {
              ...icon,
              position: reorderedMap.get(icon.id) ?? icon.position,
            }
          : icon,
      );
    });
  };

  const getEntry = (entryId: DesktopEntryId) => icons.find((icon) => icon.id === entryId) ?? null;

  const addIcon = (icon: DesktopIconState) => {
    setIcons((currentIcons) => {
      if (currentIcons.some((existingIcon) => existingIcon.id === icon.id)) {
        return currentIcons;
      }

      return resolveRootIconPositions([...currentIcons, icon], bounds, icon.id);
    });
  };

  const updateIcon = (iconId: DesktopEntryId, patch: Partial<DesktopIconState>) => {
    setIcons((currentIcons) =>
      resolveRootIconPositions(
        currentIcons.map((icon) => (icon.id === iconId ? { ...icon, ...patch } : icon)),
        bounds,
        patch.parentId === null ? iconId : undefined,
      ),
    );
  };

  const removeIcon = (iconId: DesktopEntryId) => {
    setIcons((currentIcons) => {
      const targetIcon = currentIcons.find((icon) => icon.id === iconId);
      const nextIcons = currentIcons.filter((icon) => icon.id !== iconId);

      return targetIcon?.parentId ? normalizeFolderOrder(nextIcons, targetIcon.parentId) : nextIcons;
    });
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
    moveIconToDesktop,
    moveIconToFolder,
    previewMoveIcon,
    reorderFolderEntry,
    removeIcon,
    selectedIconIds,
    setSelectedIconIds,
    updateIcon,
  };
}
