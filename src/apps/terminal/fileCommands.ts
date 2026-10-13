import {
  baseName,
  HOME,
  isWritablePath,
  parentPath,
  resolvePath,
} from "./filesystem";
import { globPattern } from "./parser";
import {
  fail,
  ok,
  options,
  type CommandHandler,
  type ShellContext,
} from "./types";

const pathFor = (path: string, context: ShellContext) => {
  if (!path) throw new Error("'': No such file or directory");
  return resolvePath(path, context.cwd);
};
const requireOperands = (args: string[]) => {
  if (!args.length) throw new Error("missing operand");
};

export const fileCommands: Record<string, CommandHandler> = {
  pwd: (args, _stdin, context) => {
    options(args, "LP");
    return ok(`${context.cwd}\n`);
  },
  cd: (args, _stdin, context) => {
    if (args.length > 1) return fail("bash: cd: too many arguments");
    const target = args[0] === "-" ? context.env.OLDPWD : (args[0] ?? HOME);
    if (target === undefined) return fail("bash: cd: OLDPWD not set");
    const path = pathFor(target, context);
    context.fs.requireDirectory(path);
    context.env.OLDPWD = context.cwd;
    context.cwd = path;
    context.env.PWD = path;
    return ok(args[0] === "-" ? `${path}\n` : "");
  },
  ls: (args, _stdin, context) => {
    const { flags, operands } = options(args, "alAhFR1dtr", {
      all: "a",
      "almost-all": "A",
      reverse: "r",
    });
    let output = "";
    let errors = "";
    const targets = operands.length ? operands : ["."];
    for (const target of targets) {
      try {
        const path = pathFor(target, context);
        const node = context.fs.get(path);
        if (!node)
          throw new Error(
            `cannot access '${target}': No such file or directory`,
          );
        const list = (directory: string, heading: boolean) => {
          if (heading)
            output += `${output ? "\n" : ""}${directory === path ? target : directory}:\n`;
          let entries = context.fs
            .children(directory)
            .filter(
              ([name]) =>
                flags.has("a") ||
                flags.has("A") ||
                !baseName(name).startsWith("."),
            );
          if (flags.has("t"))
            entries.sort((a, b) => b[1].modified - a[1].modified);
          if (flags.has("r")) entries.reverse();
          const names = entries.map(([name, entry]) => ({
            name: baseName(name),
            entry,
          }));
          if (flags.has("a"))
            names.unshift(
              { name: ".", entry: node },
              { name: "..", entry: context.fs.get(parentPath(directory))! },
            );
          output += format(names);
          if (flags.has("R"))
            for (const [name, entry] of entries)
              if (entry.type === "directory") list(name, true);
        };
        const format = (entries: { name: string; entry: typeof node }[]) => {
          const lines = entries.map(({ name, entry }) => {
            const suffix =
              entry.type === "directory" && flags.has("F") ? "/" : "";
            if (!flags.has("l")) return name + suffix;
            const size =
              entry.type === "directory"
                ? 4096
                : new TextEncoder().encode(entry.content).length;
            const sizeText =
              flags.has("h") && size >= 1024
                ? `${(size / 1024).toFixed(1)}K`
                : String(size);
            const date = new Date(entry.modified).toLocaleDateString("en-GB", {
              month: "short",
              day: "2-digit",
            });
            return `${entry.type === "directory" ? "drwxr-xr-x" : "-rw-r--r--"} 1 emil emil ${sizeText.padStart(6)} ${date} ${name}${suffix}`;
          });
          return lines.length
            ? lines.join(flags.has("l") || flags.has("1") ? "\n" : "  ") + "\n"
            : "";
        };
        if (node.type === "directory" && !flags.has("d"))
          list(path, targets.length > 1 || flags.has("R"));
        else output += format([{ name: target, entry: node }]);
      } catch (error) {
        errors += `ls: ${(error as Error).message}\n`;
      }
    }
    return { stdout: output, stderr: errors, code: errors ? 2 : 0 };
  },
  cat: (args, stdin, context) => {
    const { flags, operands } = options(args, "nb", {
      number: "n",
      "number-nonblank": "b",
    });
    let output = "";
    let errors = "";
    for (const path of operands.length ? operands : ["-"]) {
      try {
        output +=
          path === "-" ? stdin : context.fs.read(pathFor(path, context));
      } catch (error) {
        errors += `cat: ${(error as Error).message}\n`;
      }
    }
    if (flags.has("n") || flags.has("b")) {
      let count = 0;
      output = output.replace(/^.*(?:\n|$)/gm, (line) =>
        !line || (flags.has("b") && line === "\n")
          ? line
          : `${String(++count).padStart(6)}\t${line}`,
      );
    }
    return { stdout: output, stderr: errors, code: errors ? 1 : 0 };
  },
  touch: (args, _stdin, context) => {
    const { operands } = options(args, "");
    requireOperands(operands);
    for (const name of operands) {
      const path = pathFor(name, context);
      if (context.fs.get(path)?.type === "directory") {
        if (!isWritablePath(path))
          throw new Error(`${path}: Permission denied`);
        context.fs.get(path)!.modified = Date.now();
      } else context.fs.write(path, "", true);
    }
    return ok();
  },
  mkdir: (args, _stdin, context) => {
    const { flags, operands } = options(args, "p", { parents: "p" });
    requireOperands(operands);
    for (const name of operands)
      context.fs.mkdir(pathFor(name, context), flags.has("p"));
    return ok();
  },
  rm: (args, _stdin, context) => {
    const { flags, operands } = options(args, "rfR", {
      recursive: "r",
      force: "f",
    });
    if (!flags.has("f")) requireOperands(operands);
    for (const name of operands) {
      const path = pathFor(name, context);
      if (flags.has("f") && !context.fs.get(path)) continue;
      if ([".", ".."].includes(name.split("/").filter(Boolean).slice(-1)[0]))
        throw new Error(`refusing to remove '.' or '..' directory: ${name}`);
      context.fs.remove(path, flags.has("r") || flags.has("R"));
    }
    return ok();
  },
  rmdir: (args, _stdin, context) => {
    const { operands } = options(args, "");
    requireOperands(operands);
    for (const name of operands)
      context.fs.remove(pathFor(name, context), false, true);
    return ok();
  },
  cp: (args, _stdin, context) => copyOrMove(args, context, false),
  mv: (args, _stdin, context) => copyOrMove(args, context, true),
  tree: (args, _stdin, context) => {
    const { flags, operands } = options(args, "ad", { all: "a" });
    if (operands.length > 1) throw new Error("expected at most one directory");
    const path = pathFor(operands[0] ?? ".", context);
    let directories = 0;
    let files = 0;
    const walk = (directory: string, prefix: string): string => {
      const entries = context.fs
        .children(directory)
        .filter(
          ([name, node]) =>
            (flags.has("a") || !baseName(name).startsWith(".")) &&
            (!flags.has("d") || node.type === "directory"),
        );
      return entries
        .map(([name, node], index) => {
          const last = index === entries.length - 1;
          let line = `${prefix}${last ? "└──" : "├──"} ${baseName(name)}\n`;
          if (node.type === "directory") {
            directories++;
            line += walk(name, `${prefix}${last ? "    " : "│   "}`);
          } else files++;
          return line;
        })
        .join("");
    };
    const tree = walk(path, "");
    return ok(
      `${operands[0] ?? "."}\n${tree}\n${directories} directories, ${files} files\n`,
    );
  },
  find: (args, _stdin, context) => {
    let root = ".";
    let name: string | undefined;
    let type: string | undefined;
    if (args[0] && !args[0].startsWith("-")) root = args.shift()!;
    while (args.length) {
      const flag = args.shift();
      if (flag === "-name" && args[0] !== undefined) name = args.shift();
      else if (flag === "-type" && ["f", "d"].includes(args[0]))
        type = args.shift();
      else
        throw new Error(
          `unsupported or incomplete predicate '${flag}' (supported: -name, -type)`,
        );
    }
    const path = pathFor(root, context);
    if (!context.fs.get(path))
      throw new Error(`${root}: No such file or directory`);
    const matches = context.fs
      .entries()
      .filter(
        ([entry, node]) =>
          (entry === path ||
            entry.startsWith(path === "/" ? "/" : `${path}/`)) &&
          (!name || globPattern(name).test(baseName(entry))) &&
          (!type || node.type === (type === "d" ? "directory" : "file")),
      );
    return ok(
      matches
        .map(
          ([entry]) =>
            (root === "/" ? "" : root.replace(/\/$/, "")) +
            (path === "/" ? entry : entry.slice(path.length)),
        )
        .join("\n") + (matches.length ? "\n" : ""),
    );
  },
  stat: (args, _stdin, context) => {
    const { operands } = options(args, "");
    requireOperands(operands);
    return ok(
      operands
        .map((name) => {
          const node = context.fs.get(pathFor(name, context));
          if (!node) throw new Error(`${name}: No such file or directory`);
          return `  File: ${name}\n  Size: ${new TextEncoder().encode(node.content).length}\t${node.type === "file" ? "regular file" : "directory"}\nAccess: (${node.type === "file" ? "0644/-rw-r--r--" : "0755/drwxr-xr-x"})  Uid: (1000/emil)  Gid: (1000/emil)\nModify: ${new Date(node.modified).toISOString()}\n`;
        })
        .join(""),
    );
  },
  du: (args, _stdin, context) => {
    const { flags, operands } = options(args, "sh", {
      summarize: "s",
      "human-readable": "h",
    });
    return ok(
      (operands.length ? operands : ["."])
        .map((name) => {
          const path = pathFor(name, context);
          if (!context.fs.get(path))
            throw new Error(`${name}: No such file or directory`);
          const size = context.fs
            .entries()
            .filter(([entry]) => entry === path || entry.startsWith(`${path}/`))
            .reduce(
              (sum, [, node]) =>
                sum + new TextEncoder().encode(node.content).length,
              0,
            );
          return `${flags.has("h") ? `${(size / 1024).toFixed(1)}K` : Math.ceil(size / 1024)}\t${name}\n`;
        })
        .join(""),
    );
  },
};

function copyOrMove(args: string[], context: ShellContext, move: boolean) {
  const { flags, operands } = options(args, move ? "n" : "rRn", {
    recursive: "r",
    "no-clobber": "n",
  });
  if (operands.length < 2) throw new Error("missing destination file operand");
  const destination = pathFor(operands.pop()!, context);
  if (operands.length > 1) context.fs.requireDirectory(destination);
  for (const name of operands) {
    const source = pathFor(name, context);
    const target =
      context.fs.get(destination)?.type === "directory"
        ? `${destination}/${baseName(source)}`
        : destination;
    if (flags.has("n") && context.fs.get(target)) continue;
    context.fs.copy(
      source,
      destination,
      flags.has("r") || flags.has("R"),
      move,
    );
  }
  return ok();
}
