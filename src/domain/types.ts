export type GradeBand = "K-2" | "3-5" | "6-8" | "9-12";

// --- V1 Architecture Spec Types ---

export interface Provenance {
  generator_model: string;
  critic_model: string;
  judge_model: string;
  verifier: {
    type: "none" | "numeric" | "symbolic" | "hybrid";
    tool?: string | null;
    passed: boolean; // critical invariant
    details?: string | null;
  };
  revision_of?: string | null; // uuid
  attempt: number;
}

export interface VerificationReport {
  rubric_scores: {
    solvability: number;
    ambiguity: number;
    procedural_correctness: number;
    pedagogical_alignment: number;
  };
  underspecified: boolean;
  issues: string[]; // empty if clean
}

export interface MisconceptionConfig {
  id: string;
  error_tag: string;
  trigger: {
    kind: "exact_answer" | "regex" | "predicate";
    value: string; // "4/0" or regex string
  };
  hint_ladder: string[];
}

export interface VisualSpec {
  type: "box_plot" | "dot_plot" | "histogram" | "number_line" | "geometry_2d";
  data: any; // Flexible schema based on type
}

export interface MathProblemItem {
  meta: {
    id: string; // uuid
    version: number;
    skill_id: string;
    difficulty: number; // 1-5
    created_at: string; // ISO
    verified_at?: string | null;
    status: "DRAFT" | "IN_REVIEW" | "VERIFIED" | "REJECTED" | "RETIRED";
    provenance: Provenance;
    verification_report: VerificationReport;
  };
  problem_content: {
    stem: string; // Main question text (can be markdown/latex)
    format: "text" | "latex" | "mixed";
    variables?: Record<string, unknown>;
    diagram_prompt?: string | null;
    visual_spec?: VisualSpec; // Added Visual Spec
  };
  answer_spec: {
    answer_mode: "final_only" | "work_shown" | "mixed";
    input_type:
      | "integer"
      | "decimal"
      | "fraction"
      | "expression"
      | "set"
      | "boolean"
      | "multiple_choice"
      | "text";
    tolerance?: number | null;
    accepted_forms?: string[];
    ui?: {
      placeholder?: string | null;
      choices?: string[];
    };
  };
  solution_logic: {
    final_answer_canonical: string; // The TRUTH
    final_answer_type:
      | "numeric"
      | "algebraic"
      | "set"
      | "boolean"
      | "multiple_choice";
    steps: Array<{
      step_index: number;
      explanation: string;
      math: string; // LaTeX
      answer: string; // Expected user input for this step (scaffold)
    }>;
  };
  misconceptions: MisconceptionConfig[];
}

// Legacy Type Alias for Migration (Shim)
// We will transition consumers to MathProblemItem but keep this for now to reduce noise
export type Item = MathProblemItem & {
  // Add legacy fields mapped to new structure if needed, or just break and fix
  // For now, let's try to stick to the new one and fix the build.
  // Ideally code should use MathProblemItem.
};

// --- Skill Graph ---

export interface Skill {
  id: string;
  name: string;
  gradeBand: GradeBand;
  prereqs: string[]; // skill IDs
  misconceptions: string[]; // keys for common misconceptions (informational in V1, actual triggers in Item)
  templates: string[]; // template IDs
  description?: string;
  tags?: string[];
  standards?: string[]; // e.g. ["4.NF.A.1"]

  // Adaptation Parameters
  bktParams?: {
    learningRate?: number; // p_transit
    slip?: number;
    guess?: number;
  };
}

export interface SkillMap {
  [skillId: string]: Skill;
}

// --- Runtime State ---

export interface Attempt {
  id: string;
  userId: string;
  itemId: string;
  skillId: string;
  timestamp: string; // ISO date
  isCorrect: boolean;
  timeTakenMs: number;
  attemptsCount: number;
  hintsUsed: number;
  errorTags: string[]; // detected misconceptions
}

export interface SkillState {
  masteryProb: number; // 0.0 to 1.0
  stability: number; // For spaced repetition
  lastPracticed: string; // ISO date
  misconceptions: string[]; // Active misconceptions
}

export interface LearnerState {
  userId: string;
  skillState: {
    [skillId: string]: SkillState;
  };
}

// --- Interfaces for Services ---

export interface Generator {
  skillId: string;
  templateId: string;
  generate(difficulty: number, rng?: () => number): MathProblemItem;
}

export interface Diagnosis {
  divergence_step_index?: number;
  error_category: string; // e.g. "sign_error" or the tag
  diagnosis_explanation?: string;
  confidence_score?: number;
  hint_ladder?: string[]; // V1 extension for static hints
}

// --- UI Step Type for Interactive Scaffolding ---

/**
 * Represents a single step in an interactive solution walkthrough.
 * Used by InteractiveSteps component to guide learners through problem-solving.
 */
export interface Step {
  id: string;
  text: string; // The instructional text / question for this step
  answer?: string | number; // Expected answer (if interactive step)
  explanation?: string; // Explanation shown after correct answer
}
