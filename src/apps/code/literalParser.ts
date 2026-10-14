export type LiteralParseResult = { ok: true; value: unknown } | { ok: false; error: string; line: number };

const IDENTIFIER = /[A-Za-z_$][\w$]*/y;
const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;

// Turns `export const name = [...]` written as plain data (no expressions) into a value without evaluating code.
export function parseExportedLiteral(source: string, exportName: string): LiteralParseResult {
  const lineAt = (index: number) => source.slice(0, index).split("\n").length;
  const fail = (error: string, index: number): LiteralParseResult => ({ error, line: lineAt(index), ok: false });
  const declaration = new RegExp(`export const ${exportName}\\b[^=]*=\\s*`).exec(source);

  if (!declaration) {
    return fail(`"export const ${exportName}" is missing`, 0);
  }

  // Skips whitespace and comments; returns -1 for an unterminated block comment.
  const skipTrivia = (from: number) => {
    let index = from;

    while (index < source.length) {
      if (/\s/.test(source[index])) {
        index += 1;
      } else if (source.startsWith("//", index)) {
        const end = source.indexOf("\n", index);
        index = end < 0 ? source.length : end;
      } else if (source.startsWith("/*", index)) {
        const end = source.indexOf("*/", index + 2);

        if (end < 0) {
          return -1;
        }

        index = end + 2;
      } else {
        break;
      }
    }

    return index;
  };

  let json = "";
  const sourceOffsets: number[] = [];
  const emit = (text: string, at: number) => {
    json += text;
    sourceOffsets.push(...Array.from(text, () => at));
  };
  const stack: string[] = [];
  let index = declaration.index + declaration[0].length;

  while (index < source.length) {
    const next = skipTrivia(index);

    if (next < 0) {
      return fail("Unterminated comment", index);
    }

    if (next >= source.length) {
      break;
    }

    index = next;
    const char = source[index];

    if (char === '"' || char === "'") {
      let end = index + 1;

      while (end < source.length && source[end] !== char && source[end] !== "\n") {
        end += source[end] === "\\" ? 2 : 1;
      }

      if (source[end] !== char) {
        return fail("Unterminated string", index);
      }

      const inner = source.slice(index + 1, end);

      try {
        const value: string = JSON.parse(
          char === '"' ? `"${inner}"` : `"${inner.replace(/\\'|"/g, (match) => (match === '"' ? '\\"' : "'"))}"`,
        );
        emit(JSON.stringify(value), index);
      } catch {
        return fail("Invalid escape in string", index);
      }

      index = end + 1;
    } else if (char === "`") {
      return fail("Template strings aren't supported here, use quotes", index);
    } else if (char === "[" || char === "{") {
      stack.push(char);
      emit(char, index);
      index += 1;
    } else if (char === "]" || char === "}") {
      if (stack.pop() !== (char === "]" ? "[" : "{")) {
        return fail(`Unexpected "${char}"`, index);
      }

      emit(char, index);
      index += 1;

      if (stack.length === 0) {
        break;
      }
    } else if (char === ",") {
      const following = skipTrivia(index + 1);

      // Trailing commas are valid TS but not JSON.
      if (following < 0 || (source[following] !== "]" && source[following] !== "}")) {
        emit(",", index);
      }

      index += 1;
    } else if (char === ":") {
      emit(":", index);
      index += 1;
    } else {
      IDENTIFIER.lastIndex = index;
      NUMBER.lastIndex = index;
      const identifier = IDENTIFIER.exec(source)?.[0];
      const number = identifier ? undefined : NUMBER.exec(source)?.[0];

      if (identifier) {
        const following = skipTrivia(index + identifier.length);

        if (source[following] === ":") {
          emit(JSON.stringify(identifier), index);
        } else if (identifier === "true" || identifier === "false" || identifier === "null") {
          emit(identifier, index);
        } else {
          return fail(`"${identifier}" isn't plain data. Only strings, numbers, booleans, arrays and objects work here`, index);
        }

        index += identifier.length;
      } else if (number) {
        emit(number, index);
        index += number.length;
      } else {
        return fail(`Unexpected "${char}"`, index);
      }
    }

    if (stack.length === 0) {
      return fail("Expected an array or object literal", index);
    }
  }

  if (stack.length > 0) {
    return fail(`Unclosed "${stack[stack.length - 1]}"`, index);
  }

  try {
    return { ok: true, value: JSON.parse(json) };
  } catch (error) {
    const position = Number(/position (\d+)/.exec(String(error))?.[1] ?? json.length - 1);
    const reason = /Expected[^(]*|Unexpected[^(]*/.exec(String(error))?.[0]?.replace(/ in JSON.*$/, "").trim();

    return fail(reason ?? "Invalid syntax (missing comma?)", sourceOffsets[Math.min(position, sourceOffsets.length - 1)] ?? index);
  }
}
