/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqual } from "@ecosy/core/utilities";
import type { Slice } from "./slice";
import type { AnyAction } from "./utils";
import type { LiteralObject } from "@ecosy/core/types";

// --- Type Utilities ---

export type SliceMap<State extends LiteralObject = {}> = {
  [Key in keyof State]: [State[Key]] extends [LiteralObject] ? Slice<State[Key], any, any> : never;
};

export type CombinedState<Slices extends SliceMap<any>> = [Slices] extends [SliceMap<infer State>]
  ? State
  : never;

export type CombinedEvents<Slices extends SliceMap<any>> = {
  [K in keyof Slices]: [Slices[K]] extends [{ events: infer Events }]
    ? [Events] extends [{}]
      ? { [E in keyof Events]: Events[E] }
      : never
    : never;
};

export type CombinedActions<Slices extends SliceMap<any>> = {
  [K in keyof Slices]: Slices[K] extends { actions: infer A }
    ? A extends Record<string, (...args: any[]) => infer R>
      ? R
      : never
    : never;
}[keyof Slices];

type Reducer<State, Action = AnyAction> = (state: State, action: Action) => State;

/** Result of {@link combineSlices}, containing merged initial state, root reducer, and event map. */
export interface CombineSlicesResult<Slices extends SliceMap> {
  initialState: CombinedState<Slices>;
  reducer: Reducer<CombinedState<Slices>, CombinedActions<Slices>>;
  events: CombinedEvents<Slices>;
}

/**
 * Combines multiple slices into a single initial state, root reducer, and event map.
 * The root reducer delegates each action to the appropriate slice reducer.
 *
 * @param slices - A map of slice name → Slice instance.
 * @returns An object with `initialState`, `reducer`, and `events`.
 */
export function combineSlices<Slices extends SliceMap<any>>(slices: Slices) {
  const initialState = {} as CombinedState<Slices>;
  const events: Record<string, Record<string, string>> = {};

  for (const key in slices) {
    initialState[key as unknown as keyof CombinedState<Slices>] = slices[key].initialState;
    events[key] = slices[key].events[slices[key].name as string] ?? {};
  }

  type Action = CombinedActions<Slices>;

  const reducer = (state: CombinedState<Slices> = initialState, action: Action) => {
    let changed = false;
    const next = { ...state };

    for (const key in slices) {
      const prev = state[key as unknown as keyof CombinedState<Slices>];
      const sliceNext = slices[key].reducer(prev, action as AnyAction);

      if (!isEqual(prev, sliceNext)) {
        next[key as unknown as keyof CombinedState<Slices>] = sliceNext;
        changed = true;
      }
    }

    return changed ? next : state;
  };

  return { initialState, reducer, events } as unknown as CombineSlicesResult<Slices>;
}
