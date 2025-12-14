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

  // BKT Parameters (Default vs Skill Override)
  // Ideally we need to look up the skill object.
  // For now, let's look it up from ALL_SKILLS which is imported in this file.
  const skillDef = ALL_SKILLS.find(s => s.id === attempt.skillId);
  
  const learningRate = skillDef?.bktParams?.learningRate ?? 0.1;
  const slip = skillDef?.bktParams?.slip ?? 0.1;
  const guess = skillDef?.bktParams?.guess ?? 0.2;
  
  const currentP = skillState.masteryProb;
  let newP = currentP;
  
  if (attempt.isCorrect) {
    // P(L|Correct) = (P(L) * (1-s)) / (P(L)*(1-s) + (1-P(L))*g)
    const numerator = currentP * (1 - slip);
    const denominator = (currentP * (1 - slip)) + ((1 - currentP) * guess);
    newP = denominator > 0 ? numerator / denominator : currentP;

    // Stability Increase: If masterful, increase intervals
    // Simple additive for now: +1 day if high mastery
    if (newP > 0.8) {
        newSkillState.stability = (newSkillState.stability || 0) + 1; 
    }
  } else {
    // P(L|Incorrect) = (P(L) * s) / (P(L)*s + (1-P(L))*(1-g))
    const numerator = currentP * slip;
    const denominator = (currentP * slip) + ((1 - currentP) * (1 - guess));
    newP = denominator > 0 ? numerator / denominator : currentP;
    
    // Stability Reset: If they got it wrong, trust drops
    newSkillState.stability = Math.max(0, (newSkillState.stability || 0) - 0.5);
  }
  
  // Add learning gain (transit)
  newP = newP + ((1 - newP) * learningRate);

  // Clamp
  newSkillState.masteryProb = Math.min(0.99, Math.max(0.01, newP));
  
  newSkillState.lastPracticed = attempt.timestamp;

  newState.skillState[attempt.skillId] = newSkillState;
  
  return newState;
}

export function recommendNextItem(state: LearnerState, rng: () => number = Math.random): Item {
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
        if (c.state.masteryProb < 0.8) return false; // Only review reinforced items
        
        const lastPracticed = new Date(c.state.lastPracticed);
        const hoursSince = (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60);
        
        // Base interval is 24h
        // If stability is high, extend interval: 24h * (1 + stability)
        // e.g. stability 0 -> 24h, stability 2 -> 72h
        const requiredIntervalHours = 24 * (1 + (c.state.stability || 0));
        
        return hoursSince > requiredIntervalHours;
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
    const roll = rng();

    if (reviewDue.length > 0 && roll < 0.3) {
        // Pick random review item
        targetSkill = reviewDue[Math.floor(rng() * reviewDue.length)].skill;
    } else if (learningQueue.length > 0) {
        // Pick lowest mastery
        targetSkill = learningQueue.sort((a, b) => a.state.masteryProb - b.state.masteryProb)[0].skill;
    } else {
        // Fallback: Just random skill
        targetSkill = candidateSkills[Math.floor(rng() * candidateSkills.length)].skill;
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
