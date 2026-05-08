/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqual } from "@ecosy/core/utilities";
import type {
  ExtendedEventExpect,
  SubscriberInstance,
  WiredEvents,
} from "@ecosy/core/subscriber";
import type { Freezable, PartialLiteral } from "@ecosy/core/types";
import { createStore } from "./store";
import type { CombineSlicesResult, CombinedState, CombinedEvents, CombinedActions, SliceMap } from "./combine";
import type { AnyAction, Reducers } from "./utils";

export interface ConfigureStoreOptions<Slices extends SliceMap<any>, Signals extends string[] = []> {
  slices: CombineSlicesResult<Slices>;
  signals?: Signals;
}

/**
 * Fully-typed wired store inferred from a slice map. Exposes both the
 * underlying `Subscriber` API (`getState`, `setState`, `subscribe`, ...) and
 * the per-slice event handles synthesised by `Subscriber.wire`. For slices
 * `{ error: { add, pop } }` the result includes `store.error.onAdd(...)`,
 * `store.error.add(...)`, and so on.
 */
export type WiredStore<Slices extends SliceMap<any>> = SubscriberInstance<
  CombinedState<Slices>,
  CombinedEvents<Slices> & ExtendedEventExpect
> &
  Freezable<WiredEvents<CombinedEvents<Slices> & ExtendedEventExpect>>;

export interface ConfigureStoreResult<Slices extends SliceMap<any>> {
  store: WiredStore<Slices>;
  dispatch: (action: CombinedActions<Slices>) => void;
  getState: () => CombinedState<Slices>;
  hydrate: (state: PartialLiteral<CombinedState<Slices>>) => void;
}

/**
 * Initialise a Store from combined slices. Framework-agnostic — safe to use
 * in Workers, on the server, or any runtime.
 *
 * @example
 * ```ts
 * const combined = combineSlices({ counter: counterSlice, user: userSlice });
 * const { store, dispatch, getState } = configureStore({ slices: combined });
 * ```
 */
export function configureStore<Slices extends SliceMap<any>, Signals extends string[] = []>(
  options: ConfigureStoreOptions<Slices, Signals>,
): ConfigureStoreResult<Slices> {
  const { slices, signals } = options;
  const { initialState, reducer, events } = slices;

  type State = CombinedState<Slices>;
  type Events = CombinedEvents<Slices> & ExtendedEventExpect;

  // 1. Build the underlying store via createStore (single store + subscriber)
  const { store } = createStore<State, Reducers<State, AnyAction>, Events, never, Signals>({
    initialState,
    extraEvents: events as Events,
    signals,
  });

  type Action = CombinedActions<Slices>;

  // 2. Dispatch: run the combined reducer → setState → fire event channel
  function dispatch(action: Action) {
    const current = store.getState() as State;
    const next = reducer(current, action);
    const act = action as Record<string, unknown>;

    if (!isEqual(store.getState(), next)) {
      store.setState(next);
    }

    if (typeof act.type === "string") {
      store.dispatch(act.type, action);
    }
  }

  // 3. getState
  function getState() {
    return store.getState() as State;
  }

  // 4. Hydrate: load server-rendered state into the store
  function hydrate(state: PartialLiteral<State>) {
    store.setState(state);
  }

  return { store, dispatch, getState, hydrate } as ConfigureStoreResult<Slices>;
}
