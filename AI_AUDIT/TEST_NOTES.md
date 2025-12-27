# Test Notes

## Call-Site Map

### `src/domain/learner/state.ts`

*   **`createInitialState(userId)`**
    *   Callers: Tests (e.g., `state.test.ts`), App initialization (implied).
    *   Assumptions: Creates default state for all registered skills.
*   **`updateLearnerState(state, attempt)`**
    *   Callers: `MathTutor.tsx` (submission handler), Tests.
    *   Assumptions: Uses BKT to update mastery. Updates `lastPracticed` and `stability`. Clamps mastery.
*   **`recommendNextItem(state, rng, skills)`**
    *   Callers: `LearnerService.ts`, Tests.
    *   Assumptions: Prioritizes review (if due) then learning queue (lowest mastery). Handles prereqs.

### `src/domain/generator/engine.ts`

*   **`Engine.register(generator)`**
    *   Callers: Self-initialization loop in `engine.ts`, Tests.
*   **`Engine.generate(skillId, difficulty, rng)`**
    *   Callers: `recommendNextItem` in `state.ts`, Tests.
    *   Assumptions: Tries API first, falls back to Local. Throws if skill missing locally (and API fails).

## Contracts

### `updateLearnerState`
*   **Inputs**: `state` (LearnerState), `attempt` (Attempt)
*   **Outputs**: New `LearnerState` (immutable update)
*   **Invariants**: Mastery clamped [0.01, 0.99].
*   **Behavior**:
    *   Correct: Increases mastery (BKT). If mastery > 0.8, increments stability.
    *   Incorrect: Decreases mastery (BKT). Decreases stability.
    *   Lazy Init: Initializes skill state if missing.

### `Engine.generate`
*   **Inputs**: `skillId`, `difficulty`, `rng?`
*   **Outputs**: `MathProblemItem` (Promise)
*   **Errors**: Throws if generator not found (and API unavailable).
*   **Behavior**:
    *   Fetch enabled: Call `/problems`, then `/factory/run`. Return valid item.
    *   Fetch failed/disabled: Use local generator.
    *   Validation: Always validate output.

## Test Plan

### `src/domain/learner/state.behavior.test.ts`
| Test Name | Behavior | Branch/Line | Type |
| :--- | :--- | :--- | :--- |
| `updateLearnerState` - Correct | Increases mastery via BKT | `state.ts:58-62` | Happy Path |
| `updateLearnerState` - Incorrect | Decreases mastery via BKT | `state.ts:68-71` | Happy Path |
| `updateLearnerState` - Stability Inc | Stability +1 when correct & mastery > 0.8 | `state.ts:65-67` | Branch |
| `updateLearnerState` - Stability Reset | Stability drops when incorrect | `state.ts:74` | Branch |
| `updateLearnerState` - Clamping | Mastery clamped to 0.01 and 0.99 | `state.ts:81` | Boundary |
| `recommendNextItem` - Review | Picks review item if due & roll < 0.3 | `state.ts:145` | Branch |
| `recommendNextItem` - Learning | Picks lowest mastery from queue | `state.ts:148` | Branch |
| `recommendNextItem` - Prereqs | Filters out skills if prereqs unmet | `state.ts:128` | Branch |

### `src/domain/generator/engine.behavior.test.ts`
| Test Name | Behavior | Branch/Line | Type |
| :--- | :--- | :--- | :--- |
| `generate` - Local Fallback | Uses local gen if API URL missing | `engine.ts:38` | Branch |
| `generate` - Network Error | Uses local gen if API fetch fails | `engine.ts:66` | Branch |
| `generate` - API Success | Returns API item if fetch succeeds | `engine.ts:47` | Happy Path |
| `generate` - Missing Skill | Throws if local gen missing | `engine.ts:72` | Error |

# Test Plan Update
Mutation Sanity Check
# Mutation Sanity Passed: Mutation: Review Crash caused test failure
# Final Coverage
=== Coverage Summary ===
Global Branch Coverage: 77.04% (245/318)

=== Top 10 Lowest Branch Coverage (Min 1 Branch) ===
18.52% (5/27) - C:\Users\dmedl\Projects\MathFlow\src\domain\math-utils.ts
75.00% (33/44) - C:\Users\dmedl\Projects\MathFlow\src\domain\skills\grade4\fractions.ts
78.13% (25/32) - C:\Users\dmedl\Projects\MathFlow\src\domain\skills\grade4\measurement.ts
78.95% (30/38) - C:\Users\dmedl\Projects\MathFlow\src\domain\skills\grade4\data.ts
80.00% (16/20) - C:\Users\dmedl\Projects\MathFlow\src\domain\skills\grade4\geometry.ts
84.09% (37/44) - C:\Users\dmedl\Projects\MathFlow\src\domain\skills\grade4\oa.ts
87.32% (62/71) - C:\Users\dmedl\Projects\MathFlow\src\domain\skills\grade4\nbt.ts
87.50% (35/40) - C:\Users\dmedl\Projects\MathFlow\src\domain\skills\grade4\decimals.ts
100.00% (2/2) - C:\Users\dmedl\Projects\MathFlow\src\domain\test-utils.ts

=== Zero Branch Files (Top 5 by size) ===