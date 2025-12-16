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
    const numUser = parseFloat(normalizedUser);
    const numCanonical = parseFloat(canonical);

    if (!isNaN(numUser) && !isNaN(numCanonical)) {
      // Use tolerance if provided, otherwise standard epsilon
      // If tolerance is explicitly null, use exact match only (but parseFloat has issues with exactness so we might default to epsilon still?)
      // Usually null tolerance implies strictness, but floating point arithmetic usually needs epsilon.
      // Let's assume if null, we use a very small epsilon.
      const tolerance = item.answer_spec.tolerance ?? 1e-9;
      if (Math.abs(numUser - numCanonical) < tolerance) {
        return true;
      }
    }
  }

  return false;
}
