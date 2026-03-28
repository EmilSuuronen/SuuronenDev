type DesktopContextMenuItem = {
  danger?: boolean;
  label: string;
  onSelect: () => void;
};

type DesktopContextMenuSection = {
  items: DesktopContextMenuItem[];
};

type DesktopContextMenuProps = {
  sections: DesktopContextMenuSection[];
  x: number;
  y: number;
};

function DesktopContextMenu({ sections, x, y }: DesktopContextMenuProps) {
  return (
    <div
      className="desktop-context-menu"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="desktop-context-menu-section">
          {section.items.map((item) => (
            <button
              key={item.label}
              className={`desktop-context-menu-item${item.danger ? " desktop-context-menu-item--danger" : ""}`}
              type="button"
              onClick={item.onSelect}
            >
              {item.label}
            </button>
          ))}
          {sectionIndex < sections.length - 1 ? <div className="desktop-context-menu-divider" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

export default DesktopContextMenu;
