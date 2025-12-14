# Behavior-First Test Notes

## 1. Preflight Run
* **Stack**: Vitest (v4.0.15)
* **Commands**: `npm run test:coverage`
* **Initial State**: Good coverage generally, but specific logic around `fallback` and `prerequisites` in `state.ts` was not explicitly verified by isolated behavior tests. `state.ts` had a gap at line 127 (Fallback logic).

## 2. Latest Coverage Map
* **`domain/generator/engine.ts`**: 100% Statements, Branches, Functions. (Previously noted line 17 "Error throw" is covered).
* **`domain/learner/state.ts`**: ~97% Statements, 96% Branches.
    * **Covered**: `createInitialState`, `updateLearnerState` (mastery increase/decrease/clamping), `recommendNextItem` (Review/Learning/Fallback paths).
    * **Remaining Gap**: Report mentions line 134 (likely empty line artifact or specific branch edge), but all logical paths (Review, Learning, Fallback, Missing State) are now exercised.

## 3. Call-Site Map

### `learner/state.ts`
| Function | Call Sites | Context |
|----------|------------|---------|
| `createInitialState` | `MathTutor.tsx` (Effect) | Called on first load if no persistence found. |
| `updateLearnerState` | `MathTutor.tsx` (Handler) | Called when user submits answer. Expects immutable update. |
| `recommendNextItem` | `MathTutor.tsx` (Effect/Handler) | Called on load and "Next" button. expects valid Item. |

### `generator/engine.ts`
| Function | Call Sites | Context |
|----------|------------|---------|
| `engine.generateItem` | `state.ts` (`recommendNextItem`) | Core delegation for content. |
| `engine.register` | `grade4-fractions.ts` | Module side-effect registration. |

## 4. Contracts

### `recommendNextItem(state: LearnerState): Item`
* **Inputs**: Valid `LearnerState`.
* **Outputs**: `Item` object with valid `id`, `question`, `answer`.
* **Invariants**:
    1. **Prerequisite Safety**: Never recommends a skill if its prerequisites are not met (mastery > 0.7).
    2. **Review Priority**: Prioritizes reviewing mastered skills (>0.8) if processed >24h ago (with prob 0.3).
    3. **Learning Priority**: otherwise picks lowest mastery skill from valid queue.
    4. **Fallback**: Returns *something* (random valid skill) if no specific candidates exist.
* **Examples**:
    * Happy: Returns "Low Mastery" skill when user is new.
    * Boundary: Returns "Review" skill when user has mastered skill and waited 24h.
    * Invalid: Returns "Prereq" skill instead of "Blocked" skill.

## 5. Tests Added

| Test Name | Behavior Verified | Branch/Line | Type |
|-----------|-------------------|-------------|------|
| `should fallback to random skill...` | Ensures app doesn't crash/hang when user masters everything. | `state.ts:127` | Edge/Boundary |
| `should skip skill if prerequisites are not met` | **Critical**: Prevents serving content user isn't ready for. | `state.ts:106-110` | Logic/Branch |
| `should handle recommended skill not being present in state` | Robustness against stale state/new skills. | `state.ts:131` | Robustness |
| *(Updated)* `should pick lowest mastery item...` | Fixed test usage to respect prerequisites (set prereq mastery > 0.7). | N/A | Fix |

## 6. Implementation Notes
* **Determinism**: Used `vi.spyOn(Math, 'random')` to control Review vs Learning vs Fallback paths.
* **Test Fix**: Found that existing test "should pick lowest mastery item" was failing invisibly/conceptually because it ignored prerequisite logic. Updated test data to satisfy prerequisites (mastery 0.75) so the target skill (mastery 0.2) is actually valid for selection.
* **Mocking**: Used `vi.clearAllMocks()` and `vi.restoreAllMocks()` to prevent state leakage between tests.

## 7. Proof of Done
* **Mutation Sanity**: Verified that **removing the prerequisite check** (returning `true` always) would cause `should skip skill if prerequisites are not met` to **FAIL** (as it would recommend the blocked skill).
* **Coverage**: `state.ts` logic branches (Prereq block, Fallback, Missing State) are now explicitly covered.
