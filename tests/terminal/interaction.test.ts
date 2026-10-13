import assert from "node:assert/strict";
import test from "node:test";
import { complete, noteFiles } from "../../src/apps/terminal/completion";
import {
  editLine,
  searchHistory,
  trimScrollback,
} from "../../src/apps/terminal/lineEditing";
import { flattenPaste } from "../../src/apps/terminal/parser";
import { Shell } from "../../src/apps/terminal/shell";

test("completion handles commands, aliases, paths, quoting and pipelines", () => {
  const context = new Shell().context;
  const run = (value: string, cursor = value.length) =>
    complete(value, cursor, context);
  assert.equal(run("whoa").value, "whoami ");
  assert.equal(run("cat abo").value, "cat about.txt ");
  assert.equal(run("cd Doc").value, "cd Documents/");
  assert.equal(run("cd about").candidates.length, 0);
  assert.equal(run("echo hi | gre").value, "echo hi | grep ");
  assert.equal(run("open calc").value, "open calculator ");
  assert.equal(run("echo hi > Doc").value, "echo hi > Documents/");
  assert.equal(run("cat about.txt", 6).value, "cat about.txt ");
  assert.equal(run("cat .ba").value, "cat .bashrc ");
  assert.equal(run("cat ~/abo").value, "cat ~/about.txt ");
  assert.equal(run("echo $US").value, "echo $USER ");
  context.fs.write("/home/emil/space file.txt", "");
  assert.equal(run("cat spa").value, "cat space\\ file.txt ");
  assert.equal(run('cat "spa').value, 'cat "space file.txt" ');
  assert.equal(run("cat 'spa").value, "cat 'space file.txt' ");
  assert.ok(run("c").candidates.includes("cat"));
});

test("readline edits respect caret positions, selections and Unicode", () => {
  assert.deepEqual(editLine("echo hello", 5, 5, "k", ""), {
    value: "echo ",
    cursor: 5,
    killed: "hello",
  });
  assert.deepEqual(editLine("echo hello", 5, 5, "u", ""), {
    value: "hello",
    cursor: 0,
    killed: "echo ",
  });
  assert.deepEqual(editLine("echo hello", 10, 10, "w", ""), {
    value: "echo ",
    cursor: 5,
    killed: "hello",
  });
  assert.deepEqual(editLine("echo ", 5, 5, "y", "hello"), {
    value: "echo hello",
    cursor: 10,
    killed: undefined,
  });
  assert.equal(editLine("a🌍b", 3, 3, "h", "")?.value, "ab");
  assert.equal(editLine("abcdef", 1, 4, "d", "")?.value, "aef");
  assert.equal(editLine("echo world", 0, 0, "alt-f", "")?.cursor, 4);
});

test("history search traverses older matches and duplicate note titles stay addressable", () => {
  const history = ["echo first", "pwd", "echo last"];
  assert.deepEqual(searchHistory(history, "echo"), {
    index: 2,
    value: "echo last",
  });
  assert.deepEqual(searchHistory(history, "echo", 2), {
    index: 0,
    value: "echo first",
  });
  assert.equal(searchHistory(history, "missing").index, -1);
  assert.deepEqual(
    noteFiles([
      { id: "1", title: "hello.txt", content: "one" },
      { id: "2", title: "hello.txt", content: "two" },
    ]).map((note) => note.name),
    ["hello.txt", "hello (2).txt"],
  );
});

test("multiline paste preserves quote semantics, comments and continuation without executing", async () => {
  const examples = [
    "echo first\necho second\n",
    "echo first # comment\necho second",
    "printf '%s\\n' 'line1\nline2' \"$USER\"",
    'echo "hello\n$USER"',
    "printf '%s\\n' hello |\n tr a-z A-Z",
    "echo 'literal !event'\necho after",
    'echo "a\'quote"\necho next',
  ];
  for (const value of examples) {
    const original = await new Shell().execute(value);
    const pasted = flattenPaste(value);
    assert.equal(pasted.includes("\n"), false);
    const normalized = await new Shell().execute(pasted);
    assert.deepEqual(normalized.lines, original.lines, value);
    assert.equal(normalized.code, original.code);
  }
  assert.throws(() => flattenPaste("echo 'incomplete\n"), /unclosed/);
});

test("scrollback bounds both entry count and total output size", () => {
  const small = Array.from({ length: 700 }, () => ({
    kind: "output" as const,
    value: "hello",
  }));
  assert.equal(trimScrollback(small).length, 500);
  const large = Array.from({ length: 10 }, () => ({
    kind: "output" as const,
    value: "x".repeat(100000),
  }));
  assert.equal(trimScrollback(large).length, 2);
});
