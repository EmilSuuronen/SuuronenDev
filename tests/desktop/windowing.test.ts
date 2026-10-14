import assert from "node:assert/strict";
import test from "node:test";
import { getPaletteItems, rankPaletteItems } from "../../src/components/desktop/paletteItems";
import { desktopThemes } from "../../src/data/themes";
import { desktopFilterOptions } from "../../src/data/desktopFilters";
import { getSnapRect, getSnapZone } from "../../src/utils/windowMath";

const bounds = { width: 1200, height: 800 };
const minSize = { width: 300, height: 200 };

test("dragging to an edge picks a half, a corner picks a quarter, the top maximizes", () => {
  assert.equal(getSnapZone(600, 400, bounds), null);
  assert.equal(getSnapZone(0, 400, bounds), "left");
  assert.equal(getSnapZone(1199, 400, bounds), "right");
  assert.equal(getSnapZone(600, -20, bounds), "top");
  assert.equal(getSnapZone(2, 10, bounds), "top-left");
  assert.equal(getSnapZone(1199, 795, bounds), "bottom-right");
});

test("snap rectangles tile the workspace and respect minimum sizes", () => {
  assert.deepEqual(getSnapRect("left", bounds, minSize), { position: { x: 0, y: 0 }, size: { width: 600, height: 800 } });
  assert.deepEqual(getSnapRect("right", bounds, minSize), { position: { x: 600, y: 0 }, size: { width: 600, height: 800 } });
  assert.deepEqual(getSnapRect("bottom-right", bounds, minSize), { position: { x: 600, y: 400 }, size: { width: 600, height: 400 } });
  assert.deepEqual(getSnapRect("top", bounds, minSize), { position: { x: 0, y: 0 }, size: bounds });
  // A window that can't be narrower than 700px still fits and hugs its edge.
  assert.deepEqual(getSnapRect("right", bounds, { width: 700, height: 200 }).position, { x: 500, y: 0 });
});

test("the command palette finds apps, notes, themes and commands, and runs the right action", () => {
  const calls: string[] = [];
  const record = (name: string) => (value?: unknown) => calls.push(value === undefined ? name : `${name}:${String(value)}`);
  const items = getPaletteItems({
    actions: {
      createFolder: record("folder"),
      createNote: record("note"),
      openEntry: record("open"),
      reboot: record("reboot"),
      runCommand: record("run"),
      selectFilter: record("filter"),
      selectTheme: record("theme"),
      setLocale: record("locale"),
      textMode: record("text"),
      viewSource: record("source"),
    },
    entries: [
      { id: "terminal", icon: "terminal", kind: "app", label: "Terminal", parentId: null, position: { x: 0, y: 0 }, windowId: "terminal" },
      { id: "note:a", icon: "textfile", kind: "file", label: "groceries.txt", parentId: null, position: { x: 0, y: 0 } },
      { id: "note:b", icon: "textfile", kind: "file", label: "old.txt", parentId: "trash", position: { x: 0, y: 0 } },
    ],
    filterOptions: desktopFilterOptions,
    languageLabel: (locale) => ({ en: "English", fi: "Suomi", pirate: "Pirate", alien: "Alien" })[locale],
    t: (input) => input,
    themeName: (id) => id,
    themeOptions: desktopThemes,
  });

  const first = (query: string) => rankPaletteItems(items, query)[0];
  assert.equal(first("term").label, "Terminal");
  assert.equal(first("grocer").label, "groceries.txt");
  assert.equal(rankPaletteItems(items, "old.txt").some((item) => item.id === "entry:note:b"), false, "trashed notes are hidden");
  assert.equal(first("cowsay").label, "fortune | cowsay");
  assert.equal(first("suomi").label, "Suomi");
  assert.equal(rankPaletteItems(items, "").length, items.length);

  first("cowsay").run();
  first("midnight").run();
  first("grocer").run();
  first("suomi").run();
  assert.deepEqual(calls, ["run:fortune | cowsay", "theme:midnight-copper", "open:note:a", "locale:fi"]);
});
