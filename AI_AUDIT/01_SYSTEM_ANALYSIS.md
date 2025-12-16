# System Analysis Report

**Date:** 2025-12-15
**Version:** 1.0.0
**Scope:** Full Repo (Client + Server + Shared Domain)

## 1. Executive Snapshot

- **Current Health:**
  - **Tests:** [PASS] 24 files, 170 tests passing.
  - **Build:** [FAIL] `tsc -b` fails with 20 errors (unused variables).
  - **Lint:** [FAIL] (Unused variables overlap).
- **Biggest Systemic Risks:**
  1. **Zombie Server / Drift:** Client uses `LocalLearnerService` (simulation) while real Server exists but appears disconnected.
  2. **Build Broken:** Unused variables block clean builds, hiding real errors.
  3. **Data Persistence:** Server uses in-memory `ProblemBank` (data loss on restart); Client uses `localStorage` (device locked).
- **Description:** A dual-mode Math Learning application with a React client ("Proactive" Thick Client) and an Express server ("Reactive" API), sharing a core `domain` logic library.

## 2. System Map

### Architecture

```mermaid
graph TD
    Client[Client (React/Vite)] -->|Imports| Shared[Shared Domain]
    Server[Server (Express)] -->|Imports| Shared
    
    subgraph "Client Runtime"
        UI[App/MathTutor] --> LearnerService[LocalLearnerService]
        LearnerService -->|Simulates Network| DomainLogic[Client Domain Logic]
        DomainLogic --> LocalStore[localStorage]
    end
    
    subgraph "Server Runtime (Disconnected?)"
        API[API /api/problems] --> Pipeline[ContentPipeline]
        Pipeline --> ProblemBank[In-Memory Store]
    end
```

### Entry Points & Modes

- **Client:** `src/main.tsx` (Vite) -> `LocalLearnerService` (Simulated Remote).
- **Server:** `server/src/index.ts` (Express, Port 3000) -> `MemoryStore`.
- **Shared:** `src/domain` (Skills, Generators, Validation).

### Key Data Flows

- **Learning:** User actions -> `LearnerService` -> `LearnerState` update -> `localStorage`.
- **Content:** Server generates content via `ContentPipeline` -> `ProblemBank`. (Currently unused by Client).

## 3. Risk Register (Prioritized)

| Severity | Finding | Evidence | Impact | Likelihood | Confidence | Next Step | Fastest Proof |
|:---:|:---:|---|---|:---:|:---:|---|---|
| **High** | **Build Broken** | `src/domain/skills/grade6-ee.ts:408` (TS6133) | Blocked CI/CD; Developers ignore errors; Type safety erosion. | 100% | 1.0 | Fix unused vars or loosen config. | `npm run build` |
| **High** | **Architectural Drift** | `App.tsx` uses `LocalLearnerService`; Server exists but is unused. | Server code rots; Logic diverges; False sense of backend readiness. | 100% | 1.0 | Decide: Kill Server OR Connect Client. | `grep "fetch" src/services` |
| **Med** | **Data Loss (Server)** | `server/src/store/ProblemBank.ts:4` (`new Map()`) | Server restart wipes all generated problems. | 100% | 1.0 | Add SQLite or file persistence. | Restart server, check data. |
| **Med** | **Phantom Deps** | `server/src/index.ts` imports `../../src/domain` | Strict coupling; Server build fails if Client src moves. | 50% | 0.9 | Extract `domain` to workspace package. | Move `src` folder, check server. |
| **Low** | **Unused Vars** | 20+ instances in `domain/skills` | Noise in logs; sloppy code. | 100% | 1.0 | Run lint autofix or manual cleanup. | `npm run lint` |

## 4. Reality Checks

- **CI Truth:** Tests are green and fast (1.8s). Coverage artifacts exist (`coverage/`).
- **Docs Truth:** `package.json` scripts are accurate (`test`, `build`, `dev`).
- **Environment:** Node v22.11.0, npm 10.9.0.

## 5. Top 3 Next Moves

1. **Green the Build:** Fix the 20 unused variable errors in `grade6-ee.ts` and `grade6-stats.ts`. (Low effort, High impact).
2. **Unify or Decouple:** Explicitly decide if the Server is the target. If so, create `RemoteLearnerService` to talk to `/api`. If not, deprecate Server code or move to `tools/`.
3. **Harden Persistence:** If Server is kept, replace `new Map()` with `sqlite3` or `fs` based storage to prevent data loss.
