# Test Notes

## Call-Site Map

### `src/domain/generator/engine.ts`
**Exported:** `class Engine`, `engine` (singleton)
**Call Sites:**
- `src/domain/learner/state.ts` (via `engine.generate`)
- `src/services/LearnerService.ts` (implied usage via `state.ts`)
- Tests (`engine.*.test.ts`, `state.*.test.ts`)

### `src/domain/learner/state.ts`
**Exported:** `createInitialState`, `updateLearnerState`, `recommendNextItem`
**Call Sites:**
- `src/services/LearnerService.ts`
- Tests (`state.*.test.ts`, `persistence.*.test.ts`)

## Contracts

### `Engine.generate(skillId, difficulty, rng)`
- **Inputs:** `skillId` (string), `difficulty` (number 0-1), `rng` (function, optional)
- **Outputs:** `Promise<MathProblemItem>`
- **Invariants:** Always returns a valid `MathProblemItem` or throws. Falls back to local generator if network fails or returns invalid data.
- **Errors:** Throws if no generator found (local) or if local generator produces invalid item.

### `updateLearnerState(state, attempt)`
- **Inputs:** `state` (LearnerState), `attempt` (Attempt)
- **Outputs:** `LearnerState` (new reference)
- **Invariants:** Updates `masteryProb` via BKT. Updates `stability` (increases on high mastery correct, decreases on incorrect). Clamps values. Initializes missing skills.

### `recommendNextItem(state, rng, skills)`
- **Inputs:** `state` (LearnerState), `rng` (function), `skills` (Skill[], defaults to ALL)
- **Outputs:** `Promise<MathProblemItem>`
- **Invariants:** Returns an item from `skills`. Respects prerequisites (blocks if < 0.7). Prioritizes review (if due) with 30% chance. Prioritizes learning queue (lowest mastery).
- **Errors:** Throws if no skills available.

## Tests Added

### `src/domain/generator/engine.strict.test.ts`
1. `falls back to local generator if Factory returns empty items list`
2. `falls back to local generator if fetch response.json() throws error`
3. `falls back to local generator if network fails (fetch throws)`
4. `falls back to local generator if API returns error status (404/500)`
5. `falls back to local generator if network returns valid JSON but invalid schema`
6. `throws Error if local generator produces invalid item`
7. `throws Error if local generator is missing for the requested skill`

### `src/domain/learner/state.strict.test.ts`
1. `initializes state with all skills at 0.1 mastery and 0 stability` (`createInitialState`)
2. `decreases stability by 0.5 (clamped to 0) on incorrect answer`
3. `decreases stability to 0 (clamped) if result would be negative`
4. `initializes missing skill state with default mastery 0.1 before update`
5. `blocks skill if prerequisite is not mastered (< 0.7)`
6. `skips review item if RNG >= 0.3 and learning queue is available`

## Mutation Sanity
- **Mutation:** Changed `updateLearnerState` stability decrease from `0.5` to `0.1`.
- **Result:** Tests `decreases stability by 0.5...` and `decreases stability to 0...` failed as expected.

## Coverage Summary
- `src/domain/generator/engine.ts`: ~96% (Uncovered: logging)
- `src/domain/learner/state.ts`: ~98% (Uncovered: internal sort access hint)
