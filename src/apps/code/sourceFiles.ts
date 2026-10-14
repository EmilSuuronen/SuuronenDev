import type { SourceFiles } from "./sourceIndex";

// Bundled at build time, so the viewer always shows exactly the deployed source.
const rawFiles = import.meta.glob<string>(
  ["/src/**/*.{ts,tsx,css}", "/index.html", "/package.json", "/vite.config.ts", "/README.md", "/tsconfig*.json"],
  { eager: true, import: "default", query: "?raw" },
);

export const sourceFiles: SourceFiles = Object.fromEntries(
  Object.entries(rawFiles).map(([path, content]) => [path.slice(1), content]),
);

export const sourcePaths = Object.keys(sourceFiles).sort();
