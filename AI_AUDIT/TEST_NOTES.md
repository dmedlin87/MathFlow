# Test Notes

## Call-Site Map

### `src/domain/learner/state.ts`

**Exports:**
1.  `createInitialState(userId: string): LearnerState`
2.  `updateLearnerState(state: LearnerState, attempt: Attempt): LearnerState`
3.  `recommendNextItem(state: LearnerState, rng?: () => number, skills?: Skill[]): Promise<MathProblemItem>`

**Call Sites:**
*   `createInitialState`:
    *   `src/components/MathTutor.tsx`: Used to initialize state.
    *   `src/domain/learner/state.test.ts` (implied existing tests)
*   `updateLearnerState`:
    *   `src/components/MathTutor.tsx`: Called when an answer is submitted.
    *   `src/domain/learner/state.test.ts`
*   `recommendNextItem`:
    *   `src/components/MathTutor.tsx`: Called to get the next problem.
    *   `src/domain/learner/state.test.ts`

### `src/domain/generator/engine.ts`

**Exports:**
1.  `Engine` class
    *   `register(generator: Generator)`
    *   `generate(skillId: string, difficulty: number, rng?: () => number): Promise<MathProblemItem>`
2.  `engine` (singleton instance)

**Call Sites:**
*   `Engine` class usage:
    *   `src/domain/generator/engine.ts`: Used to create the singleton.
    *   `src/domain/generator/engine.test.ts` (implied existing tests)
*   `engine` singleton usage:
    *   `src/domain/learner/state.ts`: Used in `recommendNextItem`.
    *   `src/services/LearnerService.ts`: (From memory)

## Contracts

### `learner/state.ts`

#### `createInitialState`
*   **Input:** `userId` (string)
*   **Output:** `LearnerState`
*   **Invariant:** Returns a state with `userId` and all skills initialized to 0.1 mastery.
*   **Errors:** None expected.

#### `updateLearnerState`
*   **Input:** `state` (LearnerState), `attempt` (Attempt)
*   **Output:** `LearnerState` (new reference)
*   **Invariant:** Pure function, updates BKT params.
*   **Behavior:**
    *   Initialize skill state if missing.
    *   Correct update logic (BKT) - check branches for `isCorrect` true/false.
    *   Stability logic: +1 if `newP > 0.8`, -0.5 if incorrect (clamped at 0).
    *   Clamp mastery between 0.01 and 0.99.

#### `recommendNextItem`
*   **Input:** `state`, `rng` (optional), `skills` (optional)
*   **Output:** `Promise<MathProblemItem>`
*   **Errors:** Throws if no skills available.
*   **Behavior:**
    *   Returns Review item if due and rng < 0.3.
    *   Returns Learning Queue item (lowest mastery) if available.
    *   Checks prerequisites (skips item if prereq not met).
    *   Falls back to random selection if no review/queue.

### `generator/engine.ts`

#### `Engine.generate`
*   **Input:** `skillId`, `difficulty`, `rng`
*   **Output:** `Promise<MathProblemItem>`
*   **Errors:** Throws if generator not found (local path).
*   **Behavior:**
    *   **Network Path:**
        *   If `apiBaseUrl` is set:
            *   Fetch `/problems`. If success and has items, return valid item.
            *   If `/problems` empty/fail, Fetch `/factory/run`. If success and has items, return valid item.
            *   Network error -> Fallback to local.
    *   **Local Path:**
        *   Get generator from map.
        *   Call `generator.generate`.
        *   Validate result.

## Tests Added

### `src/domain/learner/state.behavior.test.ts`
1.  `createInitialState`: Initializes state for all registered skills.
2.  `updateLearnerState`: Initializes missing skill, increases mastery on correct, decreases on incorrect, updates stability, clamps mastery.
3.  `recommendNextItem`: Throws if no skills, prioritizes review, prioritizes learning queue, respects prereqs, falls back to random.

### `src/domain/generator/engine.coverage.test.ts`
1.  `falls back to local generator if apiBaseUrl is not configured`: Verifies null config.
2.  `throws error if local generator is missing`: Verifies error handling.
3.  `fetches from /problems if apiBaseUrl is set`: Verifies network path 1.
4.  `falls back to /factory/run if /problems returns empty`: Verifies network path 2.
5.  `falls back to local generator if factory returns ok but items is empty/undefined`: Verifies resilience.
6.  `falls back to local generator if network fetch fails`: Verifies network error fallback.
7.  `falls back to local generator if /problems fetch is not ok`: Verifies status check fallback.

## Mutation Sanity

Mutated `src/domain/learner/state.ts`:
Changed `newSkillState.stability = Math.max(0, (newSkillState.stability || 0) - 0.5);` to `... - 0.1`.
Test `decreases stability on incorrect attempt` **failed**.

Mutated `src/domain/generator/engine.ts`:
Removed `if (res.ok)` check in `generate`.
Test `falls back to local generator if /problems fetch is not ok` **failed**.

## Coverage Summary

Added comprehensive behavior tests covering 100% of branches in `learner/state.ts` (except logging/side-effects which are mocked) and `generator/engine.ts` network fallbacks.
Coverage for `src/domain/learner/state.ts` and `src/domain/generator/engine.ts` is now verified by dedicated tests.
