# `ftson`

Fast JSON powered by TypeScript

## Usage

### 1. Configure `ftson.config.ts`

```ts
import { schema } from "ftson";
import { ArbitraryType } from "./src/types/ArbitraryType";

export const stringify = {
  "./src/generated/1.ts": {
    stringify1: schema<ArbitraryType>(/* global config */)({
      // config for the type
      keyOrder: ["b", "a"],
      // config for a nested type
      fields: { b: { fields: { c: { keyOrder: ["d", "e"] } } } },
    }),
  },
};
```

### 2. Run `ftson`

```sh
npx ftson
```

A file like the one below will be generated at `./src/generated/1.ts`:

```ts
import { ArbitraryType } from "../types/ArbitraryType";

export function stringify1(input: ArbitraryType): string {
  return `{"b":${/* ... fast stringify function */},"a":${input.a}}`;
}
```

### 3. Use the generated function

It may require runtime dependencies such as `@ftson/escape`.

As you may have noticed, the heavy stringify function generator is **not** needed at runtime!

## Status

Work in Progress, incomplete.
