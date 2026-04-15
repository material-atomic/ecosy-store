/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ExtendedEventExpect, Subscriber } from "@ecosy/core/subscriber";
import {
  type AnyAction,
  getType,
  type PayloadAction,
  type Reducers,
  type StateResult,
} from "./utils";
import type { LiteralObject, PartialLiteral, ToString } from "@ecosy/core/types";

type EventTemplate<Name extends string, Key extends PropertyKey> = `$${Name}:${ToString<Key>}`;

type ExtractEvents<R extends Reducers<any, any>, N = never, Signals extends string[] = []> = [
  N,
] extends [string]
  ? {
      [Name in N]: {
        [Key in keyof R]: EventTemplate<Name, Key>;
      };
    }
  : {
      signals: {
        [S in Signals[number]]: EventTemplate<"signals", S>;
      };
    };

type Actions<
  R extends Reducers<any, any>,
  N extends string | never = never,
  Signals extends string[] = string[],
> = {
  signals: {
    [S in Signals[number] & ([N] extends [never] ? keyof R : never)]: () => void;
  };
} & {
  [K in keyof R]: R[K] extends (state: any) => any
    ? () => void
    : R[K] extends (state: any, action: PayloadAction<infer P, string, infer M, infer D>) => any
      ? [P] extends [never]
        ? () => void
        : [M] extends [never]
          ? (payload: P) => void
          : [D] extends [never]
            ? (payload: P, meta: M) => void
            : (payload: P, meta: M, delta: D) => void
      : () => void;
};

/** Options for creating a store via {@link createStore}. */
export interface CreateStoreOptions<
  S extends LiteralObject,
  R extends Reducers<S, AnyAction> = Reducers<S, AnyAction>,
  N extends string | never = never,
  E extends ExtendedEventExpect = {},
  Signals extends string[] = [],
> {
  name?: N;
  initialState?: S | PartialLiteral<S>;
  reducers?: R;
  extraEvents?: E;
  signals?: Signals;
}

/** Return value of {@link createStore}, containing the wired store and action dispatchers. */
export interface CreateStoreReturn<
  Store,
  R extends Reducers<any, any>,
  N extends string | never,
  Signals extends string[] = [],
> {
  store: Store;
  actions: Actions<R, N, Signals>;
}

/**
 * Creates a new store backed by a `Subscriber` instance.
 * Wires reducer-based event channels, optional signals, and extra events.
 *
 * @param options - Store configuration including initial state, reducers, extra events, and signals.
 * @returns An object with the wired `store` and typed `actions` dispatchers.
 *
 * @example
 * ```ts
 * const { store, actions } = createStore({
 *   name: "counter",
 *   initialState: { count: 0 },
 *   reducers: {
 *     increment: (state) => ({ ...state, count: state.count + 1 }),
 *   },
 * });
 * ```
 */
export function createStore<
  S extends LiteralObject,
  R extends Reducers<S, AnyAction> = Reducers<S, AnyAction>,
  E extends ExtendedEventExpect = {},
  N extends string | never = never,
  Signals extends string[] = [],
>(options: CreateStoreOptions<S, R, N, E, Signals>) {
  type AllEvents = ExtractEvents<R, N, Signals> & E;

  const { initialState, extraEvents, reducers, name, signals: signalNames } = options;

  // 1. Iterate reducers → build getAction + finalEvents

  const finalEvents: Record<string, Record<string, string>> = {};

  if (reducers) {
    const domain = name || "signals";

    if (!finalEvents[domain]) {
      finalEvents[domain] = {};
    }

    for (const key of Object.keys(reducers)) {
      finalEvents[domain][key] = getType(domain, key);
    }
  }

  // 2. Explicit signals → add to finalEvents.signals

  if (signalNames?.length) {
    if (!finalEvents["signals"]) {
      finalEvents["signals"] = {};
    }

    for (const sig of signalNames) {
      finalEvents["signals"][sig] = getType("signals", sig);
    }
  }

  // 3. Merge extraEvents

  const combinedEvents = Object.assign({} as AllEvents, finalEvents, extraEvents);

  // 4. Create store instance + wire

  const instance = new Subscriber<S, AllEvents>(initialState, combinedEvents);
  const store = Subscriber.wire(instance, combinedEvents);

  // 5. Build actions (reducer wrappers using getAction)
  const actions: Record<string, (...args: unknown[]) => void> = {};

  if (reducers) {
    const domain = name || "signals";

    for (const [key, reducer] of Object.entries(reducers)) {
      const channel = finalEvents[domain][key];

      actions[key] = (...args: unknown[]) => {
        const action = {
          type: getType(domain, key),
          payload: args[0],
          meta: args[1],
          delta: args[2],
        };
        const state = store.shallow.clone(store.getState()) as S;
        const nextState =
          (reducer as (state: S, action: unknown) => StateResult<S>)(state, action) ?? state;
        store.setState(nextState);
        store.dispatch(channel, action);
      };
    }
  }

  return { store, actions } as CreateStoreReturn<typeof store, R, N, Signals>;
}
