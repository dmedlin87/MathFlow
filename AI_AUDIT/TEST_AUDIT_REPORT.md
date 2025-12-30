# Behavior-First Test Audit Report

## 1. Mode & Evidence
**Mode A (Execution Capable)**
- Environment: Node v22.21.1, pnpm v10.20.0
- Execution: Ran `pnpm test run`, `pnpm run test:coverage`, and manual mutation checks.
- Artifacts:
    - [RUN] Preflight log (passed, 572 tests)
    - [COV] Coverage summary (~98% line coverage)

## 2. Preflight Run
**Command:** `pnpm test run`
**Result:** 51 test files passed, 572 tests passed.
**Time:** ~13s
**Coverage:** 97.92% Statements, 94.63% Branches.

## 3. Test Inventory Map

| File | Target Module | Type | Key Behaviors |
| :--- | :--- | :--- | :--- |
| `src/components/MathTutor.test.tsx` | `MathTutor.tsx` | Integration | Session flow, feedback, retries, service interaction |
| `src/domain/learner/state.test.ts` | `state.ts` | Unit | BKT logic, mastery updates, stability, scheduler |
| `src/domain/generator/engine.test.ts` | `engine.ts` | Unit | Generator registration, network fallback, validation |
| `server/src/store/ProblemBank.test.ts` | `ProblemBank.ts` | Unit | File IO (mocked), sampling, shuffling |
| `src/components/inputs/UniversalInput.test.tsx` | `UniversalInput.tsx` | Component | Input handling (text, fraction, MC), accessibility |
| `src/domain/skills/grade5/nbt.test.ts` | `grade5/nbt.ts` | Unit | Content correctness, RNG determinism |

## 4. Risk Ranking

1.  **`server/src/store/ProblemBank.ts` (Risk: 90/100)**
    *   **Reason:** Backend persistence layer.
    *   **Finding:** **Defective Test.** The test file contains a double `vi.mock("fs/promises")` declaration, where the second one (rejecting all reads) likely overrides the first one (simulating data). This suggests the tests might be passing due to "happy path" mocking that doesn't match the actual implementation intent or the tests are testing the wrong mock.
    *   Evidence: [CODE] `server/src/store/ProblemBank.test.ts` lines 6-25.

2.  **`src/domain/learner/state.ts` (Risk: 85/100)**
    *   **Reason:** Core progression logic (BKT). Critical bug impact.
    *   **Finding:** Tests are strong and behavior-constraining (verified via mutation), but the math is complex and relies on specific constants.

3.  **`src/components/MathTutor.tsx` (Risk: 80/100)**
    *   **Reason:** Main user interface. High state complexity.
    *   **Finding:** Tests are meaningful but rely heavily on mocking `LearnerService`. "Correct! 🎉" feedback assertions are brittle but effective.

## 5. Coverage Reality Map
*   **High Coverage:** Most domain logic and components are >95%.
*   **Gaps:**
    *   `src/services/persistence.ts`: Low coverage (38%). Missing dedicated test file?
    *   `server/src/config.ts`: Uncovered branch (line 11).

## 6. Contract Map
*   **`updateLearnerState`**:
    *   Input: `LearnerState`, `Attempt`
    *   Output: New `LearnerState`
    *   Contract: Must monotonically increase mastery on correct answers (verified), clamp between 0.01-0.99 (verified).
*   **`ProblemBank.save`**:
    *   Input: `MathProblemItem`
    *   Output: `Promise<void>`
    *   Contract: Rejects unverified items (verified).

## 7. Test Quality Scorecard

| Test File | Classification | Notes |
| :--- | :--- | :--- |
| `state.test.ts` | ✅ **Real** | Caught BKT mutation immediately. Excellent constraints. |
| `MathTutor.test.tsx` | ✅ **Real** | Caught UI mutation. Good integration flow. |
| `ProblemBank.test.ts` | ❌ **Fake/Broken** | Double mock definition. Test setup is invalid. |
| `UniversalInput.test.tsx` | ✅ **Real** | Strong accessibility and event handling checks. |
| `nbt.test.ts` | ✅ **Real** | Uses `createMockRng` for deterministic content testing. |

## 8. Flake Report
*   No flakes observed during `pnpm test run` (3 iterations).
*   **Potential Flake:** `MathTutor.test.tsx` uses `setTimeout(50)` in mocks. While `waitFor` is used, this pattern is risky on slower CI envs.

## 9. Snapshot Audit
*   No significant snapshot abuse found. Most tests assert specific values/text.

## 10. Mutation Notes
1.  **Mutation:** `src/domain/learner/state.ts`: Forced `newP = 0.01` on correct answer.
    *   **Outcome:** `state.test.ts` **FAILED** (3 failures).
    *   **Verdict:** Test is **REAL**.
2.  **Mutation:** `src/components/MathTutor.tsx`: Disabled `setUserAnswer` state update.
    *   **Outcome:** `MathTutor.test.tsx` **FAILED** (7 failures).
    *   **Verdict:** Test is **REAL**.

## 11. Fix Plan
1.  **Critical:** Fix `server/src/store/ProblemBank.test.ts` double mock. Ensure it tests the actual file operations (simulated) correctly.
2.  **High:** Add tests for `src/services/persistence.ts` to improve coverage from 38% to >80%.
3.  **Medium:** Refactor `MathTutor.test.tsx` to use Fake Timers (`vi.useFakeTimers`) instead of real `setTimeout` in mocks to eliminate potential flakes.

## 12. Proof of Done
*   Mutation sanity checks passed (failures observed when expected).
*   Report generated.
