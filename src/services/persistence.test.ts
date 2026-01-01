import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersistenceService } from "./persistence";
import type { LearnerState } from "../domain/types";

describe("PersistenceService", () => {
  const MOCK_STORAGE_KEY = "mathflow_learner_state_v1";

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
      // Helper to reset internal store
      _reset: () => { store = {}; }
    };
  })();

  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock._reset();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("saveState", () => {
    it("saves valid state to localStorage", () => {
      const state = { userId: "user123", skillState: {} } as LearnerState;
      PersistenceService.saveState(state);
      expect(localStorage.setItem).toHaveBeenCalledWith(MOCK_STORAGE_KEY, JSON.stringify(state));
    });

    it("handles localStorage.setItem throwing error (e.g. quota exceeded)", () => {
      const state = { userId: "user123", skillState: {} } as LearnerState;
      const error = new Error("QuotaExceeded");
      (localStorage.setItem as any).mockImplementationOnce(() => { throw error; });

      expect(() => PersistenceService.saveState(state)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Failed to save state', error);
    });
  });

  describe("loadState", () => {
    it("returns parsed state when valid JSON exists", () => {
      const storedState = { userId: "user123", skillState: {} };
      (localStorage.getItem as any).mockReturnValue(JSON.stringify(storedState));

      const result = PersistenceService.loadState();
      expect(result).toEqual(storedState);
      expect(localStorage.getItem).toHaveBeenCalledWith(MOCK_STORAGE_KEY);
    });

    it("returns null when no state exists", () => {
      (localStorage.getItem as any).mockReturnValue(null);
      const result = PersistenceService.loadState();
      expect(result).toBeNull();
    });

    it("returns null and logs error when JSON is invalid", () => {
      (localStorage.getItem as any).mockReturnValue("{ invalid json");
      const result = PersistenceService.loadState();
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to load state', expect.any(Error));
    });

    it("returns null and logs error when localStorage access throws", () => {
       const error = new Error("Access Denied");
       (localStorage.getItem as any).mockImplementationOnce(() => { throw error; });
       const result = PersistenceService.loadState();
       expect(result).toBeNull();
       expect(console.error).toHaveBeenCalledWith('Failed to load state', error);
    });
  });

  describe("clearState", () => {
      it("removes the key from localStorage", () => {
          PersistenceService.clearState();
          expect(localStorage.removeItem).toHaveBeenCalledWith(MOCK_STORAGE_KEY);
      });
  });
});
