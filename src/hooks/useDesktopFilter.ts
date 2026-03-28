import { useEffect, useMemo, useState } from "react";

import {
  defaultDesktopFilter,
  desktopFilterOptions,
  type DesktopFilterId,
} from "../data/desktopFilters";

const STORAGE_KEY = "suuronen.desktop.filter";

export function useDesktopFilter() {
  const [activeFilterId, setActiveFilterId] = useState<DesktopFilterId>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (desktopFilterOptions.some((filterOption) => filterOption.id === stored)) {
        return stored as DesktopFilterId;
      }
    } catch {
      // ignore storage failures
    }

    return defaultDesktopFilter.id;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, activeFilterId);
  }, [activeFilterId]);

  const activeFilter = useMemo(
    () =>
      desktopFilterOptions.find((filterOption) => filterOption.id === activeFilterId) ??
      defaultDesktopFilter,
    [activeFilterId],
  );

  return {
    activeFilter,
    activeFilterId,
    filterOptions: desktopFilterOptions,
    setActiveFilterId,
  };
}
