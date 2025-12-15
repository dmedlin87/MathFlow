# AI Audit: Test Notes

## 1. Call-Site Map

### `src/domain/generator/engine.ts`

**Exported: `Engine` class**
- `constructor(config)`
- `register(generator)`
- `generate(skillId, difficulty, rng)`

**Call Sites:**
- `src/domain/learner/state.ts` -> `recommendNextItem` calls `engine.generate`
- `src/domain/skills/*.ts` -> calls `engine.register`
- Tests -> `engine.generate`

### `src/domain/learner/state.ts`

**Exported Functions:**
- `createInitialState(userId)`
- `updateLearnerState(state, attempt)`
- `recommendNextItem(state, rng, skills)`

**Call Sites:**
- `src/services/LearnerService.ts` -> calls all three
- Tests

## 2. Contracts

### `Engine.generate(skillId, difficulty, rng)`
- **Inputs:** `skillId` (string), `difficulty` (number 0-1), `rng` (optional function)
- **Outputs:** `Promise<MathProblemItem>`
- **Invariants:**
    - Prioritizes API fetch if `apiBaseUrl` is configured.
    - Falls back to local generator if API fetch fails or returns empty.
    - Throws if no generator found (local or remote).
- **Errors:** "No generator found for skill: {skillId}"

### `recommendNextItem(state, rng, skills)`
- **Inputs:** `state` (LearnerState), `rng` (function), `skills` (Skill[])
- **Outputs:** `Promise<MathProblemItem>`
- **Invariants:**
    - Recommend "Review Due" items first (if roll < 0.3).
    - Then "Learning Queue" (lowest mastery, prereqs met).
    - Fallback to random if nothing else matches.
    - Sets difficulty to 0.9 if mastery > 0.8 (Review Challenge).
- **Errors:** "No skills available to recommend" (if skills list empty).

## 3. Test Plan & Implementation Notes

### Added Tests

**`src/domain/generator/engine.test.ts`**
1. `tries to fetch from API...` (Happy Path, Network)
2. `falls back to local generator if API fetch fails` (Boundary, Network)
3. `falls back to local generator if API returns empty` (Boundary, Data)
4. `uses factory item if bank is empty...` (Happy Path, Factory)
5. `throws error when skill not found...` (Error Path)
6. `should handle invalid API response gracefully` (Invalid Input)

**`src/domain/learner/state.behavior.test.ts`**
1. `should throw error if no candidate skills provided` (Error Path)
2. `should select review items when due...` (Happy Path, Logic)
3. `should fallback to random skill...` (Boundary, Fallback)
4. `should NOT set high difficulty if selected skill is not highly mastered` (Branch Coverage)

### Implementation Details
- Used `vi.spyOn(global, 'fetch')` to mock API calls in `engine.test.ts`.
- Used `vi.useFakeTimers()` to control time in state tests.
- Explicitly injected `TEST_SKILLS` to ensure determinism in `state.behavior.test.ts`.
- Mocked `Math.random` via `rng` injection or spies to force logic branches.

## 4. Mutation Sanity Check

**Mutation 1: `engine.ts`**
- **Change:** Commented out `if (API_BASE) { ... }` block.
- **Result:** Test `tries to fetch from API` FAILED (Expected: called fetch, Received: not called).
- **Status:** PASSED (Mutation detected).

**Mutation 2: `state.ts`**
- **Change:** Changed `if (skillState && skillState.masteryProb > 0.8)` to `> 0.99`.
- **Result:** Test `should select review items when due` FAILED (Expected difficulty 0.9, Received 0.95 (mastery)).
- **Status:** PASSED (Mutation detected).

## 5. Coverage Summary

- **`domain/generator/engine.ts`**: 100% Statements, 100% Branches (Improved from ~80%).
- **`domain/learner/state.ts`**: High coverage, specifically targeted the fallback logic and difficulty setting branches.
