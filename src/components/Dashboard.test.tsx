// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // for .toBeInTheDocument
import { Dashboard } from './Dashboard';
import type { LearnerState } from '../domain/types';

// Mock ALL_SKILLS_LIST to have a predictable set of skills for testing
vi.mock('../domain/skills/registry', () => ({
  ALL_SKILLS_LIST: [
    { id: 'skill_1', name: 'Addition', gradeBand: '3-5' },
    { id: 'skill_2', name: 'Subtraction', gradeBand: '3-5' },
  ],
}));

describe('Dashboard Component', () => {
  const mockLearnerState: LearnerState = {
    userId: 'test_user',
    skillState: {
      skill_1: {
        masteryProb: 0.85,
        stability: 0.5,
        lastPracticed: new Date().toISOString(),
        misconceptions: [],
      },
      skill_2: {
        masteryProb: 0.2,
        stability: 0.1,
        lastPracticed: new Date().toISOString(),
        misconceptions: [],
      },
    },
  };

  const onCloseMock = vi.fn();

  it('renders progress bars with accessible attributes', () => {
    render(<Dashboard learnerState={mockLearnerState} onClose={onCloseMock} />);

    // Check for role="progressbar"
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2);

    // Verify attributes for the first skill (0.85 mastery -> 85%)
    const p1 = progressBars[0];
    expect(p1).toHaveAttribute('aria-valuenow', '85');
    expect(p1).toHaveAttribute('aria-valuemin', '0');
    expect(p1).toHaveAttribute('aria-valuemax', '100');
    expect(p1).toHaveAttribute('aria-label', 'Addition mastery');

    // Verify attributes for the second skill (0.2 mastery -> 20%)
    const p2 = progressBars[1];
    expect(p2).toHaveAttribute('aria-valuenow', '20');
    expect(p2).toHaveAttribute('aria-valuemin', '0');
    expect(p2).toHaveAttribute('aria-valuemax', '100');
    expect(p2).toHaveAttribute('aria-label', 'Subtraction mastery');
  });

  it('handles skills missing from learner state (defaults to 0.1)', () => {
    // Modify state to remove skill_2
    const partialState = {
      ...mockLearnerState,
      skillState: {
        skill_1: mockLearnerState.skillState.skill_1,
      }
    };

    render(<Dashboard learnerState={partialState} onClose={onCloseMock} />);

    const progressBars = screen.getAllByRole('progressbar');
    // skill_2 should default to 10%
    const p2 = progressBars[1];
    expect(p2).toHaveAttribute('aria-valuenow', '10');
  });
});
