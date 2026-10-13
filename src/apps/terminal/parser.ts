export type WordPart = { text: string; quote: "none" | "single" | "double" };
export type Word = { parts: WordPart[] };
type Token = Word | string;
export type Redirect = { operator: string; target?: Word };
export type Command = { words: Word[]; redirects: Redirect[] };
export type Pipeline = { commands: Command[]; condition: ";" | "&&" | "||" };

/** Tokenize without evaluating input as JavaScript or invoking a host shell. */
export function tokenize(input: string): Token[] {
  if (input.length > 8192) throw new Error("command line too long (8192 characters maximum)");
  const tokens: Token[] = [];
  let parts: WordPart[] = [];
  let active = false;
  const append = (text: string, quote: WordPart["quote"]) => {
    active = true;
    const last = parts[parts.length - 1];
    if (last?.quote === quote) last.text += text;
    else parts.push({ text, quote });
  };
  const flush = () => { if (active) tokens.push({ parts }); parts = []; active = false; };
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === "#" && !active) { while (i < input.length && input[i] !== "\n") i++; }
    if (i >= input.length) break;
    if (/\s/.test(input[i])) {
      flush();
      if (input[i] === "\n" && tokens.length && tokens[tokens.length - 1] !== ";") tokens.push(";");
      continue;
    }
    if (char === "\\") {
      if (++i >= input.length) throw new Error("unexpected end of input after '\\'");
      if (input[i] !== "\n") append(input[i], "single");
      continue;
    }
    if (char === "'" || char === '"') {
      const quote = char === "'" ? "single" : "double";
      append("", quote);
      let closed = false;
      while (++i < input.length) {
        if (input[i] === char) { closed = true; break; }
        if (quote === "double" && input[i] === "\\" && /[$`"\\\n]/.test(input[i + 1] ?? "")) {
          i++;
          if (input[i] !== "\n") append(input[i], "single");
        } else {
          if (quote === "double" && (input[i] === "`" || input.slice(i, i + 2) === "$(")) throw new Error("command substitution is not supported in this browser shell");
          append(input[i], quote);
        }
      }
      if (!closed) throw new Error(`unexpected end of input: unclosed ${char} quote`);
      continue;
    }
    if (char === "`" || input.slice(i, i + 2) === "$(") throw new Error("command substitution is not supported in this browser shell");
    const operator = input.slice(i).match(/^(2>&1|2>>|2>|&&|\|\||>>|[;|<>&])/); 
    if (operator && (!char.match(/\d/) || !active)) {
      flush();
      if (operator[0] === "&") throw new Error("background jobs are not supported; use Ctrl+C to interrupt a running command");
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
    if (!command.words.length && !command.redirects.length) throw new Error("syntax error near unexpected token");
    pipeline.commands.push(command);
    command = { words: [], redirects: [] };
  };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (typeof token !== "string") { command.words.push(token); continue; }
    if ([">", ">>", "<", "2>", "2>>", "2>&1"].includes(token)) {
      if (token === "2>&1") command.redirects.push({ operator: token });
      else {
        const target = tokens[++i];
        if (!target || typeof target === "string") throw new Error("syntax error: expected a redirection target");
        command.redirects.push({ operator: token, target });
      }
    } else if (token === "|") flush();
    else {
      flush();
      pipelines.push(pipeline);
      pipeline = { commands: [], condition: token as Pipeline["condition"] };
    }
  }
  if (command.words.length || command.redirects.length) { flush(); pipelines.push(pipeline); }
  else if (pipeline.commands.length || pipeline.condition !== ";") throw new Error("syntax error: incomplete command");
  return pipelines;
}

export function globPattern(pattern: string): RegExp {
  return new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]")}$`);
}

export function expandWord(word: Word, env: Record<string, string>, status: number): { value: string; glob: string | null }[] {
  // Keep quoted whitespace and wildcard characters literal while splitting unquoted variables.
  const fields: { value: string; pattern: string; wildcard: boolean }[] = [{ value: "", pattern: "", wildcard: false }];
  let preserveEmpty = false;
  for (const [index, part] of word.parts.entries()) {
    preserveEmpty ||= part.quote !== "none";
    let text = part.text;
    if (part.quote === "none" && index === 0 && /^~(?:\/|$)/.test(text)) text = env.HOME + text.slice(1);
    const expanded = part.quote === "single" ? text : text.replace(/\$(?:\{([A-Za-z_][A-Za-z_0-9]*|\?)\}|([A-Za-z_][A-Za-z_0-9]*|\?))/g, (_, braced: string, plain: string) => (braced ?? plain) === "?" ? String(status) : env[braced ?? plain] ?? "");
    const pieces = part.quote === "none" ? expanded.split(/([\t\n ]+)/) : [expanded];
    for (const piece of pieces) {
      if (part.quote === "none" && /^[\t\n ]+$/.test(piece)) { if (fields[fields.length - 1].value) fields.push({ value: "", pattern: "", wildcard: false }); continue; }
      const field = fields[fields.length - 1];
      field.value += piece;
      field.pattern += part.quote === "none" ? piece : piece.replace(/\*/g, "\u0001").replace(/\?/g, "\u0002");
      field.wildcard ||= part.quote === "none" && /[*?]/.test(piece);
    }
  }
  return fields.filter((field) => field.value || preserveEmpty).map((field) => ({ value: field.value, glob: field.wildcard ? field.pattern : null }));
}
