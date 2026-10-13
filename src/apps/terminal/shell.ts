import type { TerminalLine } from "../../types/desktop";
import { builtins } from "./builtins";
import { easterEggs } from "./easterEggs";
import { fileCommands } from "./fileCommands";
import { HOME, VirtualFileSystem, resolvePath, type SavedFile } from "./filesystem";
import { helpText } from "./manual";
import { expandWord, globPattern, parse, type Command, type Word } from "./parser";
import { textCommands } from "./textCommands";
import { fail, ok, type CommandHandler, type CommandResult, type ShellContext, type ShellEffect } from "./types";

export const HISTORY_LIMIT = 500;
export const STORAGE_KEY = "suuronen.desktop.terminal.v1";
export const commands: Record<string, CommandHandler> = Object.assign(Object.create(null), fileCommands, textCommands, builtins, easterEggs);
export type ShellSnapshot = { version: 1; files: SavedFile[]; history: string[] };
export type ExecutionOptions = {
  signal?: AbortSignal;
  onOutput?: (lines: TerminalLine[]) => void;
  onEffect?: (effect: ShellEffect) => void | number | Promise<void | number>;
};
export type ExecutionResult = { lines: TerminalLine[]; code: number; effects: ShellEffect[] };

export class Shell {
  context: ShellContext;
  private running = false;

  constructor(snapshot?: ShellSnapshot) {
    this.context = {
      fs: new VirtualFileSystem(snapshot?.files), cwd: HOME,
      env: Object.assign(Object.create(null), { HOME, USER: "emil", LOGNAME: "emil", HOSTNAME: "desktop", PWD: HOME, SHELL: "/bin/bash", TERM: "xterm-256color", LANG: "en_US.UTF-8", PATH: "/usr/local/bin:/usr/bin:/bin" }),
      aliases: new Map([["ll", "ls -al"], ["la", "ls -a"], ["l", "ls"]]),
      history: snapshot?.history?.filter((entry) => typeof entry === "string" && entry.length <= 8192).slice(-HISTORY_LIMIT) ?? [],
      status: 0, started: Date.now(), compact: false,
      adventure: { room: "desk", inventory: [], won: false }, notes: [], apps: ["terminal"],
    };
  }

  snapshot(): ShellSnapshot { return { version: 1, files: this.context.fs.snapshot(), history: this.context.history }; }

  expandHistory(input: string): string {
    let single = false; let double = false; let result = "";
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === "\\" && !single) { result += char + (input[++i] ?? ""); continue; }
      if (char === "'" && !double) single = !single;
      if (char === '"' && !single) double = !double;
      const match = !single && char === "!" ? input.slice(i).match(/^!(?:!|\d+|[A-Za-z_][\w-]*)/) : null;
      if (!match) { result += char; continue; }
      const query = match[0].slice(1);
      const history = this.context.history;
      const recalled = query === "!" ? history[history.length - 1] : /^\d+$/.test(query) ? history[Number(query) - 1] : [...history].reverse().find((line) => line.startsWith(query));
      if (recalled === undefined) throw new Error(`${match[0]}: event not found`);
      result += recalled;
      i += match[0].length - 1;
    }
    return result;
  }

  private expand(word: Word, context: ShellContext): string[] {
    return expandWord(word, context.env, context.status).flatMap(({ value, glob }) => {
      if (!glob) return [value];
      const absolute = resolvePath(glob, context.cwd);
      const pattern = globPattern(absolute);
      const segments = absolute.split("/");
      const matches = context.fs.entries().map(([path]) => path).filter((path) => pattern.test(path) && path.split("/").every((segment, index) => !segment.startsWith(".") || segments[index]?.startsWith("."))).sort();
      return matches.length ? matches.map((path) => {
        if (value.startsWith("/")) return path;
        const cwdParts = context.cwd.split("/").filter(Boolean);
        const pathParts = path.split("/").filter(Boolean);
        while (cwdParts[0] && cwdParts[0] === pathParts[0]) { cwdParts.shift(); pathParts.shift(); }
        return (value.startsWith("./") ? "./" : "") + [...cwdParts.map(() => ".."), ...pathParts].join("/");
      }) : [value.replace(/\u0001/g, "*").replace(/\u0002/g, "?")];
    });
  }

  private expandAlias(command: Command, context: ShellContext): Command {
    const seen = new Set<string>();
    let current = command;
    while (current.words.length) {
      const first = current.words[0];
      if (first.parts.some((part) => part.quote !== "none")) break;
      const name = first.parts.map((part) => part.text).join("");
      const alias = context.aliases.get(name);
      if (alias === undefined || seen.has(name)) break;
      seen.add(name);
      if (seen.size > 20) throw new Error("alias expansion limit exceeded");
      const parsed = parse(alias);
      if (parsed.length !== 1 || parsed[0].commands.length !== 1) throw new Error("aliases must contain a single command in this shell");
      const expanded = parsed[0].commands[0];
      current = { words: [...expanded.words, ...current.words.slice(1)], redirects: [...expanded.redirects, ...current.redirects] };
    }
    return current;
  }

  private async runCommand(command: Command, stdin: string, context: ShellContext): Promise<CommandResult> {
    const args = command.words.flatMap((word) => this.expand(word, context));
    const assignments: string[] = [];
    while (/^[A-Za-z_][A-Za-z_0-9]*=/.test(args[0] ?? "")) assignments.push(args.shift()!);
    if (assignments.length && !args.length) return await builtins.export(assignments, "", context);
    if (assignments.length) {
      context = { ...context, env: Object.assign(Object.create(null), context.env) };
      await builtins.export(assignments, "", context);
    }
    const name = args.shift();
    if (!name) return ok();
    if (args.length === 1 && args[0] === "--help" && commands[name]) return ok(helpText(name) ?? `${name}: no help available\n`);
    if (name === "type" || name === "which") {
      if (!args.length) return fail(`${name}: expected a command name`);
      let status = 0;
      const text = args.map((arg) => {
        if (context.aliases.has(arg) && name === "type") return `${arg} is aliased to '${context.aliases.get(arg)}'\n`;
        if (commands[arg] || ["type", "which"].includes(arg)) return name === "which" ? `/usr/bin/${arg}\n` : `${arg} is a browser shell command\n`;
        status = 1; return name === "type" ? `bash: type: ${arg}: not found\n` : "";
      }).join("");
      return { ...ok(text), code: status };
    }
    const executable = name.startsWith("/usr/bin/") || name.startsWith("/bin/") ? name.slice(name.lastIndexOf("/") + 1) : name;
    const handler = commands[executable];
    if (!handler) return fail(`bash: ${name}: command not found${name === "vim" || name === "vi" ? ". Try nano FILE." : ""}`, 127);
    try { return await handler(args, stdin, context); }
    catch (error) {
      if ((error as Error).name === "AbortError") throw error;
      return fail(`${executable}: ${(error as Error).message}`, ["grep", "test", "["].includes(executable) ? 2 : 1);
    }
  }

  async execute(input: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    if (this.running) return { lines: [{ kind: "error", value: "bash: a command is already running", literal: true }], code: 1, effects: [] };
    this.running = true;
    const output: TerminalLine[] = [];
    const effects: ShellEffect[] = [];
    let printed = 0;
    const emit = (lines: TerminalLine[]) => {
      const bounded = lines.flatMap((line) => {
        if (printed >= 100000) return [];
        const value = line.value.slice(0, 100000 - printed);
        printed += value.length;
        return [{ ...line, value: value + (value.length < line.value.length ? "\n[display truncated; redirect output to a file]" : "") }];
      });
      output.push(...bounded);
      if (bounded.length) options.onOutput?.(bounded);
    };
    const emitText = (kind: "output" | "error", text: string) => { if (text) emit([{ kind, value: text.replace(/\n$/, ""), literal: true }]); };
    this.context.signal = options.signal;
    try {
      const resolved = this.expandHistory(input);
      if (resolved !== input) emitText("output", resolved);
      if (resolved.trim() && !/^\s/.test(input) && this.context.history[this.context.history.length - 1] !== resolved) {
        this.context.history.push(resolved);
        this.context.history = this.context.history.slice(-HISTORY_LIMIT);
      }
      const pipelines = parse(resolved);
      for (const pipeline of pipelines) {
        options.signal?.throwIfAborted();
        if (pipeline.condition === "&&" && this.context.status !== 0 || pipeline.condition === "||" && this.context.status === 0) continue;
        let stdin = "";
        let stderr = "";
        let rich: TerminalLine[] | undefined;
        const pendingEffects: ShellEffect[] = [];
        for (const [index, original] of pipeline.commands.entries()) {
          options.signal?.throwIfAborted();
          const context = pipeline.commands.length === 1 ? this.context : { ...this.context, env: Object.assign(Object.create(null), this.context.env), aliases: new Map(this.context.aliases), history: [...this.context.history], adventure: { ...this.context.adventure, inventory: [...this.context.adventure.inventory] } };
          const command = this.expandAlias(original, context);
          type Sink = { path?: string; text: string };
          const stdoutSink: Sink = { text: "" };
          const stderrSink: Sink = { text: "" };
          let out = stdoutSink; let err = stderrSink;
          let result: CommandResult;
          try {
            for (const redirect of command.redirects) {
              if (redirect.operator === "2>&1") { err = out; continue; }
              const targets = this.expand(redirect.target!, context);
              if (targets.length !== 1) throw new Error("ambiguous redirect");
              const path = resolvePath(targets[0], context.cwd);
              if (redirect.operator === "<") stdin = context.fs.read(path);
              else {
                context.fs.write(path, "", redirect.operator.endsWith(">>"));
                const sink: Sink = { path, text: "" };
                if (redirect.operator.startsWith("2")) err = sink; else out = sink;
              }
            }
            result = await this.runCommand({ ...command, redirects: [] }, stdin, context);
            if (result.stdout.length > 1024 * 1024) result = fail("bash: pipeline output exceeds 1 MiB limit");
          } catch (error) {
            if ((error as Error).name === "AbortError") throw error;
            result = fail(`bash: ${(error as Error).message}`);
          }
          out.text += result.stdout;
          err.text += result.stderr;
          try {
            for (const sink of new Set([out, err])) if (sink.path) context.fs.write(sink.path, sink.text, true);
          } catch (error) { stderrSink.text += `bash: ${(error as Error).message}\n`; result.code = 1; }
          stdin = stdoutSink.text;
          stderr += stderrSink.text;
          this.context.status = result.code;
          if (index === pipeline.commands.length - 1 && !out.path) rich = result.rich;
          for (const effect of result.effects ?? []) {
            if (effect.type === "pager" && (out.path || index < pipeline.commands.length - 1)) {
              if (out.path) context.fs.write(out.path, effect.content, true); else stdin += effect.content;
            } else if (effect.type === "editor" && (pipeline.commands.length > 1 || command.redirects.length)) {
              stderr += "nano: interactive editing cannot be piped or redirected\n";
              this.context.status = 1;
            } else pendingEffects.push(effect);
          }
        }
        for (const effect of pendingEffects.filter((effect) => effect.type === "clear")) { effects.push(effect); await options.onEffect?.(effect); }
        emitText("error", stderr);
        if (rich) emit(rich); else emitText("output", stdin);
        for (const effect of pendingEffects.filter((effect) => effect.type !== "clear")) {
          effects.push(effect);
          const status = await options.onEffect?.(effect);
          if (typeof status === "number") this.context.status = status;
          options.signal?.throwIfAborted();
          if (effect.type === "exit") return { lines: output, code: this.context.status, effects };
        }
      }
    } catch (error) {
      const aborted = (error as Error).name === "AbortError";
      this.context.status = aborted ? 130 : 2;
      emitText(aborted ? "output" : "error", aborted ? "^C" : `bash: ${(error as Error).message}`);
    } finally {
      this.running = false;
      this.context.signal = undefined;
    }
    return { lines: output, code: this.context.status, effects };
  }
}

export function loadShell(storage?: Pick<Storage, "getItem">): Shell {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw || raw.length > 3 * 1024 * 1024) return new Shell();
    const snapshot = JSON.parse(raw) as ShellSnapshot;
    if (snapshot.version !== 1 || !Array.isArray(snapshot.history)) return new Shell();
    return new Shell(snapshot);
  } catch { return new Shell(); }
}

export function saveShell(shell: Shell, storage: Pick<Storage, "setItem">): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(shell.snapshot())); return true; }
  catch { return false; }
}
