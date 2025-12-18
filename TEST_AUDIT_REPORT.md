# Test Audit Report (v3.0)

## 1. Mode & Evidence
- **Mode A**: Full execution capability (dependencies installed, tests run, coverage generated).
- **Execution**: `pnpm` (v10.20.0), Node (v22.21.1).
- **Artifacts**:
    - Full test run output (272/272 passed).
    - Coverage report (Statements: 85.4%, Branches: 68.56%).
    - Determinism checks (5 runs of full suite).

## 2. Preflight Run
- **Command**: `pnpm test run`
- **Result**: **PASS** (272 tests passing).
- **Determinism**: **PASS** (5 consecutive runs passed without flakes).
- **Coverage Summary**:
    - **Statements**: 85.4%
    - **Branches**: 68.56%
    - **Uncovered Areas**: High-risk gaps in `server/src/index.ts` (36%), `MathTutor.tsx` (58%), and visualizers.

## 3. Test Inventory Map (Triage Sample)

| Test File | Target Module | Type | Behaviors Claimed |
|-----------|---------------|------|-------------------|
| `src/domain/generator/engine.behavior.test.ts` | `Engine` (Core) | Unit | API fallback logic, error handling, local generation fallback. |
| `src/domain/learner/state.behavior.test.ts` | `LearnerState` (Core) | Unit | Mastery updates (BKT), stability logic, recommendation engine. |
| `src/domain/skills/grade6/stats.behavior.test.ts` | `DotPlotGenerator` (Content) | Unit | Distribution properties (mode calculation), randomization. |
| `src/components/MathTutor.test.tsx` | `MathTutor` (UI) | Integration | Submission flow, loading states, disabling UI during async. |
| `server/src/index.test.ts` | `server/src/index` (Backend) | Integration | Route handling, error middleware, security headers. |
| `server/src/factory/pipeline.test.ts` | `ContentPipeline` (Backend) | Unit | Generation pipeline, retries, verification integration. |

## 4. Risk Ranking

| Rank | Module | Risk Score | Rationale |
|------|--------|------------|-----------|
| 1 | `LearnerState` (`state.ts`) | 85/100 | **Critical**: Controls mastery & progression. Complex BKT logic. High bug impact (user progress). |
| 2 | `Engine` (`engine.ts`) | 80/100 | **Critical**: Central problem dispatch. Complex network/fallback logic. |
| 3 | `server/src/index.ts` | 60/100 | **High**: API entry point. Low coverage (36%). Security implications. |
| 4 | `MathTutor.tsx` | 55/100 | **Medium**: Main user interface. Async state management complexity. |
| 5 | `DotPlotGenerator` | 40/100 | **Low**: Specific content generator. Isolated scope. |

## 5. Coverage Reality Map

| Module | Branch Coverage | Reality Check |
|--------|-----------------|---------------|
| `server/src/index.ts` | 27.5% | **DANGEROUS**. Main API handler logic is mostly uncovered. Tests mock `problemBank` but miss error middleware integration paths. |
| `MathTutor.tsx` | 45.91% | **WEAK**. UI states (loading, error) covered, but edge cases (network failure, weird inputs) missed. |
| `LearnerState` | 100% | **EXCELLENT**. High confidence. Mutation testing confirmed robustness. |
| `Engine` | 94.73% | **STRONG**. Fallback logic well-covered. |

## 6. Contract Map

| Function | Inputs | Outputs | Invariants | Call-Site Evidence |
|----------|--------|---------|------------|--------------------|
| `Engine.generate` | `skillId`, `difficulty` | `MathProblemItem` | Must return valid item or throw. Fallback to local if API fails. | `MathTutor.tsx` calls `engine.generate`. |
| `updateLearnerState` | `state`, `attempt` | `LearnerState` | Mastery [0.01, 0.99]. Stability >= 0. | `LearnerService.ts` calls `updateLearnerState`. |
| `recommendNextItem` | `state` | `MathProblemItem` | Must respect grade level & prerequisites. | `LearnerService.ts` calls `recommendNextItem`. |

## 7. Test Quality Scorecard

| Test File | Classification | Evidence | Fix |
|-----------|----------------|----------|-----|
| `engine.behavior.test.ts` | ✅ **Real** | Fails on mutation (breaking fallback throws error). | N/A |
| `state.behavior.test.ts` | ✅ **Real** | Fails on mutation (inverted logic fails assertions). | N/A |
| `stats.behavior.test.ts` | ✅ **Real** | Constrains mode calculation logic. | N/A |
| `MathTutor.test.tsx` | ✅ **Real** | Verifies async UI state transitions (disabled button). | N/A |
| `index.test.ts` | ⚠️ **Weak** | Mocks `problemBank` too heavily; doesn't verify middleware stack integration fully. | Add integration test with `supertest`. |

## 8. Flake Report
**Status**: CLEAN.
- 5/5 runs passed.
- No flaky tests identified in the sample.

## 9. Snapshot Audit
**Status**: CLEAN.
- No use of `toMatchSnapshot` or `toMatchInlineSnapshot` found in the codebase.

## 10. Mutation Notes
- **`Engine` Fallback Logic**:
    - Mutation: Threw error instead of fallback in `generate()`.
    - Outcome: **Caught**. 5 tests failed. `returns local item when /problems API returns null` failed as expected.
- **`LearnerState` Update Logic**:
    - Mutation: Inverted correctness check (`if (false)` instead of `if (attempt.isCorrect)`).
    - Outcome: **Caught**. 3 tests failed. Mastery decrease observed when increase expected.

## 11. Fix Plan (Prioritized)

1.  **[High] Server Integration Tests**:
    - `server/src/index.ts` has low coverage (27.5% branch).
    - **Action**: Add `supertest` integration tests to verify real HTTP middleware stack, error handling, and rate limiting without mocking internal handlers.

2.  **[Medium] MathTutor Error States**:
    - `MathTutor` tests happy path and loading, but misses error handling (e.g., submission failure).
    - **Action**: Add test case for `submitAttempt` rejection and verify UI error message.

3.  **[Low] Generator Boundary Testing**:
    - `DotPlotGenerator` assumes strict RNG behavior.
    - **Action**: Add more property-based tests (fuzzing) to ensure robust mode calculation across random seeds.

4.  **[Low] Prerequisite Integrity**:
    - `LearnerState` relies on `ALL_SKILLS` import.
    - **Action**: Add consistency test to ensure all prereq IDs in `ALL_SKILLS` actually exist in the registry (already partially covered by `registry.consistency.test.ts`, ensure it's comprehensive).

## 12. Proof of Done
- All claims backed by [RUN] output or [CODE] analysis.
- Mutations performed and verified.
- Coverage data analyzed.
