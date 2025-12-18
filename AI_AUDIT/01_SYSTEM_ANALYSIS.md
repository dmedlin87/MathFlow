# AI Audit — System Analysis (01)

## 1) Executive snapshot

**What this repo is:** A React + TypeScript tutoring UI backed by a small Express server that can serve (and just-in-time generate) “verified” math problem items, plus a deterministic domain layer of skill generators.

**Current health (evidence-backed):**

- **Typecheck:** PASS (root TS project refs)
  - Command: `npx tsc -b`
  - Result: exit 0
  - Evidence: command output (2025-12-18)
- **Typecheck (server):** PASS
  - Command: `npx tsc -p server/tsconfig.json`
  - Result: exit 0
  - Evidence: command output (2025-12-18)
- **Tests:** PASS
  - Command: `npx vitest run`
  - Result: exit 0, “33 passed (33) / 272 passed (272)”
  - Evidence: command output (2025-12-18)
- **Lint:** PASS
  - Command: `npm run lint`
  - Result: exit 0
  - Evidence: command output (2025-12-18)
- **Docs checks:** **FAIL**
  - Command: `npm run docs:check`
  - Result: exit 1 due to broken local link `./docs/ARCHITECTURE_SPEC.md`
  - Evidence: command output (2025-12-18) + `README.md:L30-L36`, `docs/ARCHITECTURE.md` is the only docs file in `docs/`
- **Build:** **[UNRUN]** (produces artifacts in `dist/` / `server/dist/`)
  - Canonical command: `npm run build` (`tsc -b && vite build`) per `package.json:L6-L18`

**Top systemic risks (ranked):**

1. **Supply-chain risk**: suspicious dependency named `"-"` with `UNLICENSED` in lockfile.
2. **Package-manager drift**: both `package-lock.json` and `pnpm-lock.yaml` exist.
3. **Docs drift blocks `docs:check`**: README points to missing `docs/ARCHITECTURE_SPEC.md`.
4. **No CI is defined in-repo**: docs imply GitHub Actions but no workflow files exist.
5. **Runtime “server-first” architecture is opt-in**: client uses server only when `VITE_API_BASE_URL` is set; otherwise it silently falls back to local generators.

**Environment captured:** Node `v22.11.0`, npm `10.9.0` (command output 2025-12-18).

---

## 2) System map

### 2.1 Architecture diagram (text)

```text
Browser (Vite dev / static build)
  └─ React UI (src/main.tsx -> src/App.tsx)
      ├─ MathTutor (src/components/MathTutor.tsx)
      │    └─ ILearnerService (src/services/LearnerService.ts)
      │         ├─ recommendNextItem(...) (src/domain/learner/state.ts)
      │         │    └─ engine.generate(skillId, difficulty) (src/domain/generator/engine.ts)
      │         │         ├─ fetch {API_BASE}/problems + {API_BASE}/factory/run  (network path)
      │         │         └─ local generator fallback (registered in engine singleton)
      │         └─ MisconceptionEvaluator (src/domain/learner/misconceptionEvaluator.ts)
      └─ Dashboard (src/components/Dashboard.tsx)

Node/Express server (server/src/index.ts)
  ├─ GET /api/problems
  │   └─ ProblemBank.fetch (server/src/store/ProblemBank.ts)  [in-memory]
  │       └─ if empty: skillGeneratorMap.get(skillId) (src/domain/skills/generatorMap.ts)
  │           └─ ContentPipeline.run(...) (server/src/factory/pipeline.ts)
  │               ├─ DomainGeneratorAdapter -> domain Generator.generate(...)
  │               ├─ MockCritic.solve
  │               └─ MockJudge.evaluate -> mark candidate VERIFIED
  └─ POST /api/factory/run (generate+save N items)
```

### 2.2 Entry points + runtime modes

- **Client dev:** `npm run dev:client` runs Vite (`package.json:L6-L18`).
- **Server dev:** `npm run dev:server` runs `tsx watch --tsconfig server/tsconfig.json server/src/index.ts` (`package.json:L6-L18`).
- **Combined dev:** `npm run dev` runs both via `concurrently` (`package.json:L6-L18`).
- **Client production build:** `npm run build` (runs `tsc -b && vite build`) (`package.json:L6-L18`).
- **Server bundle build (optional):** `npm run build:server` uses Vite SSR build targeting Node 20 and outputs to `server/dist` (`package.json:L6-L18`, `vite.config.server.ts:L4-L16`).

### 2.3 Key data/state flows

- **Learner state**
  - Stored client-side via `localStorage` (`src/services/persistence.ts:L3-L29`).
  - Mutated by deterministic domain function `updateLearnerState` (`src/domain/learner/state.ts:L25-L91`).

- **Problem item retrieval**
  - **Preferred path (network)**: `Engine.generate` calls `fetch(${API_BASE}/problems?... )`, then possibly `fetch(${API_BASE}/factory/run, POST)` (`src/domain/generator/engine.ts:L39-L64`).
  - **Fallback path (local)**: if no API base URL or network fails, it selects a registered generator and generates locally (`src/domain/generator/engine.ts:L73-L79`).

- **Server-side bank**
  - In-memory only (`ProblemBank` stores `Map`s; no persistence) (`server/src/store/ProblemBank.ts:L3-L6`).

### 2.4 External dependencies + env vars + secret surfaces

**Env vars (server):**

- `PORT` (`server/src/config.ts:L6-L14`, `.env.example:L1`)
- `RATE_LIMIT_MAX` (`server/src/config.ts:L8-L10`)
- `DEFAULT_DIFFICULTY` (`server/src/config.ts:L11-L14`)

**Env vars (client):**

- `VITE_API_BASE_URL` via `import.meta.env` gated behind browser check (`src/domain/config.ts:L3-L16`).

**Secret surfaces:**

- `.env.example` declares `OPENAI_API_KEY` placeholder (`.env.example:L1-L2`) but there is **no code usage** located in this audit (search produced no server hits).

---

## 3) Risk register (ranked)

| Severity | Finding | Evidence | Impact | Likelihood | Confidence | Next step | Fastest proof |
|---|---|---|---|---|---:|---|---|
| **High** | Suspicious supply-chain dependency named `"-"` (version `0.0.1`, `UNLICENSED`) included as a direct dependency | `package.json:L20-L28`; `package-lock.json:L10-L52` shows `node_modules/-` resolved from npm registry | Potential malicious/typosquat package; unpredictable transitive installs; increases attack surface | Medium (always installed on `npm install`) | 0.85 | Remove the dependency if unintentional; regenerate lockfile(s) with a single package manager | `npm ls -a -` and grep usage of imports/requires of `"-"` |
| **Med** | Package manager drift: both npm and pnpm lockfiles are present | Repo root contains `package-lock.json` and `pnpm-lock.yaml` (directory listing); `pnpm-lock.yaml:L1-L31` | Installs may differ between contributors/CI; harder to reproduce bugs; supply-chain review duplicated | High (common contributor behavior) | 0.9 | Choose a single package manager; document it; delete the other lockfile | Fresh clone + `npm ci` vs `pnpm i` diff of resolved versions |
| **Med** | Docs check fails due to broken link in README (`docs:check`) | `npm run docs:check` output: broken link `README.md: ./docs/ARCHITECTURE_SPEC.md`; README references it (`README.md:L30-L36`); `docs/` contains only `ARCHITECTURE.md` | Any pipeline that runs `npm run docs:check` will fail; new devs hit dead links | High (always triggers) | 0.95 | Fix README link or add the missing doc file | Re-run `npm run docs:check` |
| **Med** | CI drift / missing CI definition: docs mention GitHub Actions but repo contains no workflow config | Docs claim CI (`docs/ARCHITECTURE.md:L32-L38`); no `.github/` directory found (search result) | Tests/lint/typecheck may not run on PRs; regressions can merge silently | Medium | 0.8 | Add minimal CI workflow running `npm ci`, `npm run lint`, `npx tsc -b`, `npx vitest run`, and optionally `npm run docs:check` | Create `.github/workflows/ci.yml` and verify in PR |
| **Med** | “Server-first runtime” is opt-in: client only uses server when `VITE_API_BASE_URL` is set; otherwise it silently uses local generators | `src/domain/config.ts:L3-L16` returns null unless `env.VITE_API_BASE_URL` and `window` exists; `src/domain/generator/engine.ts:L39-L79` uses network only if API base present | Architectural drift: production may unintentionally bypass server verification / persistence and behave differently than intended | Medium | 0.75 | Make the desired mode explicit (e.g., require server in prod, log loud warning when missing) | Add a test asserting `getApiBaseUrl()` behavior in built client env and an e2e smoke check hitting `/api/problems` |
| **Low** | Server has no `/api/health` endpoint even though this is a common expectation | No `app.get("/api/health"...)` found in `server/src` (search result); `server/src/index.ts` only registers `/api/problems` and `/api/factory/run` (`server/src/index.ts:L79-L136`) | Monitoring / readiness checks are harder; Vite proxy health checks can’t rely on a stable endpoint | Medium | 0.65 | Add `GET /api/health` returning `{ ok: true }` | `curl http://localhost:3002/api/health` |
| **Low** | Server “bank” is in-memory only; generated items are lost on restart | `server/src/store/ProblemBank.ts:L3-L6` | Data loss across restarts; can’t scale beyond one process | High (always) | 0.95 | Introduce a persistence adapter (file/SQLite/Postgres) behind `ProblemBank` | Add an integration test that restarts the server and checks bank persistence |

---

## 4) Reality checks (Tests/CI + Docs)

### 4.1 CI truth

- **No CI workflow config found in-repo** (**not** in `.github/workflows`) — therefore what runs on PRs is **[UNPROVEN]**.
- If CI is added later, consider also running `npm run docs:check`, which currently fails.

### 4.2 Test truth

- Test runner: Vitest (`package.json:L13-L14`, `vitest.config.ts:L6-L17`).
- A previous test audit report exists and claims multiple-run determinism; it also records Node v22.11.0 (`TEST_AUDIT_REPORT.md:L1-L17`).
- Local run on 2025-12-18: `npx vitest run` passed (33 test files, 272 tests).

### 4.3 Coverage truth

- Coverage artifacts exist (e.g., `coverage/` directory and various coverage logs), but **coverage was not re-run in this audit**.
- `TEST_AUDIT_REPORT.md` reports global coverage ~84% statements/lines and identifies weaker modules such as `misconceptionEvaluator.ts` (`TEST_AUDIT_REPORT.md:L40-L48`).

### 4.4 Docs truth

- README Quick Start uses `npm` (`README.md:L9-L24`), but `pnpm-lock.yaml` also exists.
- README links to a missing architecture spec doc (`README.md:L30-L36`).
- `docs:check` fails accordingly.

---

## 5) Dependency & supply chain notes

- **Direct deps include React 19 and Vite 6** (`package.json:L20-L55`).
- **High-risk signal:** direct dependency `"-"` from npm registry (`package-lock.json:L47-L52`). This is unusually named and should be considered suspicious until justified.
- **Lockfile drift:** pnpm and npm lockfiles exist simultaneously.

---

## 6) Top 3 next moves (highest leverage / lowest risk)

1. **Remove the `"-"` dependency + lockfile clean-up**

- **Why:** This is the single biggest supply-chain red flag.
- **Done looks like:** `package.json` no longer includes `"-"`; only one lockfile is kept; `npm ci` (or `pnpm i`) is reproducible.

1. **Fix docs drift + decide whether `docs:check` is a gate**

- **Why:** `npm run docs:check` currently fails; this breaks “docs as code” workflows.
- **Done looks like:** `npm run docs:check` succeeds; README points to existing docs.

1. **Define minimal CI that matches actual local health commands**

- **Why:** Without CI, regressions rely on local discipline.
- **Done looks like:** PRs run `lint`, `tsc -b`, `vitest run`, and (optionally) `docs:check`.

---

## Appendix: Canonical commands (from repo)

- `npm run dev` / `npm run dev:client` / `npm run dev:server` (`package.json:L6-L10`)
- `npm run test` (Vitest) (`package.json:L13-L14`)
- `npm run lint` (`package.json:L11-L12`)
- `npm run build` (`package.json:L10-L11`)
- `npm run docs:check` (`package.json:L15-L17`)
