/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import katex from 'katex';
import { MathRenderer } from './MathRenderer';
import '@testing-library/jest-dom';

describe('MathRenderer', () => {
    // Helper to get only visible text (ignoring sr-only)
    const getVisibleText = (container: HTMLElement) => {
        const visibleSpan = container.querySelector('[aria-hidden="true"]');
        return visibleSpan?.textContent || '';
    };

    it('renders simple text correctly', () => {
        const { container } = render(<MathRenderer text="Hello world" />);
        expect(getVisibleText(container)).toContain('Hello');
        expect(getVisibleText(container)).toContain('world');
    });

    it('preserves spacing in textContent', () => {
        const { container } = render(<MathRenderer text="Hello world" />);
        expect(getVisibleText(container)).toContain("Hello world");
    });

    it('renders bold text correctly', () => {
        render(<MathRenderer text="**Bold**" />);
        const boldElement = screen.getAllByText('Bold').find(el => el.closest('strong'));
        expect(boldElement).toBeInTheDocument();
    });

    it('renders fractions correctly', () => {
        render(<MathRenderer text="1/2" />);
        expect(screen.getAllByText('1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('2').length).toBeGreaterThan(0);
        
        // Find the visible one
        const numerator = screen.getAllByText('1').find(el => el.closest('span.flex-col'));
        expect(numerator).toBeInTheDocument();
    });

    it('renders mixed content correctly', () => {
        render(<MathRenderer text="Solve **1/2 + 1/2**" />);
        expect(screen.getAllByText('Solve').length).toBeGreaterThan(0);
        
        const num1 = screen.getAllByText('1').find(el => el.closest('strong'));
        expect(num1).toBeInTheDocument();
    });

    it('handles empty text', () => {
        const { container } = render(<MathRenderer text="" />);
        expect(getVisibleText(container)).toBe("");
    });

    it('renders explanation text with spaces', () => {
        const { container } = render(<MathRenderer text="1 + 1 equals 2." />);
        const srOnly = container.querySelector('.sr-only');
        expect(srOnly).toBeInTheDocument();
        expect(srOnly?.textContent).toBe("1 + 1 equals 2.");
        // Use regex because optimization groups text tokens
        expect(screen.getAllByText(/equals/).length).toBeGreaterThan(0);
    });

    describe('KaTeX Support', () => {
        it('renders inline math', () => {
            render(<MathRenderer text="Solve \( x^2 \)" />);
            expect(screen.getAllByText('Solve').length).toBeGreaterThan(0);
            const katexElement = document.querySelector('.katex');
            expect(katexElement).toBeInTheDocument();
        });

        it('renders display math', () => {
            render(<MathRenderer text="$$ y = mx + b $$" />);
            const displayWrapper = document.querySelector('.w-full.flex.justify-center');
            expect(displayWrapper).toBeInTheDocument();
            expect(displayWrapper?.querySelector('.katex')).toBeInTheDocument();
        });

        it('handles KaTeX rendering errors gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const katexSpy = vi.spyOn(katex, 'renderToString').mockImplementation(() => {
                throw new Error('Simulated KaTeX error');
            });

            render(<MathRenderer text="\( \invalidCommand \)" />);
            // With mocked error, the catch block runs and renders .text-red-500
            const errorElement = document.querySelector('.text-red-500');
            expect(errorElement).toBeInTheDocument();
            // The catch block renders the raw part: \( \invalidCommand \)
            expect(errorElement?.textContent).toContain('invalidCommand');
            
            consoleSpy.mockRestore();
            katexSpy.mockRestore();
        });

        it('handles empty math delimiters', () => {
            const { container } = render(<MathRenderer text="Empty \( \)" />);
            expect(getVisibleText(container)).toContain('Empty');
        });
    });

    describe('Fraction Edge Cases', () => {
        it('ignores incomplete fractions like 1/', () => {
            const { container } = render(<MathRenderer text="Value is 1/" />);
            expect(getVisibleText(container)).toContain('1/');
        });

        it('ignores /2', () => {
            const { container } = render(<MathRenderer text="/2 is half" />);
            expect(getVisibleText(container)).toContain('/2');
        });

        it('handles triple slashes like 1/2/3 by ignoring them as fractions', () => {
            const { container } = render(<MathRenderer text="1/2/3" />);
            expect(getVisibleText(container)).toContain('1/2/3');
        });
    });

    it('renders complex mixed content', () => {
        render(<MathRenderer text="Find **x** in \( x/2 = 4 \) where **x** is integer." />);
        expect(screen.getAllByText('Find').length).toBeGreaterThan(0);
        expect(document.querySelector('.katex')).toBeInTheDocument();
        expect(document.querySelector('strong')).toBeInTheDocument();
    });
});
