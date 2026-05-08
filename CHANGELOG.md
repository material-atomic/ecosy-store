# Changelog

## 0.2.1 (2026-05-08)

### Bug Fixes

- **configureStore**: `ConfigureStoreResult.store` no longer drops the `Slices` generic. It previously typed as `ReturnType<typeof createStore>["store"]` (default generics), which erased the wired per-slice event handles — `store.<slice>.<event>` and `store.<slice>.on<Event>` were unreachable from TypeScript even though they existed at runtime.
- **combineSlices**: `CombinedEvents<Slices>` now flattens to `{ [sliceKey]: { ...eventKeys } }` to match the runtime shape `combineSlices` produces. The previous type double-nested as `{ [sliceKey]: { [sliceName]: { ...eventKeys } } }`, which made `WiredEventDomain` infer over the wrong layer and surface a single `on<SliceName>` method instead of one handler per event.

### Types

- **Adds `WiredStore<Slices>`**: explicit alias for the fully-wired Subscriber store inferred from a slice map. Resolves to `SubscriberInstance<CombinedState<Slices>, CombinedEvents<Slices> & ExtendedEventExpect> & Freezable<WiredEvents<...>>`. Re-exported from the package index — downstream packages (e.g. `@ecosy/react`) can use it directly to type their own store fields without repeating the union.

### Compatibility

- No runtime behaviour change. Pure type-level fix; consumers may delete local re-cast workarounds (`store as unknown as WiredStore<Slices>` etc.) once they upgrade.
- Downstream packages depending on `ConfigureStoreResult["store"]` (notably `@ecosy/react`'s `connectStore`) should also bump and switch their `store` field to `WiredStore<Slices>` to propagate the fix to React consumers.

---

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
