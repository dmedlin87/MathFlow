import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

describe("CORS Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("should allow all origins when default is used (wildcard)", async () => {
    // Import the app
    const { app } = await import("./index.js");

    const res = await request(app)
      .get("/api/problems?skillId=test")
      .set("Origin", "http://any-origin.com");

    // When origin is "*", it should return "*"
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });

  it("should restrict origins when ALLOWED_ORIGINS is set", async () => {
    vi.stubEnv("ALLOWED_ORIGINS", "http://trusted.com,http://partner.com");

    // Re-import app to pick up env var in config
    const { app } = await import("./index.js");

    // Allowed origin
    const resAllowed = await request(app)
      .get("/api/problems?skillId=test")
      .set("Origin", "http://trusted.com");
    expect(resAllowed.headers["access-control-allow-origin"]).toBe("http://trusted.com");

    // Disallowed origin
    const resDisallowed = await request(app)
      .get("/api/problems?skillId=test")
      .set("Origin", "http://evil.com");
    expect(resDisallowed.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
