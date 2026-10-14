import { resolvePath } from "./filesystem";
import { ok, options, type CommandHandler, type ShellContext } from "./types";

function readInputs(paths: string[], stdin: string, context: ShellContext) {
  return (paths.length ? paths : ["-"]).map((path) => ({
    path,
    text:
      path === "-" ? stdin : context.fs.read(resolvePath(path, context.cwd)),
  }));
}
const lines = (text: string) =>
  text ? text.replace(/\n$/, "").split("\n") : [];
const terminated = (items: string[]) =>
  items.length ? items.join("\n") + "\n" : "";
const escapes = (text: string) =>
  text.replace(
    /\\(n|t|r|\\|0[0-7]{1,3}|x[\da-fA-F]{2})/g,
    (_, value: string) =>
      ({ n: "\n", t: "\t", r: "\r", "\\": "\\" })[value] ??
      String.fromCharCode(parseInt(value.slice(1), value[0] === "x" ? 16 : 8)),
  );

/** Basic grep patterns use a small NFA, so even repeated stars cannot freeze the UI. */
function basicMatcher(
  pattern: string,
  insensitive: boolean,
): (line: string) => boolean {
  if (pattern.length > 256)
    throw new Error("pattern is too long (256 characters maximum)");
  if (insensitive) pattern = pattern.toLowerCase();
  const anchored = pattern.startsWith("^");
  if (anchored) pattern = pattern.slice(1);
  const end = pattern.endsWith("$") && !pattern.endsWith("\\$");
  if (end) pattern = pattern.slice(0, -1);
  const units: { test: (char: string) => boolean; star: boolean }[] = [];
  for (let i = 0; i < pattern.length; i++) {
    let char = pattern[i];
    if (char === "*" && units.length && !units[units.length - 1].star) {
      units[units.length - 1].star = true;
      continue;
    }
    let test: (value: string) => boolean;
    if (char === "\\") {
      char = pattern[++i];
      if (!char) throw new Error("trailing backslash");
      if (/[(){}1-9]/.test(char))
        throw new Error(
          "groups and backreferences are not supported; use a basic pattern or -F",
        );
      const literal = char;
      test = (value) => value === literal;
    } else if (char === ".") test = () => true;
    else if (char === "[") {
      const close = pattern.indexOf("]", i + 1);
      if (close === -1) throw new Error("unmatched '['");
      const regex = new RegExp(`^${pattern.slice(i, close + 1)}$`, "u");
      test = (value) => regex.test(value);
      i = close;
    } else {
      const literal = char;
      test = (value) => value === literal;
    }
    units.push({ test, star: false });
  }
  const closure = (states: Set<number>) => {
    for (const state of states) if (units[state]?.star) states.add(state + 1);
    return states;
  };
  return (line) => {
    if (insensitive) line = line.toLowerCase();
    let states = closure(new Set([0]));
    if (!end && states.has(units.length)) return true;
    for (const char of line) {
      if (!anchored) states = closure(states.add(0));
      const next = new Set<number>();
      for (const state of states)
        if (units[state]?.test(char))
          next.add(units[state].star ? state : state + 1);
      states = closure(next);
      if (!end && states.has(units.length)) return true;
    }
    if (!anchored) states = closure(states.add(0));
    return states.has(units.length);
  };
}

export const textCommands: Record<string, CommandHandler> = {
  echo: (args) => {
    let newline = true;
    let expand = false;
    while (/^-[neE]+$/.test(args[0] ?? "")) {
      for (const flag of args.shift()!.slice(1)) {
        if (flag === "n") newline = false;
        else expand = flag === "e";
      }
    }
    return ok(
      (expand ? escapes(args.join(" ")) : args.join(" ")) +
        (newline ? "\n" : ""),
    );
  },
  printf: (args) => {
    if (!args.length) throw new Error("usage: printf FORMAT [ARGUMENT...]");
    const format = escapes(args.shift()!);
    let output = "";
    do {
      const count = args.length;
      output += format.replace(/%(%|s|d|b|.)/g, (_, type: string) => {
        if (type === "%") return "%";
        if (!["s", "d", "b"].includes(type))
          throw new Error(`unsupported format character '${type}'`);
        const value = args.shift() ?? "";
        if (type === "d") {
          if (value && !/^[+-]?\d+$/.test(value))
            throw new Error(`${value}: invalid number`);
          return String(Number(value));
        }
        return type === "b" ? escapes(value) : value;
      });
      if (args.length === count) break;
    } while (args.length);
    return ok(output);
  },
  head: (args, stdin, context) => ends(args, stdin, context, false),
  tail: (args, stdin, context) => ends(args, stdin, context, true),
  grep: (args, stdin, context) => {
    const { flags, operands } = options(args, "invclFxq", {
      "ignore-case": "i",
      "line-number": "n",
      "invert-match": "v",
      count: "c",
      "fixed-strings": "F",
      quiet: "q",
    });
    if (!operands.length) throw new Error("missing search pattern");
    const pattern = operands.shift()!;
    const search = flags.has("F")
      ? (line: string) => {
          const a = flags.has("i") ? line.toLowerCase() : line;
          const b = flags.has("i") ? pattern.toLowerCase() : pattern;
          return flags.has("x") ? a === b : a.includes(b);
        }
      : basicMatcher(
          flags.has("x") ? `^${pattern.replace(/^\^|\$$/g, "")}$` : pattern,
          flags.has("i"),
        );
    let matched = false;
    const output = readInputs(operands, stdin, context).flatMap(
      ({ path, text }) => {
        const matches = lines(text)
          .map((line, i) => ({ line, i }))
          .filter(({ line }) => search(line) !== flags.has("v"));
        matched ||= matches.length > 0;
        const prefix = operands.length > 1 ? `${path}:` : "";
        if (flags.has("q")) return [];
        if (flags.has("l")) return matches.length ? [path] : [];
        if (flags.has("c")) return [`${prefix}${matches.length}`];
        return matches.map(
          ({ line, i }) =>
            `${prefix}${flags.has("n") ? `${i + 1}:` : ""}${line}`,
        );
      },
    );
    return { ...ok(terminated(output)), code: matched ? 0 : 1 };
  },
  wc: (args, stdin, context) => {
    const { flags, operands } = options(args, "lwcm", {
      lines: "l",
      words: "w",
      bytes: "c",
      chars: "m",
    });
    const counts = readInputs(operands, stdin, context).map(
      ({ path, text }) => ({
        path,
        values: [
          (text.match(/\n/g) ?? []).length,
          (text.match(/\S+/gu) ?? []).length,
          new TextEncoder().encode(text).length,
          [...text].length,
        ],
      }),
    );
    if (counts.length > 1)
      counts.push({
        path: "total",
        values: [0, 1, 2, 3].map((i) =>
          counts.reduce((sum, entry) => sum + entry.values[i], 0),
        ),
      });
    return ok(
      counts
        .map(
          ({ path, values }) =>
            values
              .filter((_, i) => (flags.size ? flags.has("lwcm"[i]) : i < 3))
              .map((value) => String(value).padStart(7))
              .join(" ") + (path !== "-" ? ` ${path}` : ""),
        )
        .join("\n") + "\n",
    );
  },
  sort: (args, stdin, context) => {
    const { flags, operands } = options(args, "nru", {
      numeric: "n",
      reverse: "r",
      unique: "u",
    });
    let sorted = lines(
      readInputs(operands, stdin, context)
        .map(({ text }) => text)
        .join(""),
    );
    sorted.sort((a, b) =>
      flags.has("n")
        ? (parseFloat(a) || 0) - (parseFloat(b) || 0)
        : a < b
          ? -1
          : a > b
            ? 1
            : 0,
    );
    if (flags.has("r")) sorted.reverse();
    if (flags.has("u")) sorted = [...new Set(sorted)];
    return ok(terminated(sorted));
  },
  uniq: (args, stdin, context) => {
    const { flags, operands } = options(args, "cdiu", {
      count: "c",
      repeated: "d",
      unique: "u",
      "ignore-case": "i",
    });
    if (operands.length > 1)
      throw new Error("expected at most one input file; use > for output");
    const groups: { text: string; count: number }[] = [];
    for (const line of lines(readInputs(operands, stdin, context)[0].text)) {
      const last = groups[groups.length - 1];
      if (
        last &&
        (flags.has("i")
          ? last.text.toLowerCase() === line.toLowerCase()
          : last.text === line)
      )
        last.count++;
      else groups.push({ text: line, count: 1 });
    }
    return ok(
      terminated(
        groups
          .filter(
            ({ count }) =>
              (!flags.has("d") || count > 1) &&
              (!flags.has("u") || count === 1),
          )
          .map(
            ({ text, count }) =>
              `${flags.has("c") ? `${String(count).padStart(7)} ` : ""}${text}`,
          ),
      ),
    );
  },
  cut: (args, stdin, context) => {
    let delimiter = "\t";
    let selection = "";
    let chars = false;
    const paths: string[] = [];
    while (args.length) {
      const arg = args.shift()!;
      if (/^-[dfc]/.test(arg)) {
        const value = arg.slice(2) || args.shift();
        if (value === undefined)
          throw new Error(`${arg}: option requires an argument`);
        if (arg[1] === "d") {
          if ([...value].length !== 1)
            throw new Error("delimiter must be one character");
          delimiter = value;
        } else {
          selection = value;
          chars = arg[1] === "c";
        }
      } else if (arg.startsWith("-") && arg !== "-")
        throw new Error(`unsupported option '${arg}'`);
      else paths.push(arg);
    }
    if (!selection || !/^\d+(?:-\d*)?(?:,\d+(?:-\d*)?)*$/.test(selection))
      throw new Error("expected -f FIELDS or -c CHARACTERS (e.g. 1,3-5)");
    const ranges = selection.split(",").map((range) => {
      const [from, to] = range.split("-");
      return [
        Number(from),
        range.includes("-") ? (to ? Number(to) : Infinity) : Number(from),
      ];
    });
    if (ranges.some(([from, to]) => from < 1 || to < from))
      throw new Error("invalid field range");
    return ok(
      terminated(
        lines(
          readInputs(paths, stdin, context)
            .map(({ text }) => text)
            .join(""),
        ).map((line) => {
          if (!chars && !line.includes(delimiter)) return line;
          return (chars ? [...line] : line.split(delimiter))
            .filter((_, i) =>
              ranges.some(([from, to]) => i + 1 >= from && i + 1 <= to),
            )
            .join(chars ? "" : delimiter);
        }),
      ),
    );
  },
  tr: (args, stdin) => {
    const { flags, operands } = options(args, "ds");
    const expand = (value: string) => [
      ...escapes(
        value
          .replace(/\[:lower:\]/g, "a-z")
          .replace(/\[:upper:\]/g, "A-Z")
          .replace(/\[:digit:\]/g, "0-9"),
      ).replace(/(.)-(.)/g, (_, a: string, b: string) => {
        const size = b.charCodeAt(0) - a.charCodeAt(0) + 1;
        if (size < 1 || size > 256) throw new Error("invalid character range");
        return Array.from({ length: size }, (_, i) =>
          String.fromCharCode(a.charCodeAt(0) + i),
        ).join("");
      }),
    ];
    if (
      !operands.length ||
      operands.length > 2 ||
      (!flags.has("d") && !flags.has("s") && operands.length < 2)
    )
      throw new Error("usage: tr [-ds] SET1 [SET2]");
    const source = expand(operands[0]);
    const target = expand(operands[1] ?? operands[0]);
    if (!target.length && !flags.has("d"))
      throw new Error("SET2 must not be empty");
    let output = "";
    let previous = "";
    for (const char of stdin) {
      const index = source.indexOf(char);
      if (flags.has("d") && index !== -1) continue;
      const next =
        !flags.has("d") && operands.length > 1 && index !== -1
          ? target[Math.min(index, target.length - 1)]
          : char;
      if (!(flags.has("s") && next === previous && target.includes(next)))
        output += next;
      previous = next;
    }
    return ok(output);
  },
  rev: (args, stdin, context) =>
    ok(
      terminated(
        lines(
          readInputs(options(args, "").operands, stdin, context)
            .map(({ text }) => text)
            .join(""),
        ).map((line) => [...line].reverse().join("")),
      ),
    ),
  base64: (args, stdin, context) => {
    const { flags, operands } = options(args, "d", { decode: "d" });
    if (operands.length > 1) throw new Error("extra operand");
    const text = readInputs(operands, stdin, context)[0].text;
    if (flags.has("d")) {
      try {
        return ok(
          new TextDecoder().decode(
            Uint8Array.from(atob(text.replace(/\s/g, "")), (char) =>
              char.charCodeAt(0),
            ),
          ),
        );
      } catch {
        throw new Error("invalid input");
      }
    }
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return ok(terminated(btoa(binary).match(/.{1,76}/g) ?? []));
  },
  seq: (args) => {
    if (
      !args.length ||
      args.length > 3 ||
      args.some((value) => !Number.isFinite(Number(value)))
    )
      throw new Error("usage: seq [FIRST [INCREMENT]] LAST");
    const values = args.map(Number);
    const start = values.length === 1 ? 1 : values[0];
    const step = values.length === 3 ? values[1] : 1;
    const end = values[values.length - 1];
    if (!step) throw new Error("zero increment");
    const count = Math.max(0, Math.floor((end - start) / step + 1e-10) + 1);
    if (count > 10000) throw new Error("output limited to 10000 numbers");
    return ok(
      terminated(
        Array.from({ length: count }, (_, i) =>
          String(Number((start + step * i).toPrecision(12))),
        ),
      ),
    );
  },
};

function ends(
  args: string[],
  stdin: string,
  context: ShellContext,
  tail: boolean,
) {
  let count = 10;
  const paths: string[] = [];
  while (args.length) {
    const arg = args.shift()!;
    if (arg === "-n" || arg === "--lines") {
      const value = args.shift();
      if (!value || !/^\d+$/.test(value))
        throw new Error("invalid number of lines");
      count = Number(value);
    } else if (/^-\d+$/.test(arg)) count = Number(arg.slice(1));
    else if (arg.startsWith("-") && arg !== "-")
      throw new Error(`unsupported option '${arg}'`);
    else paths.push(arg);
  }
  return ok(
    readInputs(paths, stdin, context)
      .map(({ path, text }) => {
        const items = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
        return (
          (paths.length > 1 ? `==> ${path} <==\n` : "") +
          (count === 0
            ? []
            : tail
              ? items.slice(-count)
              : items.slice(0, count)
          ).join("")
        );
      })
      .join(paths.length > 1 ? "\n" : ""),
  );
}
