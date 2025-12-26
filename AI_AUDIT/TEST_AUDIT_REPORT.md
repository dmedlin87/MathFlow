# TEST AUDIT REPORT

## 1. Mode & Evidence
- **Mode A**: Full Execution Capability.
- **Environment**: Node v22.21.1, pnpm 10.20.0, Vitest v4.0.16.
- **Preflight**: 48 Test files, 557 Tests. **3 Failures** in `ProblemBank.test.ts`.

## 2. Preflight Run
- **Failing**: `server/src/store/ProblemBank.test.ts` (3 failures).
- **Cause**: Shared state leakage (File System persistence across tests).
- **Coverage**: ~95% overall, but deep logic (BKT) has critical path checks.

## 3. Test Inventory Map (Sampled)

| Test File | Module | Behavior Claimed | Quality |
|---|---|---|---|
| `server/src/store/ProblemBank.test.ts` | `ProblemBank` | Persistence, Shuffling, Retrieval | ❌ **Flaky/Broken** (Shared State) |
| `src/domain/learner/state.test.ts` | `LearnerState` | BKT Logic, Recommendations | ✅ **High** (Caught Mutation) |
| `src/domain/generator/engine.test.ts` | `Engine` | Fallback Logic, Registry | ✅ **High** (Caught Mutation) |
| `src/components/FractionVisualizer.test.tsx` | `FractionVisualizer` | SVG Rendering, Props | ✅ **High** (Caught Mutation) |
| `src/domain/skills/grade5/nbt.test.ts` | `Grade5NBT` | Math Generation Logic | ✅ **High** (Deterministic RNG) |
| `src/domain/math-utils.test.ts` | `math-utils` | GCD, Factors, Answer Check | ✅ **High** (Pure functions) |

## 4. Risk Ranking

1.  **`server/src/store/ProblemBank.ts`** (Score: 90)
    *   **Reason**: Core persistence layer. Tests are failing and leaking state. High risk of data corruption or test flakiness hiding bugs.
2.  **`src/domain/learner/state.ts`** (Score: 85)
    *   **Reason**: Core Mastery Logic (BKT). If this breaks, the entire adaptive learning system fails. Tests are good but the module is high stakes.
3.  **`src/domain/generator/engine.ts`** (Score: 80)
    *   **Reason**: Orchestrator for all content. Network fallback logic is complex.

## 5. Contract Map

| Module | Symbol | Contract | Call Site Evidence |
|---|---|---|---|
| `LearnerState` | `updateLearnerState` | Input: State, Attempt. Output: New State. Invariant: Mastery clamped [0.01, 0.99]. | `MathTutor.tsx` calls this to update UI. Tests verify clamping. |
| `Engine` | `generate` | Input: skillId, difficulty. Output: `MathProblemItem` (validated). Error: Throws if no generator. | `recommendNextItem` relies on this returning valid items. |
| `ProblemBank` | `fetch` | Input: skillId, limit. Output: Array of items. Invariant: Verified items only. | `Engine.ts` calls this (mocked in engine tests, real in bank tests). |

## 6. Flake Report

### `server/src/store/ProblemBank.test.ts`
- **Status**: **CONFIRMED BROKEN** (Always fails in clean env if previous data exists).
- **Root Cause**: **Shared Global State (File System)**. The test writes to `data/problems.json` via `ProblemBank` but does not mock the filesystem or use a unique temp directory per test.
- **Evidence**:
    - [RUN] `Failure: Expected [] to deeply equal [ ... ]` (Found items from previous run).
    - [CODE] `ProblemBank` uses `fs/promises` directly without DI or Mocking in the test file.
- **Fix Plan**: Mock `fs/promises` using `vi.mock("fs/promises")` or use `memfs`. Alternatively, configure `ProblemBank` to use a temp dir in tests.

## 7. Mutation Notes

### Mutation 1: `src/domain/learner/state.ts`
- **Mutation**: Force `newMastery = 0.99` in `updateLearnerState` (ignoring BKT).
- **Outcome**: **KILLED** by `src/domain/learner/state.test.ts`.
- **Error**: `AssertionError: expected 0.99 to be close to 0.4`.
- **Verdict**: Test meaningfully constrains BKT logic.

### Mutation 2: `src/components/FractionVisualizer.tsx`
- **Mutation**: Force `fill="none"` for all slices.
- **Outcome**: **KILLED** by `src/components/FractionVisualizer.test.tsx`.
- **Error**: `Expected ... fill="#abc", Received ... fill="none"`.
- **Verdict**: Test meaningfully constrains visual output.

### Mutation 3: `src/domain/generator/engine.ts`
- **Mutation**: Force `id = "MUTATED_LOCAL_ID"` on generated items.
- **Outcome**: **KILLED** by `src/domain/generator/engine.test.ts`.
- **Error**: `expected ... to be { id: 'item_1' ... }`.
- **Verdict**: Test checks object identity/content strictly.

## 8. Fix Plan

1.  **Fix `ProblemBank` Tests (High Priority)**
    *   Implement `vi.mock("fs/promises")` in `server/src/store/ProblemBank.test.ts` to simulate an in-memory file system.
    *   Ensure `afterEach(() => vi.restoreAllMocks())` cleans up state.
    *   *Regression Prevented*: Flaky CI, false positives on persistence bugs.

2.  **Hardening `LearnerState` Tests**
    *   Add specific BKT calculation checks (currently strictness is good, but could be more explicit about parameters).

3.  **Visual Verification**
    *   `FractionVisualizer` tests are good, but `ProblemVisualizer` (generic) needs similar coverage if it exists.

## 9. Conclusion
The suite is generally **High Quality** in the domain layer (`src/domain`), with real, deterministic tests that catch regressions (proven via mutation). The **Critical Weakness** is `server/src/store/ProblemBank.test.ts`, which is currently failing and fundamentally flawed due to side effects.
