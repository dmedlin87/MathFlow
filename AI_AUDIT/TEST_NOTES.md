# Test Notes

## Call-Site Map

### `src/domain/generator/engine.ts`

*   **`generate(skillId, difficulty, rng?)`**
    *   **Call Sites:** `LearnerService.ts` (via `recommendNextItem`), `state.ts` (via `recommendNextItem`), Tests.
    *   **Implied Assumptions:** Returns `Promise<MathProblemItem>`. Handles API fetching and local fallback.
*   **`register(generator)`**
    *   **Call Sites:** Skill definition files (e.g., `grade6/ee.ts`), Tests.
    *   **Implied Assumptions:** Registers generator for `generate` to use.

### `src/domain/learner/state.ts`

*   **`createInitialState(userId)`**
    *   **Call Sites:** `LearnerService.ts`, Tests.
    *   **Implied Assumptions:** Returns initialized `LearnerState` with default mastery 0.1.
*   **`updateLearnerState(state, attempt)`**
    *   **Call Sites:** `LearnerService.ts`, Tests.
    *   **Implied Assumptions:** Pure function returning new state. Updates BKT mastery and stability.
*   **`recommendNextItem(state, rng?, skills?)`**
    *   **Call Sites:** `LearnerService.ts`, Tests.
    *   **Implied Assumptions:** Returns `Promise<MathProblemItem>`. Selects based on Review Due > Learning Queue > Random. Respects Prerequisites.

## Extracted Contracts

### `Engine.generate`
*   **Inputs:** `skillId` (string), `difficulty` (number), `rng` (optional).
*   **Outputs:** `Promise<MathProblemItem>`.
*   **Invariants:** Returned item validation pass.
*   **Errors:** Throws if skill not found (local mode). Warns/Falls back if API fails.
*   **Examples:**
    *   Happy: `generate("add_1", 0.5)` -> Returns item.
    *   Boundary: API returns 500 -> Returns local item.

### `updateLearnerState`
*   **Inputs:** `state`, `attempt`.
*   **Outputs:** `LearnerState`.
*   **Invariants:** Mastery [0.01, 0.99].
*   **Examples:**
    *   Happy: Correct -> Mastery increases.
    *   Boundary: Mastery > 0.8 -> Stability increases.

## Tests Added

| Test Name | Behavior | Target | Type |
| :--- | :--- | :--- | :--- |
| `Engine: Factory 500` | `generate` falls back to local when factory API fails (500) | `engine.ts:53` | Boundary |
| `State: Prereq 0.7` | `recommendNextItem` blocks skill if prereq mastery == 0.7 | `state.ts:133` | Boundary |
| `State: Missing Prereq` | `recommendNextItem` blocks skill if prereq state missing | `state.ts:132` | Invalid |
| `State: Stability 0.8` | `updateLearnerState` does NOT increase stability if mastery <= 0.8 | `state.ts:66` | Boundary |
| `State: Stability > 0.8` | `updateLearnerState` increases stability if mastery > 0.8 | `state.ts:66` | Happy |

## Mutation Sanity

1.  **Mutation:** `src/domain/learner/state.ts` - Changed stability threshold from `0.8` to `0.1`.
    *   **Result:** `should NOT increase stability if mastery is not high enough (>0.8)` **FAILED**.
2.  **Mutation:** `src/domain/generator/engine.ts` - Removed fallback logic (lines 68+).
    *   **Result:** 5 tests in `engine.behavior.test.ts` **FAILED** (including the new Factory 500 test).

## Coverage Summary

*   **`src/domain/generator/engine.ts`**: Branch coverage increased from ~80% to 85.71%.
*   **`src/domain/learner/state.ts`**: Remained 100% (High quality behavior tests added to constrain specific logic paths).
