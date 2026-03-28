import { getInitialTerminalLines } from "./terminalLines";
import type {
  TerminalCommandContext,
  TerminalCommandDefinition,
  TerminalCommandResult,
  TerminalLine,
} from "../types/desktop";

function output(lines: TerminalLine[]): TerminalCommandResult {
  return {
    type: "output",
    lines,
  };
}

export const terminalCommands: TerminalCommandDefinition[] = [
  {
    input: "contact",
    description: "show contact links",
    run: () =>
      output([
        { kind: "output", value: "contact information:" },
        {
          kind: "link",
          label: "email",
          value: "emilsuuronen@gmail.com",
          href: "mailto:emilsuuronen@gmail.com",
        },
        {
          kind: "link",
          label: "linkedin",
          value: "https://www.linkedin.com/in/emil-suuronen/",
          href: "https://www.linkedin.com/in/emil-suuronen/",
        },
        {
          kind: "link",
          label: "github",
          value: "https://github.com/EmilSuuronen",
          href: "https://github.com/EmilSuuronen",
        },
      ]),
  },
  {
    input: "whoami",
    description: "print current user",
    run: () => output([{ kind: "output", value: "emil" }]),
  },
  {
    input: "pwd",
    description: "print working directory",
    run: () => output([{ kind: "output", value: "/home/emil" }]),
  },
  {
    input: "ls",
    description: "list desktop files",
    run: () =>
      output([
        { kind: "output", value: "about.txt  stack.txt  contact.txt  applications/  browser/" },
      ]),
  },
  {
    input: "tree",
    description: "show tiny workspace tree",
    run: () =>
      output([
        { kind: "output", value: "." },
        { kind: "output", value: "|-- about.txt" },
        { kind: "output", value: "|-- stack.txt" },
        { kind: "output", value: "|-- contact.txt" },
        { kind: "output", value: "|-- browser/" },
        { kind: "output", value: "`-- applications/" },
        { kind: "output", value: "    `-- molkkis" },
      ]),
  },
  {
    input: "uname -a",
    description: "print faux system information",
    run: () =>
      output([
        {
          kind: "output",
          value: "Linux suuronen.dev 6.1.0-web #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux",
        },
      ]),
  },
  {
    input: "date",
    description: "print current date and time",
    run: ({ now }: TerminalCommandContext) =>
      output([
        {
          kind: "output",
          value: now.toLocaleString(),
        },
      ]),
  },
  {
    input: "logo",
    description: "show startup banner again",
    run: ({ useCompactArt }: TerminalCommandContext) => output(getInitialTerminalLines(useCompactArt)),
  },
  {
    input: "cat about.txt",
    description: "read short profile note",
    run: () =>
      output([
        {
          kind: "output",
          value: "Backend engineer by trade, terminal goblin by aesthetic, builder of systems that should behave under pressure.",
        },
      ]),
  },
  {
    input: "cat stack.txt",
    description: "read stack summary",
    run: () =>
      output([
        {
          kind: "output",
          value: "Python, Go, Kotlin, cloud-heavy backend work, a bit of AI curiosity, and enough frontend sense to make the interface worth opening.",
        },
      ]),
  },
  {
    input: "cat contact.txt",
    description: "read quick contact note",
    run: () =>
      output([
        {
          kind: "output",
          value: "If you want the actual links, run contact.",
        },
      ]),
  },
  {
    input: "clear",
    description: "clear terminal output",
    run: () => ({ type: "clear" }),
  },
];

export function getHelpTerminalLines(translate: (input: string) => string): TerminalLine[] {
  return [
    { kind: "output", value: translate("available commands:") },
    { kind: "output", value: `help  -  ${translate("list available commands")}` },
    ...terminalCommands.map((command) => ({
      kind: "output" as const,
      value: `${command.input}  -  ${translate(command.description)}`,
    })),
  ];
}

export function runTerminalCommand(
  input: string,
  context: TerminalCommandContext,
) {
  return terminalCommands.find((command) => command.input === input)?.run(context) ?? null;
}
