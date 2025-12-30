# Test Audit Report

## 1. Preflight Run
- Commands: `npm install`, `pnpm run test:coverage`
- Baseline: High coverage (~99%) across most files.
- Targets: `src/domain/learner/state.ts` (100%), `src/domain/generator/engine.ts` (100%).

## 2. Call-Site Map & Contracts

### `src/domain/learner/state.ts`

**Exported Functions:**
1.  `updateLearnerState(state, attempt)`
    -   **Inputs:** `LearnerState` object, `Attempt` object.
    -   **Outputs:** New `LearnerState` (immutable).
    -   **Behavior:** Updates mastery (BKT), stability, and last practiced time. Handles missing skills gracefully.
    -   **Invariants:** `masteryProb` [0.01, 0.99], `stability` >= 0.

2.  `recommendNextItem(state, rng?, skills?)`
    -   **Inputs:** `LearnerState`, optional RNG, optional `skills` list.
    -   **Outputs:** `Promise<MathProblemItem>`.
    -   **Behavior:** Prioritizes Review > Learning > Fallback. Filters learning items by prerequisites.
    -   **Errors:** Throws if no skills available.

### `src/domain/generator/engine.ts`

**Exported Class:** `Engine`
1.  `generate(skillId, difficulty, rng?)`
    -   **Inputs:** `skillId`, `difficulty`, optional RNG.
    -   **Outputs:** `Promise<MathProblemItem>`.
    -   **Behavior:** Tries Network -> Fallback to Local. Validate schema at each step.
    -   **Errors:** Throws if local generator not found or local generation fails validation.

## 3. Test Plan Execution

I added strict behavior tests to constrain edge cases that were implementation details but not explicitly tested contracts.

| Test File | Test Name | Behavior Constrained | Result |
|-----------|-----------|----------------------|--------|
| `state.strict.test.ts` | `updateLearnerState - Unknown Skill` | Uses default BKT params if skill ID is not in registry. | PASS |
| `state.strict.test.ts` | `updateLearnerState - Stability Floor` | Stability is clamped at 0 (never negative). | PASS |
| `state.strict.test.ts` | `updateLearnerState - Lazy Init` | Initializes missing skill state before updating. | PASS |
| `state.strict.test.ts` | `recommendNextItem - Prerequisites` | Excludes blocked skills from Learning Queue (prioritizes valid skills). | PASS |
| `state.strict.test.ts` | `recommendNextItem - Defaults` | Uses `ALL_SKILLS` if `skills` arg is omitted. | PASS |
| `engine.strict.test.ts` | `generate - Network Validation Fail` | Falls back to local if network returns valid JSON but invalid Schema. | PASS |
| `engine.strict.test.ts` | `generate - Local Validation Fail` | Throws error if local generator produces invalid item. | PASS |

## 4. Mutation Sanity
- **Mutation:** Removed `Math.max(0, ...)` from stability update in `src/domain/learner/state.ts`.
- **Expected Result:** Stability becomes negative (-0.3).
- **Observed Result:** Test `does not decrease stability below 0` FAILED.
- **Conclusion:** Test meaningfully constrains the stability floor behavior.

## 5. Coverage Summary
- `src/domain/learner/state.ts`: 100% (Maintained)
- `src/domain/generator/engine.ts`: 100% (Maintained)
- **Note:** While coverage percentage didn't change (as it was already 100%), the *quality* of coverage improved by verifying specific branch behaviors (fallback logic, clamping) rather than just execution paths.
