import type { LearnerState, Attempt, Item } from '../types';
import { engine } from '../generator/engine';
import { SKILL_EQUIV_FRACTIONS, SKILL_ADD_LIKE_FRACTIONS } from '../skills/grade4-fractions';

// Temporary simpler scheduler: Just focus on fractions for now
const ALL_SKILLS = [SKILL_EQUIV_FRACTIONS, SKILL_ADD_LIKE_FRACTIONS];

export function createInitialState(userId: string): LearnerState {
  const state: LearnerState = {
    userId,
    skillState: {}
  };
  // Initialize with 0 mastery
  ALL_SKILLS.forEach(skill => {
    state.skillState[skill.id] = {
        masteryProb: 0.1,
        stability: 0,
        lastPracticed: new Date().toISOString(),
        misconceptions: []
    };
  });
  return state;
}

export function updateLearnerState(state: LearnerState, attempt: Attempt): LearnerState {
  let skillState = state.skillState[attempt.skillId];
  
  if (!skillState) {
    // If we are answering a problem for a skill we don't have state for, initialize it
    skillState = {
        masteryProb: 0.1,
        stability: 0,
        lastPracticed: new Date().toISOString(),
        misconceptions: []
    };
  }

  const newState = { 
    ...state,
    skillState: { ...state.skillState } 
  };
  const newSkillState = { ...skillState };

  // Very simple BKT-like update
  // P(L) = P(L|Obs)
  const learningRate = 0.1;
  const slip = 0.1;
  const guess = 0.2;
  
  const currentP = skillState.masteryProb;
  
  if (attempt.isCorrect) {
    // P(L|Correct) = (P(L) * (1-s)) / (P(L)*(1-s) + (1-P(L))*g)
    const numerator = currentP * (1 - slip);
    const denominator = (currentP * (1 - slip)) + ((1 - currentP) * guess);
    newSkillState.masteryProb = numerator / denominator;
  } else {
    // P(L|Incorrect) = (P(L) * s) / (P(L)*s + (1-P(L))*(1-g))
    const numerator = currentP * slip;
    const denominator = (currentP * slip) + ((1 - currentP) * (1 - guess));
    newSkillState.masteryProb = numerator / denominator;
  }
  
  // Add learning gain (transit)
  newSkillState.masteryProb = newSkillState.masteryProb + ((1 - newSkillState.masteryProb) * learningRate);

  // Clamp
  newSkillState.masteryProb = Math.min(0.99, Math.max(0.01, newSkillState.masteryProb));
  
  newSkillState.lastPracticed = attempt.timestamp;

  newState.skillState[attempt.skillId] = newSkillState;
  
  return newState;
}

export function recommendNextItem(state: LearnerState): Item {
    const now = new Date();
    const candidateSkills = ALL_SKILLS.map(skill => {
        // Fallback if new skill added and state is old
        const s = state.skillState[skill.id] || {
            masteryProb: 0.1,
            stability: 0,
            lastPracticed: new Date().toISOString(),
            misconceptions: []
        };
        return { skill, state: s };
    });

    // 1. Identify "Review Due" items
    // Simple logic: if mastery > 0.8 but not practiced in 1 day (mock logic), it's due
    const reviewDue = candidateSkills.filter(c => {
        if (c.state.masteryProb < 0.8) return false;
        const lastPracticed = new Date(c.state.lastPracticed);
        const hoursSince = (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60);
        return hoursSince > 24; // Review every 24h
    });

    // 2. Identify "Learning Queue" (mastery < 0.8)
    // AND check prerequisites
    const learningQueue = candidateSkills.filter(c => {
        if (c.state.masteryProb >= 0.8) return false;
        
        // Check prereqs
        if (c.skill.prereqs.length > 0) {
            const allPrereqsMet = c.skill.prereqs.every(pid => {
                const pState = state.skillState[pid];
                return pState && pState.masteryProb > 0.7; // Threshold for moving on
            });
            if (!allPrereqsMet) return false;
        }
        return true;
    });
    
    // Mix strategy: 30% Review, 70% New Learning (if available)
    let targetSkill;
    const roll = Math.random();

    if (reviewDue.length > 0 && roll < 0.3) {
        // Pick random review item
        targetSkill = reviewDue[Math.floor(Math.random() * reviewDue.length)].skill;
    } else if (learningQueue.length > 0) {
        // Pick lowest mastery
        targetSkill = learningQueue.sort((a, b) => a.state.masteryProb - b.state.masteryProb)[0].skill;
    } else {
        // Fallback: Just random skill
        targetSkill = candidateSkills[Math.floor(Math.random() * candidateSkills.length)].skill;
    }

    // Determine difficulty based on mastery
    const skillState = state.skillState[targetSkill.id];
    let difficulty = skillState?.masteryProb || 0.1;

    // If review, we might want to check retention, potentially slightly harder or same
    if (skillState && skillState.masteryProb > 0.8) {
        difficulty = 0.9; // Challenge on review
    }
    
    // Pick a template
    const templateId = targetSkill.templates[0]; 
    return engine.generateItem(templateId, difficulty);
}
