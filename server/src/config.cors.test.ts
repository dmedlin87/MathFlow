import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Server Config CORS', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should default allowedOrigins to "*" when ALLOWED_ORIGINS is unset', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', '');
    const { config } = await import('./config.js');
    expect(config.allowedOrigins).toBe('*');
  });

  it('should parse comma-separated allowedOrigins into an array', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com,https://test.com');
    const { config } = await import('./config.js');
    expect(config.allowedOrigins).toEqual(['https://example.com', 'https://test.com']);
  });

  it('should trim spaces from allowedOrigins', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', ' https://example.com , https://test.com ');
    const { config } = await import('./config.js');
    expect(config.allowedOrigins).toEqual(['https://example.com', 'https://test.com']);
  });
});
