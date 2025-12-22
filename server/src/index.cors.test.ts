import { vi, describe, it, expect, beforeEach } from 'vitest';
import cors from 'cors';
import { config } from './config.js';

// Mock dependencies
vi.mock('./store/ProblemBank.js', () => ({
  problemBank: {
    fetch: vi.fn(),
    save: vi.fn(),
  }
}));

// Mock cors
vi.mock('cors', () => ({
  default: vi.fn(() => (req, res, next) => next()),
}));

describe('Server CORS Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should be initialized with explicit configuration', async () => {
    await import('./index.js');

    // Check that cors was called with a configuration object
    expect(cors).toHaveBeenCalledWith(expect.objectContaining({
      origin: config.allowedOrigins,
      methods: expect.arrayContaining(['GET', 'POST']),
      allowedHeaders: expect.arrayContaining(['Content-Type', 'X-API-Key'])
    }));
  });
});
