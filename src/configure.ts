/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqual } from "@ecosy/core/utilities";
import type { ExtendedEventExpect } from "@ecosy/core/subscriber";
import type { PartialLiteral } from "@ecosy/core/types";
import { createStore } from "./store";
import type { CombineSlicesResult, CombinedState, CombinedEvents, CombinedActions, SliceMap } from "./combine";
import type { AnyAction, Reducers } from "./utils";

export interface ConfigureStoreOptions<Slices extends SliceMap<any>, Signals extends string[] = []> {
  slices: CombineSlicesResult<Slices>;
  signals?: Signals;
}

export interface ConfigureStoreResult<Slices extends SliceMap<any>> {
  store: ReturnType<typeof createStore>["store"];
  dispatch: (action: CombinedActions<Slices>) => void;
  getState: () => CombinedState<Slices>;
  hydrate: (state: PartialLiteral<CombinedState<Slices>>) => void;
}

/**
 * Khởi tạo Store từ combined slices. Framework-agnostic (không phụ thuộc React).
 * Dùng được ở Worker, Server, hoặc bất kỳ runtime nào.
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

  // 1. Tạo store cơ sở qua createStore (single store + subscriber)
  const { store } = createStore<State, Reducers<State, AnyAction>, Events, never, Signals>({
    initialState,
    extraEvents: events as Events,
    signals,
  });

  type Action = CombinedActions<Slices>;

  // 2. Dispatch: chạy combined reducer → setState → dispatch event channel
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

  // 4. Hydrate: đổ dữ liệu server vào store
  function hydrate(state: PartialLiteral<State>) {
    store.setState(state);
  }

  return { store, dispatch, getState, hydrate } as ConfigureStoreResult<Slices>;
}
