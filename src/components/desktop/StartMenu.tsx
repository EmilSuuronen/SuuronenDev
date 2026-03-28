import { useEffect, useRef } from "react";
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";

import AppGlyph from "./AppGlyph";
import { startMenuSections } from "../../data/startMenu";
import { useLocale } from "../../i18n/locale";
import type { DesktopEntryId, StartMenuItem } from "../../types/desktop";

type StartMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenEntry: (entryId: DesktopEntryId) => void;
};

function renderAuxIcon(icon: StartMenuItem["icon"]) {
  if (icon === "github") {
    return <FiGithub className="start-menu-item-meta-icon" />;
  }

  if (icon === "linkedin") {
    return <FiLinkedin className="start-menu-item-meta-icon" />;
  }

  if (icon === "mail") {
    return <FiMail className="start-menu-item-meta-icon" />;
  }

  return <AppGlyph iconKey={icon} className="start-menu-item-glyph" />;
}

function StartMenu({ isOpen, onClose, onOpenEntry }: StartMenuProps) {
  const { t } = useLocale();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleItemClick = (item: StartMenuItem) => {
    if (item.action.type === "open_entry") {
      onOpenEntry(item.action.entryId);
      onClose();
      return;
    }

    if (item.action.type === "open_link") {
      window.open(item.action.href, "_blank", "noopener,noreferrer");
      onClose();
    }
  };

  return (
    <div ref={menuRef} className="start-menu" role="dialog" aria-label={t("Start")}>
      <div className="start-menu-header">
        <div>
          <div className="start-menu-title">{t("Start")}</div>
          <div className="start-menu-subtitle">{t("Pinned apps and quick links")}</div>
        </div>
      </div>

      <div className="start-menu-sections">
        {startMenuSections.map((section) => (
          <section key={section.label} className="start-menu-section" aria-label={t(section.label)}>
            <div className="start-menu-section-title">{t(section.label)}</div>
            <div className="start-menu-grid">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  className="start-menu-item"
                  type="button"
                  onClick={() => handleItemClick(item)}
                >
                  <span className="start-menu-item-icon" aria-hidden="true">
                    {renderAuxIcon(item.icon)}
                  </span>
                  <span className="start-menu-item-text">
                    <span className="start-menu-item-label">{t(item.label)}</span>
                    {item.description ? (
                      <span className="start-menu-item-description">{t(item.description)}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="start-menu-footer">
        <div className="start-menu-footer-user">emil@desktop</div>
        <div className="start-menu-footer-hint">{t("Placeholder shell menu")}</div>
      </div>
    </div>
  );
}

export default StartMenu;
