import { useEffect, useMemo, useRef, useState } from "react";
import { MdOutlineMail } from "react-icons/md";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Search } from "lucide-react";

import { systemMenus } from "../../data/systemMenus";
import { useLocale } from "../../i18n/locale";
import type { DesktopMenu, WindowId } from "../../types/desktop";

type TopBarProps = {
  onOpenPalette: () => void;
  onOpenWindow: (windowId: WindowId) => void;
};

function MenuItemIcon({ icon }: { icon?: DesktopMenu["items"][number]["icon"] }) {
  if (icon === "mail") {
    return <MdOutlineMail className="topbar-menu-item-icon" />;
  }

  if (icon === "github") {
    return <FaGithub className="topbar-menu-item-icon" />;
  }

  if (icon === "linkedin") {
    return <FaLinkedin className="topbar-menu-item-icon" />;
  }

  return null;
}

function TopBar({ onOpenPalette, onOpenWindow }: TopBarProps) {
  const { t } = useLocale();
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setActiveMenuLabel(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenuLabel(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const activeMenu = useMemo<DesktopMenu | null>(
    () => systemMenus.find((menu) => menu.label === activeMenuLabel) ?? null,
    [activeMenuLabel],
  );

  const handleItemClick = (menuItem: DesktopMenu["items"][number]) => {
    if (menuItem.action?.type === "open_window") {
      onOpenWindow(menuItem.action.windowId);
    }

    setActiveMenuLabel(null);
  };

  return (
    <header className="topbar">
      <div ref={menuRef} className="topbar-menu-strip">
        {systemMenus.map((menu) => (
          <div key={menu.label} className="topbar-menu-group">
            <button
              className={`topbar-menu-trigger${activeMenuLabel === menu.label ? " is-active" : ""}`}
              type="button"
              onClick={() =>
                setActiveMenuLabel((current) => (current === menu.label ? null : menu.label))
              }
            >
              {t(menu.label)}
            </button>

            {activeMenu?.label === menu.label ? (
              <div className="topbar-menu-panel" role="menu" aria-label={t(menu.label)}>
                {menu.items.map((item) => (
                  item.href ? (
                    <a
                      key={`${menu.label}-${item.label}`}
                      className="topbar-menu-item"
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      onClick={() => setActiveMenuLabel(null)}
                    >
                      <span className="topbar-menu-item-main">
                        <MenuItemIcon icon={item.icon} />
                        <span className="topbar-menu-item-text">
                          <span className="topbar-menu-item-label">{t(item.label)}</span>
                          {item.description ? (
                            <span className="topbar-menu-item-description">{t(item.description)}</span>
                          ) : null}
                        </span>
                      </span>
                    </a>
                  ) : (
                    <button
                      key={`${menu.label}-${item.label}`}
                      className={`topbar-menu-item${item.action?.type === "none" ? " is-static" : ""}`}
                      type="button"
                      onClick={() => handleItemClick(item)}
                    >
                      <span className="topbar-menu-item-main">
                        <MenuItemIcon icon={item.icon} />
                        <span className="topbar-menu-item-text">
                          <span className="topbar-menu-item-label">{t(item.label)}</span>
                          {item.description ? (
                            <span className="topbar-menu-item-description">{t(item.description)}</span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  )
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <button aria-keyshortcuts="Control+K Meta+K" className="topbar-search" onClick={onOpenPalette} type="button">
        <Search aria-hidden="true" className="topbar-search-icon" />
        <span className="topbar-search-label">{t("Search")}</span>
        <kbd className="topbar-search-kbd">Ctrl K</kbd>
      </button>
    </header>
  );
}

export default TopBar;
