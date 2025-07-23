import { schema } from "ftson";
import { ArbitraryType } from "./src/types/ArbitraryType";

export const stringify = {
  "./src/generated/1.ts": {
    stringify1: schema<ArbitraryType>()({
      keyOrder: ["b", "a"],
      fields: { b: { fields: { c: { keyOrder: ["d", "e"] } } } },
    }),
  },
};
