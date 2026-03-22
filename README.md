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

### Types

| Type | Description |
|--|--|
| `PayloadAction<P, T, M, D>` | Action with optional `payload`, `meta`, and `delta` |
| `AnyAction` | `PayloadAction<any, any, any, any>` |
| `Reducers<State, Action>` | Map of reducer handlers |
| `Slice<State, R, N>` | Return type of `createSlice` |
| `CreateStoreOptions` | Options for `createStore` |
| `CreateStoreReturn` | Return type of `createStore` |

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