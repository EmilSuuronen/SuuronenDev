import type { DesktopFilterId } from "../../data/desktopFilters";

type DesktopFilterOverlayProps = {
  filterId: DesktopFilterId;
};

function DesktopFilterOverlay({ filterId }: DesktopFilterOverlayProps) {
  if (filterId === "none" || filterId === "invert" || filterId === "noir") {
    return null;
  }

  return (
    <div className={`desktop-filter-overlay desktop-filter-overlay--${filterId}`} aria-hidden="true">
      <span className="desktop-filter-layer desktop-filter-layer--a" />
      <span className="desktop-filter-layer desktop-filter-layer--b" />
      <span className="desktop-filter-layer desktop-filter-layer--c" />
    </div>
  );
}

export default DesktopFilterOverlay;
