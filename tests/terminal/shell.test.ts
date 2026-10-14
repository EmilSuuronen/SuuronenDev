import assert from "node:assert/strict";
import test from "node:test";
import {
  Shell,
  loadShell,
  saveShell,
  STORAGE_KEY,
} from "../../src/apps/terminal/shell";
import {
  HOME,
  MAX_FILE_SIZE,
  resolvePath,
  VirtualFileSystem,
} from "../../src/apps/terminal/filesystem";

const text = async (shell: Shell, input: string) =>
  (await shell.execute(input)).lines.map((line) => line.value).join("\n");

test("working directories, normalization and cd - change the real prompt state", async () => {
  const shell = new Shell();
  assert.equal(
    await text(
      shell,
      "mkdir -p 'projects/My App/src'; cd 'projects/My App/src'; pwd",
    ),
    `${HOME}/projects/My App/src`,
  );
  assert.equal(await text(shell, "cd ../.. && pwd"), `${HOME}/projects`);
  assert.equal(await text(shell, "cd -"), `${HOME}/projects/My App/src`);
  assert.equal(await text(shell, "cd; pwd"), HOME);
  assert.equal(resolvePath("../../../../etc", HOME), "/etc");
});

test("quotes, escapes, case and variable expansion", async () => {
  const shell = new Shell();
  assert.equal(
    await text(shell, String.raw`echo "Hello $USER" '$USER' Space\ Here`),
    "Hello emil $USER Space Here",
  );
  assert.equal(
    await text(
      shell,
      "export GREETING='Hei maailma'; printf '<%s>\\n' \"$GREETING\" ''",
    ),
    "<Hei maailma>\n<>",
  );
  assert.equal(
    await text(shell, "printf '<%s>\\n' $GREETING"),
    "<Hei>\n<maailma>",
  );
  assert.equal(
    await text(shell, "echo ~ ~/Documents; echo '~' \"~\""),
    `${HOME} ${HOME}/Documents\n~ ~`,
  );
  assert.match(await text(shell, "WHOAMI"), /command not found/);
  assert.equal(shell.context.status, 127);
});

test("conditional lists and exit codes evaluate expansions at execution time", async () => {
  const shell = new Shell();
  assert.equal(
    await text(shell, "false && echo no || echo yes; echo $?"),
    "yes\n0",
  );
  assert.equal(
    await text(shell, "unknown_command; echo $?"),
    "bash: unknown_command: command not found\n127",
  );
  assert.equal(await text(shell, "true || echo no && echo yes"), "yes");
  assert.equal(
    await text(shell, "export X=before; echo $X; export X=after; echo $X"),
    "before\nafter",
  );
});

test("pipes transform data and redirects create, append and read files", async () => {
  const shell = new Shell();
  await shell.execute(
    "printf '%s\\n' beta alpha beta | sort | uniq -c > counts.txt",
  );
  assert.equal(
    await text(shell, "cat counts.txt"),
    "      1 alpha\n      2 beta",
  );
  await shell.execute("echo gamma >> counts.txt");
  assert.equal(await text(shell, "cat < counts.txt | tail -n 1"), "gamma");
  assert.equal(await text(shell, "cat counts.txt | wc -l"), "      3");
  assert.equal(
    await text(shell, "cat absent 2> errors.txt; cat errors.txt"),
    `cat: ${HOME}/absent: No such file or directory`,
  );
  assert.match(
    await text(shell, "cat absent 2>&1 | tr 'a-z' 'A-Z'"),
    /NO SUCH FILE/,
  );
  assert.equal(await text(shell, "cat absent > /dev/null 2>&1"), "");
});

test("redirection happens before execution and descriptor order is preserved", async () => {
  const shell = new Shell();
  await shell.execute("echo before > file; cat file > file");
  assert.equal(shell.context.fs.read(`${HOME}/file`), "");
  assert.match(await text(shell, "cat absent 2>&1 > out"), /No such file/);
  assert.equal(shell.context.fs.read(`${HOME}/out`), "");
  await shell.execute("echo hi > first > second");
  assert.equal(shell.context.fs.read(`${HOME}/first`), "");
  assert.equal(shell.context.fs.read(`${HOME}/second`), "hi\n");
});

test("pipeline builtins are isolated, files remain shared", async () => {
  const shell = new Shell();
  await shell.execute("cd /tmp | cat");
  assert.equal(shell.context.cwd, HOME);
  await shell.execute("export X=hidden | cat");
  assert.equal(shell.context.env.X, undefined);
  await shell.execute("echo file | cat > shared.txt");
  assert.equal(shell.context.fs.read(`${HOME}/shared.txt`), "file\n");
});

test("globs respect dotfiles and quoted literals", async () => {
  const shell = new Shell();
  await shell.execute(
    "mkdir work; cd work; touch b.txt a.txt .hidden.txt file.md",
  );
  assert.equal(await text(shell, "echo *.txt"), "a.txt b.txt");
  assert.equal(await text(shell, "echo '*.txt' \\*.txt"), "*.txt *.txt");
  assert.equal(await text(shell, "echo .*"), ".hidden.txt");
  assert.equal(await text(shell, "echo missing*"), "missing*");
  assert.match(await text(shell, "echo hi > *.txt"), /ambiguous redirect/);
});

test("filesystem mutations and errors follow real file state", async () => {
  const shell = new Shell();
  await shell.execute(
    "mkdir demo; echo hello > demo/file; cp -r demo copy; mv copy/file copy/renamed",
  );
  assert.equal(await text(shell, "cat copy/renamed"), "hello");
  assert.match(await text(shell, "rmdir copy"), /Directory not empty/);
  assert.match(await text(shell, "rm copy"), /Is a directory/);
  await shell.execute("rm -r copy; rm -f missing");
  assert.equal(shell.context.fs.get(`${HOME}/copy`), undefined);
  assert.match(
    await text(shell, "echo nope > /etc/passwd"),
    /Permission denied/,
  );
  assert.match(await text(shell, "rm -rf /"), /Permission denied/);
  assert.match(await text(shell, "cat demo"), /Is a directory/);
  assert.match(await text(shell, "cd demo/file"), /Not a directory/);
  assert.match(await text(shell, "cp -r demo demo/nested"), /into itself/);
});

test("syntax errors are caught before any command mutates state", async () => {
  for (const input of [
    "touch fail; echo 'unclosed",
    "touch fail; echo hi |",
    "touch fail &&",
    "touch fail; echo >",
    "touch fail; echo $(whoami)",
    "touch fail & echo hi",
  ]) {
    const shell = new Shell();
    assert.equal((await shell.execute(input)).code, 2, input);
    assert.equal(shell.context.fs.get(`${HOME}/fail`), undefined, input);
  }
});

test("comments, blank commands, semicolons and pasted newlines", async () => {
  const shell = new Shell();
  assert.equal(
    await text(shell, "echo first # comment\necho second;"),
    "first\nsecond",
  );
  assert.equal(await text(shell, "# comment only"), "");
  assert.equal(await text(shell, "echo '#not a comment'"), "#not a comment");
});

test("aliases expand once and can be removed", async () => {
  const shell = new Shell();
  await shell.execute("alias greet='echo Hello'");
  assert.equal(await text(shell, "greet World"), "Hello World");
  assert.match(await text(shell, "type greet"), /aliased/);
  await shell.execute("alias echo='echo prefix'");
  assert.equal(await text(shell, "echo once"), "prefix once");
  await shell.execute("unalias greet");
  assert.equal((await shell.execute("greet")).code, 127);
});

test("history expansion, privacy and clearing", async () => {
  const shell = new Shell();
  await shell.execute("echo first");
  assert.equal(await text(shell, "!!"), "echo first\nfirst");
  await shell.execute("echo second");
  assert.equal(await text(shell, "!1"), "echo first\nfirst");
  assert.equal(await text(shell, "!echo"), "echo first\nfirst");
  assert.equal(await text(shell, "echo '!999'"), "!999");
  assert.match(await text(shell, "!999"), /event not found/);
  await shell.execute(" echo private");
  assert.equal(shell.context.history.includes(" echo private"), false);
  await shell.execute("history -c");
  assert.deepEqual(shell.context.history, []);
});

test("grep basic patterns, literal matching, statuses and worst-case repeats", async () => {
  const shell = new Shell();
  assert.equal(
    await text(shell, "printf 'Python\\ngo\\nPYTHON\\n' | grep -in '^python$'"),
    "1:Python\n3:PYTHON",
  );
  assert.equal(await text(shell, "printf 'a.b\\naXb\\n' | grep -F a.b"), "a.b");
  assert.equal(
    await text(shell, "printf 'aaaab\\nc\\n' | grep '^a*b$'"),
    "aaaab",
  );
  assert.equal(
    await text(shell, "printf 'red\\nblue\\n' | grep -v red"),
    "blue",
  );
  assert.equal((await shell.execute("echo text | grep absent")).code, 1);
  shell.context.fs.write(`${HOME}/long`, "a".repeat(10000));
  assert.equal((await shell.execute("grep 'a*a*a*a*a*a*a*a*b' long")).code, 1);
});

test("text tools, Unicode and numeric sequences", async () => {
  const shell = new Shell();
  assert.equal(
    await text(shell, "printf 'Hei 🌍' | base64 | base64 -d"),
    "Hei 🌍",
  );
  assert.equal(await text(shell, "echo 'abc 🌍' | rev"), "🌍 cba");
  assert.equal(await text(shell, "seq 3 -1 1 | sort -n | head -n 2"), "1\n2");
  assert.equal(
    await text(shell, "printf 'a:b:c\\nd:e:f\\n' | cut -d: -f1,3"),
    "a:c\nd:f",
  );
  assert.equal(await text(shell, "echo hellooo | tr -s o"), "hello");
  assert.equal(await text(shell, "printf '🌍' | wc -cm"), "      4       1");
  assert.equal(await text(shell, "printf 'no-newline' | head -n 0"), "");
  assert.equal((await shell.execute("seq 100000000")).code, 1);
});

test("test expressions and command lookup", async () => {
  const shell = new Shell();
  assert.equal(await text(shell, "[ -f about.txt ] && echo yes"), "yes");
  assert.equal(await text(shell, "test 3 -gt 2 && echo yes"), "yes");
  assert.equal((await shell.execute("[ bad")).code, 2);
  assert.equal(await text(shell, "which cat"), "/usr/bin/cat");
  assert.equal(await text(shell, "/usr/bin/whoami"), "emil");
  assert.equal((await shell.execute("constructor")).code, 127);
});

test("snapshots preserve files and history but tmp and environment start fresh", async () => {
  const shell = new Shell();
  await shell.execute(
    "mkdir persisted; echo saved > persisted/file; echo transient > /tmp/file; export CUSTOM=yes",
  );
  const storage = new Map<string, string>();
  assert.equal(
    saveShell(shell, {
      setItem: (key, value) => {
        storage.set(key, value);
      },
    }),
    true,
  );
  const loaded = loadShell({ getItem: (key) => storage.get(key) ?? null });
  assert.equal(loaded.context.fs.read(`${HOME}/persisted/file`), "saved\n");
  assert.equal(loaded.context.fs.get("/tmp/file"), undefined);
  assert.equal(loaded.context.env.CUSTOM, undefined);
  assert.deepEqual(loaded.context.history, shell.context.history);
  assert.equal(
    saveShell(shell, {
      setItem: () => {
        throw new Error("quota");
      },
    }),
    false,
  );
  storage.set(STORAGE_KEY, "not JSON");
  assert.equal(
    loadShell({ getItem: (key) => storage.get(key)! }).context.cwd,
    HOME,
  );
});

test("corrupt or unsafe snapshots recover without touching system files", () => {
  for (const files of [
    ["bad"],
    [["/etc/passwd", { type: "file", content: "oops", modified: 1 }]],
    [
      [
        `${HOME}/missing/child`,
        { type: "file", content: "orphan", modified: 1 },
      ],
    ],
  ]) {
    const shell = loadShell({
      getItem: () => JSON.stringify({ version: 1, files, history: [] }),
    });
    assert.match(shell.context.fs.read("/etc/passwd"), /emil:x:1000/);
    assert.ok(shell.context.fs.get(`${HOME}/about.txt`));
  }
});

test("file quotas and failed copies never remove the source", () => {
  const fs = new VirtualFileSystem();
  assert.throws(
    () => fs.write(`${HOME}/large`, "x".repeat(MAX_FILE_SIZE + 1)),
    /File too large/,
  );
  fs.write(`${HOME}/original`, "safe");
  assert.throws(
    () => fs.copy(`${HOME}/original`, "/etc/overwrite", false, true),
    /Permission denied/,
  );
  assert.equal(fs.read(`${HOME}/original`), "safe");
  assert.throws(
    () => fs.write(`${HOME}/large-unicode`, "🌍".repeat(MAX_FILE_SIZE / 2)),
    /File too large/,
  );
});

test("environment growth, empty paths and nonempty move targets report errors", async () => {
  const shell = new Shell();
  shell.context.env.BIG = "x".repeat(128 * 1024);
  assert.match(await text(shell, "export BIG=$BIG$BIG"), /too large/);
  assert.match(await text(shell, "cat ''"), /No such file/);
  assert.match(await text(shell, "cd ''"), /No such file/);
  await shell.execute("mkdir -p from to/from; touch from/one to/from/two");
  assert.match(await text(shell, "mv from to"), /Directory not empty/);
  assert.ok(shell.context.fs.get(`${HOME}/from/one`));
  assert.ok(shell.context.fs.get(`${HOME}/to/from/two`));
});

test("literal wildcard fragments and adversarial globs stay correct and bounded", async () => {
  const shell = new Shell();
  await shell.execute("mkdir glob; cd glob; touch 'star*.txt' start.txt");
  assert.equal(await text(shell, "echo 'star*'.*"), "star*.txt");
  shell.context.fs.write(`${HOME}/glob/${"a".repeat(200)}`, "");
  const pattern = "*a".repeat(80) + "b";
  assert.equal(await text(shell, `echo ${pattern}`), pattern);
});

test("prototype names are treated as user input, not inherited commands", async () => {
  const shell = new Shell();
  assert.match(await text(shell, "help constructor"), /no help/);
  assert.match(await text(shell, "man __proto__"), /No manual entry/);
  assert.match(await text(shell, "ls --constructor"), /unrecognized option/);
  assert.equal((await shell.execute("test 1 constructor 2")).code, 2);
  await shell.execute("adventure constructor");
  assert.match(await text(shell, "adventure look"), /THE DESK/);
});

test("desktop notes mount read-only and open through the actual note id", async () => {
  const shell = new Shell();
  shell.context.notes = [
    { name: "my note.txt", content: "desktop content", id: "note:123" },
  ];
  shell.context.fs.mountNotes(shell.context.notes);
  assert.equal(await text(shell, "cat 'Notes/my note.txt'"), "desktop content");
  assert.match(
    await text(shell, "echo overwritten > 'Notes/my note.txt'"),
    /Permission denied/,
  );
  assert.deepEqual((await shell.execute("open 'Notes/my note.txt'")).effects, [
    { type: "open", target: "note:123" },
  ]);
  assert.deepEqual((await shell.execute("open calculator")).effects, [
    { type: "open", target: "calculator" },
  ]);
});

test("sleep can be interrupted and conditional commands do not run afterward", async () => {
  const shell = new Shell();
  const controller = new AbortController();
  const running = shell.execute("sleep 60; touch never", {
    signal: controller.signal,
  });
  controller.abort();
  assert.equal((await running).code, 130);
  assert.equal(shell.context.fs.get(`${HOME}/never`), undefined);
  assert.equal(await text(shell, "echo recovered"), "recovered");
});

test("pager and editor effects are awaitable and preserve command order", async () => {
  const shell = new Shell();
  const events: string[] = [];
  await shell.execute("nano hello; cat hello", {
    onEffect: async (effect) => {
      events.push(effect.type);
      if (effect.type === "editor")
        shell.context.fs.write(effect.path, "edited");
    },
    onOutput: (output) => {
      events.push(output.map((line) => line.value).join(""));
    },
  });
  assert.deepEqual(events, ["editor", "edited"]);
  assert.equal(
    await text(shell, "man pwd | cat"),
    "PWD(1)              SUURONEN DESKTOP\n\npwd [-LP]\nPrint the current working directory. This filesystem has no symbolic links.",
  );
});

test("easter eggs and the adventure have a discoverable complete path", async () => {
  const shell = new Shell();
  assert.match(
    await text(shell, "cat .secrets/signal.txt | base64 -d"),
    /ants/,
  );
  assert.match(await text(shell, "fortune | cowsay"), /\^__\^/);
  assert.match(await text(shell, "apt moo"), /mooed/);
  await shell.execute(
    "adventure take mug; adventure east; adventure use mug; adventure west; adventure north",
  );
  assert.match(await text(shell, "adventure use coffee"), /QUEST COMPLETE/);
  assert.equal(shell.context.adventure.won, true);
  assert.deepEqual((await shell.execute("ants")).effects, [
    { type: "open", target: "antgame" },
  ]);
});

test("reboot asks the desktop to replay the boot sequence", async () => {
  const shell = new Shell();
  assert.deepEqual((await shell.execute("reboot")).effects, [{ type: "open", target: "reboot" }]);
  assert.match(await text(shell, "reboot now"), /usage: reboot/);
});
