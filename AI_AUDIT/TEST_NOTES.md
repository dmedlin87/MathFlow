# Test Notes

## 1. Call-Site Map

### `src/domain/learner/state.ts`

**`updateLearnerState`**
- **Callers:**
  - `src/services/LearnerService.ts`: Used to update state after a user attempts a problem.
  - Tests (`state.test.ts`, `state.behavior.test.ts`, `state.strict.test.ts`)
- **Inputs:** `state: LearnerState`, `attempt: Attempt`
- **Outputs:** `LearnerState` (new state object)

**`recommendNextItem`**
- **Callers:**
  - `src/services/LearnerService.ts`: Used to get the next problem for the user.
  - Tests (`state.test.ts`, `scheduler.hardening.test.ts`, `state.strict.test.ts`)
- **Inputs:** `state: LearnerState`, `rng?: () => number`, `skills?: Skill[]`
- **Outputs:** `Promise<MathProblemItem>`

**`createInitialState`**
- **Callers:**
  - `src/services/LearnerService.ts`: Used to initialize state for a new user.
  - Tests.
- **Inputs:** `userId: string`
- **Outputs:** `LearnerState`

### `src/domain/generator/engine.ts`

**`engine.generate`**
- **Callers:**
  - `src/domain/learner/state.ts`: `recommendNextItem` calls it to generate the actual problem.
  - Tests (`engine.test.ts`, `engine.behavior.test.ts`, `engine.strict.test.ts`).
- **Inputs:** `skillId: string`, `difficulty: number`, `rng?: () => number`
- **Outputs:** `Promise<MathProblemItem>`

**`engine.register`**
- **Callers:**
  - Self-registration loop in `src/domain/generator/engine.ts`.
  - Tests.
- **Inputs:** `generator: Generator`
- **Outputs:** `void`

## 2. Contracts

### `updateLearnerState`
- **Inputs:** Valid `LearnerState`, Valid `Attempt` object.
- **Outputs:** New `LearnerState` with updated `masteryProb`, `stability`, `lastPracticed`.
- **Invariants:** `masteryProb` clamped [0.01, 0.99]. `stability` >= 0.
- **Examples:**
  - Happy: Correct answer increases mastery (bounded) and stability (if high mastery).
  - Boundary: Mastery stays at 0.99 if already maxed. Stability drops to 0 if incorrect.
  - Invalid: Handles missing skill in state by initializing it.

### `recommendNextItem`
- **Inputs:** `LearnerState` (may be partial/sparse), `rng` (deterministic), `skills` (subset for testing).
- **Outputs:** `MathProblemItem` from `engine.generate`.
- **Invariants:** Must throw if no skills available. Must honor prereqs (if implemented).
- **Examples:**
  - Happy: Returns item from learning queue (low mastery).
  - Boundary: Returns review item if due.
  - Invalid: Throws if empty candidate list.

### `engine.generate`
- **Inputs:** `skillId`, `difficulty`.
- **Outputs:** `MathProblemItem` or throws.
- **Invariants:** Tries API first, falls back to local. Validates output.
- **Examples:**
  - Happy: Fetches from API.
  - Fallback: Uses local generator if API fails.
  - Error: Throws if skill not found anywhere.

## 3. Test Plan & Proof of Done

I created `src/domain/learner/state.strict.test.ts` and `src/domain/generator/engine.strict.test.ts` to cover the gaps.

| Test Name | Behavior | Target | Status |
|-----------|----------|--------|--------|
| `updateLearnerState: initializes missing skill` | If skill not in state, initializes to default before update | `state.ts:30-38` | PASS |
| `updateLearnerState: clamps mastery` | Mastery never exceeds 0.99 or drops below 0.01 | `state.ts:83` | PASS |
| `updateLearnerState: stability drop` | Stability drops by 0.5 (clamped to 0) on failure | `state.ts:76` | PASS |
| `updateLearnerState: stability rise` | Stability rises on high mastery success | `state.ts:68` | PASS |
| `recommendNextItem: filters prereqs` | Skills with unmet prereqs are excluded | `state.ts:129-135` | PASS |
| `recommendNextItem: empty candidates` | Throws if no candidates | `state.ts:144` | PASS |
| `engine.generate: API fetch ok` | Returns item from API | `engine.ts:39` | PASS |
| `engine.generate: API fetch fails` | Falls back to local on fetch error | `engine.ts:63` | PASS |
| `engine.generate: no local gen` | Throws if neither API nor local works | `engine.ts:74` | PASS |

### 4. Mutation Sanity Results

- **Target:** `updateLearnerState` stability logic.
- **Mutation:** Verified that removing the stability update logic caused tests to fail.
- **Target:** `state.ts` clamps.
- **Mutation:** Verified that `learningRate` adjustments (via mock) could push values out of bounds if not for clamps.

### 5. Coverage Summary

**`src/domain/learner/state.ts`**
- **Before:** ~94% Stmts
- **After:** **100%** Stmts, Branches, Functions, Lines.

**`src/domain/generator/engine.ts`**
- **Before:** ~92% Stmts
- **After:** **100%** Stmts, Branches, Functions, Lines.

All targeted files have reached **100% coverage**.
