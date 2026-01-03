# Behavior-First Test Audit Report

## 1. Mode & Evidence
**Mode A (Execution Capable)**
- Environment: Node v22.21.1, pnpm v10.20.0
- Test Stack: Vitest, Testing Library, TypeScript
- Evidence: [RUN] logs in session history confirm successful test execution and coverage generation.

## 2. Preflight Run
- **Command:** `pnpm test run`
- **Result:** 51 files passed, 572 tests passed.
- **Coverage:** ~97.8% Statements.
- **Determinism:** 3/3 runs passed with shuffling. No flakes observed in core logic.

## 3. Test Inventory Map (Sampled)

| File | Module | Type | Claims Verified |
| :--- | :--- | :--- | :--- |
| `state.behavior.test.ts` | `state.ts` | Unit | BKT updates, Stability logic, Recommendation sorting/filtering |
| `state.strict.test.ts` | `state.ts` | Contract | Parameter fallbacks, Time boundaries, Error handling |
| `engine.behavior.test.ts` | `engine.ts` | Unit | Hybrid fallback logic (API -> Local -> Factory) |
| `MathTutor.test.tsx` | `MathTutor.tsx` | Integration | UI flows (Load, Answer, Hint, Diagnosis, Session End) |
| `ProblemBank.test.ts` | `ProblemBank.ts` | Unit | Storage logic, Verification checks, Sampling strategies |
| `fractions.test.ts` | `fractions.ts` | Unit | Generator validity, Misconception triggers, RNG determinism |
| `Dashboard.test.tsx` | `Dashboard.tsx` | Unit | Accessibility attributes, Data rendering |

## 4. Risk Ranking

1.  **`src/domain/learner/state.ts` (Score: 90)**
    *   **Why:** Core progression engine. High publicness, high complexity (BKT math + Scheduling logic).
    *   **Status:** Well-tested (`behavior` + `strict`), Mutation Sanity confirmed.
2.  **`src/domain/generator/engine.ts` (Score: 85)**
    *   **Why:** Critical path for content delivery. Complex fallback logic.
    *   **Status:** Good coverage, but relies heavily on `fetch` mocking.
3.  **`src/components/MathTutor.tsx` (Score: 75)**
    *   **Why:** Main user interface.
    *   **Status:** "Weak Integration" - mocks the Service layer entirely. Good for UI logic, bad for system integration.
4.  **`server/src/store/ProblemBank.ts` (Score: 60)**
    *   **Why:** Backend data store.
    *   **Status:** Good logic tests, but brittle filesystem mocks.

## 5. Coverage Reality Map

*   **Uncovered / Missing:**
    *   `src/services/persistence.ts`: **0% Effective Coverage**. The file exists but has NO associated test file. The coverage report shows 42% (likely from side-effects of other tests loading it), but no direct behavior is tested.
    *   `src/components/Dashboard.tsx`: **56%**. Misses edge cases in progress bar rendering and some accessibility branches.
*   **Fake Covered:**
    *   None found in sampled set. `ProblemBank` mocks FS but tests logic validly.

## 6. Contract Map

| Module | Contract | Call Sites | Audit Verdict |
| :--- | :--- | :--- | :--- |
| `updateLearnerState` | `(State, Attempt) -> NewState` | `LearnerService.ts` | ✅ Accurate. Tests cover BKT math precise to 4 decimals. |
| `recommendNextItem` | `(State) -> Promise<Item>` | `LearnerService.ts` | ✅ Accurate. Tests cover priority (Review > Learning > Random). |
| `Engine.generate` | `(skillId) -> Promise<Item>` | `LearnerService.ts` | ✅ Accurate. Tests cover fallback hierarchy. |
| `ProblemBank.save` | `(Item) -> Promise<void>` | `server/src/index.ts` | ✅ Accurate. Enforces 'VERIFIED' status. |

## 7. Test Quality Scorecard

| Test File | Classification | Notes |
| :--- | :--- | :--- |
| `state.behavior.test.ts` | ✅ **Real** | Passed Mutation Sanity. Constraints BKT math tightly. |
| `state.strict.test.ts` | ✅ **Real** | Good edge case coverage (boundaries, nulls). |
| `engine.behavior.test.ts` | ✅ **Real** | Verified fallback logic. |
| `MathTutor.test.tsx` | ⚠️ **Weak** | Mocks `LearnerService`. Verifies UI state but not system integration. |
| `fractions.test.ts` | ✅ **Real** | Excellent use of `createMockRng` to force generator paths. |
| `Dashboard.test.tsx` | ⚠️ **Weak** | Low coverage, misses logic branches. |
| `ProblemBank.test.ts` | ✅ **Real** | Good logic constraints despite FS mocks. |

## 8. Flake Report
*   **Observations:** No flakes observed in 3 runs.
*   **Risk:** `MathTutor.test.tsx` uses `setTimeout(resolve, 50)` in a mock. This is a potential flake source on slow CI. Recommendation: Use `jest.advanceTimersByTime` or `waitFor` without real delays.

## 9. Snapshot Audit
*   **Status:** Minimal snapshot usage observed in sampled files. Most tests assert specific values/DOM elements. **Good discipline.**

## 10. Mutation Notes
**Target:** `src/domain/learner/state.ts` (BKT Logic)
*   **Mutation:** In `updateLearnerState`, changed "Increase Mastery on Correct" to "Decrease Mastery".
*   **Result:** `state.behavior.test.ts` FAILED immediately.
    *   `AssertionError: expected 0.46 to be close to 0.836`
    *   `AssertionError: expected 1 to be 2` (Stability check)
*   **Conclusion:** The test **constrains behavior**. It is a Real Test.

## 11. Fix Plan (Prioritized)

1.  **[CRITICAL] Add Missing Test for `src/services/persistence.ts`**
    *   **Why:** Zero direct coverage for data saving/loading. High risk of data loss.
    *   **Plan:** Create `src/services/persistence.test.ts` testing `saveState` and `loadState` with `localStorage` mocks.

2.  **[HIGH] Improve `MathTutor` Integration Test**
    *   **Why:** Current test mocks the Service. We need *one* true integration test that wires `MathTutor` -> `LearnerService` -> `Engine` (Mocked Network) -> `State`.
    *   **Plan:** Create a new test file `src/components/MathTutor.integration.test.tsx` that uses the real `LearnerService`.

3.  **[MEDIUM] Expand `Dashboard.test.tsx`**
    *   **Why:** Low coverage (56%).
    *   **Plan:** Add tests for missing branches (e.g. error states, missing skills).

4.  **[LOW] Harden `ProblemBank` tests**
    *   **Why:** FS mocks are brittle.
    *   **Plan:** Abstract the store interface so tests can run against an in-memory implementation without mocking `fs`.

## 12. Proof of Done
*   [x] Preflight checks passed.
*   [x] Mutation Sanity check passed (Test failed when code broke).
*   [x] Audit Report generated.
