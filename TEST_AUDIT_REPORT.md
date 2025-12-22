# Behavior-First Test Audit Report

## 1. Mode & Evidence
**Mode A (Execution Capable)**
- Environment: Node v22.21.1, pnpm 10.20.0
- Execution: Ran `pnpm test run`, `pnpm run test:coverage`
- Evidence: Full runtime logs provided in Preflight.

## 2. Preflight Run
- **Command:** `pnpm test run`
- **Result:** **FAILED** (3 failures in `server/src/store/ProblemBank.test.ts`)
- **Coverage:** `server/src/store/ProblemBank.test.ts` accesses real file system due to missing mocks.
- **Failures:**
  - `ProblemBank.test.ts`: `should return an empty list when no items exist` -> Fails due to dirty state (found 1 item instead of 0).
  - `ProblemBank.test.ts`: Shuffling tests fail due to non-deterministic state or incorrect assertions relative to the polluted state.

## 3. Test Inventory Map

| Test File | Target Module | Type | Findings |
|-----------|---------------|------|----------|
| `server/src/store/ProblemBank.test.ts` | `ProblemBank` | Integration (Broken) | **CRITICAL**: Fails to mock `fs/promises`. polluted state. |
| `src/domain/generator/engine.coverage.test.ts` | `Engine` | Unit | Healthy. Good mocking of `fetch` and global objects. |
| `server/src/factory/pipeline.test.ts` | `ContentPipeline` | Unit | Healthy. Uses clear mocks for Generator/Critic/Judge. |
| `src/components/FractionVisualizer.test.tsx` | `FractionVisualizer` | Component | Healthy. Asserts DOM attributes directly (no snapshot fog). |
| `src/domain/skills/registry.consistency.test.ts` | `Registry` | Meta/Lint | Healthy. Valuates integrity of skill registry. |
| `server/src/middleware/apiKeyAuth.test.ts` | `apiKeyAuth` | Unit/Middleware | Healthy. Mocks Request/Response correctly. |
| `src/domain/skills/grade5/oa.jail.test.ts` | `OrderOpsGenerator` | Characterization | **AMBIGUOUS**: Asserts "matches /.../" on random output. Labeled "Behavior preserved". |
| `src/domain/config.test.ts` | `config` | Unit | Healthy. |
| `src/components/SessionSummary.test.tsx` | `SessionSummary` | Component | Healthy. Meaningful assertions on text content. |
| `src/domain/learner/state.behavior.test.ts` | `LearnerState` | Behavior | Healthy. Mocks Engine/RNG. |

## 4. Risk Ranking

1.  **`server/src/store/ProblemBank.ts` (Risk: 90)**
    *   **Reason:** Core persistence layer. Tests are **broken** (polluting FS, failing locally). High risk of data loss or corruption if logic is touched.
    *   **Evidence:** [RUN] `FAIL server/src/store/ProblemBank.test.ts` (AssertionError: expected [Array] to equal []).

2.  **`src/domain/learner/state.ts` (Risk: 80)**
    *   **Reason:** Core business logic (BKT, Recommendations).
    *   **Status:** Tests are healthy (`state.behavior.test.ts`), but complexity is high. Mutation testing confirmed tests are real.

3.  **`server/src/factory/pipeline.ts` (Risk: 60)**
    *   **Reason:** Complex async pipeline.
    *   **Status:** Good test coverage with mocks.

## 5. Coverage Reality Map
*   **ProblemBank:** "Covered" by execution, but validity is nullified by dirty state failures.
*   **Engine:** Good coverage of fallback paths.
*   **Visualizers:** Strong attribute-based coverage, no visual regression testing (Snapshot Fog avoided).

## 6. Contract Map
*   **ProblemBank:**
    *   *Contract:* `fetch(skillId, limit)` -> returns distinct items.
    *   *Reality:* Test assumes clean state, Code reads from disk. Mismatch.
*   **Engine:**
    *   *Contract:* `generate(skillId)` -> returns `MathProblemItem`.
    *   *Reality:* Verified. Fallback logic correctly tested.

## 7. Test Quality Scorecard

| Test | Classification | Reason |
|------|----------------|--------|
| `ProblemBank.test.ts` | ❌ **Broken/Harmful** | Reads/Writes real files. Shared state pollution. |
| `engine.coverage.test.ts` | ✅ **Behavior-constraining** | Assertions depend on specific mock outputs. |
| `FractionVisualizer.test.tsx` | ✅ **Behavior-constraining** | Checks SVG paths/attributes explicitly. |
| `state.behavior.test.ts` | ✅ **Behavior-constraining** | Verified via Mutation (caught logic flip). |
| `oa.jail.test.ts` | ⚠️ **Weak/Char.** | "Matches regex" is loose, but captures regression for specific bug. |

## 8. Flake Report
*   **`ProblemBank.test.ts`**: Fails persistently now, but is structurally flaky due to FS dependency.
    *   *Root Cause:* Missing `vi.mock('fs/promises')`.
    *   *Fix:* Implement proper FS mocking using `memfs` pattern or `vi.mock`.

## 9. Snapshot Audit
*   **Status:** Clean. No `toMatchSnapshot` usage found in sampled tests.
*   **Evidence:** `grep -r "toMatchSnapshot" .` showed matches only in `node_modules`.

## 10. Mutation Notes
*   **Target:** `src/domain/learner/state.behavior.test.ts`
*   **Mutation:** Flipped condition `roll < 0.3` to `roll > 0.3` in `recommendNextItem`.
*   **Outcome:** Test FAILED (Expected "review_skill", got "new_skill").
*   **Verdict:** Test is **REAL** and constrains the scheduling logic.

## 11. Fix Plan (Prioritized)

1.  **URGENT:** Fix `server/src/store/ProblemBank.test.ts` isolation.
    *   *Action:* Add `vi.mock('fs/promises')` and use a memory-based mock implementation for `readFile`/`writeFile`.
    *   *Benefit:* Restores green CI, prevents local FS pollution, enables valid regression testing for storage.

2.  **High:** Clarify `src/domain/skills/grade5/oa.jail.test.ts`.
    *   *Action:* Replace regex check with deterministic assertion if possible, or document as "Characterization Test".

3.  **Medium:** Expand `Engine` tests.
    *   *Action:* Add tests for error handling in `generate`.
