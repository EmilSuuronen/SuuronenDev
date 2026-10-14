export type WordPart = { text: string; quote: "none" | "single" | "double" };
export type Word = { parts: WordPart[] };
type Token = Word | string;
export type Redirect = { operator: string; target?: Word };
export type Command = { words: Word[]; redirects: Redirect[] };
export type Pipeline = { commands: Command[]; condition: ";" | "&&" | "||" };

/** Tokenize without evaluating input as JavaScript or invoking a host shell. */
export function tokenize(input: string): Token[] {
  if (input.length > 8192)
    throw new Error("command line too long (8192 characters maximum)");
  const tokens: Token[] = [];
  let parts: WordPart[] = [];
  let active = false;
  const append = (text: string, quote: WordPart["quote"]) => {
    active = true;
    const last = parts[parts.length - 1];
    if (last?.quote === quote) last.text += text;
    else parts.push({ text, quote });
  };
  const flush = () => {
    if (active) tokens.push({ parts });
    parts = [];
    active = false;
  };
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === "#" && !active) {
      while (i < input.length && input[i] !== "\n") i++;
    }
    if (i >= input.length) break;
    if (/\s/.test(input[i])) {
      flush();
      if (
        input[i] === "\n" &&
        tokens.length &&
        ![";", "|", "&&", "||"].includes(tokens[tokens.length - 1] as string)
      )
        tokens.push(";");
      continue;
    }
    if (char === "\\") {
      if (++i >= input.length)
        throw new Error("unexpected end of input after '\\'");
      if (input[i] !== "\n") append(input[i], "single");
      continue;
    }
    if (char === "$" && input[i + 1] === "'") {
      i += 2;
      let literal = "";
      for (; i < input.length && input[i] !== "'"; i++) {
        if (input[i] === "\\") {
          const escape = input[++i];
          const escapes: Record<string, string> = {
            n: "\n",
            t: "\t",
            r: "\r",
            "\\": "\\",
            "'": "'",
          };
          literal += escapes[escape] ?? `\\${escape}`;
        } else literal += input[i];
      }
      if (i >= input.length)
        throw new Error("unexpected end of input: unclosed ANSI-C quote");
      append(literal, "single");
      continue;
    }
    if (char === "'" || char === '"') {
      const quote = char === "'" ? "single" : "double";
      append("", quote);
      let closed = false;
      while (++i < input.length) {
        if (input[i] === char) {
          closed = true;
          break;
        }
        if (
          quote === "double" &&
          input[i] === "\\" &&
          /[$`"\\\n]/.test(input[i + 1] ?? "")
        ) {
          i++;
          if (input[i] !== "\n") append(input[i], "single");
        } else {
          if (
            quote === "double" &&
            (input[i] === "`" || input.slice(i, i + 2) === "$(")
          )
            throw new Error(
              "command substitution is not supported in this browser shell",
            );
          append(input[i], quote);
        }
      }
      if (!closed)
        throw new Error(`unexpected end of input: unclosed ${char} quote`);
      continue;
    }
    if (char === "`" || input.slice(i, i + 2) === "$(")
      throw new Error(
        "command substitution is not supported in this browser shell",
      );
    const operator = input.slice(i).match(/^(2>&1|2>>|2>|&&|\|\||>>|[;|<>&])/);
    if (operator && (!char.match(/\d/) || !active)) {
      flush();
      if (operator[0] === "&")
        throw new Error(
          "background jobs are not supported; use Ctrl+C to interrupt a running command",
        );
      tokens.push(operator[0]);
      i += operator[0].length - 1;
      continue;
    }
    append(char, "none");
  }
  flush();
  return tokens;
}

export function parse(input: string): Pipeline[] {
  const tokens = tokenize(input);
  const pipelines: Pipeline[] = [];
  let pipeline: Pipeline = { commands: [], condition: ";" };
  let command: Command = { words: [], redirects: [] };
  const flush = () => {
    if (!command.words.length && !command.redirects.length)
      throw new Error("syntax error near unexpected token");
    pipeline.commands.push(command);
    command = { words: [], redirects: [] };
  };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (typeof token !== "string") {
      command.words.push(token);
      continue;
    }
    if ([">", ">>", "<", "2>", "2>>", "2>&1"].includes(token)) {
      if (token === "2>&1") command.redirects.push({ operator: token });
      else {
        const target = tokens[++i];
        if (!target || typeof target === "string")
          throw new Error("syntax error: expected a redirection target");
        command.redirects.push({ operator: token, target });
      }
    } else if (token === "|") flush();
    else {
      flush();
      pipelines.push(pipeline);
      pipeline = { commands: [], condition: token as Pipeline["condition"] };
    }
  }
  if (command.words.length || command.redirects.length) {
    flush();
    pipelines.push(pipeline);
  } else if (pipeline.commands.length || pipeline.condition !== ";")
    throw new Error("syntax error: incomplete command");
  return pipelines;
}

export function globPattern(pattern: string): {
  test: (value: string) => boolean;
} {
  if (pattern.length > 1024) throw new Error("filename pattern is too long");
  const tokens = [...pattern.replace(/\*+/g, "*")];
  const minimum = tokens.filter((token) => token !== "*").length;
  const closure = (states: Set<number>) => {
    for (const state of states)
      if (tokens[state] === "*") states.add(state + 1);
    return states;
  };
  return {
    test: (value) => {
      const characters = [...value];
      if (characters.length < minimum) return false;
      let states = closure(new Set([0]));
      for (const char of characters) {
        const next = new Set<number>();
        for (const state of states) {
          const token = tokens[state];
          if (token === "*" && char !== "/") next.add(state);
          else if (
            (token === "?" && char !== "/") ||
            (token === "\u0001" ? "*" : token === "\u0002" ? "?" : token) ===
              char
          )
            next.add(state + 1);
        }
        states = closure(next);
        if (!states.size) return false;
      }
      return states.has(tokens.length);
    },
  };
}

/** Represent pasted newlines on a single editable line without executing the paste. */
export function flattenPaste(input: string): string {
  return tokenize(input.replace(/\r\n?/g, "\n"))
    .map((token) => {
      if (typeof token === "string") return token;
      return token.parts
        .map((part) => {
          if (part.quote === "none") return part.text;
          if (part.quote === "single")
            return `$'${part.text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}'`;
          return `"${part.text
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, () => "\"$'\\n'\"")}"`;
        })
        .join("");
    })
    .join(" ");
}

export function expandWord(
  word: Word,
  env: Record<string, string>,
  status: number,
): { value: string; glob: string | null }[] {
  // Keep quoted whitespace and wildcard characters literal while splitting unquoted variables.
  const fields: { value: string; pattern: string; wildcard: boolean }[] = [
    { value: "", pattern: "", wildcard: false },
  ];
  let preserveEmpty = false;
  for (const [index, part] of word.parts.entries()) {
    preserveEmpty ||= part.quote !== "none";
    let text = part.text;
    if (part.quote === "none" && index === 0 && /^~(?:\/|$)/.test(text))
      text = env.HOME + text.slice(1);
    let expansionSize = text.length;
    const expanded =
      part.quote === "single"
        ? text
        : text.replace(
            /\$(?:\{([A-Za-z_][A-Za-z_0-9]*|\?)\}|([A-Za-z_][A-Za-z_0-9]*|\?))/g,
            (match: string, braced: string, plain: string) => {
              const value =
                (braced ?? plain) === "?"
                  ? String(status)
                  : (env[braced ?? plain] ?? "");
              expansionSize += value.length - match.length;
              if (expansionSize > 128 * 1024)
                throw new Error(
                  "expanded argument is too large (128 KiB maximum)",
                );
              return value;
            },
          );
    if (expanded.length > 128 * 1024)
      throw new Error("expanded argument is too large (128 KiB maximum)");
    const pieces =
      part.quote === "none" ? expanded.split(/([\t\n ]+)/) : [expanded];
    for (const piece of pieces) {
      if (part.quote === "none" && /^[\t\n ]+$/.test(piece)) {
        if (fields[fields.length - 1].value)
          fields.push({ value: "", pattern: "", wildcard: false });
        continue;
      }
      const field = fields[fields.length - 1];
      field.value += piece;
      field.pattern +=
        part.quote === "none"
          ? piece
          : piece.replace(/\*/g, "\u0001").replace(/\?/g, "\u0002");
      field.wildcard ||= part.quote === "none" && /[*?]/.test(piece);
    }
  }
  return fields
    .filter((field) => field.value || preserveEmpty)
    .map((field) => ({
      value: field.value,
      glob: field.wildcard ? field.pattern : null,
    }));
}
