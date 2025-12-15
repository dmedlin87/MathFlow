import type { MathProblemItem } from '../../../src/domain/types.js';

/**
 * Stage A: Generator
 * Anchored to a skill, produces a candidate item.
 */
export interface OfflineGenerator {
    skillId: string;
    generate(difficulty: number): Promise<MathProblemItem>;
}

/**
 * Stage B: Critic
 * Solves the problem blindly (stem only) and produces analysis.
 */
export interface CriticResponse {
    derivedSolution: string; // The critic's answer
    rubricScores: {
        solvability: number;
        ambiguity: number;
        procedural_correctness: number;
        pedagogical_alignment: number;
    };
    issues: string[];
}

export interface Critic {
    modelId: string;
    solve(problemContent: MathProblemItem['problem_content']): Promise<CriticResponse>;
}

/**
 * Stage C: Judge
 * Compares generator solution vs critic solution.
 */
export interface JudegeVerdict {
    approved: boolean;
    feedback: string;
    finalRubric: CriticResponse['rubricScores'];
}

export interface Judge {
    modelId: string;
    evaluate(
        generatorItem: MathProblemItem, 
        criticResponse: CriticResponse
    ): Promise<JudegeVerdict>;
}

/**
 * Stage D: Deterministic Verifier
 * Optional machine-check for specific types.
 */
export interface VerifierResult {
    passed: boolean; // Trumps LLM if false and verification was applicable
    details: string;
    type: 'numeric' | 'symbolic' | 'none';
}

export interface Verifier {
    verify(item: MathProblemItem): Promise<VerifierResult>;
}
