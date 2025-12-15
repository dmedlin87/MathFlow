import type { MathProblemItem, MisconceptionConfig } from '../types';

export interface EvaluatedMisconception {
    tag: string;
    description?: string; // Could be looked up from a dictionary or embedded
    hintLadder?: string[];
}

export class MisconceptionEvaluator {
    static evaluate(item: MathProblemItem, userAnswer: string | number): EvaluatedMisconception | null {
        if (!item.misconceptions || item.misconceptions.length === 0) {
            return null;
        }

        const answerStr = String(userAnswer).trim();

        for (const config of item.misconceptions) {
            if (this.isMatch(config, answerStr)) {
                return {
                    tag: config.error_tag,
                    hintLadder: config.hint_ladder
                };
            }
        }

        return null;
    }

    private static isMatch(config: MisconceptionConfig, answer: string): boolean {
        switch (config.trigger.kind) {
            case 'exact_answer':
                return answer === config.trigger.value;
            case 'regex':
                try {
                    const regex = new RegExp(config.trigger.value);
                    return regex.test(answer);
                } catch (e) {
                    console.error(`Invalid regex trigger for misconception ${config.id}:`, e);
                    return false;
                }
            case 'predicate':
                console.warn(`Predicate triggers not supported in V1 Runtime (Misconception: ${config.id})`);
                return false;
            default:
                return false;
        }
    }
}
