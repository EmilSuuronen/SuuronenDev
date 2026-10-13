import { contactLinks } from "../../data/contactLinks";
import { getInitialTerminalLines } from "../../data/terminalLines";
import { HOME, isWritablePath, resolvePath } from "./filesystem";
import { helpText, manuals } from "./manual";
import { fail, ok, options, type CommandHandler, type ShellContext } from "./types";

export const APP_NAMES = ["browser", "calculator", "settings", "notes", "terminal", "antgame", "molkkis", "applications", "trash"];
const variableName = /^[A-Za-z_][A-Za-z_0-9]*$/;
const readonlyVariables = new Set(["HOME", "USER", "LOGNAME", "PWD", "OLDPWD", "SHELL", "HOSTNAME"]);
const uptime = (context: ShellContext) => {
  const seconds = Math.floor((Date.now() - context.started) / 1000);
  return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds / 60) % 60}m ${seconds % 60}s`;
};
export const builtins: Record<string, CommandHandler> = {
  help: (args) => { const text = helpText(args[0]); return text === null ? fail(`help: no help for '${args[0]}'`) : ok(text); },
  man: (args) => {
    if (!args.length) return fail("What manual page do you want? Try 'man intro'.");
    if (!manuals[args[0]]) return fail(`No manual entry for ${args[0]}`);
    return ok("", [{ type: "pager", content: `${args[0].toUpperCase()}(1)              SUURONEN DESKTOP\n\n${manuals[args[0]]}\n` }]);
  },
  clear: () => ok("", [{ type: "clear" }]),
  reset: (_args, _stdin, context) => ({ ...ok("", [{ type: "clear" }]), rich: getInitialTerminalLines(context.compact) }),
  logo: (_args, _stdin, context) => {
    const rich = getInitialTerminalLines(context.compact);
    return { ...ok(rich.map((line) => line.value).join("\n") + "\n"), rich };
  },
  whoami: () => ok("emil\n"),
  id: (args) => { const { flags } = options(args, "un"); return ok(flags.has("u") ? flags.has("n") ? "emil\n" : "1000\n" : "uid=1000(emil) gid=1000(emil) groups=1000(emil)\n"); },
  hostname: () => ok("desktop\n"),
  uname: (args) => {
    const { flags, operands } = options(args, "asnrvm", { all: "a" });
    if (operands.length) throw new Error("extra operand");
    const values: Record<string, string> = { s: "Linux", n: "desktop", r: "6.8.0-browser", v: "#1 Suuronen Desktop (browser sandbox)", m: "web" };
    return ok(Object.entries(values).filter(([flag]) => flags.has("a") || flags.has(flag) || !flags.size && flag === "s").map(([, value]) => value).join(" ") + "\n");
  },
  date: (args) => {
    const now = new Date();
    if (!args.length) return ok(`${now.toString()}\n`);
    if (args.length !== 1) throw new Error("extra operand");
    if (["-I", "--iso-8601"].includes(args[0])) return ok(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}\n`);
    if (!args[0].startsWith("+")) throw new Error("usage: date [-I|+FORMAT]");
    const fields: Record<string, string> = { Y: String(now.getFullYear()), m: String(now.getMonth() + 1).padStart(2, "0"), d: String(now.getDate()).padStart(2, "0"), H: String(now.getHours()).padStart(2, "0"), M: String(now.getMinutes()).padStart(2, "0"), S: String(now.getSeconds()).padStart(2, "0"), s: String(Math.floor(now.getTime() / 1000)), "%": "%" };
    fields.F = `${fields.Y}-${fields.m}-${fields.d}`; fields.T = `${fields.H}:${fields.M}:${fields.S}`;
    return ok(args[0].slice(1).replace(/%(.)/g, (match, key: string) => fields[key] ?? match) + "\n");
  },
  uptime: (_args, _stdin, context) => ok(` ${new Date().toLocaleTimeString()} up ${uptime(context)}, 1 user (browser session)\n`),
  ps: (args, _stdin, context) => {
    if (args.some((arg) => !["-e", "-f", "-ef", "aux"].includes(arg))) throw new Error("supported options: -e, -ef, aux");
    return ok("  PID TTY      COMMAND\n    1 ?        desktop-session\n  100 pts/0    bash (browser shell)\n" + context.apps.map((name, i) => `${String(200 + i).padStart(5)} ?        ${name}\n`).join(""));
  },
  sleep: async (args, _stdin, context) => {
    if (args.length !== 1 || !/^\d+(?:\.\d+)?$/.test(args[0]) || Number(args[0]) > 3600) throw new Error("usage: sleep SECONDS (0–3600)");
    await new Promise<void>((resolve, reject) => {
      const signal = context.signal;
      if (signal?.aborted) { reject(new DOMException("Interrupted", "AbortError")); return; }
      const timer = setTimeout(() => { signal?.removeEventListener("abort", cancel); resolve(); }, Number(args[0]) * 1000);
      const cancel = () => { clearTimeout(timer); signal?.removeEventListener("abort", cancel); reject(new DOMException("Interrupted", "AbortError")); };
      signal?.addEventListener("abort", cancel, { once: true });
    });
    return ok();
  },
  env: (_args, _stdin, context) => ok(Object.entries(context.env).map(([name, value]) => `${name}=${value}`).join("\n") + "\n"),
  printenv: (args, _stdin, context) => args.length ? { ...ok(args.filter((arg) => Object.prototype.hasOwnProperty.call(context.env, arg)).map((arg) => `${context.env[arg]}\n`).join("")), code: args.some((arg) => !Object.prototype.hasOwnProperty.call(context.env, arg)) ? 1 : 0 } : builtins.env([], "", context),
  export: (args, _stdin, context) => {
    if (!args.length) return ok(Object.entries(context.env).map(([name, value]) => `declare -x ${name}=${JSON.stringify(value)}`).join("\n") + "\n");
    for (const arg of args) {
      const equal = arg.indexOf("=");
      const name = equal === -1 ? arg : arg.slice(0, equal);
      if (!variableName.test(name)) throw new Error(`'${name}': not a valid identifier`);
      if (readonlyVariables.has(name)) throw new Error(`${name}: readonly variable`);
      context.env[name] = equal === -1 ? context.env[name] ?? "" : arg.slice(equal + 1);
    }
    return ok();
  },
  unset: (args, _stdin, context) => {
    for (const name of args) {
      if (!variableName.test(name)) throw new Error(`'${name}': not a valid identifier`);
      if (readonlyVariables.has(name)) throw new Error(`${name}: readonly variable`);
      delete context.env[name];
    }
    return ok();
  },
  alias: (args, _stdin, context) => {
    if (!args.length) return ok([...context.aliases.entries()].map(([key, value]) => `alias ${key}='${value.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
    let output = "";
    for (const arg of args) {
      const equal = arg.indexOf("=");
      if (equal === -1) {
        if (!context.aliases.has(arg)) throw new Error(`${arg}: not found`);
        output += `alias ${arg}='${context.aliases.get(arg)}'\n`;
      } else {
        const name = arg.slice(0, equal);
        if (!/^[\w-]+$/.test(name)) throw new Error(`'${name}': invalid alias name`);
        if (context.aliases.size >= 100 && !context.aliases.has(name)) throw new Error("alias limit reached (100)");
        context.aliases.set(name, arg.slice(equal + 1));
      }
    }
    return ok(output);
  },
  unalias: (args, _stdin, context) => {
    if (!args.length) throw new Error("usage: unalias NAME...");
    for (const name of args) if (!context.aliases.delete(name)) throw new Error(`${name}: not found`);
    return ok();
  },
  history: (args, _stdin, context) => {
    if (args[0] === "-c" && args.length === 1) { context.history = []; return ok(); }
    if (args.length > 1 || args.length && !/^\d+$/.test(args[0])) throw new Error("usage: history [COUNT|-c]");
    const count = args.length ? Number(args[0]) : context.history.length;
    const start = Math.max(0, context.history.length - count);
    return ok(context.history.slice(start).map((line, i) => `${String(start + i + 1).padStart(5)}  ${line}`).join("\n") + (count ? "\n" : ""));
  },
  true: () => ok(),
  false: () => ({ ...ok(), code: 1 }),
  test: (args, _stdin, context) => {
    let negate = false;
    if (args[0] === "!") { negate = true; args.shift(); }
    let result = false;
    if (args.length === 1) result = Boolean(args[0]);
    else if (args.length === 2) {
      const [operator, value] = args;
      const node = context.fs.get(resolvePath(value, context.cwd));
      if (operator === "-e") result = Boolean(node);
      else if (operator === "-f") result = node?.type === "file";
      else if (operator === "-d") result = node?.type === "directory";
      else if (operator === "-n") result = Boolean(value);
      else if (operator === "-z") result = !value;
      else throw new Error(`${operator}: unary operator expected`);
    } else if (args.length === 3) {
      const [a, operator, b] = args;
      if (operator === "=" || operator === "==") result = a === b;
      else if (operator === "!=") result = a !== b;
      else {
        if (!/^-?\d+$/.test(a) || !/^-?\d+$/.test(b)) throw new Error("integer expression expected");
        const checks: Record<string, boolean> = { "-eq": Number(a) === Number(b), "-ne": Number(a) !== Number(b), "-lt": Number(a) < Number(b), "-le": Number(a) <= Number(b), "-gt": Number(a) > Number(b), "-ge": Number(a) >= Number(b) };
        if (!(operator in checks)) throw new Error(`${operator}: binary operator expected`);
        result = checks[operator];
      }
    } else if (args.length) throw new Error("too many arguments");
    return { ...ok(), code: result !== negate ? 0 : 1 };
  },
  "[": (args, stdin, context) => { if (args.pop() !== "]") throw new Error("missing ']'"); return builtins.test(args, stdin, context); },
  exit: (args) => {
    if (args.length > 1) throw new Error("too many arguments");
    if (args[0] && !/^\d+$/.test(args[0])) throw new Error("numeric argument required");
    return { ...ok("exit\n", [{ type: "exit" }]), code: Number(args[0] ?? 0) % 256 };
  },
  logout: (args, stdin, context) => builtins.exit(args, stdin, context),
  apps: () => ok("browser       Portfolio, tech stack, and contact\ncalculator    Quick math\nsettings      Themes and personalization\nnotes         Desktop text editor\nterminal      This shell\nantgame       Ant Exterminator\nmolkkis       Mölkkis (opens in a new tab)\napplications  Application folder\ntrash         Desktop trash\n\nLaunch with: open NAME\n"),
  open: (args, _stdin, context) => {
    if (args.length !== 1) throw new Error("usage: open APP|FILE|URL");
    const target = args[0];
    if (APP_NAMES.includes(target)) return ok("", [{ type: "open", target }]);
    if (/^https?:\/\//.test(target)) {
      const url = new URL(target);
      if (url.username || url.password) throw new Error("URLs containing credentials are not supported");
      return ok("", [{ type: "open", target: url.href }]);
    }
    const path = resolvePath(target, context.cwd);
    if (path === `${HOME}/applications`) return ok("", [{ type: "open", target: "applications" }]);
    if (path === `${HOME}/Notes`) return ok("", [{ type: "open", target: "notes" }]);
    const note = context.notes.find((item) => `${HOME}/Notes/${item.name}` === path);
    if (note) return ok("", [{ type: "open", target: note.id }]);
    const content = context.fs.read(path);
    const launcher = path.startsWith(`${HOME}/applications/`) && path.endsWith(".desktop") ? content.match(/^Exec=open ([\w-]+)$/m)?.[1] : null;
    if (launcher && APP_NAMES.includes(launcher)) return ok("", [{ type: "open", target: launcher }]);
    return ok("", [{ type: "pager", content }]);
  },
  "xdg-open": (args, stdin, context) => builtins.open(args, stdin, context),
  notes: (_args, _stdin, context) => ok(context.notes.length ? context.notes.map((note) => `${HOME}/Notes/${note.name}`).join("\n") + "\n" : "No desktop notes yet. Create one with: open notes\n"),
  contact: () => ({ ...ok(contactLinks.map((link) => `${link.label}: ${link.href}`).join("\n") + "\n"), rich: contactLinks.map((link) => ({ kind: "link", label: link.label, href: link.href, value: link.subtitle })) }),
  nano: (args, _stdin, context) => {
    if (args.length !== 1) throw new Error("usage: nano FILE");
    const path = resolvePath(args[0], context.cwd);
    if (!isWritablePath(path)) throw new Error(`${path}: Permission denied`);
    context.fs.requireDirectory(path.slice(0, path.lastIndexOf("/")) || "/");
    const content = context.fs.get(path) ? context.fs.read(path) : "";
    return ok("", [{ type: "editor", path, content }]);
  },
  less: (args, stdin, context) => {
    const { operands } = options(args, "");
    const content = operands.length ? operands.map((path) => context.fs.read(resolvePath(path, context.cwd))).join("\n") : stdin;
    return ok("", [{ type: "pager", content }]);
  },
  more: (args, stdin, context) => builtins.less(args, stdin, context),
  neofetch: (_args, _stdin, context) => ok(`         .--.          emil@desktop\n        |o_o |         ------------\n        |:_/ |         OS: Ubuntu-inspired browser desktop\n       //   \\ \\        Host: suuronen.dev\n      (|     | )       Shell: browser-bash 1.0\n     /'\\_   _/\u0060\\       Uptime: ${uptime(context)}\n     \\___)=(___/       Apps open: ${context.apps.length}\n                       Files: ${context.fs.entries().length}\n                       Stack: React + TypeScript + Vite\n                       Theme: terminal goblin\n`),
};
