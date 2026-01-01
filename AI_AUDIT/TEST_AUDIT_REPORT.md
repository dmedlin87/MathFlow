# Behavior-First Test Audit Report

## 1. Mode & Evidence
- **Mode**: A (Execution Capable)
- **Environment**: Node v22.21.1, pnpm v10.20.0
- **Evidence**:
  - `pnpm test` executed successfully (572 tests passed).
  - Coverage report generated.
  - Mutation testing performed manually.

## 2. Preflight Run
- **Command**: `pnpm test`
- **Result**: 51 files, 572 tests passed.
- **Coverage**: ~98% Statements.
  - **Low Coverage Areas**:
    - `src/components/Dashboard.tsx` (56%)
    - `src/services/persistence.ts` (42%)
    - `server/src/store/ProblemBank.ts` (85%)

## 3. Test Inventory Map
| Test File | Target Module | Behaviors Claimed |
|-----------|---------------|-------------------|
| `src/domain/generator/engine.test.ts` | `Engine` | Registry, Network Fallback (API -> Factory -> Local), Error Handling |
| `src/domain/learner/state.test.ts` | `LearnerState` | Initialization, BKT Updates (Correct/Incorrect), Prereq Checks |
| `src/components/MathTutor.test.tsx` | `MathTutor` | Session Flow, Diagnosis Feedback, Hint Ladder, Input Handling |
| `server/src/store/ProblemBank.test.ts` | `ProblemBank` | Save Verification, Fetch logic (Random/Shuffle), Fallbacks |
| `src/domain/skills/grade5/nbt.test.ts` | `NBT Generators` | Content Generation, Format Compliance |
| `src/components/MathRenderer.test.tsx` | `MathRenderer` | Text/Math/Fraction Rendering (Regex-based) |
| `server/src/middleware/rateLimit.test.ts` | `RateLimit` | Request Limiting, Headers |

## 4. Risk Ranking
1. **[90] `src/domain/learner/state.ts`**
   - **Why**: Core progression logic (BKT). High impact on user experience. Complex state transitions.
   - **Weakness**: Mutation revealed prioritization logic is not behaviorally constrained.
2. **[85] `src/domain/generator/engine.ts`**
   - **Why**: High publicness (used everywhere). Complex network/fallback logic.
   - **Strength**: Good tests for fallback hierarchy.
3. **[70] `server/src/store/ProblemBank.ts`**
   - **Why**: Data persistence.
   - **Weakness**: Relies on mocked FS; potential for drift.
4. **[65] `src/components/MathTutor.tsx`**
   - **Why**: Main UI integration point.
   - **Strength**: Comprehensive interaction tests.

## 5. Coverage Reality Map
- **Uncovered Branches**:
  - `src/domain/learner/state.ts`: Prioritization logic (sorting) is covered by lines but not constraints (Mutation Survived).
  - `server/src/store/ProblemBank.ts`: FS error handling branches.
- **Fake Coverage**:
  - `MathTutor` tests heavily mock `LearnerService`, potentially masking integration issues with real `Engine`/`State`.

## 6. Contract Map
| Function | Implied Contract | Evidence |
|----------|------------------|----------|
| `Engine.generate` | Returns `MathProblemItem` or throws. Fallback: API -> Factory -> Local. | `engine.test.ts` "falls back to local..." |
| `updateLearnerState` | Returns NEW state (immutability). Updates BKT params. Clamps values. | `state.test.ts` "returns a new state reference" |
| `recommendNextItem` | Returns item based on mastery/review. Excludes mastered. | `state.test.ts` "excludes mastered skills" |
| `ProblemBank.save` | Rejects items with `status !== VERIFIED`. | `ProblemBank.test.ts` "should reject saving unverified items" |

## 7. Test Quality Scorecard
| Test File | Classification | Evidence | Fix |
|-----------|----------------|----------|-----|
| `state.test.ts` | ⚠️ Weak | Mutation Survived (Priority Logic) | Add test with 2 unmastered skills (Low vs High mastery) |
| `engine.test.ts` | ✅ Real | Meaningful fallbacks verified | N/A |
| `MathTutor.test.tsx` | ✅ Real | Constraints UI states correctly | N/A |
| `MathRenderer.test.tsx` | ✅ Real | No snapshots; regex assertions | N/A |
| `ProblemBank.test.ts` | ⚠️ Weak | Heavy FS mocking | Use temporary real files or stricter mocks |

## 8. Flake Report
- **Status**: Clean.
- **Probe**: 3 full runs, 0 flakes.
- **Determinism**: `ProblemBank` uses `vi.spyOn(Math, 'random')`. `Engine` mocks `fetch`.

## 9. Snapshot Audit
- **Status**: Excellent.
- **Findings**: No snapshot usage in sampled files. Explicit assertions used instead.

## 10. Mutation Notes
- **Mutant**: `src/domain/learner/state.ts`: Reversed sort order in `recommendNextItem` (Prioritize Highest Mastery vs Lowest).
- **Result**: **SURVIVED**.
- **Implication**: The test `excludes mastered skills` only provides 1 unmastered option, so sorting is irrelevant. The suite does not enforce "Learning Queue prioritizes lowest mastery".

## 11. Fix Plan (Prioritized)
1. **[High] Fix `state.test.ts` Prioritization Constraint**:
   - **Issue**: Mutation survived.
   - **Fix**: Add test case with 2 unmastered skills (e.g., 0.2 and 0.4 mastery) and assert the 0.2 one is recommended.
2. **[Medium] Verify `ProblemBank` FS Integration**:
   - **Issue**: Heavy mocking.
   - **Fix**: Add a "contract test" that runs against a real temp file.

## 12. Proof of Done
- Audit completed. Report generated. No code changes made (Audit mode).
