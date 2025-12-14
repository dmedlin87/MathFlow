# Hybrid AI Intelligent Tutoring System (MathFlow)

## Architecture Spec (V1) — Verified Content + Runtime Scaffolding + Skill Graph

This document specifies a production-oriented **Hybrid AI** architecture for MathFlow: an Intelligent Tutoring System (ITS) that separates **Pedagogical Truth** (skills, mastery, verified problems) from **Conversational Voice** (LLMs used for explanations and hints).

The system is designed to be **safe for school math** (especially elementary/middle), scalable, and auditable. High-school expansion is supported, but V1 prioritizes reliability and speed of iteration.

---

## 1. Goals and Non‑Negotiables

### 1.1 Goals

- **Trustworthy math practice**: students see only problems that passed offline verification.
- **Adaptive progression**: “what’s next” is computed from a **skill DAG + mastery model**, not from the chat.
- **Just‑in‑time help**: wrong answers trigger diagnosis → targeted hinting with controlled disclosure (fading).
- **Auditable by design**: every served problem is traceable to its verification run and model/tool versions.

### 1.2 Safety/Integrity Invariants (Hard Rules)

1. **Verified‑only delivery**: runtime must never call an LLM to generate *new* student-facing problems.
2. **Blind‑solve evaluation**: the critic solves from the stem only (no access to generator solution) before comparison.
3. **Deterministic first**: correctness checks prefer symbolic/numeric tooling; LLM judging is never the primary truth oracle when a deterministic check exists.
4. **State is authoritative outside the LLM**: mastery, attempts, and progression are stored/computed by services, not inferred.
5. **Schema‑bound outputs**: LLM outputs must be strict JSON validated server‑side; schema failures are hard fails.
6. **No-answer leakage**: hint levels 1–2 must not reveal the final answer; leaks are blocked by policy + detectors.
7. **Versioned everything**: skills graph, problems, and policies are versioned and audit-linked.

---

## 2. System Overview

### 2.1 High-Level Components

#### Offline (Content Factory)

- **Problem Generator (LLM)**: produces candidate items anchored to a skill node; outputs strict `MathProblemItem` JSON.
- **Critic (LLM, blind solve)**: solves stem-only, returns derived solution + rubric scores + issues.
- **Judge (LLM, compare phase)**: compares critic solution to generator solution; final rubric scoring + verdict.
- **Deterministic Verifier (CAS/numeric)**: validates answer equivalence where supported (recommended for V1).
- **Refinement Loop**: bounded revise cycles (max attempts) on rejection.
- **Verified Problem Bank**: persistent store for `VERIFIED` items with provenance + audit trail.

#### Runtime (Tutoring)

- **Orchestrator**: explicit state machine controlling session flow, policies, and persistence.
- **Answer Checker (Deterministic)**: checks student inputs against `answer_spec` and canonical truth.
- **Diagnosis Engine**: classifies error; uses lightweight matchers first, LLM second.
- **Scaffolding Engine**: generates hints (fading levels), Socratic prompts, and micro-remediation.
- **Skill Graph Service (DAG)**: computes unlocks, recommendations, and “what to practice next.”
- **Learner Model Service**: updates mastery (BKT or alternative) and stores knowledge state.
- **Telemetry/Analytics**: events + dashboards for learning outcomes and system performance.
- **Caches**: prefetch + semantic cache for common errors/hints (with version-aware invalidation).

### 2.2 Data Plane vs Control Plane

- **Control Plane**: skill graph, mastery algorithm params, hint policies, verification thresholds, graders/verifiers.
- **Data Plane**: problems, solutions, attempts, diagnoses, hints, audit logs, usage telemetry.

LLMs operate only on the **data plane** and are never the authority for correctness, progression, or mastery.

---

## 3. Learner Model & Mastery (The “Brain”)

V1 uses **Bayesian Knowledge Tracing (BKT)** per skill node. (Alternative models like Elo/IRT can be swapped later, but the contract remains.)

### 3.1 Per-Skill State (Stored)

For each learner and each `skill_id`, store:

- `p_mastery` (0..1): probability the learner knows the skill
- `p_transit` (0..1): probability of learning the skill after one practice opportunity
- `p_slip` (0..1): probability of error despite knowing the skill
- `p_guess` (0..1): probability of correct guess without knowing the skill
- counters/timestamps: `opportunities`, `last_practiced_at`, `streak`, `last_outcome`

### 3.2 Update Equations (Standard BKT)

Let `p = p_mastery` prior to the attempt.

Posterior after observing correctness:

- If **Correct**:
  - `p_given_obs = (p * (1 - p_slip)) / (p * (1 - p_slip) + (1 - p) * p_guess)`
- If **Incorrect**:
  - `p_given_obs = (p * p_slip) / (p * p_slip + (1 - p) * (1 - p_guess))`

Learning transition after opportunity:

- `p_mastery_next = p_given_obs + (1 - p_given_obs) * p_transit`

### 3.3 Mastery Thresholds and Policies

- Default mastery threshold: `p_mastery >= 0.95` → skill “Mastered”
- “Needs review” threshold: `p_mastery < 0.75` → prioritize practice
- Optional spacing rule: if `last_practiced_at` is old, schedule review even if mastered

### 3.4 Assessment vs Practice

- **Practice items** update BKT gradually.
- **Checkpoint/quiz items** can update with stronger weight (policy-controlled) or be modeled separately.

---

## 4. Offline Content Verification Pipeline

### 4.1 Contract

**Input:** `skill_id` (node), difficulty, generation params  
**Output:** `VERIFIED` `MathProblemItem`, or a structured `REJECT` report

**Core goal:** runtime is a read-only consumer of verified items.

### 4.2 Generator → Critic → Judge → Verifier

#### Stage A: Generator (Seed Creation)

- Anchored to a specific `skill_id`
- Outputs strict JSON including stem, answer spec, canonical answer, and solution derivation

#### Stage B: Critic (Blind Solve)

- Receives only `problem_content`
- Independently solves and returns derived solution + rubric scores + issues

#### Stage C: Judge (Compare + Rubric)

- Receives: generator solution + critic derived solution
- Produces verdict: `APPROVE | REJECT` + structured feedback

#### Stage D: Deterministic Verifier (Recommended)

Where supported, deterministically verify equivalence:

- numeric/fraction/decimal: normalize + compare (tolerance policy)
- simple algebraic: parse → canonical form → equivalence via CAS or constrained simplification
- sets/intervals: canonicalize ordering and membership/structure checks
- boolean/MCQ: strict match

**Deterministic verification is the highest-tier validator** whenever available.

#### Stage E: Refinement Loop (Bounded)

On `REJECT`, generator revises with critic/judge feedback; stop after `max_attempts`.

### 4.3 Refinement Loop Policy

- `max_attempts`: 3 (default)
- Preserve lineage with `revision_of` and `attempt` in provenance

### 4.4 Rubric Definition (0..1 each)

- `solvability`: unique and valid solution exists
- `ambiguity`: language precise; no missing units/definitions
- `procedural_correctness`: steps are mathematically valid and conventional
- `pedagogical_alignment`: matches target skill/difficulty; no hidden prerequisites

**Approval policy (default):**

- All rubric scores `>= 0.95`
- `underspecified == false`
- deterministic verifier passes when applicable

Rubric thresholds are **configuration**, not “prompt vibes.”

---

## 5. Data Model

### 5.1 `MathProblemItem` (V1 JSON Schema)

This is the “truth artifact” served to learners. It includes UI input constraints and misconception hooks.

```json
{
  "$schema": "http://json-schema.org/draft-2020-12/schema#",
  "title": "MathProblemItem",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "meta": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "version": { "type": "integer", "minimum": 1 },
        "skill_id": { "type": "string" },
        "difficulty": { "type": "integer", "minimum": 1, "maximum": 5 },
        "created_at": { "type": "string", "format": "date-time" },
        "verified_at": { "type": ["string", "null"], "format": "date-time" },
        "status": { "type": "string", "enum": ["DRAFT", "IN_REVIEW", "VERIFIED", "REJECTED", "RETIRED"] },
        "provenance": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "generator_model": { "type": "string" },
            "critic_model": { "type": "string" },
            "judge_model": { "type": "string" },
            "verifier": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "type": { "type": "string", "enum": ["none", "numeric", "symbolic", "hybrid"] },
                "tool": { "type": ["string", "null"] },
                "passed": { "type": "boolean" },
                "details": { "type": ["string", "null"] }
              },
              "required": ["type", "passed"]
            },
            "revision_of": { "type": ["string", "null"], "format": "uuid" },
            "attempt": { "type": "integer", "minimum": 1 }
          },
          "required": ["generator_model", "critic_model", "judge_model", "verifier", "attempt"]
        },
        "verification_report": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "rubric_scores": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "solvability": { "type": "number", "minimum": 0, "maximum": 1 },
                "ambiguity": { "type": "number", "minimum": 0, "maximum": 1 },
                "procedural_correctness": { "type": "number", "minimum": 0, "maximum": 1 },
                "pedagogical_alignment": { "type": "number", "minimum": 0, "maximum": 1 }
              },
              "required": ["solvability", "ambiguity", "procedural_correctness", "pedagogical_alignment"]
            },
            "underspecified": { "type": "boolean" },
            "issues": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["rubric_scores", "underspecified", "issues"]
        }
      },
      "required": ["id", "version", "skill_id", "difficulty", "created_at", "status", "provenance", "verification_report"]
    },
    "problem_content": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "stem": { "type": "string" },
        "format": { "type": "string", "enum": ["text", "latex", "mixed"], "default": "mixed" },
        "variables": { "type": "object", "default": {} },
        "diagram_prompt": { "type": ["string", "null"] }
      },
      "required": ["stem", "format"]
    },
    "answer_spec": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "answer_mode": { "type": "string", "enum": ["final_only", "work_shown", "mixed"], "default": "final_only" },
        "input_type": { "type": "string", "enum": ["integer", "decimal", "fraction", "expression", "set", "boolean", "multiple_choice"] },
        "tolerance": { "type": ["number", "null"], "description": "Decimals only (e.g., 0.01).", "default": null },
        "accepted_forms": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Optional explicit canonical strings accepted (e.g., ['0.5','1/2']).",
          "default": []
        },
        "ui": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "placeholder": { "type": ["string", "null"], "default": null },
            "choices": { "type": "array", "items": { "type": "string" }, "default": [] }
          },
          "default": {}
        }
      },
      "required": ["input_type"]
    },
    "solution_logic": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "final_answer_canonical": { "type": "string" },
        "final_answer_type": { "type": "string", "enum": ["numeric", "algebraic", "set", "boolean", "multiple_choice"] },
        "steps": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "step_index": { "type": "integer", "minimum": 1 },
              "explanation": { "type": "string" },
              "math": { "type": "string", "description": "LaTeX or ASCII math expression." }
            },
            "required": ["step_index", "explanation", "math"]
          }
        }
      },
      "required": ["final_answer_canonical", "final_answer_type", "steps"]
    },
    "misconceptions": {
      "type": "array",
      "description": "Fast, deterministic misconception triggers (no LLM required).",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string" },
          "error_tag": { "type": "string" },
          "trigger": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "kind": { "type": "string", "enum": ["exact_answer", "regex", "predicate"] },
              "value": { "type": "string" }
            },
            "required": ["kind", "value"]
          },
          "hint_ladder": {
            "type": "array",
            "minItems": 1,
            "items": { "type": "string" },
            "description": "Static ladder for common errors; runtime can pick by attempt count."
          }
        },
        "required": ["id", "error_tag", "trigger", "hint_ladder"]
      },
      "default": []
    }
  },
  "required": ["meta", "problem_content", "answer_spec", "solution_logic"]
}
```

### 5.2 Canonicalization Rules (V1)

- **integer**: `"42"`
- **fraction**: `"3/4"` reduced; negative sign in numerator only (`"-3/4"`)
- **decimal**: fixed precision policy per skill/item; compare with `tolerance`
- **expression**: normalized whitespace; equivalence verified via CAS where supported
- **set**: canonical braces + sorted elements (policy-defined)
- **boolean**: `"true"` / `"false"`
- **multiple_choice**: strict choice key or exact string match

---

## 6. Deterministic Verifier Contract (V1)

### 6.1 Supported Types (V1 must-haves)

1. **integer**: strict equality after normalization
1. **fraction**: reduce both forms and compare
1. **decimal**: numeric compare with `tolerance`
1. **multiple_choice / boolean**: strict match

### 6.2 Supported Types (V1 optional)

1. **expression (simple algebra)**: equivalence check via:
   - CAS service (recommended), or
   - constrained simplification + randomized substitution (seeded, bounded domains)

### 6.3 Determinism Requirements

- Any randomized substitution uses a fixed seed.
- Domains avoid undefined points (division by zero).
- Parser/version is pinned and included in `meta.provenance.verifier.details`.

---

## 7. Runtime Tutoring Loop (Diagnosis + JIT Hinting)

### 7.1 Runtime Flow (Default)

1. Select `skill_id` from Skill Graph + Learner Model
2. Fetch a verified problem for `(skill_id, difficulty)`
3. Present stem
4. Collect attempt
5. Deterministic check → correct/incorrect
6. If incorrect → diagnose → choose hint level → serve hint → retry
7. Update mastery (BKT) after each opportunity
8. Advance node when mastered (and/or after checkpoint)

### 7.2 Two Interaction Modes (Answer Reality)

Driven by `answer_spec.answer_mode`:

#### Mode A — `final_only` (Default)

- Student enters only the final answer.
- Diagnosis strategy:
  1) **misconceptions[]** (fast, deterministic)
  2) If no match → LLM diagnosis classifier with `stem + student_answer + canonical answer type` (NOT full solution steps)
  3) Conservative hinting on low confidence

#### Mode B — `work_shown`

- Student enters multi-step work (structured text lines or UI math fields).
- Diagnosis strategy:
  - align student steps to `solution_logic.steps` and find divergence step index

### 7.3 Diagnosis Output Schema (Runtime)

```json
{
  "divergence_step_index": 2,
  "error_category": "sign_error",
  "diagnosis_explanation": "The negative sign was dropped when subtracting a negative value.",
  "confidence_score": 0.86
}
```

### 7.4 Error Taxonomy (V1)

- `procedural_error`
- `sign_error`
- `conceptual_error`
- `omission_error`
- `units_error`
- `representation_error`
- `unknown`

### 7.5 Hinting Policy (Fading Levels)

Default ladder by attempt count:

- attempt 1 → **Level 1**: pointing hint (where to look)
- attempt 2 → **Level 2**: rule hint (principle reminder)
- attempt 3+ → **Level 3**: bottom-out hint (reveal sub-step, not final answer)

Hint output schema:

```json
{
  "hint_level": 2,
  "hint_strategy": "rule_hint",
  "hint_text": "Remember: subtracting a negative is the same as adding its positive."
}
```

### 7.6 No-Answer Leak Controls

For hint levels 1–2:

- The hint generator must not receive `final_answer_canonical`.
- **Leak detector** blocks hints if they:
  - contain the canonical answer string (exact match after normalization), or
  - are judged to disclose the final answer (optional offline policy test), or
  - contain full-step solutions (policy-defined heuristics)

---

## 8. Skill Graph (Internal DAG, V1)

CASE/JSON‑LD support is optional as an import/export layer. V1 uses a clean internal DAG JSON for speed and debuggability.

### 8.1 `skills_graph.json` Schema (V1)

```json
{
  "version": "1.0.0",
  "nodes": [
    {
      "id": "frac_add_like",
      "name": "Add like fractions",
      "grade_band": "3-5",
      "prerequisites": ["frac_equiv", "frac_ident"],
      "bkt": { "p_init": 0.2, "p_transit": 0.12, "p_slip": 0.1, "p_guess": 0.2 },
      "tags": ["fractions", "addition"]
    }
  ]
}
```

### 8.2 Unlock + Recommend Logic

- **Unlocked** if all `prerequisites` are mastered (`p_mastery >= 0.95`)
- **Recommend** among unlocked:
  - lowest `p_mastery` first, then
  - highest “time since last practiced,” then
  - tie-breakers: priority/grade band/difficulty

### 8.3 DAG Validation

On graph import or deployment:

- cycle detection (reject if cycles)
- missing prereq ids (reject)
- bkt params sanity bounds (warn/reject by policy)

---

## 9. Service Interfaces (Minimum API Surface)

### 9.1 Skill Graph Service

- `GET /kg/graph?version=...`
- `GET /kg/nodes/{id}`
- `GET /kg/nodes/{id}/prerequisites`
- `POST /kg/learners/{learnerId}/available-nodes`

### 9.2 Problem Bank Service

- `GET /problems?skillId=...&difficulty=...&limit=...`
- `GET /problems/{problemId}?version=...`
- `POST /attempts` (stores attempt payload + normalized input)
- `POST /evaluate` (deterministic check; returns correctness + normalization details)

### 9.3 Mastery Service

- `GET /mastery/{learnerId}/skills`
- `POST /mastery/update` (skill_id, outcome, timestamp → updated mastery)

### 9.4 Scaffolding Service

- `POST /diagnose` (problem + attempt → diagnosis JSON)
- `POST /hint` (diagnosis + policy → hint JSON)

---

## 10. Observability & Auditability

### 10.1 Required Events (Runtime + Offline)

- `problem_served`
- `attempt_submitted`
- `attempt_evaluated`
- `diagnosis_completed`
- `hint_served`
- `mastery_updated`
- `skill_unlocked`
- `skill_mastered`
- `verification_approved`
- `verification_rejected`

### 10.2 Audit Requirements

Every served item must trace to:

- `skill_id` (node)
- problem id + version
- verification report + deterministic verifier status
- model ids + configuration hashes (where available)
- policy version ids (rubric thresholds, hint rules)

---

## 11. Failure Modes & Degraded Operation

### 11.1 Offline Pipeline Failures

- schema invalid → reject immediately
- critic disagreement → refine or discard
- verifier parse failure → policy decides: reject or mark as “LLM-only verified” (not recommended for V1)

### 11.2 Runtime Failures

- diagnosis model down → fallback to misconception ladder or generic pointing hint
- hint model down → cached hints or static ladder
- graph service down → continue current skill; block advancement; queue updates

---

## 12. Definition of Done (V1)

The system is “production-ready” when:

1. Runtime serves **only VERIFIED** problems (provable via audit queries).
2. Offline pipeline enforces blind solve + rubric gating + bounded refinement loop.
3. Deterministic verifier is implemented for: integer, fraction, decimal (with tolerance), boolean, MCQ.
4. Mastery updates are implemented and documented (BKT) with stable thresholds.
5. Diagnosis + hinting are schema-bound, leak-checked, and policy-driven.
6. Skill graph is DAG-validated (cycles block deploy).
7. End-to-end events are emitted and traceable across services.
