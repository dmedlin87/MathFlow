# Behavior-First Test Audit Report (v3.0)

## 1. Mode & Evidence
- **Mode**: A (Native Execution)
- **Environment**: Node v22.11.0, Vitest v4.0.15, Win32
- **Artifacts**: Ran `npx vitest` and `npx vitest --coverage`.

## 2. Preflight Run
- **Command**: `npx vitest run`
- **Result**: **PASS** (49/49 tests passed, 9 files)
- **Determinism**: **5/5 Runs Passed** (No flakes observed).
- **Global Coverage**:
  - Statements: 84%
  - Branches: 83%
  - Functions: 88%
  - Lines: 84%

## 3. Test Inventory Map

| Test File | Target Module(s) | Type | Key Behaviors Claimed |
|-----------|------------------|------|-----------------------|
| `services/LearnerService.test.ts` | `LearnerService.ts` | Integ/Unit | Network simulation (latency), State loading, Attempt submission, Diagnosis |
| `domain/learner/scheduler.test.ts` | `state.ts` (Scheduler) | Unit | Prerequisite blocking, Review scheduling (probabilistic) |
| `domain/generator/engine.test.ts` | `engine.ts` | Integ | API Fetching, Local Fallback, Generator Registry |
| `domain/skills/grade4-fractions.test.ts` | `grade4-fractions.ts` | Unit | Content generation constraints (difficulty ranges), Misconception regex triggers |
| `domain/learner/state.test.ts` | `state.ts` | Unit | State updates (BKT logic) |

## 4. Risk Ranking

1.  **[HIGH] `src/services/LearnerService.ts`**
    *   *Why*: Application boundary, state management, simulated network I/O. Used directly by UI.
    *   *Risk*: High. Bugs here break the user session.
2.  **[HIGH] `src/domain/learner/scheduler.ts` (in `state.ts`)**
    *   *Why*: Core AI logic for progression.
    *   *Risk*: High. Determines if correct content is shown. Mutation test showed weak constraints.
3.  **[MED] `src/domain/skills/grade4-fractions.ts`**
    *   *Why*: Content source.
    *   *Risk*: Medium. Logic is complex (GCD, constraints) but isolated. Tests are brittle.

## 5. Coverage Reality Map

| Module | Branch Coverage | Uncovered / Weak Areas |
|--------|-----------------|------------------------|
| `engine.ts` | 78.57% | API Failure modes fully covered? |
| `misconceptionEvaluator.ts` | **50.00%** | Lines 12, 26, 34-45 (Specific error tag logic missing?) |
| `grade4-fractions.ts` | **66.66%** | Lines 65, 145-151 (Specific difficulty edge cases) |
| `LearnerService.ts` | 50.00% | Lines 26-27 (Serialization error), 45-46 (Recommendation wrapper) |

## 6. Contract Map

**Module: `LearnerService`** (Primary UI Interface)
- **Caller**: `src/components/MathTutor.tsx`
- **Contract Verified**:
    - `getRecommendation(state)`: ✅ Used and Tested.
    - `submitAttempt(state, attempt)`: ✅ Used and Tested.
    - `diagnose(item, answer)`: ✅ Used and Tested.
- **Drift**:
    - No significant drift found. Types (`Attempt`, `LearnerState`) are shared.

**Module: `Scheduler`**
- **Caller**: `LearnerService` -> `MathTutor`
- **Ambiguity**:
    - Prerequisite logic relies on `masteryProb > 0.7`. Tests verify this ostensibly, but see Mutation Notes.

## 7. Test Quality Scorecard

| Test File | Verdict | Evidence / Notes |
|-----------|---------|------------------|
| `LearnerService.test.ts` | ✅ **Real** | checks latency (`Date.now`), checks diagnosis output. |
| `scheduler.test.ts` | ⚠️ **Weak** | `recommends base skill...` survived mutation. Logic relies on list order, not just constraints. |
| `grade4-fractions.test.ts` | ⚠️ **Brittle** | Relies on `vi.spyOn(Math, 'random').mockReturnValue(...)` sequence. Implementation Locked. |
| `engine.test.ts` | ✅ **Real** | Good use of `fetch` mocking and fallback validation. |

## 8. Flake Report

- **Status**: **Clean** (5 runs).
- **Risk**: `LearnerService.test.ts` uses real wall-clock time (`Date.now` and >300ms assert).
    - *Mitigation*: If CI is very slow, 300ms might be exceeded naturally (false positive? No, it asserts *greater* than 300. It asserts `end - start >= 300`. This is safe from "slow CI" causing failure unless the *timer* fires too early, which is rare. The risk is if the test runs *too fast*, but `await setTimeout` ensures it waits. So actually fairly safe).

## 9. Snapshot Audit
- **Status**: No snapshots found (`toMatchSnapshot` not used).

## 10. Mutation Notes

**Target**: `src/domain/learner/state.ts` (Scheduler Logic)
- **Mutation**: Disabled the `if (!allPrereqsMet) return false;` check in `recommendNextItem`.
- **Test**: `src/domain/learner/scheduler.test.ts` -> "recommends base skill first when both are unmastered".
- **Outcome**: ❌ **SURVIVED**.
- **Analysis**: The test setup leaves both Base and Dependent skills at equal mastery (0.1). When the prereq check is removed, the scheduler picks the Base skill anyway because it appears first in the `ALL_SKILLS` list (stable sort fallback).
- **Implication**: The test does **not** prove that prerequisites are blocking the dependent skill; it only proves the Base skill is picked by default.

## 11. Fix Plan (Prioritized)

1.  **[Critical] Fix Scheduler Test (`scheduler.test.ts`)**
    -   *Action*: Modify "recommends base skill first" to give the Dependent skill *lower* mastery (e.g., 0.05) or some other advantage that would cause it to be picked if the prereq check were missing. Eliminate reliance on list order.
2.  **[Maintenance] Decouple Randomness (`grade4-fractions.ts`)**
    -   *Action*: Refactor Generators to accept an optional `rng` function. Pass a deterministic RNG in tests instead of spying on `Math.random`. Reduces brittleness.
3.  **[Coverage] Expand Misconception Coverage**
    -   *Action*: Add tests for `misconceptionEvaluator.ts` to cover the missing branches (50% -> 80%+).
4.  **[Safety] Leak Proofing**
    -   *Action*: `MathTutor.tsx` uses `new LocalLearnerService()` inside `useMemo`. Ideally this should be a singleton or Context to avoid re-instantiation issues, though `useMemo` handles it for now. Not a test issue, but an arch note.
