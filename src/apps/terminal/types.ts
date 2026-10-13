import type { TerminalLine } from "../../types/desktop";
import type { VirtualFileSystem } from "./filesystem";

export type ShellEffect =
  | { type: "clear" | "exit" }
  | { type: "open"; target: string }
  | { type: "editor"; path: string; content: string }
  | { type: "pager"; content: string };
export type CommandResult = { stdout: string; stderr: string; code: number; effects?: ShellEffect[]; rich?: TerminalLine[] };
export type DesktopNote = { name: string; content: string; id: string };
export type ShellContext = {
  fs: VirtualFileSystem;
  cwd: string;
  env: Record<string, string>;
  aliases: Map<string, string>;
  history: string[];
  status: number;
  started: number;
  adventure: { room: string; inventory: string[]; won: boolean };
  notes: DesktopNote[];
  apps: string[];
  compact: boolean;
  signal?: AbortSignal;
};
export const ok = (stdout = "", effects?: ShellEffect[]): CommandResult => ({ stdout, stderr: "", code: 0, effects });
export const fail = (message: string, code = 1): CommandResult => ({ stdout: "", stderr: `${message}\n`, code });
export type CommandHandler = (args: string[], stdin: string, context: ShellContext) => CommandResult | Promise<CommandResult>;

/** Small explicit option parser: unsupported flags are errors, never silently ignored. */
export function options(args: string[], allowed: string, long: Record<string, string> = {}) {
  const flags = new Set<string>();
  const operands: string[] = [];
  let ended = false;
  for (const arg of args) {
    if (arg === "--" && !ended) { ended = true; continue; }
    if (!ended && arg.startsWith("--")) {
      const value = long[arg.slice(2)];
      if (value === undefined) throw new Error(`unrecognized option '${arg}'`);
      for (const flag of value) flags.add(flag);
    } else if (!ended && /^-./.test(arg)) {
      for (const flag of arg.slice(1)) {
        if (!allowed.includes(flag)) throw new Error(`invalid option -- '${flag}'`);
        flags.add(flag);
      }
    } else operands.push(arg);
  }
  return { flags, operands };
}
