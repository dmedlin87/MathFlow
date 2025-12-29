# Behavior-First Test Audit Report

## 1. Mode & Evidence
- **Mode**: Mode A (Execution Capable)
- **Environment**: Node v22.21.1, PNPM 10.20.0, Vitest
- **Execution**: Full suite ran successfully (572 tests).
- **Artifacts**: `preflight_test_output.txt`, `preflight_coverage_output.txt`.

## 2. Preflight Run
- **Command**: `pnpm test run`
- **Result**: 572 passed, 0 failed.
- **Determinism**: Ran 3 times with consistent pass.
- **Speed**: Full suite takes ~14s. `MathTutor.test.tsx` is slowest (~1-2s).
- **Coverage**: High (97.83% Stmts). `src/services/persistence.ts` is low (42%).

## 3. Test Inventory Map (Sampled)

| Test File | Target Module | Type | Behaviors Claimed |
|-----------|---------------|------|-------------------|
| `MathTutor.test.tsx` | `MathTutor.tsx` | Integration | Session flow, Feedback display, Hints, Input handling |
| `engine.test.ts` | `engine.ts` | Unit | Registry lookup, API Fallback, Error handling |
| `state.test.ts` | `state.ts` | Unit | BKT Mastery updates, Stability logic, Clamping |
| `ProblemBank.test.ts` | `ProblemBank.ts` | Unit | Storage, Shuffling, Verification check |
| `nbt.test.ts` | `nbt.ts` | Unit | Generator validity, Content correctness |
| `UniversalInput.test.tsx` | `UniversalInput.tsx` | Component | Input rendering, Accessibility, Event handling |
| `validation.test.ts` | `validation.ts` | Unit | Schema validation |
| `index.test.ts` | `server/index.ts` | Unit | Route definitions (basic) |
| `persistence.test.ts` | `persistence.ts` | Unit | LocalStorage wrapper |
| `Dashboard.test.tsx` | `Dashboard.tsx` | Component | UI rendering |

## 4. Risk Ranking

1.  **`src/domain/generator/engine.ts` (Score: 85)**
    *   *Publicness*: High (Core singleton used by Service).
    *   *Branchiness*: High (Fallback logic: API -> Factory -> Local).
    *   *Bug Impact*: Critical (If fails, user gets no problems).
    *   *Test Weakness*: Tests rely heavily on `mockFetch`.

2.  **`src/domain/learner/state.ts` (Score: 80)**
    *   *Publicness*: High (Core state management).
    *   *Branchiness*: Medium (BKT formulas).
    *   *Bug Impact*: High (Progress loss/corruption).
    *   *Test Weakness*: Low (Strong behavioral tests).

3.  **`src/components/MathTutor.tsx` (Score: 75)**
    *   *Publicness*: High (Main User Interface).
    *   *Branchiness*: High (UI states: Loading, Error, Success, Retry, Hints).
    *   *Bug Impact*: High (UX broken).
    *   *Test Weakness*: Low (Good integration tests).

4.  **`server/src/store/ProblemBank.ts` (Score: 60)**
    *   *Publicness*: Medium (Backend internal).
    *   *Branchiness*: Medium (Shuffling logic).
    *   *Bug Impact*: Medium (Repeated questions).
    *   *Test Weakness*: Medium (Mocks FS and Math.random).

## 5. Coverage Reality Map

*   **`src/services/persistence.ts`**: Low coverage (42%). Error handling branches for `localStorage` are likely uncovered or stubbed out in a way that doesn't test failure.
*   **`src/components/MathTutor.tsx`**: High coverage, but "Dev Mode" logic might be brittle or under-tested in real scenarios.
*   **`src/domain/generator/engine.ts`**: High coverage, but "Factory" integration path is heavily mocked.

## 6. Contract Map

### `Engine.generate(skillId, difficulty)`
*   **Input**: `skillId` (string), `difficulty` (number 0-1).
*   **Output**: Promise<`MathProblemItem`>.
*   **Errors**: Throws if generator not found AND API fallback fails.
*   **Invariants**: Returned item must have `meta.skill_id` matching request.

### `LearnerState.updateLearnerState(state, attempt)`
*   **Input**: `LearnerState` (Immutable), `Attempt`.
*   **Output**: New `LearnerState`.
*   **Invariants**:
    *   `masteryProb` clamped [0.01, 0.99].
    *   `stability` >= 0.
    *   `lastPracticed` updated.

## 7. Test Quality Scorecard

| Test File | Classification | Score (0-10) | Notes |
|-----------|----------------|--------------|-------|
| `MathTutor.test.tsx` | ✅ Behavior-constraining | 9 | Excellent user-centric assertions. |
| `state.test.ts` | ✅ Behavior-constraining | 9 | Strong logic verification. |
| `engine.test.ts` | ✅ Behavior-constraining | 8 | Good logic, but mock-heavy. |
| `ProblemBank.test.ts` | ✅ Behavior-constraining | 8 | Good determinism checks. |
| `UniversalInput.test.tsx`| ✅ Behavior-constraining | 8 | Good a11y and event checks. |
| `nbt.test.ts` | ✅ Behavior-constraining | 7 | Good, but could be more exhaustive on content. |

**% Real Tests**: >90%

## 8. Flake Report
*   **Status**: Clean.
*   **Potential**: `MathTutor.test.tsx` uses `waitFor` which is robust, but the mock service uses `setTimeout(50)`. If CI is extremely slow, this *could* flake, but unlikely.
*   **Mitigation**: None needed immediately.

## 9. Snapshot Audit
*   **Status**: **Snapshot Free**. No `__snapshots__` directories found. Excellent discipline.

## 10. Mutation Notes
*   **Mutation 1 (`state.ts`)**: Changed mastery update logic.
    *   *Result*: `state.test.ts` **FAILED** (2 tests).
    *   *Verdict*: Test is **Real**.
*   **Mutation 2 (`MathTutor.tsx`)**: Changed "Correct!" text to "Wrong!".
    *   *Result*: `MathTutor.test.tsx` **FAILED** (7 tests).
    *   *Verdict*: Test is **Real**.

## 11. Fix Plan (Optional)
*   **Priority 1**: Increase coverage for `src/services/persistence.ts`. It's a low-hanging fruit and critical for user data safety.
*   **Priority 2**: Add a test case for `Engine` where `apiBaseUrl` is undefined (constructor default) to verify pure local behavior explicitly.

## 12. Proof of Done
N/A (No changes requested).
