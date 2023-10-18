import { tags } from 'typia';

type IntNumber = number & tags.Type<'uint32'> & tags.Minimum<1> & tags.Maximum<99>;

type NotEmptyArray = tags.MinItems<3> & tags.MaxItems<5>;

export type MockResponse<T extends Record<any, any>> = {
  [K in keyof T]: T[K] extends number
    ? IntNumber
    : T[K] extends (infer R)[]
    ? R extends number
      ? IntNumber[] & NotEmptyArray
      : R extends Record<any, any>
      ? MockResponse<R>[] & NotEmptyArray
      : R[] & NotEmptyArray
    : T[K] extends Record<any, any>
    ? MockResponse<T[K]>
    : T[K];
};
