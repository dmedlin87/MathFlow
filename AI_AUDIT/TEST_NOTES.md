# Test Notes

## 1. Call-Site Map

### `src/domain/learner/state.ts`

**Exported Functions:**

1.  `createInitialState(userId: string): LearnerState`
    *   **Call Sites:**
        *   `src/components/MathTutor.tsx` (via `PersistenceService` or direct fallback)
        *   `src/services/LearnerService.ts`
        *   `src/App.tsx` (for initialization)
    *   **Assumptions:** Returns a state with all skills from registry initialized to default values (0.1 mastery, 0 stability).

2.  `updateLearnerState(state: LearnerState, attempt: Attempt): LearnerState`
    *   **Call Sites:**
        *   `src/services/LearnerService.ts`
    *   **Assumptions:**
        *   Calculates new mastery using BKT (Bayesian Knowledge Tracing).
        *   Updates stability based on correctness and mastery level.
        *   Clamps mastery between 0.01 and 0.99.
        *   Handles missing skills in state gracefully.

3.  `recommendNextItem(state: LearnerState, rng?: () => number, skills?: Skill[]): Promise<MathProblemItem>`
    *   **Call Sites:**
        *   `src/services/LearnerService.ts`
    *   **Assumptions:**
        *   Prioritizes "Review Due" items (stability-based interval).
        *   Then "Learning Queue" (lowest mastery, prereqs met).
        *   Fallback to random selection.
        *   Uses `engine.generate` to fetch actual items.

## 2. Contracts

### `createInitialState`
*   **Input:** `userId` (string)
*   **Output:** `LearnerState`
*   **Invariant:** `skillState` keys must match `ALL_SKILLS` ids. Mastery initialized to 0.1.

### `updateLearnerState`
*   **Input:** `state` (LearnerState), `attempt` (Attempt)
*   **Output:** New `LearnerState` (immutable update)
*   **Invariant:** Mastery probability is always clamped [0.01, 0.99].
*   **Behavior:**
    *   Correct answer increases mastery (BKT).
    *   Incorrect answer decreases mastery (BKT).
    *   Stability increases if mastery > 0.8 and correct.
    *   Stability drops if incorrect.

### `recommendNextItem`
*   **Input:** `state` (LearnerState), `rng` (optional function), `skills` (optional override)
*   **Output:** `Promise<MathProblemItem>`
*   **Error:** Throws if no skills available.
*   **Behavior:**
    *   Review Due logic: `(now - lastPracticed) > 24 * (1 + stability)`
    *   Selection mix: Review (30% if due) > Learning Queue (Lowest Mastery) > Random.

## 3. Tests Added (`src/domain/learner/state.coverage.test.ts`)

| Test Name | Behavior Checked | Type |
| :--- | :--- | :--- |
| `recommendNextItem > throws Error when candidateSkills is empty` | Error handling for empty registry | Invalid Input |
| `recommendNextItem > selects from reviewDue when reviewDue > 0 and roll < 0.3` | Review prioritization logic | Happy Path (Branch) |
| `recommendNextItem > falls back to random skill...` | Fallback logic when no review/learning queue | Happy Path (Branch) |
| `recommendNextItem > sets difficulty to 0.9 when masteryProb > 0.8` | Difficulty adaptation | Happy Path |
| `recommendNextItem > sorts learning queue by mastery` | Learning queue prioritization | Happy Path |
| `updateLearnerState > initializes state for new skill if missing` | Robustness for missing state | Edge Case |
| `updateLearnerState > increases stability when mastery > 0.8 and correct` | Stability logic | Happy Path |
| `updateLearnerState > uses custom BKT params...` | BKT parameter loading | Happy Path |
| `updateLearnerState > clamps mastery probability...` | Boundary check [0.01, 0.99] | Boundary |

## 4. Mutation Sanity Results

**Mutation:**
In `src/domain/learner/state.ts`:
```typescript
<<<<<<< SEARCH
  if (skillState && skillState.masteryProb > 0.8) {
    difficulty = 0.9; // Challenge on review
  }
=======
  if (skillState && skillState.masteryProb > 0.8) {
    difficulty = 0.1; // Challenge on review
  }
>>>>>>> REPLACE
```

**Result:**
Failed 3 tests in `src/domain/learner/state.coverage.test.ts`:
1.  `selects from reviewDue when reviewDue > 0 and roll < 0.3`
2.  `falls back to random skill when review not selected and learning queue empty`
3.  `sets difficulty to 0.9 when masteryProb > 0.8`

This confirms that the tests are correctly asserting the expected `difficulty` parameter passed to the engine, validation the logic branches.

## 5. Coverage Summary

*   **Before:** `state.ts` had gaps in review logic and empty skill handling.
*   **After:** `state.ts` is 100% covered (statements, branches, functions, lines).
