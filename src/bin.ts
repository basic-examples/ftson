#!/usr/bin/env node

import { command, run } from "args-typed";
import { generate } from "./lib/generate";

const program = command({
  description: "Generate a stringify function for a TypeScript type",
})
  .option("h", "help", "Show help")
  .option("v", "version", "Show version")
  .option("p", "project", "Path to tsconfig.json", "scalar")
  .option("c", "config", "Path to ftson.config.ts", "scalar")
  .build(
    (
      _,
      { help, version, project, config },
      { printDescription, fullName, name }
    ) => {
      if (help) {
        printDescription(fullName);
        return;
      }
      if (version) {
        console.log(`${name} v0.0.0`);
        return;
      }
      generate(project ?? "ftson.config.ts", config ?? "tsconfig.json");
    }
  );

run(program, process.argv.slice(2), undefined, "ftson", process.exit);
