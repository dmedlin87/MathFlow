import type { MathProblemItem } from '../../../src/domain/types.js';

export class ProblemBank {
    private items: Map<string, MathProblemItem> = new Map();
    private bySkill: Map<string, string[]> = new Map(); // skillId -> itemIds

    constructor() {
        // We could seed initial data here if needed, or load from JSON file
    }

    async save(item: MathProblemItem): Promise<void> {
        if (item.meta.status !== 'VERIFIED') {
            throw new Error("Cannot save unverified item to Problem Bank");
        }
        
        this.items.set(item.meta.id, item);
        
        const skillId = item.meta.skill_id;
        if (!this.bySkill.has(skillId)) {
            this.bySkill.set(skillId, []);
        }
        this.bySkill.get(skillId)?.push(item.meta.id);
    }

    async fetch(skillId: string, limit: number = 1): Promise<MathProblemItem[]> {
        const itemIds = this.bySkill.get(skillId) || [];
        
        // Simple random selection for V0
        // In V1 this would use more complex logic (difficulty matching, spaced repetition etc)
        const selectedIds = this.shuffle(itemIds).slice(0, limit);
        
        return selectedIds.map(id => this.items.get(id)!).filter(Boolean);
    }

    async getById(id: string): Promise<MathProblemItem | undefined> {
        return this.items.get(id);
    }

    private shuffle<T>(array: T[]): T[] {
        return [...array].sort(() => Math.random() - 0.5);
    }
}

// Singleton instance
export const problemBank = new ProblemBank();
