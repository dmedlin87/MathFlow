import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from './engine';
import { Generator, MathProblemItem } from '../types';

// Mock dependencies
vi.mock('../validation', () => ({
  validateMathProblemItem: vi.fn((item) => item),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Data
const mockItem: MathProblemItem = {
    meta: {
        id: 'test',
        version: 1,
        skill_id: 'test_skill',
        difficulty: 0.5,
        created_at: '2025-01-01',
        status: 'VERIFIED',
        provenance: {
            generator_model: 'test',
            critic_model: 'test',
            judge_model: 'test',
            attempt: 1,
            verifier: { passed: true, type: 'none' }
        },
        verification_report: { rubric_scores: { solvability: 1, ambiguity: 1, procedural_correctness: 1, pedagogical_alignment: 1 }, underspecified: false, issues: [] }
    },
    problem_content: { stem: 'test', format: 'text' },
    answer_spec: { answer_mode: 'final_only', input_type: 'text' },
    solution_logic: { final_answer_canonical: 'test', final_answer_type: 'numeric', steps: [] },
    misconceptions: []
};

// Mock Generators
const mockGenerator: Generator = {
  skillId: 'test_skill',
  templateId: 'test_template',
  generate: vi.fn().mockReturnValue(mockItem),
};

describe('Engine Coverage', () => {
  let engine: Engine;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    // Reset the mock return value just in case
    (mockGenerator.generate as any).mockReturnValue(mockItem);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to local generator if apiBaseUrl is not configured', async () => {
    engine = new Engine({ apiBaseUrl: null });
    engine.register(mockGenerator);

    const result = await engine.generate('test_skill', 0.5);

    expect(result.meta.skill_id).toBe('test_skill');
    expect(mockGenerator.generate).toHaveBeenCalledWith(0.5, undefined);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws error if local generator is missing (fallback path)', async () => {
    engine = new Engine({ apiBaseUrl: null });
    // No generator registered

    await expect(engine.generate('missing_skill', 0.5)).rejects.toThrow('No generator found for skill: missing_skill');
  });

  it('fetches from /problems if apiBaseUrl is set', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api' });
    engine.register(mockGenerator);

    // Mock successful fetch
    const mockProblem = { ...mockItem, meta: { ...mockItem.meta, id: 'api-problem' } };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockProblem],
    } as Response);

    const result = await engine.generate('test_skill', 0.5);

    expect(result.meta.id).toBe('api-problem');
    expect(fetch).toHaveBeenCalledWith('http://api/problems?skillId=test_skill&limit=1');
    expect(mockGenerator.generate).not.toHaveBeenCalled();
  });

  it('falls back to /factory/run if /problems returns empty', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api' });
    engine.register(mockGenerator);

    // Mock empty /problems response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    // Mock successful /factory/run response
    const mockProblem = { ...mockItem, meta: { ...mockItem.meta, id: 'factory-problem' } };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [mockProblem] }),
    } as Response);

    const result = await engine.generate('test_skill', 0.5);

    expect(result.meta.id).toBe('factory-problem');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(2, 'http://api/factory/run', expect.any(Object));
    expect(mockGenerator.generate).not.toHaveBeenCalled();
  });

  it('falls back to local generator if factory returns ok but items is empty/undefined', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api' });
    engine.register(mockGenerator);

    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response); // /problems
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) } as Response); // /factory/run

    const result = await engine.generate('test_skill', 0.5);

    expect(result.meta.skill_id).toBe('test_skill');
    expect(mockGenerator.generate).toHaveBeenCalled();
  });

  it('falls back to local generator if factory returns ok but items is undefined', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api' });
    engine.register(mockGenerator);

    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response); // /problems
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response); // /factory/run

    const result = await engine.generate('test_skill', 0.5);

    expect(result.meta.skill_id).toBe('test_skill');
    expect(mockGenerator.generate).toHaveBeenCalled();
  });

  it('falls back to local generator if network fetch fails', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api' });
    engine.register(mockGenerator);

    // Mock fetch failure
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network Error'));

    const result = await engine.generate('test_skill', 0.5);

    expect(result.meta.skill_id).toBe('test_skill');
    expect(mockGenerator.generate).toHaveBeenCalled();
  });

  it('falls back to local generator if /problems fetch is not ok', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api' });
    engine.register(mockGenerator);

    // Mock fetch not ok
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const result = await engine.generate('test_skill', 0.5);

    expect(result.meta.skill_id).toBe('test_skill');
    expect(mockGenerator.generate).toHaveBeenCalled();
  });
});
