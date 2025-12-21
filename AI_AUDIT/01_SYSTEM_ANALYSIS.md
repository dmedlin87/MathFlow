# MathFlow System Analysis — Audit-Grade System Report

## 1. Executive Snapshot

- **Current Health**: passing (Build, Test, Lint).
- **Major Risks**: Data Persistence (In-Memory), Security (No Auth), Supply Chain (Bleeding Edge React).
- **Description**: Monorepo with React/Vite SPA and Express backend. Uses stateless "Just-in-Time" content generation via shared TypeScript logic (`@domain`).
- **Critical Stats**: 77% Branch Coverage, 47 Test Files, ~550 Tests.

## 2. System Map

### Architecture

```mermaid
graph TD
    Client[Client (React/Vite)] -->|HTTP API| Server[Server (Express)]
    Server -->|Reads/Writes| ProblemBank[ProblemBank (In-Memory Map)]
    Server -->|Generates| Pipeline[ContentPipeline]
    Pipeline -->|Uses| Generators[Domain Generators (TS)]
    Generators -->|Imports| Domain[Logic & Types]
    Pipeline -->|Mocks| AI[MockCritic/MockJudge]
    
    subgraph Data Flow
    Client -- "GET /api/problems" --> Server
    Server -- "Lookup" --> ProblemBank
    ProblemBank -- "Miss" --> Pipeline
    Pipeline -- "New Problem" --> ProblemBank
    end
```

### Entry Points

- **Client**: [main.tsx](../src/main.tsx) (App mounts to `#root`)
- **Server**: [index.ts](../server/src/index.ts) (Express app listening on `PORT`)

### Key Dependencies

- **Runtime**: Node.js (v22+), React (`^19.1.0` - **Unstable/Nightly**), Express.
- **Math**: `katex` for rendering in [MathRenderer.tsx](../src/components/MathRenderer.tsx).
- **State**: In-memory `Map` in [ProblemBank.ts](../server/src/store/ProblemBank.ts).

## 3. Risk Register

| Severity | Finding | Evidence | Impact | Likelihood | Confidence | Next Step | Fastest Proof |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **High** | **Data Loss on Restart** | `server/src/store/ProblemBank.ts:4` (`private items: Map...`) | All generated problems are lost when server restarts. | 100% | 1.0 | Implement SQLite/JSON persistence. | Restart server, data gone. |
| **High** | **No Authentication** | `server/src/index.ts` (No auth middleware used) | Public access to `POST /api/factory/run` allows DoS/abuse. | High | 1.0 | Add basic Auth/API Key. | `curl -X POST /api/factory/run` |
| **Med** | **Bleeding Edge React** | `package.json:27` (`^19.1.0`) | Potential stability issues or breaking changes in unreleased React. | Med | 0.9 | Pin to stable (18.x) or verify intent. | `npm list react` |
| **Med** | **Mocked AI Logic** | `server/src/index.ts:28-29` (`new MockCritic()`) | "Smart" features are currently stubs. | 100% | 1.0 | Clarify roadmap for AI integration. | Inspect `ContentPipeline` |
| **Med** | **Critical Math Utils Coverage** | `coverage-summary.txt` (18% in `math-utils.ts`) | Bugs in answer checking (`checkAnswer`) may be missed. | Med | 0.8 | Audit & Expand coverage for `math-utils.ts`. | Run coverage report. |
| **Low** | **Ad-Hoc Math Parsing** | `src/components/MathRenderer.tsx:11` (Regex split) | Fragile parsing of LaTeX/Text mix. Limits complex math support. | Low | 0.8 | Standardize on Markdown+MDX+KaTeX. | Render mixed text. |

## 4. Reality Checks

- **Tests**: **PASS**. 47 files, ~550 tests. Setup is solid (`vitest`).
- **Build**: **PASS**. `npm run build` works.
- **Lint**: **PASS**. `eslint` is clean.
- **Env**: `PORT` and `OPENAI_API_KEY` defined in `.env.example`, but API Key appears **unused** in code (grep returned 0 results in src).

## 5. Top 3 Next Moves

1. **Persistence**: Replace in-memory `ProblemBank` with a simple file-backed store (JSON or SQLite) to enable stateful testing and dev continuity.
    - *Success*: Problems persist across server restarts.
2. **Safety**: Add a basic API Key middleware to `server/src/index.ts` to protect the factory endpoints.
    - *Success*: `curl` fails without header.
3. **Stability**: Investigate React version `^19.1.0`. Downgrade to `18.3.1` (Stable) or confirm this is a deliberate "Future-Proof" choice.
    - *Success*: `package.json` reflects a standard version or documented decision.
