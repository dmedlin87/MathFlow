import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dotenv to prevent it from loading .env file and interfering with tests
vi.mock("dotenv", () => ({
  default: {
    config: vi.fn(),
  },
}));

describe("Server Config Security", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should use default key in non-production environment", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.FACTORY_API_KEY;

    const { config } = await import("./config.js");
    expect(config.factoryApiKey).toBe("test-key-123");
  });

  it("should throw error in production if FACTORY_API_KEY is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.FACTORY_API_KEY;

    await expect(import("./config.js")).rejects.toThrow(
      /CRITICAL: FACTORY_API_KEY must be set/
    );
  });

  it("should use provided key in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.FACTORY_API_KEY = "secure-prod-key";

    const { config } = await import("./config.js");
    expect(config.factoryApiKey).toBe("secure-prod-key");
  });
});
