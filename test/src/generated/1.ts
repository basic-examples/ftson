import { ArbitraryType } from "../types/ArbitraryType";

export function stringify1(input: ArbitraryType): string {
  return `{"a":${input.a},"b":${JSON.stringify(input.b)}}`;
}
