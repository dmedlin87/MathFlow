export type GradeBand = 'K-2' | '3-5' | '6-8' | '9-12';

export interface Skill {
  id: string;
  name: string;
  gradeBand: GradeBand;
  prereqs: string[]; // skill IDs
  misconceptions: string[]; // keys for common misconceptions
  templates: string[]; // template IDs
  description?: string;
}

export interface SkillMap {
  [skillId: string]: Skill;
}

export interface Item {
  id: string;
  skillId: string;
  templateId: string;
  question: string; // The formatted question text (Markdown/LaTeX support implied)
  answer: string | number; // The canonical correct answer
  steps?: Step[]; // Optional step-by-step breakdown
  config: Record<string, any>; // The parameters used to generate this item
  misconceptionMatchers?: MisconceptionMatcher[];
}

export type MisconceptionMatcher = (userAnswer: string | number) => string | null; // returns error tag or null


export interface Step {
  id: string;
  text: string;
  explanation?: string;
  isHint?: boolean;
}

export interface Attempt {
  id: string;
  userId: string;
  itemId: string;
  skillId: string;
  timestamp: string; // ISO date
  isCorrect: boolean;
  timeTakenMs: number;
  attemptsCount: number;
  hintsUsed: number;
  errorTags: string[]; // detected misconceptions
}

export interface SkillState {
  masteryProb: number; // 0.0 to 1.0
  stability: number; // For spaced repetition
  lastPracticed: string; // ISO date
  misconceptions: string[]; // Active misconceptions
}

export interface LearnerState {
  userId: string;
  skillState: {
    [skillId: string]: SkillState;
  };
}

export interface Generator {
  templateId: string;
  skillId: string;
  generate(difficulty: number): Item;
}
