
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from './engine';

// Mock dependencies
const mockGenerator = {
  skillId: 'test-skill',
  generate: vi.fn().mockReturnValue({
    meta: {
      id: 'local-item',
      skill_id: 'test-skill', // Added missing field
      created_at: new Date().toISOString(), // Added missing field
      difficulty: 0.5,
      provenance: {
        generator_model: 'gen',
        critic_model: 'critic',
        judge_model: 'judge',
        attempt: 1,
        verifier: { type: 'none', passed: true }
      },
      status: 'VERIFIED',
      verification_report: {
        rubric_scores: { solvability: 1, ambiguity: 1, procedural_correctness: 1, pedagogical_alignment: 1 },
        underspecified: false,
        issues: []
      },
      version: 1
    },
    problem_content: { stem: 'test', format: 'text' },
    solution_logic: { final_answer_canonical: '42', final_answer_type: 'numeric', steps: [] },
    answer_spec: { input_type: 'number', answer_mode: 'final_only' }
  })
};

const validItem = {
    meta: {
      id: 'bank-item',
      skill_id: 'test-skill',
      created_at: new Date().toISOString(),
      difficulty: 0.5,
      provenance: {
        generator_model: 'gen',
        critic_model: 'critic',
        judge_model: 'judge',
        attempt: 1,
        verifier: { type: 'none', passed: true }
      },
      status: 'VERIFIED',
      verification_report: {
        rubric_scores: { solvability: 1, ambiguity: 1, procedural_correctness: 1, pedagogical_alignment: 1 },
        underspecified: false,
        issues: []
      },
      version: 1
    },
    problem_content: { stem: 'test', format: 'text' },
    solution_logic: { final_answer_canonical: '42', final_answer_type: 'numeric', steps: [] },
    answer_spec: { input_type: 'number', answer_mode: 'final_only' }
};

describe('Engine Behavior', () => {
  let engine: Engine;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches from Bank if API base URL is configured', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api.test' });
    engine.register(mockGenerator as any);

    // Mock Bank success
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [validItem]
    } as Response);

    const result = await engine.generate('test-skill', 0.5);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/problems?skillId=test-skill'));
    expect(result.meta.id).toBe('bank-item');
  });

  it('falls back to Factory if Bank returns empty list', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api.test' });
    engine.register(mockGenerator as any);

    // Mock Bank empty, Factory success
    vi.mocked(fetch)
      .mockResolvedValueOnce({ // Bank
        ok: true,
        json: async () => []
      } as Response)
      .mockResolvedValueOnce({ // Factory
        ok: true,
        json: async () => ({ items: [{ ...validItem, meta: { ...validItem.meta, id: 'factory-item' } }] })
      } as Response);

    const result = await engine.generate('test-skill', 0.5);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/factory/run'), expect.any(Object));
    expect(result.meta.id).toBe('factory-item');
  });

  it('falls back to Local generator if fetch fails (network error)', async () => {
    engine = new Engine({ apiBaseUrl: 'http://api.test' });
    engine.register(mockGenerator as any);

    // Mock Network Error
    vi.mocked(fetch).mockRejectedValue(new Error('Network Fail'));

    const result = await engine.generate('test-skill', 0.5);

    expect(result.meta.id).toBe('local-item'); // From mockGenerator
    expect(mockGenerator.generate).toHaveBeenCalledWith(0.5, undefined);
  });

  it('uses Local generator immediately if no API URL is configured', async () => {
    engine = new Engine({ apiBaseUrl: null });
    engine.register(mockGenerator as any);

    const result = await engine.generate('test-skill', 0.5);

    expect(fetch).not.toHaveBeenCalled();
    expect(result.meta.id).toBe('local-item');
  });
});
