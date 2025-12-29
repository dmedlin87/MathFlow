# Behavior-First Test Audit Report

## 1. Mode & Evidence
- **Mode:** Mode A (Executed locally)
- **Environment:** Node v22.21.1, pnpm 10.20.0, Vitest v4.0.16
- **Test Run:** `pnpm test run` (565 tests passed)

## 2. Preflight Run
**Summary:**
- **Pass Rate:** 100% (565/565)
- **Duration:** ~13s
- **Determinism:** 5/5 runs passed identical tests.
- **Coverage:** ~98% Lines, ~94% Branches (High overall, but specific gaps found).

**[RUN] Excerpt:**
```
Test Files  49 passed (49)
Tests  565 passed (565)
Start at  21:30:53
Duration  12.34s
```

## 3. Test Inventory Map (Sampled)

| Test File | Target Module | Type | Behaviors Claimed |
|-----------|---------------|------|-------------------|
| `src/components/MathTutor.test.tsx` | `MathTutor.tsx` | Integration/UI | Session flow, correctness feedback, diagnosis flow, input types. |
| `src/domain/generator/engine.test.ts` | `engine.ts` | Unit/Integration | API fetching, fallbacks, registry mechanics, error handling. |
| `server/src/store/ProblemBank.test.ts` | `ProblemBank.ts` | Unit/Backend | Persistence safety, empty state handling, shuffling logic. |
| `src/domain/learner/state.test.ts` | `state.ts` | Unit/Domain | State initialization, BKT updates (increase/decrease/clamp), stability. |
| `src/domain/skills/grade4/nbt.test.ts` | `nbt.ts` | Unit/Generator | Deterministic problem generation for specific skill types. |

## 4. Risk Ranking

1.  **`src/domain/generator/engine.ts` (Score: 90)**
    *   **Why:** Core orchestrator. If this breaks, the app stops working. Complex fallback logic.
    *   **Status:** Well-tested, high coverage.
2.  **`src/domain/learner/state.ts` (Score: 85)**
    *   **Why:** Controls user progress and mastery. Bugs here ruin the learning experience.
    *   **Status:** Solid behavior tests, explicit edge case coverage.
3.  **`src/components/MathTutor.tsx` (Score: 80)**
    *   **Why:** Main user interface. High state complexity (machines).
    *   **Status:** Tests rely heavily on mocks (risk of integration drift), but cover UI states well.
4.  **`server/src/store/ProblemBank.ts` (Score: 60)**
    *   **Why:** Backend persistence. Data integrity.
    *   **Status:** Good logic tests, but some error handling branches uncovered.

## 5. Coverage Reality Map

**Uncovered Branches / Gaps:**
*   **`server/src/store/ProblemBank.ts`**:
    *   Lines 44-49: Generic error handling during initialization (e.g., permission errors).
    *   Line 61: Error handling during persistence (save failures).
    *   **[COV]**: `ProblemBank.ts | 85.71 | 72.97 | 87.5 | 84.5 | ...44-49,61,93-94`
*   **`src/components/MathTutor.tsx`**:
    *   Lines 57-174 (scattered): Error handling paths and specific edge case rendering.
    *   **[COV]**: `MathTutor.tsx | 96.96 | 93.51 | ...` (High, but integration points often mocked).

## 6. Contract Map

**Module: `server/src/store/ProblemBank.ts`**
*   **Inputs:** `MathProblemItem` (must be VERIFIED).
*   **Outputs:** `Promise<void>` (save), `Promise<MathProblemItem[]>` (fetch).
*   **Invariants:**
    *   Cannot save UNVERIFIED items.
    *   Fetch returns <= limit items.
    *   Returns random sample (shuffled) or partial shuffle.
*   **Evidence:** `should reject saving unverified items`, `should return a shuffled copy when count exceeds available items`.

**Module: `src/domain/learner/state.ts`**
*   **Inputs:** `LearnerState`, `Attempt`.
*   **Outputs:** New `LearnerState` (immutable).
*   **Invariants:**
    *   Mastery clamped [0.01, 0.99].
    *   Mastery increases on correct, decreases on incorrect.
*   **Evidence:** `clamps mastery between 0.01 and 0.99`, `increases mastery on correct attempt`.

## 7. Test Quality Scorecard

| Test | Classification | Reason / Evidence |
|------|----------------|-------------------|
| `ProblemBank: should return a shuffled copy...` | ✅ Behavior-constraining | Failed mutation when shuffle logic removed. |
| `MathTutor: ends session after 5 problems` | ✅ Behavior-constraining | Verifies complex session state transition. |
| `LearnerState: increases mastery on correct` | ✅ Behavior-constraining | strict BKT logic verification. |
| `MathTutor: loads item on mount` | ⚠️ Weak / Brittle | Heavily mocked service layer; verifies React lifecycle more than app logic. |
| `Engine: tries to fetch from API...` | ✅ Behavior-constraining | Verifies network integration and fallback protocols. |

## 8. Flake Report
*   **Status:** Clean.
*   **Probe:** Ran tests 5 times. No failures observed.
*   **Notes:** Tests use `vi.mock` for time and `createMockRng` for randomness, ensuring determinism.

## 9. Snapshot Audit
*   **Status:** Minimal use of snapshots. Most tests assert specific DOM elements or state values.
*   **Verdict:** Healthy.

## 10. Mutation Notes

**Target:** `server/src/store/ProblemBank.ts`
**Mutation:**
```typescript
// private sample<T>(array: T[], count: number): T[]
// ...
// if (count >= len) {
//   return []; // MUTATION: Was returning shuffled copy
// }
```
**Outcome:** **KILLED**
*   Test `should return a shuffled copy when count exceeds available items` failed.
*   Test `should shuffle deterministically when count equals available items` failed.
*   **Conclusion:** Tests effectively constrain the sampling/shuffling behavior.

## 11. Fix Plan (Prioritized)

1.  **[TEST-ONLY] Strengthen `ProblemBank` Error Coverage:**
    *   Add test cases mocking `fs.readFile` / `fs.writeFile` to throw generic errors (not just ENOENT) to cover lines 44-49 and 61.
    *   *Why:* Ensures the server doesn't crash or behave unpredictably on disk IO failures.

2.  **[TEST-ONLY] Harden `MathTutor` Integration Tests:**
    *   Introduce a test variant using a "Real" `LearnerService` (with mocked network but real Engine/State logic) to catch integration bugs masked by the current heavy mocking.
    *   *Why:* `MathTutor` is critical UI; mocks are currently "happy path" heavy.

3.  **[TEST-ONLY] Verify `ProblemBank` Shuffling Distribution:**
    *   Current tests check *if* it shuffles (via mock RNG), but a statistical property test (run N times, check distribution) would be more robust for the "random" path if mocks change. (Low priority, current deterministic mock tests are "Good Enough" for now).

4.  **[TEST-ONLY] Clean up specific `any` casts in tests:**
    *   Saw `(fs.readFile as any)` in `ProblemBank.test.ts`. Use proper type assertions or `vi.mocked()`.

## 12. Proof of Done
*   Mutation verification confirmed test effectiveness.
*   Preflight confirms passing suite.
*   Audit report generated.
