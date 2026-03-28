import type { CSSProperties, ComponentType, SVGProps } from "react";

import { Cloud, Code2, Cpu, Database, Network, Rocket, Server, Shield, Sparkles } from "lucide-react";
import {
  SiDocker,
  SiElectron,
  SiExpress,
  SiFastapi,
  SiGo,
  SiGooglecloud,
  SiGooglecloudstorage,
  SiGrafana,
  SiJavascript,
  SiKotlin,
  SiKtor,
  SiKubernetes,
  SiLinux,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiNumpy,
  SiOpencv,
  SiOpentelemetry,
  SiPandas,
  SiPython,
  SiPytorch,
  SiReactrouter,
  SiSentry,
  SiSpringboot,
  SiTerraform,
  SiTypescript,
} from "react-icons/si";

import {
  techStackFeatured,
  techStackGroups,
  type TechStackFeature,
  type TechStackGroup,
  type TechStackIconKey,
} from "../../data/techStackGroups";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> | { className?: string }>;

const iconMap: Record<TechStackIconKey, IconComponent> = {
  cloud: Cloud,
  code: Code2,
  cpu: Cpu,
  database: Database,
  docker: SiDocker,
  electron: SiElectron,
  express: SiExpress,
  fastapi: SiFastapi,
  gcp: SiGooglecloud,
  go: SiGo,
  grafana: SiGrafana,
  iam: Shield,
  javascript: SiJavascript,
  kotlin: SiKotlin,
  ktor: SiKtor,
  kubernetes: SiKubernetes,
  linux: SiLinux,
  mongodb: SiMongodb,
  mysql: SiMysql,
  network: Network,
  nextjs: SiNextdotjs,
  node: SiNodedotjs,
  numpy: SiNumpy,
  opencv: SiOpencv,
  opentelemetry: SiOpentelemetry,
  pandas: SiPandas,
  python: SiPython,
  pytorch: SiPytorch,
  reactrouter: SiReactrouter,
  sentry: SiSentry,
  server: Server,
  springboot: SiSpringboot,
  storage: SiGooglecloudstorage,
  terraform: SiTerraform,
  typescript: SiTypescript,
  uvicorn: Rocket,
  vertex: Sparkles,
};

function getStackStyle({ accent, surface }: Pick<TechStackFeature | TechStackGroup, "accent" | "surface">) {
  return {
    "--stack-accent": accent,
    "--stack-surface": surface,
  } as CSSProperties;
}

function BrowserTechStack() {
  return (
    <div className="tech-stack-view">
      <div className="tech-stack-feature-grid" aria-label="Primary stack comfort zones">
        {techStackFeatured.map((feature) => {
          const Icon = iconMap[feature.icon];

          return (
            <article key={feature.label} className="tech-stack-feature-card" style={getStackStyle(feature)}>
              <div className="tech-stack-feature-head">
                <span className="tech-stack-feature-icon" aria-hidden="true">
                  <Icon className="tech-stack-icon" />
                </span>
                <div>
                  <span className="tech-stack-kicker">Most comfortable</span>
                  <h3>{feature.label}</h3>
                </div>
              </div>

              <p>{feature.description}</p>

              <div className="tech-stack-feature-list" aria-label={`${feature.label} focus areas`}>
                {feature.details.map((detail) => (
                  <span key={detail} className="tech-stack-inline-pill">
                    {detail}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="tech-stack-grid" aria-label="Technology categories">
        {techStackGroups.map((group) => {
          const GroupIcon = iconMap[group.icon];

          return (
            <article key={group.label} className="tech-stack-group-card" style={getStackStyle(group)}>
              <header className="tech-stack-group-header">
                <span className="tech-stack-group-icon" aria-hidden="true">
                  <GroupIcon className="tech-stack-icon" />
                </span>
                <div>
                  <span className="tech-stack-kicker">Category</span>
                  <h3>{group.label}</h3>
                </div>
              </header>

              <p className="tech-stack-group-description">{group.description}</p>

              <div className="tech-stack-sections">
                {group.sections.map((section) => (
                  <section key={section.title} className="tech-stack-section-block">
                    <h4>{section.title}</h4>
                    <div className="tech-stack-skill-grid">
                      {section.items.map((skill) => {
                        const SkillIcon = iconMap[skill.icon];

                        return (
                          <div key={skill.label} className="tech-stack-skill-pill">
                            <span className="tech-stack-skill-icon" aria-hidden="true">
                              <SkillIcon className="tech-stack-icon" />
                            </span>
                            <span>{skill.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default BrowserTechStack;
