# Documentation Audit Report (v1.0)

**Date:** 2025-12-14
**Auditor:** Antigravity (AI Agent)

## 1. Executive Summary

The audit reveals a **High Discrepancy** between the `README.md` (which is a generic template) and the project reality. The `ARCHITECTURE_SPEC.md` is highly detailed and structurally aligned with the codebase types, but the "Offline Verification Pipeline" it describes is currently **mocked/simulated** in the runtime code (`createMockProvenance`), rather than being a fully operational offline system.

**Confidence Score:** 9/10 (High certainty on findings)

### Top 3 Risks

1. **Onboarding Failure (P0):** `README.md` contains NO project-specific run instructions. A new developer following it cannot start the app.
2. **Architecture Simulation:** The "Verified Problem Bank" and "Critic/Judge" pipeline described in the Spec are implemented as *mocks* returning hardcoded "VERIFIED" statuses. This is a discrepancy if the spec implies a working AI pipeline.
3. **Missing CI/CD Integration:** There are no `docs:check` or verification scripts in `package.json` to prevent further drift.

### Top 3 Recommended Fixes

1. **Rewrite README.md:** Replace the Vite template with actual start commands (`npm run dev`).
2. **Annotate Architecture Spec:** Explicitly state that V1 uses "Simulated Provenance" for the offline pipeline until the full Content Factory is built.
3. **Implement Doc Safeguards:** Add `docs:check` scripts to `package.json` to enforce link integrity and script existence.

---

## 2. Truth Audit Findings

### Artifacts Audited

- `README.md` (Root)
- `docs/ARCHITECTURE_SPEC.md`
- `package.json`

### A) Scripts & Commands

| Claim (Doc) | Reality (Code) | Status | Evidence |
| :--- | :--- | :--- | :--- |
| `npm run dev` (Implicit) | `concurrently "npm run dev:client" ...` | **VERIFIED** | `package.json:9` |
| `npm run build` | Exists | **VERIFIED** | `package.json:10` |
| `docs:check` | Missing | **MISSING** | `package.json` |

### B) Code vs Prose Consistency

| Feature Claim | Implementation | Status | Notes |
| :--- | :--- | :--- | :--- |
| **BKT (Bayesian Knowledge Tracing)** | `bktParams` in `types.ts`, `grade4-fractions.ts` | **VERIFIED** | Data structures exist. |
| **MathProblemItem Schema** | `interface MathProblemItem` in `types.ts` | **VERIFIED** | Strict alignment. |
| **Offline Verification (Critic/Judge)** | `createMockProvenance` in `grade4-fractions.ts` | **SIMULATED** | Spec implies active agents; Code uses static mocks. |
| **Skill Graph** | `private generators: Map` in `engine.ts` | **IMPLICIT** | No explicit Graph Service found yet, but logic exists. |

---

## 3. Automation Plan (Phase 3 Proposal)

To prevent future drift, we recommend adding the following scripts to `package.json`:

```json
{
  "scripts": {
    "docs:check:links": "markdown-link-check **/*.md",
    "docs:check": "npm run docs:check:links"
  }
}
```
