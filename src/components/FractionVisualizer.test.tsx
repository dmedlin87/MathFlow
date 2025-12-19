/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { FractionVisualizer } from './FractionVisualizer';

describe('FractionVisualizer', () => {
  it('renders a pie svg with one path per denominator slice', () => {
    const { container } = render(
      <FractionVisualizer
        numerator={1}
        denominator={3}
        size={120}
        color="#ff0000"
        className="my-class"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
    expect(svg).toHaveAttribute('viewBox', '0 0 120 120');
    expect(svg).toHaveClass('my-class');

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(3);
  });

  it('fills first N slices with the provided color and leaves the rest unfilled', () => {
    const { container } = render(
      <FractionVisualizer numerator={2} denominator={5} color="#123456" />
    );

    const paths = Array.from(container.querySelectorAll('path'));
    const fills = paths.map((p) => p.getAttribute('fill'));

    expect(fills.slice(0, 2)).toEqual(['#123456', '#123456']);
    expect(fills.slice(2)).toEqual(['none', 'none', 'none']);
  });

  it('treats numerator greater than denominator as fully filled (current behavior)', () => {
    const { container } = render(
      <FractionVisualizer numerator={10} denominator={4} color="#abc" />
    );

    const paths = Array.from(container.querySelectorAll('path'));
    expect(paths.length).toBe(4);

    for (const p of paths) {
      expect(p).toHaveAttribute('fill', '#abc');
    }
  });

  it('uses largeArcFlag=1 when a slice is larger than 180 degrees', () => {
    const { container } = render(
      <FractionVisualizer numerator={1} denominator={1} size={100} />
    );

    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();

    const d = path?.getAttribute('d') ?? '';
    expect(d).toContain('A 50 50 0 1 1');
  });

  it('uses largeArcFlag=0 when slice is 180 degrees or less', () => {
    const { container } = render(
      <FractionVisualizer numerator={1} denominator={2} size={100} />
    );

    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();

    const d = path?.getAttribute('d') ?? '';
    expect(d).toContain('A 50 50 0 0 1');
  });

  it('returns null for non-pie visualizer types', () => {
    const { container } = render(
      <FractionVisualizer numerator={1} denominator={2} type="bar" />
    );

    expect(container.firstChild).toBeNull();
  });
});
