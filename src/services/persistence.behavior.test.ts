import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersistenceService } from "./persistence";
import { createTestState } from "../test/testHelpers";
import type { LearnerState } from "../domain/types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _forceQuotaError: false,
  };
})();

describe("PersistenceService", () => {
  const TEST_KEY = "mathflow_learner_state_v1";

  beforeEach(() => {
    vi.resetAllMocks();
    localStorageMock.clear();
    localStorageMock._forceQuotaError = false;
    vi.stubGlobal("localStorage", localStorageMock);

    // Silence console.error for tests expecting failure
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("saveState", () => {
    it("successfully saves learner state to localStorage", () => {
      const state = { userId: "test-user", skillState: {} } as LearnerState;

      PersistenceService.saveState(state);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(TEST_KEY, JSON.stringify(state));
    });

    it("handles QuotaExceededError gracefully (logs error, does not crash)", () => {
      const state = { userId: "test-user", skillState: {} } as LearnerState;

      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => PersistenceService.saveState(state)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith("Failed to save state", expect.any(Error));
    });
  });

  describe("loadState", () => {
    it("successfully loads and parses learner state from localStorage", () => {
      const state = { userId: "test-user", skillState: {} } as LearnerState;
      localStorageMock.setItem(TEST_KEY, JSON.stringify(state));

      const loaded = PersistenceService.loadState();

      expect(loaded).toEqual(state);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(TEST_KEY);
    });

    it("returns null if no state exists in localStorage", () => {
      const loaded = PersistenceService.loadState();
      expect(loaded).toBeNull();
    });

    it("returns null and logs error if stored data is corrupt (JSON parse error)", () => {
      localStorageMock.setItem(TEST_KEY, "{ invalid json");

      const loaded = PersistenceService.loadState();

      expect(loaded).toBeNull();
      expect(console.error).toHaveBeenCalledWith("Failed to load state", expect.any(Error));
    });
  });

  describe("clearState", () => {
      it("removes state from localStorage", () => {
          localStorageMock.setItem(TEST_KEY, "some-data");
          PersistenceService.clearState();
          expect(localStorageMock.removeItem).toHaveBeenCalledWith(TEST_KEY);
          expect(localStorageMock.getItem(TEST_KEY)).toBeNull();
      });
  });
});
