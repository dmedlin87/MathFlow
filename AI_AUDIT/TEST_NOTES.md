# Test Notes

## Call-Site Map

### `src/domain/generator/engine.ts`

**Exported Class:** `Engine`
- `constructor(config: EngineConfig)`
  - Callers: `engine.ts` (default export), `engine.behavior.test.ts`, `engine.strict.test.ts`.
- `register(generator: Generator)`
  - Callers: `engine.ts` (module init), `engine.*.test.ts`.
- `generate(skillId, difficulty, rng?)`
  - Callers: `src/domain/learner/state.ts` (recommendNextItem), tests.

**Behavioral Contract (Engine.generate):**
- **Inputs:** `skillId` (string), `difficulty` (0-1), `rng` (function, optional)
- **Outputs:** `Promise<MathProblemItem>`
- **Invariants:** Always returns a validated item or throws. Prioritizes API -> Factory -> Local.
- **Errors:** Throws if no generator found and all fallbacks fail.

### `src/services/persistence.ts`

**Exported Object:** `PersistenceService`
- `saveState(state: LearnerState)`
  - Callers: `App.tsx` (on state change), tests.
- `loadState()`
  - Callers: `App.tsx` (initialization), tests.

**Behavioral Contract (PersistenceService):**
- **Inputs:** `LearnerState`
- **Outputs:** `void` (save), `LearnerState | null` (load)
- **Invariants:** Must not crash on StorageQuotaExceeded. Must return null on corrupt data.
- **Errors:** Swallows errors and logs them.

## Tests Added

### `src/domain/generator/engine.behavior.test.ts`
- **Added:** `falls back to Local generator if bank is empty AND factory fails`
  - **Behavior:** Ensures that if the verified problem bank is empty (`[]`) AND the JIT factory returns 500/NetworkError, the system gracefully degrades to local generation.
  - **Why:** This path was logically present but untested.
- **Added:** `falls back to Local generator if bank is empty AND factory returns empty items`
  - **Behavior:** Ensures fallback if both API sources are empty.

### `src/services/persistence.behavior.test.ts`
- **Added:** `saveState` success.
- **Added:** `saveState` handles `QuotaExceededError` (asserts no throw, console error called).
- **Added:** `loadState` success.
- **Added:** `loadState` returns null on missing key.
- **Added:** `loadState` returns null and logs error on JSON parse failure (corrupt data).

## Mutation Sanity Check

**Target:** `learner/state.ts`
**Mutation:**
In `updateLearnerState`, I changed:
```typescript
const learningRate = skillDef?.bktParams?.learningRate ?? 0.1;
```
to
```typescript
const learningRate = 0.9; // Force high learning rate
```

**Result:** `src/domain/learner/state.strict.test.ts` FAILED.
- Test `uses default BKT parameters when skill def has no params` failed.
- Expected `0.83636` (approx), Received `0.9` range.
- This confirms that `state.strict.test.ts` is correctly asserting the mathematical properties of the BKT update, preventing silent regressions in learning parameters.

**Target:** `services/persistence.ts`
**Mutation:**
Removed `try/catch` in `loadState`.
**Result:** `persistence.behavior.test.ts` FAILED.
- Test `returns null and logs error if stored data is corrupt` threw SyntaxError instead of returning null.

## Coverage Summary

- **Before:** `persistence.ts` ~38% coverage.
- **After:** `persistence.ts` 100% coverage.
- **Engine:** `engine.ts` remained 100%, but behavioral assertions are now stricter regarding fallbacks.
