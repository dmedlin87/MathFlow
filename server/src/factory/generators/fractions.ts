import {
  OfflineGenerator,
  Critic,
  Judge,
  CriticResponse,
  JudegeVerdict,
} from "../base.js";
import type {
  MathProblemItem,
  Provenance,
  VerificationReport,
} from "@/domain/types.js";
import { EquivFractionGenerator } from "@/domain/skills/grade4/fractions.js";

/**
 * Mock Generator: Wraps the existing deterministic generator from domain/skills
 */
export class MockFractionsGenerator implements OfflineGenerator {
  skillId = "frac_equiv_01";

  async generate(difficulty: number): Promise<MathProblemItem> {
    // Wrap simulated offline generator
    const item = EquivFractionGenerator.generate(difficulty);

    // Strip pre-cooked metadata to simulate raw output
    return {
      ...item,
      meta: {
        ...item.meta,
        provenance: {
          generator_model: "offline-mock",
          critic_model: "none",
          judge_model: "none",
          verifier: { type: "none", passed: true },
          attempt: 0,
        } as Provenance,
        verification_report: {
          rubric_scores: {
            solvability: 1,
            ambiguity: 0,
            procedural_correctness: 1,
            pedagogical_alignment: 1,
          },
          underspecified: false,
          issues: [],
        } as VerificationReport,
        status: "DRAFT",
      },
    };
  }
}

/**
 * Mock Critic
 */
export class MockCritic implements Critic {
  modelId = "mock-critic-v1";

  constructor(private shouldFail: boolean = false) {}

  async solve(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _problemContent: MathProblemItem["problem_content"]
  ): Promise<CriticResponse> {
    return {
      derivedSolution: "42",
      rubricScores: {
        solvability: this.shouldFail ? 0.5 : 1.0,
        ambiguity: 0,
        procedural_correctness: this.shouldFail ? 0.6 : 1.0,
        pedagogical_alignment: 1.0,
      },
      issues: this.shouldFail ? ["Unsolvable"] : [],
    };
  }
}

/**
 * Mock Judge
 */
export class MockJudge implements Judge {
  modelId = "mock-judge-v1";

  async evaluate(
    _generatorItem: MathProblemItem,
    criticResponse: CriticResponse
  ): Promise<JudegeVerdict> {
    const score = criticResponse.rubricScores.solvability;
    if (score > 0.9) {
      return {
        approved: true,
        feedback: "Good job",
        finalRubric: criticResponse.rubricScores,
      };
    } else {
      return {
        approved: false,
        feedback: "Solveability too low",
        finalRubric: criticResponse.rubricScores,
      };
    }
  }
}
