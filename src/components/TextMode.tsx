import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

import TerminalApp from "../apps/TerminalApp";
import { browserSections } from "../data/browserSections";
import { contactLinks } from "../data/contactLinks";
import { projects } from "../data/projects";
import { techStackGroups } from "../data/techStackGroups";
import { useLocale } from "../i18n/locale";
import ProjectsPage, { ProjectLinks } from "./ProjectsPage";

export type TextModePage = "/" | "/projects";

type TextModeProps = {
  onNavigate: (page: TextModePage) => void;
  onReboot: () => void;
  page: TextModePage;
};

type MenuId = "contact" | "settings";

// A checkbox setting remembered in localStorage.
function useStoredFlag(key: string, fallback: boolean) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? stored === "on" : fallback;
    } catch {
      return fallback;
    }
  });

  const toggle = () => {
    setValue(!value);
    try {
      window.localStorage.setItem(key, value ? "off" : "on");
    } catch {
      // storage blocked: the choice lasts until reload
    }
  };

  return [value, toggle] as const;
}

function Command({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h2 className="textmode-command" id={id}>
      <span className="textmode-prompt">emil@suuronen.dev:~$</span> {children}
    </h2>
  );
}

// Sections type in one after another; delays stay short so the page is readable almost immediately.
const reveal = (index: number) => ({ "--reveal-delay": `${index * 90}ms` }) as CSSProperties;

function TextMode({ onNavigate, onReboot, page }: TextModeProps) {
  const { t } = useLocale();
  const about = browserSections[0];
  const [crt, toggleCrt] = useStoredFlag("suuronen.text.crt", true);
  const [leftAligned, toggleLeftAligned] = useStoredFlag("suuronen.text.left", true);
  const [menu, setMenu] = useState<MenuId | null>(null);
  const menubarRef = useRef<HTMLElement>(null);
  // No autofocus on touch devices: it would pop the keyboard over the page.
  const [autoFocus] = useState(() => Boolean(window.matchMedia?.("(pointer: fine)").matches));

  useEffect(() => {
    if (!menu) {
      return;
    }

    const close = (event: PointerEvent | KeyboardEvent) => {
      if ("key" in event ? event.key === "Escape" : !menubarRef.current?.contains(event.target as Node)) {
        setMenu(null);
      }
    };

    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [menu]);

  // Home keeps its scroll position while the projects page is open.
  const scrollRef = useRef<HTMLElement>(null);
  const homeScrollRef = useRef(0);

  useLayoutEffect(() => {
    const scroller = scrollRef.current!;
    scroller.scrollTop = page === "/" ? homeScrollRef.current : 0;
  }, [page]);

  const navigate = (next: TextModePage) => (event: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks keep normal link behaviour (new tab, download...).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    onNavigate(next);
  };

  const menuButton = (id: MenuId, label: string) => (
    <button
      aria-expanded={menu === id}
      className="textmode-menu-button"
      onClick={() => setMenu(menu === id ? null : id)}
      // Like a real menu bar: once one menu is open, hovering another switches to it.
      onPointerEnter={() => menu && setMenu(id)}
      type="button"
    >
      {t(label)}
    </button>
  );

  return (
    <main
      ref={scrollRef}
      onScroll={(event) => {
        if (page === "/") {
          homeScrollRef.current = event.currentTarget.scrollTop;
        }
      }}
      className={`textmode ${crt ? "" : "textmode--no-crt"} ${leftAligned ? "textmode--left" : ""}`}
    >
      <div className="textmode-screen">
      {crt ? <div aria-hidden="true" className="boot-scanlines textmode-scanlines" /> : null}
      <header className="textmode-bar">
        <div className="textmode-titlebar">
          <span className="textmode-titlebar-title">Emil Suuronen - suuronen.dev</span>
          <span aria-hidden="true" className="textmode-titlebar-buttons">
            <span>_</span>
            <span>□</span>
            <span>×</span>
          </span>
        </div>
        <nav ref={menubarRef} aria-label={t("Site")} className="textmode-menubar">
          <div className="textmode-menu">
            {menuButton("contact", "Contact")}
            {menu === "contact" ? (
              <div className="textmode-menu-popup">
                {contactLinks.map((link) => (
                  <a
                    key={link.type}
                    className="textmode-menu-item"
                    href={link.href}
                    onClick={() => setMenu(null)}
                    rel={link.type === "email" ? undefined : "noopener noreferrer"}
                    target={link.type === "email" ? undefined : "_blank"}
                  >
                    {link.label}: {link.subtitle}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div className="textmode-menu">
            {menuButton("settings", "Settings")}
            {menu === "settings" ? (
              <div className="textmode-menu-popup">
                <label className="textmode-menu-item">
                  <input checked={crt} onChange={toggleCrt} type="checkbox" />
                  {t("CRT effect")}
                </label>
                <label className="textmode-menu-item">
                  <input checked={leftAligned} onChange={toggleLeftAligned} type="checkbox" />
                  {t("Left-aligned layout")}
                </label>
              </div>
            ) : null}
          </div>
        </nav>
      </header>
      {page === "/projects" ? <ProjectsPage onBack={navigate("/")} /> : null}
      {/* Hidden rather than unmounted, so the terminal session survives a visit to the projects page. */}
      <div className="textmode-page" hidden={page !== "/"}>
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
                <ProjectLinks project={project} />
              </li>
            ))}
          </ul>
          <p>
            <a className="textmode-link" href="/projects" onClick={navigate("/projects")}>
              [{t("view more projects")} →]
            </a>
          </p>
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


        <section aria-label={t("Terminal")} className="textmode-section textmode-terminal" style={reveal(4)}>
          <TerminalApp
            inline
            isActive={autoFocus && page === "/"}
            onOpen={(target) => {
              if (target === "reboot") {
                onReboot();
              } else if (/^https?:/.test(target)) {
                window.open(target, "_blank", "noopener");
              } else {
                return false; // desktop apps have nowhere to open here
              }
            }}
          />
        </section>
      </div>
      </div>
    </main>
  );
}

export default TextMode;
