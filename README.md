# @ecosy/store

Lightweight state management with slices, reducers, and event-driven architecture for TypeScript applications.

## Installation

```bash
npm install @ecosy/store
# or
yarn add @ecosy/store
```

> **Note:** `@ecosy/core` is installed automatically as a dependency.

## API

### `createSlice`

Creates a state slice with auto-generated action creators, a reducer, and event channels.

```ts
import { createSlice, type PayloadAction } from "@ecosy/store";

const counterSlice = createSlice({
  name: "counter",
  initialState: { count: 0 },
  reducers: {
    increment: (state) => ({ ...state, count: state.count + 1 }),
    decrement: (state) => ({ ...state, count: state.count - 1 }),
    add: (state, action: PayloadAction<number>) => ({
      ...state,
      count: state.count + action.payload,
    }),
  },
});

// Auto-generated action creators
counterSlice.actions.increment();
// => { type: "$counter:increment" }

counterSlice.actions.add(5);
// => { type: "$counter:add", payload: 5 }

// Reducer
const next = counterSlice.reducer({ count: 0 }, counterSlice.actions.add(5));
// => { count: 5 }

// Event channels
counterSlice.events;
// => { counter: { increment: "$counter:increment", decrement: "$counter:decrement", add: "$counter:add" } }
```

### `createStore`

Creates a store backed by a `Subscriber` instance with event wiring and typed actions.

```ts
import { createStore } from "@ecosy/store";

const { store, actions } = createStore({
  name: "app",
  initialState: { theme: "light" },
  reducers: {
    toggleTheme: (state) => ({
      ...state,
      theme: state.theme === "light" ? "dark" : "light",
    }),
  },
});

// Listen to state changes
store.onStateChange((state) => {
  console.log("Theme:", state.theme);
});

// Dispatch actions
actions.toggleTheme(); // logs "Theme: dark"

// Get current state
store.getState(); // { theme: "dark" }
```

#### Signals

Fire-and-forget events that don't modify state:

```ts
const { store, actions } = createStore({
  initialState: { count: 0 },
  reducers: {
    increment: (state) => ({ ...state, count: state.count + 1 }),
  },
  signals: ["reset", "sync"],
});

// Signals are available as actions
actions.signals.reset();
actions.signals.sync();
```

---

### `combineSlices(slices)`

Merges multiple slices into a single initial state, a root reducer, and an event map.

```ts
import { combineSlices, createSlice } from "@ecosy/store";

const counterSlice = createSlice({ /* ... */ });
const userSlice = createSlice({ /* ... */ });

const combined = combineSlices({
  counter: counterSlice,
  user: userSlice,
});

combined.initialState; // { counter: { ... }, user: { ... } }
combined.reducer;      // root reducer delegating per-slice
combined.events;       // merged event channel map
```

### `configureStore(options)`

Framework-agnostic store factory for combined slices. Safe to use in Workers, Server, or any non-React runtime.

```ts
import { configureStore } from "@ecosy/store";

const { store, dispatch, getState, hydrate } = configureStore({
  slices: combined,
  signals: ["reset", "sync"],
});

dispatch(counterSlice.actions.increment());
getState();
hydrate({ counter: { count: 42 } });
```

For React bindings (`useSelector`, `useDispatch`, `createSelector`), use [`@ecosy/react`](https://github.com/material-atomic/ecosy-react)'s `connectStore`, which is built on top of `configureStore`.

---

### Types

| Type | Description |
|--|--|
| `PayloadAction<P, T, M, D>` | Action with optional `payload`, `meta`, and `delta` |
| `AnyAction` | `PayloadAction<any, any, any, any>` |
| `Reducers<State, Action>` | Map of reducer handlers |
| `Slice<State, R, N>` | Return type of `createSlice` |
| `CreateStoreOptions` / `CreateStoreReturn` | Options and return type of `createStore` |
| `SliceMap`, `CombinedState`, `CombinedEvents`, `CombinedActions`, `CombineSlicesResult` | Helpers for `combineSlices` |
| `ConfigureStoreOptions`, `ConfigureStoreResult` | Options and return type of `configureStore` |

### `getType(prefix, key)`

Generates event channel strings:

```ts
import { getType } from "@ecosy/store";

getType("counter", "increment"); // "$counter:increment"
```

---

## Related packages

| Package | Description |
|--|--|
| [`@ecosy/core`](https://github.com/material-atomic/ecosy-core) | Types, utilities, and pub/sub subscriber |
| [`@ecosy/react`](https://github.com/material-atomic/ecosy-react) | React hooks for `@ecosy/store` |

## License

MIT