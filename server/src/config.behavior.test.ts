import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Server Config Security', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should use default API key in development when key is missing', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    // Ensure FACTORY_API_KEY is undefined
    delete process.env.FACTORY_API_KEY;

    // We need to import fresh
    const { config } = await import('./config.js');
    expect(config.factoryApiKey).toBe('test-key-123');
  });

  it('should throw error in production if API key is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.FACTORY_API_KEY;

    // Use import() to trigger the side-effect code
    await expect(import('./config.js')).rejects.toThrow(/CRITICAL/);
  });

  it('should accept API key in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('FACTORY_API_KEY', 'secure-key-456');

    const { config } = await import('./config.js');
    expect(config.factoryApiKey).toBe('secure-key-456');
  });
});
