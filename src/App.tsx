import { useEffect, useState } from "react";

type Theme = "light" | "dark";

type Project = {
  title: string;
  description: string;
  tags: string[];
  href: string;
  image?: string;
};

type LinkItem = {
  label: string;
  value: string;
  href: string;
};

const contactLinks: LinkItem[] = [
  {
    label: "GitHub",
    value: "@EmilSuuronen",
    href: "https://github.com/EmilSuuronen",
  },
  {
    label: "LinkedIn",
    value: "emil-suuronen",
    href: "https://www.linkedin.com/in/emil-suuronen/",
  },
  {
    label: "Email",
    value: "emilsuuronen@gmail.com",
    href: "mailto:emilsuuronen@gmail.com",
  },
];

const skillGroups = [
  {
    title: "Frontend",
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
  },
  {
    title: "Mobile",
    skills: ["Kotlin", "Swift", "React Native", "Android", "iOS"],
  },
  {
    title: "General",
    skills: ["Node.js", "Java", "Python", "C#", "Linux"],
  },
];

const featuredProjects: Project[] = [
  {
    title: "Suuronen.dev",
    description: "This site. A lightweight portfolio that now runs as a React and TypeScript app.",
    tags: ["React", "TypeScript", "Vite", "GitHub Pages"],
    href: "https://github.com/EmilSuuronen/SuuronenDev",
    image: "/res/projectImg/suuronendev.png",
  },
  {
    title: "AimPractice",
    description: "A small browser game built to practice mouse control and movement accuracy.",
    tags: ["JavaScript", "Game", "Web"],
    href: "https://emilsuuronen.github.io/AimPractice/",
    image: "/res/projectImg/aimpracticeimg.png",
  },
  {
    title: "AI-Blaze",
    description:
      "A React app for turning interface sketches into HTML and CSS with AI-assisted generation.",
    tags: ["React", "AI", "Firebase", "Web"],
    href: "https://github.com/EmilSuuronen/AI-Blaze",
  },
  {
    title: "FoodieHub",
    description: "A food sharing platform built as a React Native project for school.",
    tags: ["React Native", "Mobile", "Web"],
    href: "https://github.com/Liideli/FoodieHub",
  },
  {
    title: "BrainyBear",
    description: "An iOS app for children, built with Swift as part of a team project.",
    tags: ["Swift", "iOS"],
    href: "https://github.com/Liideli/BrainyBear",
  },
  {
    title: "ParlaMatch",
    description: "An Android app for browsing and matching with members of parliament.",
    tags: ["Kotlin", "Android"],
    href: "https://github.com/EmilSuuronen/ParlaMatch",
  },
];

const otherLinks: LinkItem[] = [
  {
    label: "Spotify",
    value: "Music releases",
    href: "https://open.spotify.com/artist/5Xuol061Xde1ge1RgQowKr",
  },
  {
    label: "SoundCloud",
    value: "Drafts and uploads",
    href: "https://soundcloud.com/meemil",
  },
  {
    label: "Snapchat",
    value: "Lenses and filters",
    href: "https://www.snapchat.com/add/empuhtin",
  },
];

function App() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const nextThemeLabel = theme === "light" ? "Dark mode" : "Light mode";

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top">
          Suuronen.dev
        </a>
        <nav className="site-nav" aria-label="Primary">
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </nav>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${nextThemeLabel}`}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </header>

      <main id="top" className="page-content">
        <section className="hero panel">
          <p className="eyebrow">Portfolio / personal site</p>
          <h1>React, TypeScript, web, mobile.</h1>
          <p className="hero-copy">
            Emil Suuronen is an ICT engineering student focused on building clean web and mobile
            products. This site is the new React baseline for the next design iteration.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">
              View projects
            </a>
            <a className="button button-secondary" href="mailto:emilsuuronen@gmail.com">
              Get in touch
            </a>
          </div>
        </section>

        <section id="about" className="about-grid">
          <article className="panel">
            <p className="section-label">About</p>
            <h2>Current focus</h2>
            <p>
              I&apos;m especially interested in modern frontend development, mobile apps, and
              building products that feel intentional instead of overloaded.
            </p>
            <p>
              The old site was a static HTML page. This version gives you a typed React setup that
              is easier to extend, restyle, and deploy.
            </p>
          </article>

          <article className="panel">
            <p className="section-label">Contact</p>
            <h2>Reach me here</h2>
            <div className="stack">
              {contactLinks.map((item) => (
                <a key={item.label} className="contact-link" href={item.href} target="_blank" rel="noreferrer">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </a>
              ))}
            </div>
          </article>
        </section>

        <section className="panel">
          <p className="section-label">Skills</p>
          <h2>Tooling I work with</h2>
          <div className="skills-grid">
            {skillGroups.map((group) => (
              <article key={group.title} className="skill-card">
                <h3>{group.title}</h3>
                <ul className="tag-list">
                  {group.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="work" className="panel">
          <p className="section-label">Selected work</p>
          <h2>Projects</h2>
          <div className="projects-grid">
            {featuredProjects.map((project) => (
              <a
                key={project.title}
                className="project-card"
                href={project.href}
                target="_blank"
                rel="noreferrer"
              >
                {project.image ? (
                  <img className="project-image" src={project.image} alt={`${project.title} preview`} />
                ) : null}
                <div className="project-body">
                  <div className="project-header">
                    <h3>{project.title}</h3>
                    <span>Open</span>
                  </div>
                  <p>{project.description}</p>
                  <ul className="tag-list">
                    {project.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="section-label">Elsewhere</p>
          <h2>Creative channels</h2>
          <div className="links-grid">
            {otherLinks.map((item) => (
              <a key={item.label} className="surface-link" href={item.href} target="_blank" rel="noreferrer">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </a>
            ))}
          </div>
        </section>

        <section id="contact" className="panel final-panel">
          <p className="section-label">Next step</p>
          <h2>Need a collaborator or want to talk about a project?</h2>
          <p>
            Email is the simplest route. GitHub and LinkedIn are linked above if you want code or
            background first.
          </p>
          <a className="button button-primary" href="mailto:emilsuuronen@gmail.com">
            emilsuuronen@gmail.com
          </a>
        </section>
      </main>
    </div>
  );
}

export default App;
