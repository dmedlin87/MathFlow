# Behavior-First Test Notes

## 1. Preflight Run

* **Stack**: Vitest (v4.0.15)
* **Commands**:
  * `npm run test -- --run`
  * `npm run test:coverage`
  * Mutation sanity (targeted):
    * `npm run test -- --run src/domain/math-utils.test.ts`
    * `npm run test -- --run src/domain/skills/grade4-fractions.test.ts`
* **Initial State**: Tests passing. Coverage indicated missing coverage in `domain/math-utils.ts` and `domain/skills/grade4-fractions.ts`.

## 2. Latest Coverage Map

* **Before (from `npm run test:coverage`)**:
  * **`domain/math-utils.ts`**: 0% (uncovered lines `2-10`).
  * **`domain/skills/grade4-fractions.ts`**: partial (uncovered lines `171-212, 246-290`).
  * **`domain/learner/state.ts`**: 100%.
  * **`domain/generator/engine.ts`**: 100%.
* **After adding tests (from `npm run test:coverage`)**:
  * **All files**: 100% Statements / 100% Branch / 100% Functions / 100% Lines.
  * **`domain/math-utils.ts`**: 100%.
  * **`domain/skills/grade4-fractions.ts`**: 100%.

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

### `math-utils.ts`

| Function | Call Sites | Context |
|----------|------------|---------|
| `gcd` | `skills/grade4-fractions.ts` (`SimplifyFractionGenerator.generate`) | Used to ensure the base fraction is simplified before scaling. |
| `getFactors` | *(none found)* | No call sites observed; tests are characterization of current behavior. |

### `skills/grade4-fractions.ts` (new coverage targets)

| Export | Call Sites | Context |
|--------|-----------|---------|
| `SubLikeFractionGenerator.generate` | `engine.generateItem('T_SUB_LIKE_FRACTIONS', ...)` via engine registry; UI flow via `recommendNextItem` | Produces TeX-ish question payload and fraction-string answer payload. |
| `SimplifyFractionGenerator.generate` | `engine.generateItem('T_SIMPLIFY_FRACTION', ...)` via engine registry; UI flow via `recommendNextItem` | Produces TeX-ish question payload and fraction-string answer payload. |

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

### `gcd(a: number, b: number): number`

* **Inputs**: numbers `a`, `b`.
* **Outputs**: numeric GCD as computed by the recursive implementation.
* **Invariants**:
  1. Base case returns `a` when `b === 0`.
* **Errors**: none observed.
* **Examples**:
  * Happy: `gcd(12, 8) === 4`.
  * Boundary: `gcd(5, 0) === 5`.
  * Invalid: `gcd(0, 5) === 5` (characterization).

### `getFactors(n: number): number[]`

* **Inputs**: integer-ish number `n`.
* **Outputs**: all positive divisors found by iterating `i = 1..n`.
* **Invariants**:
  1. For `n > 0`, always includes `1` and `n`.
* **Errors**: none observed.
* **Examples**:
  * Happy: `getFactors(6) === [1,2,3,6]`.
  * Boundary: `getFactors(1) === [1]`.
  * Invalid: `getFactors(0) === []`, `getFactors(-3) === []` (characterization).

### `SubLikeFractionGenerator.generate(difficulty: number): Item`

* **Inputs**: `difficulty` number.
* **Outputs**: an `Item` where:
  * `question.text` embeds `\frac{num1}{den} - \frac{num2}{den}`.
  * `answer.value` is the fraction string `${targetNum}/${den}`.
* **Invariants**:
  1. Uses `max = 10` when `difficulty < 0.5`, else `max = 20`.
  2. Answer numerator equals `(num1 - num2)`.
* **Errors**: none observed.
* **Examples**:
  * Happy: returns consistent `num1 - num2` and denominator.
  * Boundary: difficulty crossing `0.5` changes max range.
  * Invalid: misconception matcher returns `sub_num_sub_den` for `${targetNum}/0`.

### `SimplifyFractionGenerator.generate(difficulty: number): Item`

* **Inputs**: `difficulty` number.
* **Outputs**: an `Item` where:
  * `question.text` embeds `\frac{questionNum}{questionDen}`.
  * `answer.value` is a lowest-terms fraction string `${simpleNum}/${simpleDen}`.
* **Invariants**:
  1. Generated question fraction is reducible (`gcd(questionNum, questionDen) > 1`).
  2. Answer fraction is lowest terms (`gcd(ansNum, ansDen) === 1`).
* **Errors**: none observed.
* **Examples**:
  * Happy: answer is reduced and equivalent to the question.
  * Boundary: difficulty crossing `0.5` changes range/multiplier.
  * Invalid: misconception matcher returns `no_simplify` when `${questionNum}/${questionDen}` is submitted.

## 5. Tests Added

| Test Name | Behavior Verified | Branch/Line | Type |
|-----------|-------------------|-------------|------|
| `should fallback to random skill...` | Ensures app doesn't crash/hang when user masters everything. | `state.ts:127` | Edge/Boundary |
| `should skip skill if prerequisites are not met` | **Critical**: Prevents serving content user isn't ready for. | `state.ts:106-110` | Logic/Branch |
| `should handle recommended skill not being present in state` | Robustness against stale state/new skills. | `state.ts:131` | Robustness |
| *(Updated)* `should pick lowest mastery item...` | Fixed test usage to respect prerequisites (set prereq mastery > 0.7). | N/A | Fix |
| `keeps mastery unchanged when correct-update denominator is zero` | If BKT params produce `denominator === 0`, preserves `currentP` (avoids `NaN`). | `state.ts:60` | Invalid/Edge |
| `keeps mastery unchanged when incorrect-update denominator is zero` | Same as above for incorrect branch. | `state.ts:71` | Invalid/Edge |

### New files

* `src/domain/math-utils.test.ts`
  * `gcd` base case (`b === 0`) and recursion.
  * `getFactors` happy/boundary/invalid characterization (`n <= 0`).
* `src/domain/skills/grade4-fractions.test.ts`
  * `SubLikeFractionGenerator.generate` covers both difficulty branches (`< 0.5` vs `>= 0.5`) and misconception matcher branches.
  * `SimplifyFractionGenerator.generate` covers difficulty branches and the `no_simplify` misconception matcher.

## 6. Implementation Notes

* **Determinism**: Used `vi.spyOn(Math, 'random')` to control Review vs Learning vs Fallback paths.
* **Determinism (new)**: Used `vi.spyOn(Math, 'random')` sequences to drive `randomInt(...)` branches in generators.
* **Behavior-first assertions**:
  * For generator items, assert math equivalence from the rendered TeX string (parse `\frac{a}{b}`) and ensure the `answer.value` matches the arithmetic.
  * For simplify, assert reducible question fraction and lowest-terms answer (`gcd(...)`).
* **Test Fix**: Found that existing test "should pick lowest mastery item" was failing invisibly/conceptually because it ignored prerequisite logic. Updated test data to satisfy prerequisites (mastery 0.75) so the target skill (mastery 0.2) is actually valid for selection.
* **Mocking**: Used `vi.clearAllMocks()` and `vi.restoreAllMocks()` to prevent state leakage between tests.
* **Denominator-guard tests**: Temporarily override `SKILL_EQUIV_FRACTIONS.bktParams` inside the test and restore them in `finally`.

## 7. Proof of Done

* **Mutation Sanity**:
  * **`math-utils.ts`**: Mutated `gcd` base case to return `b` when `b === 0`.
    * `returns a when b is 0` failed (expected `5`, got `0`).
    * `computes the greatest common divisor via recursion` failed.
    * Reverted mutation; tests pass.
  * **`grade4-fractions.ts`**: Mutated `SimplifyFractionGenerator` to return the *unsimplified* fraction as the answer.
    * `generates a reducible fraction and provides a lowest-terms answer` failed (answer was not in lowest terms).
    * `tags the no_simplify misconception when the original fraction is submitted` failed (correct answer incorrectly tagged).
    * Reverted mutation; tests pass.
* **Coverage**: After new tests, coverage is 100% across the repo.
