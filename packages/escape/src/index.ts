export function escape(
  input: string,
  config?: {
    escapeHtml?: boolean;
    escapeNonAscii?: boolean;
  }
): string {
  const result: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const code = char.charCodeAt(0);

    if (config?.escapeHtml) {
      switch (char) {
        case "&":
          result.push("\\u0026");
          continue;
        case "<":
          result.push("\\u003C");
          continue;
        case ">":
          result.push("\\u003E");
          continue;
        case '"':
          result.push("\\u0022");
          continue;
        case "'":
          result.push("\\u0027");
          continue;
        case "/":
          result.push("\\u002F");
          continue;
      }
    }

    switch (char) {
      case '"':
        result.push('\\"');
        continue;
      case "\\":
        result.push("\\\\");
        continue;
      case "\b":
        result.push("\\b");
        continue;
      case "\f":
        result.push("\\f");
        continue;
      case "\n":
        result.push("\\n");
        continue;
      case "\r":
        result.push("\\r");
        continue;
      case "\t":
        result.push("\\t");
        continue;
    }

    if (config?.escapeNonAscii && code > 127) {
      result.push("\\u" + code.toString(16).padStart(4, "0"));
      continue;
    }

    result.push(char);
  }

  return result.join("");
}
