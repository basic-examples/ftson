export interface StringConfig {
  escapeHtml?: boolean;
  escapeNonAscii?: boolean;
}

export interface NumberConfig {
  maxPrecision?: number;
}

export interface GlobalConfig extends StringConfig, NumberConfig {}

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer I
) => any
  ? I
  : never;

type UnionAny<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends infer I
  ? I extends () => infer R
    ? R
    : never
  : never;

type IsUnion<T> = Exclude<T, UnionAny<T>> extends never ? false : true;

type Validate<T> = false extends UnionToIntersection<
  T extends Function ? false : T extends Symbol ? false : true
>
  ? never
  : void;

type IsSameType<A, B> = (<T>() => T extends A ? 0 : 1) extends <
  T
>() => T extends B ? 0 : 1
  ? true
  : false;

type TupleConfigInternal<
  T extends unknown[],
  R extends unknown[]
> = T extends []
  ? R
  : IsSameType<T, T[number][]> extends true
  ? {
      tuple?: R;
      restPrefix?: Config<T[number]>[];
      rest?: Config<T[number]>;
    }
  : T extends [infer First, ...infer Rest]
  ? TupleConfigInternal<Rest, [...R, Config<First>]>
  : never;

export type Config<T> = Validate<Exclude<T, null>> extends never
  ? never
  : IsUnion<Exclude<T, null>> extends true
  ? UnionToIntersection<keyof Exclude<T, null>> extends never
    ? never
    : boolean extends (Exclude<T, null> extends unknown[] ? true : false)
    ? never
    : {
        [K in keyof Exclude<T, null>]?: Config<
          Extract<Exclude<T, null>, Record<keyof Exclude<T, null>, K>>
        >;
      }
  : T extends string | null
  ? StringConfig
  : T extends number | null
  ? NumberConfig
  : T extends string | number | null
  ? StringConfig & NumberConfig
  : T extends unknown[] | null
  ? IsSameType<Exclude<T, null>, Exclude<T, null>[number][]> extends true
    ? Config<Exclude<T, null>[number]>
    : TupleConfigInternal<Exclude<T, null>, []>
  : {
      keyOrder?: (keyof Exclude<T, null>)[];
      fields?: {
        [K in keyof Exclude<T, null>]?: Config<Exclude<T, null>[K]>;
      };
    };

export declare function schema<T>(
  config?: GlobalConfig
): <const C extends Config<T>>(config?: C) => C;
