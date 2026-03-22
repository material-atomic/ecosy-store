/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LiteralObject } from "@ecosy/core/types";

/** Action type with optional `payload`, `meta`, and `delta` fields. */
export type PayloadAction<Payload = never, T = string, Meta = never, Delta = never> = {
  type: T;
} & ([Delta] extends [never]
  ? [Meta] extends [never]
    ? [Payload] extends [never]
      ? {}
      : { payload: Payload }
    : {
        payload: Payload;
        meta: Meta;
      }
  : {
      payload: Payload;
      meta: Meta;
      delta: Delta;
    });

export type AnyAction = PayloadAction<any, any, any, any>;
export type StateResult<State extends LiteralObject> = State | void;

type ReducerEmpty<State extends LiteralObject> = (state: State) => StateResult<State>;
type ReducerPayload<
  State extends LiteralObject,
  Action extends PayloadAction<any, any, any, any>,
> = (state: State, action: Action) => StateResult<State>;

export type ReducerHandler<
  State extends LiteralObject,
  Action extends PayloadAction<any, any, any, any>,
> = [Action] extends [never] ? ReducerEmpty<State> : ReducerPayload<State, Action>;

export type Reducers<
  State extends LiteralObject,
  Action extends AnyAction,
> = {
  [key: string]: ReducerHandler<State, Action>;
};

/**
 * Generates a channel type string in the format `$prefix:key`.
 *
 * @param prefix - The domain or slice name.
 * @param key - The action/event key.
 * @returns A formatted event channel string.
 */
export function getType(prefix: string, key: string) {
  return `$${prefix}:${key}`;
}
