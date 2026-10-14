import type { CSSProperties, ReactNode } from "react";

import { browserSections } from "../data/browserSections";
import { contactLinks } from "../data/contactLinks";
import { projects } from "../data/projects";
import { techStackGroups } from "../data/techStackGroups";
import { useLocale } from "../i18n/locale";

type TextModeProps = {
  onLaunchDesktop: () => void;
  onReboot: () => void;
};

function Command({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h2 className="textmode-command" id={id}>
      <span className="textmode-prompt">emil@suuronen.dev:~$</span> {children}
    </h2>
  );
}

// Sections type in one after another; delays stay short so the page is readable almost immediately.
const reveal = (index: number) => ({ "--reveal-delay": `${index * 90}ms` }) as CSSProperties;

function TextMode({ onLaunchDesktop, onReboot }: TextModeProps) {
  const { t } = useLocale();
  const about = browserSections[0];

  return (
    <main className="textmode">
      <div className="textmode-page">
        <header className="textmode-section" style={reveal(0)}>
          <Command id="textmode-whoami">whoami</Command>
          <h1 className="textmode-name">Emil Suuronen</h1>
          <p className="textmode-lead">{t("Backend engineer, infrastructure builder, and curious product tinkerer.")}</p>
          <p>{t(about.description)}</p>
        </header>

        <section aria-labelledby="textmode-projects" className="textmode-section" style={reveal(1)}>
          <Command id="textmode-projects">ls ~/projects</Command>
          <ul className="textmode-list">
            {projects.map((project) => (
              <li key={project.name} className="textmode-project">
                <p>
                  <strong className="textmode-highlight">{project.name}/</strong>{" "}
                  <span className="textmode-dim">{project.stack}</span>
                </p>
                <p>{t(project.description)}</p>
                {project.links.length ? (
                  <p className="textmode-links">
                    {project.links.map((link) => (
                      <a
                        key={link.href}
                        className="textmode-link"
                        href={link.href}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                      >
                        [{t(link.label)}]
                      </a>
                    ))}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="textmode-stack" className="textmode-section" style={reveal(2)}>
          <Command id="textmode-stack">cat stack.txt</Command>
          <dl className="textmode-stack">
            {techStackGroups.map((group) => (
              <div key={group.label}>
                <dt className="textmode-highlight">{t(group.label)}</dt>
                <dd>{group.sections.flatMap((section) => section.items.map((item) => item.label)).join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="textmode-contact" className="textmode-section" style={reveal(3)}>
          <Command id="textmode-contact">contact</Command>
          <ul className="textmode-list textmode-contact">
            {contactLinks.map((link) => (
              <li key={link.type}>
                <span className="textmode-dim">{link.label.toLowerCase().padEnd(9, " ")}</span>
                <a
                  className="textmode-link"
                  href={link.href}
                  rel={link.type === "email" ? undefined : "noopener noreferrer"}
                  target={link.type === "email" ? undefined : "_blank"}
                >
                  {link.subtitle}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="textmode-startx" className="textmode-section" style={reveal(4)}>
          <Command id="textmode-startx">startx</Command>
          <p>{t("This page is the short version. The desktop has windows, a working shell, games and the site's own source code.")}</p>
          <p className="textmode-links">
            <button className="textmode-link" onClick={onLaunchDesktop} type="button">
              [{t("boot desktop")}]
            </button>
            <button className="textmode-link" onClick={onReboot} type="button">
              [{t("reboot")}]
            </button>
          </p>
        </section>

        <p aria-hidden="true" className="textmode-section textmode-command" style={reveal(5)}>
          <span className="textmode-prompt">emil@suuronen.dev:~$</span> <span className="boot-cursor" />
        </p>
      </div>
      <div aria-hidden="true" className="boot-scanlines textmode-scanlines" />
    </main>
  );
}

export default TextMode;
