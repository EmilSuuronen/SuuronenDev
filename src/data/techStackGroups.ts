export type TechStackIconKey =
  | "cloud"
  | "code"
  | "cpu"
  | "database"
  | "docker"
  | "electron"
  | "express"
  | "fastapi"
  | "gcp"
  | "go"
  | "grafana"
  | "iam"
  | "javascript"
  | "kotlin"
  | "ktor"
  | "kubernetes"
  | "linux"
  | "mongodb"
  | "mysql"
  | "network"
  | "nextjs"
  | "node"
  | "numpy"
  | "opencv"
  | "opentelemetry"
  | "pandas"
  | "python"
  | "pytorch"
  | "reactrouter"
  | "sentry"
  | "server"
  | "springboot"
  | "storage"
  | "terraform"
  | "typescript"
  | "uvicorn"
  | "vertex";

export type TechStackSkill = {
  icon: TechStackIconKey;
  label: string;
};

export type TechStackSkillSection = {
  items: TechStackSkill[];
  title: string;
};

export type TechStackFeature = {
  accent: string;
  description: string;
  details: string[];
  icon: TechStackIconKey;
  label: string;
  surface: string;
};

export type TechStackGroup = {
  accent: string;
  description: string;
  icon: TechStackIconKey;
  label: string;
  sections: TechStackSkillSection[];
  surface: string;
};

export const techStackFeatured: TechStackFeature[] = [
  {
    label: "Python",
    icon: "python",
    accent: "#f09a34",
    surface: "rgba(240, 154, 52, 0.12)",
    description: "Backend APIs, data-heavy workflows, and AI or CV experiments without changing lanes.",
    details: ["FastAPI + Uvicorn", "NumPy / Pandas", "PyTorch + OpenCV"],
  },
  {
    label: "Go",
    icon: "go",
    accent: "#2fa0d8",
    surface: "rgba(47, 160, 216, 0.12)",
    description: "A reliable choice for large backend systems, infra-oriented services, and clean deployment paths.",
    details: ["Echo services", "Infrastructure-heavy backends", "Performance-minded systems"],
  },
  {
    label: "Kotlin",
    icon: "kotlin",
    accent: "#bb7bff",
    surface: "rgba(187, 123, 255, 0.12)",
    description: "Comfortable on both backend and mobile sides when the system wants strong structure and longevity.",
    details: ["Ktor", "Spring Boot", "Backend + mobile development"],
  },
];

export const techStackGroups: TechStackGroup[] = [
  {
    label: "Backend Systems",
    icon: "code",
    accent: "#f08c2d",
    surface: "rgba(240, 140, 45, 0.11)",
    description: "Core languages and frameworks I reach for when building production backend systems.",
    sections: [
      {
        title: "Primary languages",
        items: [
          { label: "Python", icon: "python" },
          { label: "Go", icon: "go" },
          { label: "Kotlin", icon: "kotlin" },
        ],
      },
      {
        title: "Service frameworks",
        items: [
          { label: "FastAPI", icon: "fastapi" },
          { label: "Uvicorn", icon: "uvicorn" },
          { label: "Echo", icon: "server" },
          { label: "Ktor", icon: "ktor" },
          { label: "Spring Boot", icon: "springboot" },
        ],
      },
    ],
  },
  {
    label: "AI + Data Toolkit",
    icon: "pytorch",
    accent: "#cf7a2b",
    surface: "rgba(207, 122, 43, 0.11)",
    description: "Libraries I use around computer vision, tensor work, analysis, and Python-side experimentation.",
    sections: [
      {
        title: "Scientific and ML stack",
        items: [
          { label: "NumPy", icon: "numpy" },
          { label: "OpenCV", icon: "opencv" },
          { label: "PyTorch", icon: "pytorch" },
          { label: "Pandas", icon: "pandas" },
        ],
      },
    ],
  },
  {
    label: "Google Cloud",
    icon: "gcp",
    accent: "#4c8ff6",
    surface: "rgba(76, 143, 246, 0.1)",
    description: "Practical Google Cloud experience across deployment, access control, storage, networking, and compute.",
    sections: [
      {
        title: "Platform services",
        items: [
          { label: "Google Cloud", icon: "gcp" },
          { label: "Cloud Run", icon: "cloud" },
          { label: "IAM", icon: "iam" },
          { label: "Cloud Storage", icon: "storage" },
        ],
      },
      {
        title: "Compute + AI surfaces",
        items: [
          { label: "Networking", icon: "network" },
          { label: "Vertex AI", icon: "vertex" },
          { label: "Compute Engine", icon: "cpu" },
        ],
      },
    ],
  },
  {
    label: "Fullstack + App Platforms",
    icon: "typescript",
    accent: "#ff8b5d",
    surface: "rgba(255, 139, 93, 0.1)",
    description: "When the backend needs a polished product layer, these are the tools I tend to bring with it.",
    sections: [
      {
        title: "Web foundations",
        items: [
          { label: "JavaScript", icon: "javascript" },
          { label: "TypeScript", icon: "typescript" },
          { label: "Node.js", icon: "node" },
          { label: "Express", icon: "express" },
        ],
      },
      {
        title: "Routing, frameworks, desktop",
        items: [
          { label: "React Router", icon: "reactrouter" },
          { label: "Next.js", icon: "nextjs" },
          { label: "Electron", icon: "electron" },
        ],
      },
    ],
  },
  {
    label: "Databases",
    icon: "database",
    accent: "#4c9d8f",
    surface: "rgba(76, 157, 143, 0.11)",
    description: "Relational and document stores that have shown up in both app-facing and infrastructure-facing work.",
    sections: [
      {
        title: "Data stores",
        items: [
          { label: "MySQL", icon: "mysql" },
          { label: "MongoDB", icon: "mongodb" },
          { label: "Microsoft SQL Server", icon: "database" },
        ],
      },
    ],
  },
  {
    label: "Ops + Observability",
    icon: "docker",
    accent: "#8c7d66",
    surface: "rgba(140, 125, 102, 0.12)",
    description: "The operational layer I’m comfortable with around local environments, deployments, telemetry, and reliability.",
    sections: [
      {
        title: "Platform tooling",
        items: [
          { label: "Linux", icon: "linux" },
          { label: "Docker", icon: "docker" },
          { label: "Kubernetes", icon: "kubernetes" },
          { label: "Terraform", icon: "terraform" },
        ],
      },
      {
        title: "Monitoring and incident context",
        items: [
          { label: "Grafana", icon: "grafana" },
          { label: "OpenTelemetry", icon: "opentelemetry" },
          { label: "Sentry", icon: "sentry" },
        ],
      },
    ],
  },
];
