/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LiteralObject, ToString } from "@ecosy/core/types";
import { clone, isEqual } from "@ecosy/core/utilities";
import type { AnyAction, PayloadAction, ReducerHandler, Reducers } from "./utils";
import { getType } from "./utils";

export interface CreateSliceOptions<
  State extends LiteralObject,
  R extends Reducers<State, AnyAction>,
  N extends string = string,
> {
  initialState: State | (() => State);
  reducers: R;
  name: N;
}

function extractState<State extends LiteralObject>(getter: State | (() => State)): State {
  return typeof getter === "function" ? getter() : getter;
}

const INITIALIZE = "$$initialize";

type EventTemplate<Name extends string, Key extends PropertyKey> = `$${Name}:${ToString<Key>}`;

type SliceEvents<
  R extends Reducers<any, any>,
  N extends string,
> = {
  [N_ in N]: {
    [K in keyof R]: EventTemplate<N_, K>;
  };
};

type ExtractActionProps<A> = A extends { payload: infer P }
  ? A extends { meta: infer M }
    ? A extends { delta: infer D }
      ? [P, M, D]
      : [P, M, never]
    : [P, never, never]
  : [never, never, never];

type SliceActions<R extends Record<string, any>, N extends string> = {
  [K in keyof R]: R[K] extends (state: any, action: infer A) => any
    ? ExtractActionProps<A> extends [infer P, infer M, infer D]
      ? [P] extends [never]
        ? () => PayloadAction<never, EventTemplate<N, Extract<K, string>>>
        : [M] extends [never]
          ? (payload: P) => PayloadAction<P, EventTemplate<N, Extract<K, string>>, never, never>
          : [D] extends [never]
            ? (payload: P, meta: M) => PayloadAction<P, EventTemplate<N, Extract<K, string>>, M, never>
            : (payload: P, meta: M, delta: D) => PayloadAction<P, EventTemplate<N, Extract<K, string>>, M, D>
      : never
    : () => PayloadAction<never, EventTemplate<N, Extract<K, string>>>;
};

type Reducer<State> = (state: State, action: AnyAction) => State;

/**
 * Represents a created slice with its name, initial state, typed actions,
 * reducer function, and event channel definitions.
 */
export interface Slice<
  State extends LiteralObject,
  R extends Reducers<State, AnyAction>,
  N extends string,
> {
  name: N;
  initialState: State;
  actions: SliceActions<R, N>;
  reducer: Reducer<State>;
  events: SliceEvents<R, N>;
}

/**
 * Creates a state slice with auto-generated action creators and a combined reducer.
 * Each reducer key generates a typed action creator and an event channel `$name:key`.
 *
 * @param options - Slice configuration including `name`, `initialState`, and `reducers`.
 * @returns A `Slice` object with `name`, `initialState`, `actions`, `reducer`, and `events`.
 *
 * @example
 * ```ts
 * const counterSlice = createSlice({
 *   name: "counter",
 *   initialState: { count: 0 },
 *   reducers: {
 *     increment: (state) => ({ ...state, count: state.count + 1 }),
 *     add: (state, action: PayloadAction<number>) => ({ ...state, count: state.count + action.payload }),
 *   },
 * });
 * ```
 */
export function createSlice<
  State extends LiteralObject,
  R extends Reducers<State, AnyAction>,
  N extends string = string,
>(options: CreateSliceOptions<State, R, N>) {
  const { initialState, name, reducers } = options;

  const extractedState = extractState(initialState);
  const actions: Record<string, unknown> = {};
  const transformedReducers: Record<string, ReducerHandler<State, AnyAction>> = {};
  const domainEvents: Record<string, string> = {};

  Object.entries(reducers).forEach(([actionKey]) => {
    const type = getType(name, actionKey);

    actions[actionKey] = (...args: any[]) => ({
      type,
      payload: args[0],
      meta: args[1],
      delta: args[2],
    });

    transformedReducers[type] = reducers[actionKey];
    domainEvents[actionKey] = type;
  });

  const events = { [name]: domainEvents } as SliceEvents<R, N>;

  function reducer(state: State = extractedState, action: AnyAction): State {
    if (action?.type === INITIALIZE) {
      return extractedState;
    }

    const handle = transformedReducers[action.type];

    if (!handle) {
      return state ?? extractedState;
    }

    const snapshot = clone(state);
    const next = handle(snapshot, action) ?? snapshot;

    return isEqual(state, next) ? state : next;
  }

  return {
    name,
    initialState: extractedState,
    actions,
    reducer,
    events,
  } as Slice<State, R, N>;
}
