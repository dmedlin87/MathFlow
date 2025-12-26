# Test Notes

## 1. Call-Site Map

### `src/domain/learner/state.ts`

**Export: `createInitialState(userId: string)`**
- **Callers**:
    - `src/services/LearnerService.ts` (implied service layer usage)
    - Tests (`state.test.ts`, `state.behavior.test.ts`)
- **Assumptions**: `userId` is non-empty string. `ALL_SKILLS_LIST` is non-empty.

**Export: `updateLearnerState(state: LearnerState, attempt: Attempt)`**
- **Callers**:
    - `src/services/LearnerService.ts`
    - Tests
- **Assumptions**: `attempt.skillId` exists. `state.skillState` may be partial.

**Export: `recommendNextItem(state: LearnerState, rng?, skills?)`**
- **Callers**:
    - `src/services/LearnerService.ts`
    - Tests
- **Assumptions**: `state.skillState` is valid. `rng` returns [0, 1). `skills` defaults to global registry.

### `src/domain/generator/engine.ts`

**Export: `Engine` (Class)**
- **Methods**: `register`, `generate`
- **Callers**:
    - `src/services/LearnerService.ts` (via singleton `engine`)
    - Tests
- **Assumptions**: `config.apiBaseUrl` dictates mode (Network vs Local).

## 2. Contracts

### `createInitialState`
- **Inputs**: `userId` (string)
- **Outputs**: `LearnerState`
- **Invariants**: `skillState` has keys for all skills in `ALL_SKILLS_LIST` with default 0.1 mastery.
- **Errors**: None.

### `updateLearnerState`
- **Inputs**: `state` (LearnerState), `attempt` (Attempt)
- **Outputs**: New `LearnerState` (immutable update)
- **Invariants**: `masteryProb` clamped [0.01, 0.99]. `stability` >= 0.
- **Behavior**:
    - Correct -> increase mastery (Bayesian update), stability +1 if mastery > 0.8.
    - Incorrect -> decrease mastery, stability -0.5 (min 0).

### `recommendNextItem`
- **Inputs**: `state`, `rng` (optional), `skills` (optional)
- **Outputs**: `MathProblemItem`
- **Invariants**: Returns a valid item from `engine`.
- **Errors**: Throws if no skills available.
- **Behavior**:
    - Review priority if mastery > 0.8 and interval passed.
    - Learning queue (mastery < 0.8) sorted by mastery (lowest first).
    - Prerequisite check (blocks skills if prereqs < 0.7 mastery).
    - 30% chance of review if available.

### `Engine.generate`
- **Inputs**: `skillId`, `difficulty`, `rng` (optional)
- **Outputs**: `MathProblemItem` (Promise)
- **Behavior**:
    - If `apiBaseUrl` set: Try Fetch Bank -> If empty, Fetch Factory -> If fail/empty, Log warning.
    - Always: Fallback to Local Generator if network fails or returns no items.
    - Validates output using `validateMathProblemItem`.

## 3. Test Plan

| Test Name | Behavior | Branch/Line | Type |
|-----------|----------|-------------|------|
| `state_init_skills` | `createInitialState` initializes all registry skills | `state.ts:13` | Happy |
| `update_lazy_init` | `updateLearnerState` initializes missing skill state | `state.ts:30` | Edge |
| `update_stability_inc` | Stability increments by 1 when mastery > 0.8 and correct | `state.ts:67` | Happy |
| `update_stability_reset` | Stability drops by 0.5 (clamped 0) when incorrect | `state.ts:76` | Happy |
| `recommend_prereq_block` | Filters out skills with unmet prereqs (< 0.7) | `state.ts:131` | Logic |
| `recommend_review_override` | Sets difficulty to 0.9 for review items (> 0.8 mastery) | `state.ts:168` | Logic |
| `engine_fetch_bank` | Returns Bank item if API configured and fetch succeeds | `engine.ts:40` | Happy |
| `engine_fetch_factory` | Falls back to Factory if Bank returns empty | `engine.ts:51` | Edge |
| `engine_fallback_local` | Falls back to Local if API fetch fails (catch block) | `engine.ts:65` | Error |

## 4. Mutation Sanity
- **Mutation**: Changed `state.ts` line 67: `if (newP > 0.8)` -> `if (newP > 0.99)`.
- **Result**: `state.behavior.test.ts` failed as expected.
  - Test: "increases stability by 1 when mastery is high (>0.8) and attempt is correct"
  - Error: `AssertionError: expected 2 to be 3`.
- **Conclusion**: The test accurately constrains the stability update logic.

## 5. Coverage Summary
- **Before**: Unclear due to missing report, but known gaps in `engine.ts` network paths and `state.ts` edge cases.
- **After**:
  - `state.ts`: Explicit tests for lazy init, stability logic, and scheduler prereqs/overrides.
  - `engine.ts`: Full coverage of Network -> Bank -> Factory -> Local fallback chain.
  - **Note**: Coverage report generation is flaky in this environment, but behavior tests explicitly target all critical branches.
