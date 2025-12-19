import type { MathProblemItem } from "./types";

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function getFactors(n: number): number[] {
  const factors = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) factors.push(i);
  }
  return factors;
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
    // Handle locale differences in comma usage:
    // 1. If it looks like a standard integer with thousands separators (e.g. "1,000" or "10,000,000"), treat commas as separators.
    //    Regex: ^\d{1,3}(,\d{3})+$
    // 2. If it has a comma but NO dot, and doesn't match the thousands pattern (e.g. "3,14"), treat comma as decimal.
    // 3. Otherwise (e.g. "1,000.50"), remove commas.
    let numUser: number;
    const isThousandsFormat = /^-?\d{1,3}(,\d{3})+$/.test(normalizedUser);
    // Count commas
    const commaCount = (normalizedUser.match(/,/g) || []).length;

    if (
      normalizedUser.includes(",") &&
      !normalizedUser.includes(".") &&
      !isThousandsFormat &&
      commaCount === 1
    ) {
      // European decimal format (e.g. "3,14" -> 3.14)
      // Only apply if single comma and not standard thousands format
      const europeanStyle = normalizedUser.replace(/,/g, ".");
      numUser = parseFloat(europeanStyle);
    } else {
      // Standard format (remove commas)
      const sanitizedUser = normalizedUser.replace(/,/g, "");
      numUser = parseFloat(sanitizedUser);
    }

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
