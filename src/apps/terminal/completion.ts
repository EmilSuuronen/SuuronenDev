import { APP_NAMES } from "./builtins";
import { baseName, resolvePath } from "./filesystem";
import { commands } from "./shell";
import type { ShellContext } from "./types";

export type Completion = {
  value: string;
  cursor: number;
  candidates: string[];
};
export function complete(
  input: string,
  cursor: number,
  context: ShellContext,
): Completion {
  const before = input.slice(0, cursor);
  let start = 0;
  let word = "";
  let quote = "";
  let escaped = false;
  let words: string[] = [];
  let operator = "";
  for (let i = 0; i < before.length; i++) {
    const char = before[i];
    if (escaped) {
      word += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = "";
      else word += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (word) words.push(word);
      word = "";
      start = i + 1;
      continue;
    }
    if (/[;|&<>]/.test(char)) {
      if (word) words.push(word);
      if (/[;|&]/.test(char)) words = [];
      operator = /[<>]/.test(char) ? char : "";
      word = "";
      start = i + 1;
      continue;
    }
    word += char;
  }
  const first = words.length === 0 && !operator;
  const directoriesOnly = words[0] === "cd";
  let candidates: string[] = [];
  if (word.startsWith("$") && !word.includes("/"))
    candidates = Object.keys(context.env)
      .filter((key) => key.startsWith(word.slice(1)))
      .map((key) => `$${key}`);
  else {
    if (first && !word.includes("/"))
      candidates.push(
        ...Object.keys(commands),
        "type",
        "which",
        ...context.aliases.keys(),
      );
    if (
      ["open", "xdg-open"].includes(words[0]) &&
      words.length === 1 &&
      !operator
    )
      candidates.push(...APP_NAMES);
    if (!first || word.includes("/")) {
      const slash = word.lastIndexOf("/");
      const prefix = slash === -1 ? "" : word.slice(0, slash + 1);
      const partial = word.slice(slash + 1);
      const directory = resolvePath(prefix || ".", context.cwd);
      if (context.fs.get(directory)?.type === "directory") {
        candidates.push(
          ...context.fs
            .children(directory)
            .filter(
              ([path, node]) =>
                (!directoriesOnly || node.type === "directory") &&
                (!baseName(path).startsWith(".") || partial.startsWith(".")),
            )
            .map(
              ([path, node]) =>
                `${prefix}${baseName(path)}${node.type === "directory" ? "/" : ""}`,
            ),
        );
      }
    }
    candidates = [...new Set(candidates)]
      .filter((candidate) => candidate.startsWith(word))
      .sort();
  }
  if (!candidates.length) return { value: input, cursor, candidates };
  let common = candidates[0];
  while (!candidates.every((candidate) => candidate.startsWith(common)))
    common = common.slice(0, -1);
  const unique = candidates.length === 1;
  const replacement = unique ? candidates[0] : common;
  if (!unique && replacement.length <= word.length)
    return { value: input, cursor, candidates };
  const initialQuote =
    input[start] === '"' || input[start] === "'" ? input[start] : "";
  const encoded =
    initialQuote === "'"
      ? `'${replacement.replace(/'/g, "'\\''")}${unique && !replacement.endsWith("/") ? "'" : ""}`
      : initialQuote === '"'
        ? `"${replacement.replace(/["\\$`]/g, "\\$&")}${unique && !replacement.endsWith("/") ? '"' : ""}`
        : replacement.replace(/[\s'"\\;&|<>()[\]`!]/g, "\\$&");
  let end = cursor;
  // Replace the remainder of this word too when completing in the middle of it.
  let trailingQuote = quote;
  while (end < input.length) {
    const char = input[end];
    if (trailingQuote) {
      end++;
      if (char === trailingQuote) trailingQuote = "";
      continue;
    }
    if (/[\s;|&<>]/.test(char)) break;
    end++;
  }
  const suffix =
    unique && !replacement.endsWith("/") && !input.slice(end).startsWith(" ")
      ? " "
      : "";
  return {
    value: input.slice(0, start) + encoded + suffix + input.slice(end),
    cursor: start + encoded.length + suffix.length,
    candidates,
  };
}

export function noteFiles(
  notes: { id: string; title: string; content: string }[],
) {
  const used = new Set<string>();
  return notes.map((note) => {
    const title = note.title.replace(/[/\\\x00-\x1f]/g, "_") || "untitled.txt";
    let name = title;
    let suffix = 2;
    while (used.has(name))
      name = `${title.replace(/\.txt$/, "")} (${suffix++}).txt`;
    used.add(name);
    return { id: note.id, name, content: note.content };
  });
}
