import type { TerminalCommandDefinition, TerminalLine } from "../types/desktop";

export const terminalCommands: TerminalCommandDefinition[] = [
  {
    input: "contact",
    description: "show contact links",
    output: [
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
    ],
  },
];

export function getHelpTerminalLines(): TerminalLine[] {
  return [
    { kind: "output", value: "available commands:" },
    { kind: "output", value: "help  -  list available commands" },
    ...terminalCommands.map((command) => ({
      kind: "output" as const,
      value: `${command.input}  -  ${command.description}`,
    })),
  ];
}

export function findTerminalCommand(input: string) {
  return terminalCommands.find((command) => command.input === input);
}
