import * as readline from "node:readline";
import { stdin, stdout } from "node:process";
import { escape } from "@ftson/escape";

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
  terminal: false,
});

rl.on("line", (line) => {
  try {
    const [options, input]: [
      { escapeHtml?: boolean; escapeNonAscii?: boolean } | null,
      string
    ] = JSON.parse(line);
    const result = escape(input, options ?? undefined);
    console.log(result);
  } catch (err) {
    console.error("Invalid input:", err instanceof Error ? err.message : err);
  }
});
