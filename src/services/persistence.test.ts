// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersistenceService } from "./persistence";
import type { LearnerState } from "../domain/types";

describe("PersistenceService", () => {
  const mockState: LearnerState = {
    userId: "test-user",
    skillState: {
      skill_1: {
        masteryProb: 0.9,
        stability: 1,
        lastPracticed: "2023-01-01T00:00:00.000Z",
        misconceptions: [],
      },
    },
  };

  beforeEach(() => {
    vi.spyOn(Storage.prototype, "setItem");
    vi.spyOn(Storage.prototype, "getItem");
    vi.spyOn(Storage.prototype, "removeItem");
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("saveState", () => {
    it("should save state to localStorage", () => {
      PersistenceService.saveState(mockState);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "mathflow_learner_state_v1",
        JSON.stringify(mockState)
      );
    });

    it("should catch and log errors during save (e.g. quota exceeded)", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      PersistenceService.saveState(mockState);

      expect(console.error).toHaveBeenCalledWith(
        "Failed to save state",
        expect.any(Error)
      );
    });
  });

  describe("loadState", () => {
    it("should return null if no state exists", () => {
      (localStorage.getItem as any).mockReturnValue(null);
      const result = PersistenceService.loadState();
      expect(result).toBeNull();
    });

    it("should return parsed state if valid JSON exists", () => {
      (localStorage.getItem as any).mockReturnValue(JSON.stringify(mockState));
      const result = PersistenceService.loadState();
      expect(result).toEqual(mockState);
    });

    it("should return null and log error if JSON is corrupt", () => {
      (localStorage.getItem as any).mockReturnValue("{ invalid json");
      const result = PersistenceService.loadState();
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Failed to load state",
        expect.any(Error)
      );
    });
  });

  describe("clearState", () => {
    it("should remove state from localStorage", () => {
      PersistenceService.clearState();
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        "mathflow_learner_state_v1"
      );
    });
  });
});
