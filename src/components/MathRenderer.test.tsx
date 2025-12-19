/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MathRenderer } from './MathRenderer';
import '@testing-library/jest-dom';

describe('MathRenderer', () => {
    it('renders simple text correctly', () => {
        render(<MathRenderer text="Hello world" />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('preserves spacing in textContent', () => {
        const { container } = render(<MathRenderer text="Hello world" />);
        // If this fails, it means spaces are stripped
        expect(container.textContent).toContain("Hello world");
    });

    it('renders bold text correctly', () => {
        render(<MathRenderer text="**Bold**" />);
        const boldElement = screen.getByText('Bold');
        expect(boldElement).toBeInTheDocument();
        expect(boldElement.closest('strong')).toBeInTheDocument();
    });

    it('renders fractions correctly', () => {
        render(<MathRenderer text="1/2" />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        // Check for fraction structure (often flex-col)
        const numerator = screen.getByText('1');
        const fractionContainer = numerator.closest('span.flex-col');
        expect(fractionContainer).toBeInTheDocument();
    });

    it('renders mixed content correctly', () => {
        render(<MathRenderer text="Solve **1/2 + 1/2**" />);
        expect(screen.getByText('Solve')).toBeInTheDocument();
        
        // Inside bold
        const num1 = screen.getAllByText('1')[0];
        expect(num1.closest('strong')).toBeInTheDocument();
    });

    it('handles empty text', () => {
        const { container } = render(<MathRenderer text="" />);
        expect(container.textContent).toBe("");
    });

    it('renders explanation text with spaces', () => {
        const { container } = render(<MathRenderer text="1 + 1 equals 2." />);
        const srOnly = container.querySelector('.sr-only');
        expect(srOnly).toBeInTheDocument();
        expect(srOnly?.textContent).toBe("1 + 1 equals 2.");
        expect(screen.getByText("equals")).toBeInTheDocument();
        expect(screen.getByText("2.")).toBeInTheDocument();
    });
});
