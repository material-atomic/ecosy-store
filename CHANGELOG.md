# Changelog

## 0.2.0 (2026-04-15)

### Features

- **combineSlices**: merges multiple slices into a single initial state, root reducer, and event map (moved in from `@ecosy/react` so it can be used in non-React runtimes)
- **configureStore**: framework-agnostic store factory for combined slices. Returns `{ store, dispatch, getState, hydrate }` and is safe to use in Workers, Server, and any runtime
- **Types**: exports `SliceMap`, `CombinedState`, `CombinedEvents`, `CombinedActions`, `CombineSlicesResult`, `ConfigureStoreOptions`, `ConfigureStoreResult`

### Improvements

- Internal type definitions reformatted for readability (no behavior change)

---

## 0.1.0 (2026-03-22)

### Features

- **createSlice**: auto-generated action creators, reducer, and event channels from a single config
- **createStore**: event-driven store backed by `Subscriber` with typed actions and signals
- **Types**: `PayloadAction`, `AnyAction`, `Reducers`, `Slice`, `CreateStoreOptions`, `CreateStoreReturn`
- **Utilities**: `getType` for generating event channel strings
