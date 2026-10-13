import assert from "node:assert/strict";
import { after, afterEach, test } from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "https://suuronen.dev" });
for (const name of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "Node",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
  "ResizeObserver",
]) {
  Object.defineProperty(globalThis, name, {
    value: name === "window" ? browser : browser[name as keyof Window],
    configurable: true,
    writable: true,
  });
}
Object.assign(globalThis, {
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: browser.requestAnimationFrame.bind(browser),
  cancelAnimationFrame: browser.cancelAnimationFrame.bind(browser),
});
const { createElement: h, act, StrictMode } = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: TerminalApp } = await import("../../src/apps/TerminalApp");
const { LocaleProvider } = await import("../../src/i18n/locale");
const { STORAGE_KEY } = await import("../../src/apps/terminal/shell");
let width = 800;
let height = 500;
Object.defineProperty(browser.HTMLElement.prototype, "clientWidth", {
  get() {
    return width;
  },
});
Object.defineProperty(browser.HTMLElement.prototype, "clientHeight", {
  get() {
    return height;
  },
});
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot> | null = null;

async function mount(props: Record<string, unknown> = {}, preserve = false) {
  if (!preserve) browser.localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      h(StrictMode, null, h(LocaleProvider, null, h(TerminalApp, props))),
    );
  });
}
afterEach(async () => {
  if (root)
    await act(async () => {
      root!.unmount();
    });
  root = null;
  container?.remove();
  width = 800;
  height = 500;
});
after(async () => {
  await browser.happyDOM.close();
});
const input = () => container.querySelector("input")!;
const output = () => container.querySelector('[role="log"]')?.textContent ?? "";
async function change(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  await act(async () => {
    const prototype =
      element.tagName === "TEXTAREA"
        ? browser.HTMLTextAreaElement.prototype
        : browser.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(
      element,
      value,
    );
    element.dispatchEvent(new browser.Event("input", { bubbles: true }));
  });
}
async function key(
  name: string,
  modifiers: Record<string, boolean> = {},
  element: Element = input(),
) {
  await act(async () => {
    element.dispatchEvent(
      new browser.KeyboardEvent("keydown", {
        key: name,
        bubbles: true,
        cancelable: true,
        ...modifiers,
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}
async function run(command: string) {
  await change(input(), command);
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(
        new browser.Event("submit", { bubbles: true, cancelable: true }),
      );
  });
}

test("startup uses the incumbent classes, banner and prompt structure", async () => {
  await mount();
  assert.ok(
    container.querySelector(
      ".terminal-app > .terminal-screen > .terminal-history",
    ),
  );
  assert.equal(container.querySelectorAll(".terminal-history p").length, 3);
  assert.equal(
    container.querySelector(".terminal-prompt-prefix")?.textContent,
    "emil@desktop:~$",
  );
  assert.equal(input().className, "terminal-input");
  assert.equal(input().getAttribute("aria-label"), "Terminal command");
  assert.equal(document.activeElement, input());
});

test("UI executes commands, updates prompts and preserves old prompt directories", async () => {
  await mount();
  await run("mkdir work; cd work");
  assert.equal(
    container.querySelector("form .terminal-prompt-path")?.textContent,
    "~/work",
  );
  assert.equal(
    container.querySelector(".terminal-history .terminal-prompt-path")
      ?.textContent,
    "~",
  );
  await run("echo 'Case Preserved' > hello.txt; cat hello.txt");
  assert.match(output(), /Case Preserved/);
  await run("echo '<img src=x onerror=alert(1)>'");
  assert.equal(container.querySelector("img"), null);
});

test("history navigation restores drafts, completion and readline shortcuts work", async () => {
  await mount();
  await run("echo first");
  await run("echo second");
  await change(input(), "unfinished draft");
  await key("ArrowUp");
  assert.equal(input().value, "echo second");
  await key("ArrowUp");
  assert.equal(input().value, "echo first");
  await key("ArrowDown");
  await key("ArrowDown");
  assert.equal(input().value, "unfinished draft");
  await change(input(), "cat abo");
  await key("Tab");
  assert.equal(input().value, "cat about.txt ");
  input().setSelectionRange(4, 4);
  await key("k", { ctrlKey: true });
  assert.equal(input().value, "cat ");
  await key("y", { ctrlKey: true });
  assert.equal(input().value, "cat about.txt ");
  await key("l", { ctrlKey: true });
  assert.equal(output(), "");
  assert.equal(input().value, "cat about.txt ");
});

test("reverse search cycles matching commands and cancel restores the draft", async () => {
  await mount();
  await run("echo first");
  await run("pwd");
  await run("echo second");
  await change(input(), "draft");
  await key("r", { ctrlKey: true });
  assert.equal(input().getAttribute("aria-label"), "Search command history");
  await change(input(), "echo");
  assert.match(
    container.querySelector('[role="status"]')!.textContent!,
    /second/,
  );
  await key("r", { ctrlKey: true });
  assert.match(
    container.querySelector('[role="status"]')!.textContent!,
    /first/,
  );
  await key("Escape");
  assert.equal(input().value, "draft");
  await key("r", { ctrlKey: true });
  await change(input(), "first");
  await key("Enter");
  assert.equal(input().value, "");
  assert.match(output(), /first$/);
});

test("Ctrl+C cancels input, interrupts sleep and returns an editable prompt", async () => {
  await mount();
  await change(input(), "do not run");
  await key("c", { ctrlKey: true });
  assert.equal(input().value, "");
  assert.match(output(), /do not run\^C/);
  await run("sleep 60; echo should-not-run");
  assert.equal(input().readOnly, true);
  await key("c", { ctrlKey: true });
  assert.equal(input().readOnly, false);
  assert.match(output(), /\^C$/);
  await run("echo $?");
  assert.match(output(), /130$/);
});

test("nano saves, prompts before discarding, and resumes a following command", async () => {
  await mount();
  await run("nano message.txt; cat message.txt");
  let editor = container.querySelector("textarea")!;
  assert.equal(document.activeElement, editor);
  await change(editor, "hello from nano\n");
  await key("o", { ctrlKey: true }, editor);
  assert.match(
    container.querySelector('[role="status"]')!.textContent!,
    /Wrote/,
  );
  await change(editor, "unsaved edit");
  await key("x", { ctrlKey: true }, editor);
  assert.match(
    container.querySelector('[role="status"]')!.textContent!,
    /Save modified buffer/,
  );
  await key("c", {}, editor);
  assert.ok(container.querySelector("textarea"));
  await key("x", { ctrlKey: true }, editor);
  await key("n", {}, editor);
  assert.equal(container.querySelector("textarea"), null);
  assert.match(output(), /hello from nano/);
  assert.equal(document.activeElement, input());
});

test("pager navigation, quitting and clear work at mobile dimensions", async () => {
  width = 360;
  height = 300;
  await mount();
  await run("seq 50 | less");
  const pager = container.querySelector('[aria-label="Terminal pager"]')!;
  assert.equal(document.activeElement, pager);
  assert.match(pager.textContent!, /1\n2\n3/);
  await key("G", {}, pager);
  assert.match(pager.textContent!, /50/);
  await act(async () => {
    [...container.querySelectorAll("button")]
      .find((button) => button.textContent === "Quit (q)")!
      .click();
  });
  assert.ok(input());
  await run("clear");
  assert.equal(output(), "");
  assert.equal(container.querySelectorAll(".terminal-prompt-prefix").length, 1);
});

test("desktop commands call the app bridge and persisted files survive remount", async () => {
  const opened: string[] = [];
  let exited = false;
  await mount({
    onOpen: (target: string) => opened.push(target),
    onExit: () => {
      exited = true;
    },
  });
  await run("open calculator");
  assert.deepEqual(opened, ["calculator"]);
  await run("echo persistent > saved.txt");
  assert.ok(browser.localStorage.getItem(STORAGE_KEY));
  await act(async () => {
    root!.unmount();
  });
  root = null;
  container.remove();
  await mount(
    {
      onExit: () => {
        exited = true;
      },
    },
    true,
  );
  await run("cat saved.txt");
  assert.match(output(), /persistent$/);
  await key("d", { ctrlKey: true });
  assert.equal(exited, true);
});

test("closing an active terminal cancels its pending command", async () => {
  await mount();
  await run("sleep 60; touch should-not-exist");
  await act(async () => {
    root!.unmount();
  });
  root = null;
  const snapshot = JSON.parse(browser.localStorage.getItem(STORAGE_KEY)!);
  assert.equal(
    snapshot.files.some(([path]: [string]) =>
      path.endsWith("should-not-exist"),
    ),
    false,
  );
});

test("multiline paste remains editable and requires explicit submission", async () => {
  await mount();
  await act(async () => {
    const event = new browser.Event("paste", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "clipboardData", {
      value: { getData: () => "echo one\necho two\n" },
    });
    input().dispatchEvent(event);
  });
  assert.equal(input().value, "echo one ; echo two ;");
  assert.equal(output().includes("one"), false);
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(
        new browser.Event("submit", { bubbles: true, cancelable: true }),
      );
  });
  assert.match(output(), /onetwo$/);
});
