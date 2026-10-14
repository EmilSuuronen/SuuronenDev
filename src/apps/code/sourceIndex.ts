export type SourceFiles = Record<string, string>;
export type SourceLocation = { path: string; line: number };

export const IMPORT_PATH_PATTERN = /(?<=(?:from|import)\s+)(["'])(?:\.{1,2}\/|@\/)[^"']+\1/g;

export function resolveImport(fromPath: string, specifier: string, files: SourceFiles) {
  let base: string;

  if (specifier.startsWith("@/")) {
    base = `src/${specifier.slice(2)}`;
  } else if (specifier.startsWith(".")) {
    const parts = fromPath.split("/").slice(0, -1);

    for (const segment of specifier.split("/")) {
      if (segment === "..") {
        parts.pop();
      } else if (segment !== ".") {
        parts.push(segment);
      }
    }

    base = parts.join("/");
  } else {
    return null;
  }

  base = base.split("?")[0];

  return ["", ".ts", ".tsx", ".css", "/index.ts", "/index.tsx"]
    .map((suffix) => base + suffix)
    .find((candidate) => candidate in files) ?? null;
}

// Finds the JSX line that renders a class, so a clicked DOM element can be traced back to its component.
export function findClassSource(className: string, files: SourceFiles): SourceLocation | null {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const token = new RegExp(`(^|[^\\w-])${escaped}($|[^\\w-])`);

  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith(".tsx")) {
      continue;
    }

    const lineIndex = content.split("\n").findIndex((line) => line.includes("className") && token.test(line));

    if (lineIndex >= 0) {
      return { path, line: lineIndex + 1 };
    }
  }

  return null;
}

export function fuzzyScore(query: string, path: string) {
  const needle = query.trim().toLowerCase();
  const haystack = path.toLowerCase();

  if (!needle) {
    return 0;
  }

  let matched = 0;
  let lastIndex = -2;
  let score = 0;

  for (let index = 0; index < haystack.length && matched < needle.length; index += 1) {
    if (haystack[index] === needle[matched]) {
      score += index === lastIndex + 1 ? 2 : 1;
      lastIndex = index;
      matched += 1;
    }
  }

  if (matched < needle.length) {
    return -1;
  }

  const baseName = haystack.slice(haystack.lastIndexOf("/") + 1);

  return score + (baseName.includes(needle) ? 10 : 0) - haystack.length * 0.01;
}

export function getLanguageLabel(path: string) {
  const extension = path.slice(path.lastIndexOf(".") + 1);
  const labels: Record<string, string> = {
    css: "CSS",
    html: "HTML",
    json: "JSON",
    md: "Markdown",
    ts: "TypeScript",
    tsx: "TypeScript JSX",
  };

  return labels[extension] ?? "Plain text";
}
