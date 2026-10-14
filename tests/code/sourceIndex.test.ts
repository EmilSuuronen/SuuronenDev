import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import { parseExportedLiteral } from "../../src/apps/code/literalParser";
import { findClassSource, fuzzyScore, IMPORT_PATH_PATTERN, resolveImport } from "../../src/apps/code/sourceIndex";

const files: Record<string, string> = {};
const walk = (directory: string) =>
  readdirSync(directory).forEach((name) => {
    const path = `${directory}/${name}`;
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(tsx?|css)$/.test(name)) files[path] = readFileSync(path, "utf8");
  });
walk("src");

test("imports resolve to bundled source files, relative and through the @ alias", () => {
  assert.equal(resolveImport("src/App.tsx", "./apps/BrowserApp", files), "src/apps/BrowserApp.tsx");
  assert.equal(resolveImport("src/apps/code/CodeApp.tsx", "../../hooks/useElementSize", files), "src/hooks/useElementSize.ts");
  assert.equal(resolveImport("src/apps/code/CodeApp.tsx", "@/hooks/useLiveData", files), "src/hooks/useLiveData.ts");
  assert.equal(resolveImport("src/App.tsx", "react", files), null);
  assert.equal(resolveImport("src/components/desktop/AppGlyph.tsx", "../../res/icon-192.png", files), null);
});

test("inspect maps rendered class names back to the component that renders them", () => {
  for (const [className, file] of [
    ["taskbar-clock", "Taskbar.tsx"],
    ["window-titlebar", "DesktopWindow.tsx"],
    ["notes-app", "NotesApp.tsx"],
    ["app-glyph", "AppGlyph.tsx"],
  ]) {
    assert.ok(findClassSource(className, files)?.path.endsWith(file), className);
  }
});

test("quick open ranks file-name matches and rejects non-matches", () => {
  assert.equal(fuzzyScore("zzz", "src/App.tsx"), -1);
  assert.ok(fuzzyScore("app", "src/App.tsx") > fuzzyScore("app", "src/apps/antgame/engine/x.ts"));
});

test("only local import paths become links", () => {
  const source = `import X from "./a/b";  import "./styles.css"; import React from 'react'`;
  assert.deepEqual([...source.matchAll(IMPORT_PATH_PATTERN)].map((match) => match[0]), ['"./a/b"', '"./styles.css"']);
});

test("live data files parse as plain data without evaluating code", () => {
  const themes = readFileSync("src/data/themes.ts", "utf8");
  const parsed = parseExportedLiteral(themes, "desktopThemes");
  assert.ok(parsed.ok);
  assert.equal((parsed.value as { accent: string }[])[0].accent, "#f08c2d");
  assert.ok(parseExportedLiteral(readFileSync("src/data/browserSections.ts", "utf8"), "browserSections").ok);
  assert.deepEqual(
    parseExportedLiteral("export const x = { a: 'it\\'s \"q\"', /* c */ b: [1, -2.5e3, true, null,], // x\n }", "x"),
    { ok: true, value: { a: `it's "q"`, b: [1, -2500, true, null] } },
  );
});

test("broken live edits report the line instead of applying", () => {
  const themes = readFileSync("src/data/themes.ts", "utf8");
  const accentLine = themes.split("\n").findIndex((line) => line.includes('accent: "#f08c2d"')) + 1;
  const missingComma = parseExportedLiteral(themes.replace('accent: "#f08c2d",', 'accent: "#f08c2d"'), "desktopThemes");
  assert.equal(missingComma.ok, false);
  assert.equal(!missingComma.ok && missingComma.line, accentLine + 1);
  assert.match(String(!parseExportedLiteral(themes.replace('"#ff8f45"', "someVar"), "desktopThemes").ok), /true/);
  const unclosed = parseExportedLiteral("export const x = [1, 2", "x");
  assert.deepEqual(unclosed, { error: 'Unclosed "["', line: 1, ok: false });
});
