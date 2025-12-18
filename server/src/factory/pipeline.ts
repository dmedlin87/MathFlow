import type { MathProblemItem, Provenance } from "@domain/types.js";
import type { OfflineGenerator, Critic, Judge, Verifier } from "./base.js";

export interface PipelineConfig {
  maxAttempts: number;
  requireDeterministicVerification: boolean;
}

export class ContentPipeline {
  constructor(
    private generator: OfflineGenerator,
    private critic: Critic,
    private judge: Judge,
    private verifier?: Verifier,
    private config: PipelineConfig = {
      maxAttempts: 3,
      requireDeterministicVerification: false,
    }
  ) {}

  async run(difficulty: number): Promise<MathProblemItem | null> {
    let attempts = 0;
    // let lastFeedback = "";

    while (attempts < this.config.maxAttempts) {
      attempts++;

      // 1. Generate (potentially with previous feedback if we were using a real LLM context)
      const candidate = await this.generator.generate(difficulty);

      // 2. Critic (Blind Solve)
      const criticResult = await this.critic.solve(candidate.problem_content);

      // 3. Judge (Compare)
      const verdict = await this.judge.evaluate(candidate, criticResult);

      // 4. Deterministic Verify (if applicable)
      let verificationResult = {
        passed: true,
        details: "Skipped",
        type: "none",
      };
      if (this.verifier) {
        const res = await this.verifier.verify(candidate);
        verificationResult = {
          passed: res.passed,
          details: res.details,
          type: res.type,
        };
      }

      // Decision Logic
      const isApproved = verdict.approved && verificationResult.passed;

      if (isApproved) {
        // Enrich Item with Provenance
        candidate.meta.provenance = {
          generator_model: "offline-gen-v1",
          critic_model: this.critic.modelId,
          judge_model: this.judge.modelId,
          verifier: {
            type: verificationResult.type as Provenance["verifier"]["type"],
            passed: verificationResult.passed,
            details: verificationResult.details,
            tool: "custom-verifier",
          },
          attempt: attempts,
          revision_of: null,
        };

        candidate.meta.verification_report = {
          rubric_scores: verdict.finalRubric,
          underspecified: false,
          issues: criticResult.issues,
        };

        candidate.meta.verified_at = new Date().toISOString();
        candidate.meta.status = "VERIFIED";

        return candidate;
      } else {
        // lastFeedback = verdict.feedback;
        // Retry loop
      }
    }

    return null;
  }
}
