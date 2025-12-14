# Behavior-First Test Notes

## 1. Preflight Run

* **Stack**: Vitest (v4.0.15)
* **Commands**:
  * `npm run test -- --run`
  * `npm run test:coverage`
* **Initial State**: Tests passing. Coverage indicated missing branch coverage in `domain/learner/state.ts` at the `denominator > 0 ? ... : currentP` guards in `updateLearnerState`.

## 2. Latest Coverage Map

* **`domain/generator/engine.ts`**: 100% Statements, Branches, Functions. (Previously noted line 17 "Error throw" is covered).
* **`domain/learner/state.ts`**: 100% Statements, Branches, Functions.
  * Previously uncovered branch hints: lines 60 and 71 (the denominator guards inside `updateLearnerState`).

## 3. Call-Site Map

### `learner/state.ts`

| Function | Call Sites | Context |
|----------|------------|---------|
| `createInitialState` | `App.tsx` (state initializer) | Called on app startup if persistence has no saved state. |
| `updateLearnerState` | `MathTutor.tsx` (Handler) | Called when user submits answer. Expects immutable update. |
| `recommendNextItem` | `MathTutor.tsx` (Effect/Handler) | Called on load and "Next" button. expects valid Item. |

### `generator/engine.ts`

| Function | Call Sites | Context |
|----------|------------|---------|
| `engine.generateItem` | `state.ts` (`recommendNextItem`) | Core delegation for content. |
| `engine.register` | `grade4-fractions.ts` | Module side-effect registration. |

## 4. Contracts

### `createInitialState(userId: string): LearnerState`

* **Inputs**: `userId` string.
* **Outputs**: `LearnerState` with `skillState` entries for the current `ALL_SKILLS` list.
* **Invariants**:
  1. Initializes each known skill with default mastery (`0.1`) and stability (`0`).
* **Errors**: none observed.
* **Examples**:
  * Happy: new user id returns state with both fraction skills present.
  * Boundary: empty-ish string user id still returns a state object.
  * Invalid: none (no runtime validation).

### `updateLearnerState(state: LearnerState, attempt: Attempt): LearnerState`

* **Inputs**: Existing `LearnerState`, an `Attempt` containing `skillId`, `isCorrect`, `timestamp`.
* **Outputs**: New `LearnerState` with updated `skillState[attempt.skillId]`.
* **Invariants**:
  1. **Immutability**: returns new `state` and new `skillState` object references.
  2. **Clamp**: `masteryProb` clamped to `[0.01, 0.99]`.
  3. **Denominator guard**: if the Bayesian update denominator would be `0`, the posterior update preserves `currentP` (avoids `NaN`).
* **Errors**: none observed.
* **Examples**:
  * Happy: correct attempt increases mastery.
  * Boundary: extremely high/low mastery stays within clamp.
  * Invalid: missing `skillId` state gets initialized and then updated.

### `recommendNextItem(state: LearnerState): Item`

* **Inputs**: Valid `LearnerState`.
* **Outputs**: `Item` object with valid `id`, `question`, `answer`.
* **Invariants**:
  1. **Prerequisite Safety**: Never recommends a skill if its prerequisites are not met (mastery > 0.7).
  2. **Review Priority**: Prioritizes reviewing mastered skills (>0.8) if processed >24h ago (with prob 0.3).
  3. **Learning Priority**: otherwise picks lowest mastery skill from valid queue.
  4. **Fallback**: Returns *something* (random valid skill) if no specific candidates exist.
* **Errors**: none observed.
* **Examples**:
  * Happy: Returns "Low Mastery" skill when user is new.
  * Boundary: Returns "Review" skill when user has mastered skill and waited 24h.
  * Invalid: Returns "Prereq" skill instead of "Blocked" skill.

## 5. Tests Added

| Test Name | Behavior Verified | Branch/Line | Type |
|-----------|-------------------|-------------|------|
| `should fallback to random skill...` | Ensures app doesn't crash/hang when user masters everything. | `state.ts:127` | Edge/Boundary |
| `should skip skill if prerequisites are not met` | **Critical**: Prevents serving content user isn't ready for. | `state.ts:106-110` | Logic/Branch |
| `should handle recommended skill not being present in state` | Robustness against stale state/new skills. | `state.ts:131` | Robustness |
| *(Updated)* `should pick lowest mastery item...` | Fixed test usage to respect prerequisites (set prereq mastery > 0.7). | N/A | Fix |
| `keeps mastery unchanged when correct-update denominator is zero` | If BKT params produce `denominator === 0`, preserves `currentP` (avoids `NaN`). | `state.ts:60` | Invalid/Edge |
| `keeps mastery unchanged when incorrect-update denominator is zero` | Same as above for incorrect branch. | `state.ts:71` | Invalid/Edge |

## 6. Implementation Notes

* **Determinism**: Used `vi.spyOn(Math, 'random')` to control Review vs Learning vs Fallback paths.
* **Test Fix**: Found that existing test "should pick lowest mastery item" was failing invisibly/conceptually because it ignored prerequisite logic. Updated test data to satisfy prerequisites (mastery 0.75) so the target skill (mastery 0.2) is actually valid for selection.
* **Mocking**: Used `vi.clearAllMocks()` and `vi.restoreAllMocks()` to prevent state leakage between tests.
* **Denominator-guard tests**: Temporarily override `SKILL_EQUIV_FRACTIONS.bktParams` inside the test and restore them in `finally`.

## 7. Proof of Done

* **Mutation Sanity**:
  * Mutated `updateLearnerState` to remove the `denominator > 0 ? ... : currentP` guards (replaced with raw division).
  * `keeps mastery unchanged when correct-update denominator is zero` failed (received `NaN`).
  * `keeps mastery unchanged when incorrect-update denominator is zero` failed (received `NaN`).
  * Reverted mutation; both tests pass.
* **Coverage**: `domain/learner/state.ts` now reports 100% statements/branches/functions.
