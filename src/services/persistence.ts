import type { LearnerState } from '../domain/types';

const STORAGE_KEY = 'mathflow_learner_state_v1';

export const PersistenceService = {
  saveState: (state: LearnerState): void => {
    try {
      const serializable = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serializable);
    } catch (e) {
      console.error('Failed to save state', e);
    }
  },

  loadState: (): LearnerState | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as LearnerState;
    } catch (e) {
      console.error('Failed to load state', e);
      return null;
    }
  },

  clearState: (): void => {
      localStorage.removeItem(STORAGE_KEY);
  }
};
