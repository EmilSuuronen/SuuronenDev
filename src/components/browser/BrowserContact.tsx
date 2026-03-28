import type { CSSProperties } from "react";

import { FaGithub, FaLinkedin } from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";

import { contactLinks } from "../../data/contactLinks";
import { useLocale } from "../../i18n/locale";

function BrowserContact() {
  const { t } = useLocale();
  return (
    <div className="browser-contact-view">
      <div className="browser-contact-grid" aria-label={t("Contact")}>
        {contactLinks.map((link) => {
          const style = {
            "--contact-accent": link.accent,
          } as CSSProperties;

          return (
            <a
              key={link.label}
              className="browser-contact-card"
              href={link.href}
              target={link.type === "email" ? undefined : "_blank"}
              rel={link.type === "email" ? undefined : "noreferrer"}
              style={style}
            >
              <span className="browser-contact-card-icon" aria-hidden="true">
                {link.type === "email" ? (
                  <MdOutlineMail className="browser-contact-icon" />
                ) : link.type === "github" ? (
                  <FaGithub className="browser-contact-icon" />
                ) : (
                  <FaLinkedin className="browser-contact-icon" />
                )}
              </span>

              <div className="browser-contact-card-content">
                <span className="browser-contact-card-label">{t(link.label)}</span>
                <h3>{link.subtitle}</h3>
                <p>{t(link.description)}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default BrowserContact;
