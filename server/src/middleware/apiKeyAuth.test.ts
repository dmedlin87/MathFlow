import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiKeyAuth } from "./apiKeyAuth.js";
import { Request, Response } from "express";
import { config } from "../config.js";

describe("apiKeyAuth Middleware", () => {
  const mockRequest = (apiKey?: string) =>
    ({
      header: vi.fn().mockImplementation((name: string) => {
        if (name === "X-API-Key") return apiKey;
        return undefined;
      }),
    } as unknown as Request);

  const mockResponse = () => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call next() if X-API-Key matches config", () => {
    const req = mockRequest(config.factoryApiKey);
    const res = mockResponse();

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 401 if X-API-Key is missing", () => {
    const req = mockRequest(undefined);
    const res = mockResponse();

    apiKeyAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Unauthorized" })
    );
  });

  it("should return 401 if X-API-Key is incorrect", () => {
    const req = mockRequest("wrong-key");
    const res = mockResponse();

    apiKeyAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
