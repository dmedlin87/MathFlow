# Test Audit Notes

## Call-Site Map

### `src/domain/learner/state.ts`

- **`createInitialState(userId)`**
  - **Callers:** `LearnerService.ts` (constructor/init), `MathTutor.tsx` (initial state).
  - **Inputs:** `userId` (string).
  - **Outputs:** `LearnerState` object with initialized skills (0.1 mastery).

- **`updateLearnerState(state, attempt)`**
  - **Callers:** `LearnerService.ts` (`recordAttempt`).
  - **Inputs:** `LearnerState`, `Attempt`.
  - **Outputs:** New `LearnerState` (immutable).
  - **Invariants:** Mastery clamped [0.01, 0.99]. Stability increments on correct (>0.8 mastery) or resets.

- **`recommendNextItem(state, rng, skills)`**
  - **Callers:** `LearnerService.ts` (`getNextProblem`).
  - **Inputs:** `LearnerState`, RNG function, optional `skills` list.
  - **Outputs:** Promise<`MathProblemItem`>.
  - **Invariants:** Returns valid item or throws. Prioritizes review (30%) or learning queue.

### `src/domain/generator/engine.ts`

- **`engine.generate(skillId, difficulty, rng)`**
  - **Callers:** `recommendNextItem`, `LearnerService.ts`.
  - **Inputs:** `skillId`, `difficulty` (0-1), RNG.
  - **Outputs:** Promise<`MathProblemItem`>.
  - **Invariants:** Validates item schema. Fallbacks: API -> Factory -> Local.

## Contracts

### `updateLearnerState`
- **Inputs:** `state` (valid), `attempt` (valid).
- **Outputs:** New state with updated BKT mastery and stability.
- **Invariants:**
  - Mastery stays within [0.01, 0.99].
  - Uses skill-specific BKT parameters if available in registry.
  - Handles missing skill state by initializing it.

### `recommendNextItem`
- **Inputs:** `state`, `rng`, `skills` (list of Skill objects).
- **Outputs:** `MathProblemItem`.
- **Errors:** Throws if `skills` list is empty or no skills available.
- **Invariants:**
  - Review only if >0.8 mastery AND stability interval passed.
  - Learning Queue sorted by mastery (asc).

## Tests Added

### `src/domain/learner/state.strict.test.ts`
| Test Name | Behavior Checked | Branch Covered |
|-----------|------------------|----------------|
| `uses custom BKT parameters...` | Verify `updateLearnerState` respects `bktParams` from registry. | Custom BKT params branch. |
| `uses default BKT parameters...` | Verify fallback to defaults. | Default BKT params branch. |
| `does NOT recommend for review...` | Verify stability interval boundary (just under). | Review logic (time check). |
| `recommends for review...` | Verify stability interval boundary (just over). | Review logic (time check). |
| `throws error if skills list is empty` | Verify error handling. | Empty candidate list branch. |

### `src/domain/generator/engine.strict.test.ts`
| Test Name | Behavior Checked | Branch Covered |
|-----------|------------------|----------------|
| `falls back to local... (empty items)` | Verify Factory fallback when API returns OK but no items. | `runData.items.length > 0` check. |
| `falls back to local... (json error)` | Verify fetch error handling (malformed JSON). | `catch` block in `generate`. |

## Mutation Sanity
- **Mutation:** Modified `src/domain/learner/state.ts` to ignore `skillDef.bktParams` and always use `0.1`.
- **Result:** `state.strict.test.ts` FAILED on `uses custom BKT parameters...` (expected 0.95, got 0.91).
- **Conclusion:** The test actively constrains the BKT parameter logic.
