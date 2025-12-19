import type { LearnerState, Attempt, MathProblemItem, Diagnosis } from '../domain/types';
import { createInitialState, updateLearnerState, recommendNextItem } from '../domain/learner/state';
import { MisconceptionEvaluator } from '../domain/learner/misconceptionEvaluator';
import { engine } from '../domain/generator/engine';

export interface ILearnerService {
    loadState(userId: string): Promise<LearnerState>;
    submitAttempt(state: LearnerState, attempt: Attempt): Promise<LearnerState>;
    getRecommendation(state: LearnerState): Promise<MathProblemItem>;
    diagnose(item: MathProblemItem, userAnswer: string): Promise<Diagnosis | null>;
}

const LATENCY_MS = 400; // Simulate network round-trip

/**
 * Local implementation of LearnerService that simulates a remote server
 * by adding artificial latency and strict serialization checks.
 */
export class LocalLearnerService implements ILearnerService {
    
    private async simulateNetwork<T>(data: T): Promise<T> {
        await new Promise(resolve => setTimeout(resolve, LATENCY_MS));
        try {
            // Strict Serialization Check: Ensure data is valid JSON
            return JSON.parse(JSON.stringify(data));
        } catch (e) {
            console.error("Serialization Violation in LocalLearnerService:", e);
            throw new Error("Data could not be serialized (Architecture Violation)");
        }
    }

    async loadState(userId: string): Promise<LearnerState> {
        // In V1 local mode, we just create fresh state or load from simpler persistence if we had it.
        // For this refactor, we are wrapping the domain logic.
        const state = createInitialState(userId);
        return this.simulateNetwork(state);
    }

    async submitAttempt(state: LearnerState, attempt: Attempt): Promise<LearnerState> {
        // Domain Logic: pure function
        const newState = updateLearnerState(state, attempt);
        return this.simulateNetwork(newState);
    }

    async getRecommendation(state: LearnerState): Promise<MathProblemItem> {
        const item = await recommendNextItem(state, undefined, undefined, engine);
        return this.simulateNetwork(item);
    }

    async diagnose(item: MathProblemItem, userAnswer: string): Promise<Diagnosis | null> {
        // Domain Logic: MisconceptionEvaluator is deterministic
        const result = MisconceptionEvaluator.evaluate(item, userAnswer);
        
        if (!result) return this.simulateNetwork(null);

        // Map to Diagnosis type
        const diagnosis: Diagnosis = {
            error_category: result.tag,
            diagnosis_explanation: result.description,
            hint_ladder: result.hintLadder,
            confidence_score: 1.0 // Deterministic match
        };
        
        return this.simulateNetwork(diagnosis);
    }
}
