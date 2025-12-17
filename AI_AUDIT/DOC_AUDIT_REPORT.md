# Documentation Audit Report (Phase 2.1)

**Target:** `docs/ARCHITECTURE_SPEC.md`
**Auditor:** Jules (Principal Engineer)
**Date:** 2025-12-14

## 1. Executive Summary

The architecture specification (`ARCHITECTURE_SPEC.md`) describes a robust V1 Intelligent Tutoring System. While the core data models (`MathProblemItem`) and pedagogical algorithms (BKT) are implemented and verified, the documentation has drifted significantly regarding the **runtime composition** and **offline verification pipeline**.

The system is **FUNCTIONAL** but **MISREPRESENTED** in the docs. The code uses TypeScript-defined registries and helper functions (`createProblemMeta`) where the docs claim JSON artifacts (`skills_graph.json`) and specific mock helpers (`createMockProvenance`).

### Top 3 Risks
1.  **Ghost Artifacts (Medium Impact):** The docs reference `skills_graph.json` as the source of truth for the skill DAG. This file does not exist; the truth is hardcoded in `src/domain/skills/registry.ts`. New engineers looking for the JSON will be blocked.
2.  **Provenance Drift (Low Impact):** The docs claim `createMockProvenance` is used for V1. The code uses `createProblemMeta`. This makes the "Verification Pipeline" section confusing to implementers.
3.  **Aspirational Runtime (Low Impact):** Terms like `Orchestrator` and `DiagnosisEngine` are used as proper nouns/classes in the docs but exist only as distributed logic in `state.ts` and `engine.ts`.

### Top 3 Fixes
1.  **Renaming:** Update `ARCHITECTURE_SPEC.md` to explicitly state that `src/domain/skills/registry.ts` is the V1 implementation of the Skill Graph.
2.  **Correction:** Replace references to `createMockProvenance` with `createProblemMeta` and document the actual `provenance` structure populated by it.
3.  **Clarification:** Mark the "Offline Content Verification Pipeline" section as "Design Pattern / Logical Architecture" rather than implying strict class-based implementation.

**Confidence Score:** 8/10 (High confidence in drift detection; codebase structure is clean).

## 2. Missing Evidence

The following claims in the docs could not be verified with evidence:

*   `EVIDENCE: file_exists | skills_graph.json` (Claimed in Section 8.1)
*   `EVIDENCE: symbol_exists | createMockProvenance` (Claimed in Section 2.1)
*   `EVIDENCE: symbol_exists | Orchestrator` (Claimed in Section 2.1)

## 3. Verified Truths

*   **BKT Logic:** `masteryProb` updates and BKT equations are correctly implemented in `src/domain/learner/state.ts`.
*   **Data Model:** `MathProblemItem` interface in `src/domain/types.ts` (Line 45) strongly aligns with the JSON schema in the docs.
*   **Tooling:** `docs:check` scripts exist in `package.json` and pass for basic linting (links/snippets).
