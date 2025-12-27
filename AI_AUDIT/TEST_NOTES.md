# Test Notes

## 1. Preflight Run
*   **Command**: `pnpm run test:coverage src/domain/learner/state.ts src/domain/generator/engine.ts`
*   **Result**: 100% coverage reported initially, but deep analysis revealed missing behavior checks (defaults, validation failures).

## 2. Latest Coverage Map
*   **File**: `src/domain/learner/state.ts`
    *   **Uncovered**: Initially 0, but effectively untested edge cases.
    *   **Status**: Fully covered with new behavior tests.
*   **File**: `src/domain/generator/engine.ts`
    *   **Uncovered**: Line 58 (complex branch `items && length > 0`).
    *   **Status**: Logically fully covered (all truth tables tested), artifact of V8 reporting.

## 3. Call-Site Map

### `updateLearnerState`
*   **Call Sites**: `MathTutor.tsx`
*   **Assumptions**: Input state and attempt are valid.
*   **Contracts**:
    *   Input: `LearnerState`, `Attempt`
    *   Output: New `LearnerState`
    *   Invariants: Mastery clamped [0.01, 0.99], Stability >= 0.

### `recommendNextItem`
*   **Call Sites**: `MathTutor.tsx`
*   **Assumptions**: `ALL_SKILLS` available.
*   **Contracts**:
    *   Input: `LearnerState`
    *   Output: `Promise<MathProblemItem>`
    *   Errors: Throws if no skills available.

### `Engine.generate`
*   **Call Sites**: `recommendNextItem`
*   **Contracts**:
    *   Input: `skillId`, `difficulty`
    *   Output: `Promise<MathProblemItem>`
    *   Behavior: API -> Factory -> Local fallback chain.

## 4. Contracts
(See Call-Site Map above)

## 5. Test Plan & Results

| Test Name | Behavior | Outcome |
| :--- | :--- | :--- |
| `state.coverage.test.ts` / `createInitialState` | Initializes default values (0.1/0) | Passed |
| `state.coverage.test.ts` / `updateLearnerState` | Graceful handling of missing registry skill | Passed |
| `state.coverage.test.ts` / `updateLearnerState` | Stability floor check (>= 0) | Passed |
| `state.coverage.test.ts` / `recommendNextItem` | Error on empty candidate list | Passed |
| `state.coverage.test.ts` / `recommendNextItem` | Random fallback when all mastered & no review | Passed |
| `state.coverage.test.ts` / `recommendNextItem` | Missing prereq state blocks dependent skill | Passed |
| `engine.behavior.test.ts` / `generate` | Fallback to Local on API validation failure | Passed |
| `engine.behavior.test.ts` / `generate` | Fallback to Local on Factory empty items | Passed |
| `engine.behavior.test.ts` / `generate` | Fallback to Local on Factory missing items | Passed |

## 6. Implementation Notes
*   Created `src/domain/learner/state.coverage.test.ts` to isolate new coverage tests.
*   Updated `src/domain/generator/engine.behavior.test.ts` with validation and factory edge cases.
*   Mocked `validateMathProblemItem` to throw specific errors for testing fallback.
*   Used `vi.useFakeTimers` for stability/time-based logic.

## 7. Mutation Sanity Check
*   **Mutation**: Flipped `roll < 0.3` to `roll < -0.1` in `recommendNextItem`.
*   **Result**: Test `should prioritize review if due and roll < 0.3` FAILED as expected.
*   **Conclusion**: Tests are constraining real behavior.
