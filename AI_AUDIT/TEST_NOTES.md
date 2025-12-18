# Test Notes & Analysis

## Call-Site Map

### `src/domain/generator/engine.ts`

**Export: `Engine` (Class)**
- **Instantiated by:**
  - Self (singleton export `engine`)
  - `src/domain/generator/engine.test.ts` (Tests)

**Export: `engine` (Singleton)**
- **Used by:**
  - `src/domain/learner/state.ts` (in `recommendNextItem`)
  - `src/domain/generator/engine.test.ts` (Tests)

**Method: `generate(skillId, difficulty, rng)`**
- **Call Sites:**
  - `src/domain/learner/state.ts`: `return engine.generate(targetSkill.id, difficulty);`
  - Tests

### `src/domain/learner/state.ts`

**Export: `createInitialState(userId)`**
- **Used by:**
  - `src/services/LearnerService.ts`
  - Tests

**Export: `updateLearnerState(state, attempt)`**
- **Used by:**
  - `src/services/LearnerService.ts`
  - Tests

**Export: `recommendNextItem(state, rng, skills)`**
- **Used by:**
  - `src/services/LearnerService.ts`
  - Tests

---

## Contracts

### `Engine.generate`
- **Inputs:** `skillId` (string), `difficulty` (number), `rng` (optional function)
- **Outputs:** Promise<`MathProblemItem`>
- **Invariants:**
  - Must return a valid `MathProblemItem` (validated by `validateMathProblemItem`).
  - **Priority:** API -> Factory (if API empty) -> Local Generator.
  - If `apiBaseUrl` is not set, skip network and go straight to local.
  - If local generator missing and network fails/skips, throws Error.
- **Errors:**
  - "No generator found for skill: {skillId}" (if local missing and network fallback exhausted).

### `recommendNextItem`
- **Inputs:** `state` (LearnerState), `rng` (function, default `Math.random`), `skills` (Skill[], default `ALL_SKILLS`)
- **Outputs:** Promise<`MathProblemItem`>
- **Invariants:**
  - Returns a problem for a skill in the provided list.
  - **Review Logic:** If review items exist and roll < 0.3, pick review item.
  - **Learning Logic:** Else, pick lowest mastery item from learning queue (mastery < 0.8 & prereqs met).
  - **Fallback:** Random skill from candidates.
  - **Difficulty:** Based on mastery (0.9 if review/mastered, else masteryProb).
- **Errors:**
  - "No skills available to recommend" (if candidate list empty).

### `updateLearnerState`
- **Inputs:** `state` (LearnerState), `attempt` (Attempt)
- **Outputs:** New `LearnerState` (immutable)
- **Invariants:**
  - Updates `masteryProb` via BKT (Bayesian Knowledge Tracing).
  - `masteryProb` clamped to [0.01, 0.99].
  - `stability` increases on correct (if mastery > 0.8), decreases on incorrect.
  - Auto-initializes skill state if missing in input state.
- **Errors:** None (safe handling).

---

## Test Plan

### `src/domain/generator/engine.behavior.test.ts`
| Test Name | Behavior | Branch/Line | Type |
|-----------|----------|-------------|------|
| `generate returns local item when API config is missing` | Skips fetch block when `apiBaseUrl` is undefined | `engine.ts:35` (if API_BASE check) | Happy Path |
| `generate falls back to local when API returns empty list` | Enters fetch, gets empty, falls through | `engine.ts:50` (if problems.length > 0) | Boundary |
| `generate uses factory item if bank is empty but factory returns item` | Enters fetch, gets empty, calls factory, gets item | `engine.ts:56` (factory fetch) | Happy Path |
| `generate throws when skill missing locally and API off` | Throws specific error | `engine.ts:79` | Invalid |
| `generate prioritizes API result over local generator when available` | Happy path API hit | `engine.ts:46` | Happy Path |
| `generate falls back to local generator when API fetch fails` | Network failure recovery | `engine.ts:63` | Resilience |

### `src/domain/learner/state.behavior.test.ts`
| Test Name | Behavior | Branch/Line | Type |
|-----------|----------|-------------|------|
| `recommendNextItem picks review item when roll < 0.3` | Forces review path via mock RNG | `state.ts:147` | Happy Path |
| `recommendNextItem picks learning item when review empty` | Skips review block | `state.ts:150` | Happy Path |
| `recommendNextItem respects prereqs` | Filters out blocked skills | `state.ts:130` | Boundary |
| `recommendNextItem defaults to random if all mastered/blocked` | Fallback path | `state.ts:157` | Boundary |
| `updateLearnerState clamps mastery to 0.99` | Prevents overflow | `state.ts:83` | Boundary |
| `updateLearnerState auto-inits missing skill` | Handles new skill gracefull | `state.ts:30` | Robustness |

## Mutation Sanity Check Results

**Engine Mutation:**
- Modified `engine.ts` line 46: `if (problems && problems.length > 0)` -> `if (false)`
- **Result:** `generate prioritizes API result over local generator when available` failed.
- **Verification:** Proves the branch is covered and meaningful.

**LearnerState Mutation:**
- Modified `state.ts` line 147: `if (reviewDue.length > 0 && roll < 0.3)` -> `if (false)`
- **Result:** `recommendNextItem picks review item when roll < 0.3` failed.
- **Verification:** Proves review priority logic is guarded by this test.

## Coverage Summary
- `learner/state.ts`: 100% Stmts / 100% Branch / 100% Funcs / 100% Lines
- `generator/engine.ts`: 100% Stmts / 100% Branch / 100% Funcs / 100% Lines (After updates)
