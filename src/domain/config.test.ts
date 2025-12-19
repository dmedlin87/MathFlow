import { describe, it, expect } from "vitest";
import { getApiBaseUrl } from "./config";

describe("getApiBaseUrl", () => {
  it("returns null by default in node when window is not defined", () => {
    expect(getApiBaseUrl()).toBeNull();
  });

  it("returns null when window is not defined even if env is provided", () => {
    expect(
      getApiBaseUrl({
        env: { VITE_API_BASE_URL: "https://api.example.test" },
        hasWindow: false,
      })
    ).toBeNull();
  });

  it("returns null when window exists but env is missing", () => {
    expect(getApiBaseUrl({ hasWindow: true })).toBeNull();
  });

  it("returns the VITE_API_BASE_URL when window and env are present", () => {
    expect(
      getApiBaseUrl({
        env: { VITE_API_BASE_URL: "https://api.example.test" },
        hasWindow: true,
      })
    ).toBe("https://api.example.test");
  });
});
