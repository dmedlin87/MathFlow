import type { MathProblemItem } from "./types";

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function getFactors(n: number): number[] {
  if (n <= 0) return [];
  const factors: number[] = [];
  const limit = Math.sqrt(n);
  for (let i = 1; i <= limit; i++) {
    if (n % i === 0) {
      factors.push(i);
      if (i !== n / i) {
        factors.push(n / i);
      }
    }
  }
  return factors.sort((a, b) => a - b);
}

// Helper to get random integer
export function randomInt(
  min: number,
  max: number,
  rng: () => number = Math.random
): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Mock provenance helper
export const createProblemMeta = (
  skillId: string,
  diff: number
): MathProblemItem["meta"] => ({
  id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  version: 1,
  skill_id: skillId,
  difficulty: Math.ceil(diff * 5) || 1,
  created_at: new Date().toISOString(),
  verified_at: new Date().toISOString(),
  status: "VERIFIED",
  provenance: {
    generator_model: "v0-rule-based-engine",
    critic_model: "v0-simulation",
    judge_model: "v0-simulation",
    verifier: { type: "numeric", passed: true },
    attempt: 1,
  },
  verification_report: {
    rubric_scores: {
      solvability: 1,
      ambiguity: 0,
      procedural_correctness: 1,
      pedagogical_alignment: 1,
    },
    underspecified: false,
    issues: [],
  },
});

export function checkAnswer(
  userAnswer: string,
  item: MathProblemItem
): boolean {
  if (!userAnswer) return false;

  const normalizedUser = userAnswer.trim();
  const canonical = String(item.solution_logic.final_answer_canonical).trim();

  // 1. Direct match (normalized)
  if (normalizedUser === canonical) return true;

  // 2. Accepted forms check
  if (item.answer_spec.accepted_forms) {
    if (
      item.answer_spec.accepted_forms.some(
        (form) => String(form).trim() === normalizedUser
      )
    ) {
      return true;
    }
  }

  // 3. Numeric check
  const inputType = item.answer_spec.input_type;
  if (inputType === "integer" || inputType === "decimal") {
    // Sanitize commas from user input (e.g. "1,000" -> "1000")
    // Note: This assumes standard notation where comma is separator.
    const sanitizedUser = normalizedUser.replace(/,/g, "");
    const numUser = parseFloat(sanitizedUser);
    const numCanonical = parseFloat(canonical);

    if (!isNaN(numUser) && !isNaN(numCanonical)) {
      // Use tolerance if provided, otherwise standard epsilon
      // If tolerance is explicitly null, use exact match only (but parseFloat has issues with exactness so we might default to epsilon still?)
      // Usually null tolerance implies strictness, but floating point arithmetic usually needs epsilon.
      // Let's assume if null, we use a very small epsilon.
      const tolerance = item.answer_spec.tolerance ?? 1e-9;
      if (Math.abs(numUser - numCanonical) <= tolerance) {
        return true;
      }
    }
  }

  return false;
}
