/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SessionSummary } from './SessionSummary';
import '@testing-library/jest-dom';

describe('SessionSummary', () => {
    const mockStats = {
        total: 10,
        correct: 8,
        masteredSkills: ['Addition', 'Multiplication']
    };
    const onRestartMock = vi.fn();

    it('renders session statistics correctly', () => {
        render(<SessionSummary stats={mockStats} onRestart={onRestartMock} />);

        expect(screen.getByText('Session Complete! 🎓')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument(); // 8/10
        expect(screen.getByText('Accuracy')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('Problems Solved')).toBeInTheDocument();
    });

    it('renders mastered skills list', () => {
        render(<SessionSummary stats={mockStats} onRestart={onRestartMock} />);

        expect(screen.getByText('Skills Practiced')).toBeInTheDocument();
        expect(screen.getByText(/Addition/)).toBeInTheDocument();
        expect(screen.getByText(/Multiplication/)).toBeInTheDocument();
        expect(screen.getAllByText(/Mastered/).length).toBeGreaterThanOrEqual(2);
    });

    it('shows encouragement message when no skills mastered', () => {
        const noSkillsStats = { ...mockStats, masteredSkills: [] };
        render(<SessionSummary stats={noSkillsStats} onRestart={onRestartMock} />);

        expect(screen.getByText('Keep practicing to master new skills!')).toBeInTheDocument();
    });

    it('handles restart button click', () => {
        render(<SessionSummary stats={mockStats} onRestart={onRestartMock} />);
        
        const button = screen.getByText('Start New Session');
        fireEvent.click(button);
        
        expect(onRestartMock).toHaveBeenCalledTimes(1);
    });
    
    it('handles zero total problems safely', () => {
        const zeroStats = { ...mockStats, total: 0, correct: 0 };
        render(<SessionSummary stats={zeroStats} onRestart={onRestartMock} />);
        
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('has accessible dialog attributes', () => {
        render(<SessionSummary stats={mockStats} onRestart={onRestartMock} />);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'summary-title');

        const title = screen.getByRole('heading', { level: 2 });
        expect(title).toHaveAttribute('id', 'summary-title');
    });

    it('focuses the restart button on mount', () => {
         render(<SessionSummary stats={mockStats} onRestart={onRestartMock} />);
         const button = screen.getByText('Start New Session');
         expect(button).toHaveFocus();
    });
});
