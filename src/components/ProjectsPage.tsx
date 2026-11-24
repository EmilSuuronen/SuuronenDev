import { useEffect, useRef, useState, type MouseEvent } from "react";

import { projects, schoolProjects, type Project } from "../data/projects";
import { useLocale } from "../i18n/locale";

// Videos too: coming back from one in the same tab would replay the boot.
const opensNewTab = (href: string) => href.startsWith("http") || href.endsWith(".mp4");

export function ProjectLinks({ project }: { project: Project }) {
  const { t } = useLocale();

  return project.links.length ? (
    <p className="textmode-links">
      {project.links.map((link) => (
        <a
          key={link.href}
          aria-label={`${project.name}: ${t(link.label)}`}
          className="textmode-link"
          href={link.href}
          rel={opensNewTab(link.href) ? "noopener noreferrer" : undefined}
          target={opensNewTab(link.href) ? "_blank" : undefined}
        >
          [{t(link.label)}]
        </a>
      ))}
    </p>
  ) : null;
}

function ProjectCard({ onPlay, project }: { onPlay: (project: Project) => void; project: Project }) {
  const { t } = useLocale();
  const picture = <img alt="" height={450} loading="lazy" src={project.image} width={800} />;
  const [main] = project.links;

  return (
    <li className="textmode-card">
      <h3 className="textmode-titlebar textmode-card-title">{project.name}</h3>
      {project.video ? (
        <button
          aria-label={`${project.name}: ${t("watch demo")}`}
          className="textmode-card-picture"
          onClick={() => onPlay(project)}
          type="button"
        >
          {picture}
          <span aria-hidden="true" className="textmode-card-play">
            ▶
          </span>
        </button>
      ) : (
        // The same link is in the list below, so keyboards and screen readers skip this one.
        <a
          aria-hidden="true"
          className="textmode-card-picture"
          href={main.href}
          rel={opensNewTab(main.href) ? "noopener noreferrer" : undefined}
          tabIndex={-1}
          target={opensNewTab(main.href) ? "_blank" : undefined}
        >
          {picture}
        </a>
      )}
      <p className="textmode-dim textmode-card-stack">{project.stack}</p>
      <p className="textmode-card-description">{t(project.summary ?? project.description)}</p>
      <ProjectLinks project={project} />
    </li>
  );
}

function ProjectsPage({ onBack }: { onBack: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const { t } = useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState<Project | null>(null);

  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);

  useEffect(() => {
    if (playing) {
      dialogRef.current?.showModal();
    }
  }, [playing]);

  return (
    <div className="textmode-page textmode-page--wide">
      <p>
        <a className="textmode-link" href="/" onClick={onBack}>
          [← {t("back")}]
        </a>
      </p>
      <h1 ref={headingRef} className="textmode-command" tabIndex={-1}>
        <span className="textmode-prompt">emil@suuronen.dev:~$</span> open ~/projects
      </h1>
      <ul className="textmode-list textmode-cards">
        {projects.map((project) => (
          <ProjectCard key={project.name} onPlay={setPlaying} project={project} />
        ))}
      </ul>

      <section aria-labelledby="textmode-school" className="textmode-school">
        <h2 className="textmode-command" id="textmode-school">
          <span className="textmode-prompt">emil@suuronen.dev:~$</span> open ~/projects/school
        </h2>
        <p className="textmode-dim">{t("Older stuff I made for school.")}</p>
        <ul className="textmode-list textmode-cards">
          {schoolProjects.map((project) => (
            <ProjectCard key={project.name} onPlay={setPlaying} project={project} />
          ))}
        </ul>
      </section>

      {playing ? (
        <dialog
          ref={dialogRef}
          aria-label={`${playing.name}: ${t("demo video")}`}
          className="textmode-player"
          onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
          onClose={() => setPlaying(null)}
        >
          <div className="textmode-titlebar">
            <span>{playing.name}</span>
            <button
              aria-label={t("Close")}
              className="textmode-player-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              ×
            </button>
          </div>
          <video autoPlay controls muted playsInline poster={playing.image} src={playing.video} />
        </dialog>
      ) : null}
    </div>
  );
}

export default ProjectsPage;
