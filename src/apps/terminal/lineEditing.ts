import type { TerminalLine } from "../../types/desktop";

export function trimScrollback(lines: TerminalLine[]) {
  let size = 0;
  let start = lines.length;
  while (start > 0 && lines.length - start < 500) {
    const next = lines[start - 1].value.length;
    if (size + next > 250000 && start < lines.length) break;
    size += next;
    start--;
  }
  return lines.slice(start);
}

export type LineEdit = { value: string; cursor: number; killed?: string };
export function editLine(
  value: string,
  start: number,
  end: number,
  key: string,
  killBuffer: string,
): LineEdit | null {
  const replace = (
    from: number,
    to: number,
    text = "",
    killed?: string,
  ): LineEdit => ({
    value: value.slice(0, from) + text + value.slice(to),
    cursor: from + text.length,
    killed,
  });
  const previous =
    start > 1 && /[\uDC00-\uDFFF]/.test(value[start - 1])
      ? start - 2
      : Math.max(0, start - 1);
  const next =
    start < value.length && /[\uD800-\uDBFF]/.test(value[start])
      ? start + 2
      : Math.min(value.length, start + 1);
  if (key === "a") return { value, cursor: 0 };
  if (key === "e") return { value, cursor: value.length };
  if (key === "b") return { value, cursor: previous };
  if (key === "f") return { value, cursor: next };
  if (key === "h") return replace(start === end ? previous : start, end);
  if (key === "d") return replace(start, start === end ? next : end);
  if (key === "u") return replace(0, start, "", value.slice(0, start));
  if (key === "k") return replace(start, value.length, "", value.slice(start));
  if (key === "w") {
    const from = value.slice(0, start).replace(/\S+\s*$/, "").length;
    return replace(from, start, "", value.slice(from, start));
  }
  if (key === "y") return replace(start, end, killBuffer);
  if (key === "alt-b")
    return {
      value,
      cursor: value.slice(0, start).replace(/\w+\W*$/, "").length,
    };
  if (key === "alt-f")
    return {
      value,
      cursor:
        start +
        (value.slice(start).match(/^\W*\w+/)?.[0].length ??
          value.length - start),
    };
  return null;
}

export function searchHistory(
  history: string[],
  query: string,
  before = history.length,
) {
  for (let index = before - 1; index >= 0; index--)
    if (history[index].includes(query)) return { index, value: history[index] };
  return { index: -1, value: "" };
}
