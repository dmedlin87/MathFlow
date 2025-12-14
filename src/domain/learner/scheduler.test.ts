import { describe, it, expect } from 'vitest';
import { createInitialState, recommendNextItem } from './state';
import { SKILL_EQUIV_FRACTIONS, SKILL_ADD_LIKE_FRACTIONS } from '../skills/grade4-fractions';

describe('Scheduler Logic', () => {
    it('recommends base skill first when both are unmastered', () => {
        // Both skills initialized to 0.1 mastery
        // Add Like Fractions has Prereq: Equiv Fractions
        // So scheduler should NOT recommend Add Like Fractions yet
        
        const state = createInitialState('test_user');
        
        // Runrecommendation multiple times to ensure it doesn't pick dependent skill
        for(let i=0; i<10; i++) {
            const item = recommendNextItem(state);
            expect(item.skillId).toBe(SKILL_EQUIV_FRACTIONS.id);
        }
    });

    it('enables dependent skill after prereq is mastered', () => {
        const state = createInitialState('test_user');
        
        // Artificially master the prereq
        state.skillState[SKILL_EQUIV_FRACTIONS.id].masteryProb = 0.95;
        
        // Now it SHOULD be possible to get the new skill
        // (Learning Queue will contain Add Like Fractions, Review Queue will contain Equiv)
        // It's probabilistic (70% learning), so let's check if we get it eventually
        
        let foundNewSkill = false;
        for(let i=0; i<20; i++) {
            const item = recommendNextItem(state);
            if (item.skillId === SKILL_ADD_LIKE_FRACTIONS.id) {
                foundNewSkill = true;
                break;
            }
        }
        expect(foundNewSkill).toBe(true);
    });
});
