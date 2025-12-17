import type { Generator, MathProblemItem } from "../types";
import { validateMathProblemItem } from "../validation";
import { getApiBaseUrl } from "../config";

// Fix: Eliminate Hardcoded API URL (Architecture Review 2025-12-14)
export interface EngineConfig {
  apiBaseUrl?: string | null;
}

export class Engine {
  private generators: Map<string, Generator> = new Map();
  private config: EngineConfig;

  constructor(config: EngineConfig = {}) {
    this.config = config;
  }

  register(generator: Generator) {
    // In V1, we might validate the generator outputs a valid schema here
    this.generators.set(generator.skillId, generator);
  }

  async generate(
    skillId: string,
    difficulty: number,
    rng?: () => number
  ): Promise<MathProblemItem> {
    // V1 Architecture: Runtime fetches verified items from Server
    // Fallback to local (dev mode/network error) is handled for robustness,
    // but primary path is network.

    const API_BASE = this.config.apiBaseUrl;

    // Only attempt network fetch if API base is configured
    if (API_BASE) {
      try {
        // 1. Try to fetch verified problem from Bank
        const res = await fetch(
          `${API_BASE}/problems?skillId=${skillId}&limit=1`
        );

        if (res.ok) {
          const problems = await res.json();
          if (problems && problems.length > 0) {
            return validateMathProblemItem(problems[0]);
          }
          // If bank is empty, try to trigger factory (Just-in-Time for V0 Prototype)
          const runRes = await fetch(`${API_BASE}/factory/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillId, difficulty, count: 1 }),
          });

          if (runRes.ok) {
            const runData = await runRes.json();
            if (runData.items && runData.items.length > 0) {
              return validateMathProblemItem(runData.items[0]);
            }
          }
        }
      } catch (e) {
        console.warn(
          "Network fetch failed, falling back to local generator (Dev Mode)",
          e
        );
      }
    }

    // 2. Fallback: Local Generation (Legacy V0 path, kept for dev reliability)
    const generator = this.generators.get(skillId);
    if (!generator) {
      throw new Error(`No generator found for skill: ${skillId}`);
    }
    return validateMathProblemItem(generator.generate(difficulty, rng));
  }
}

// Default export uses environment-aware configuration
// In production, apiBaseUrl would be set via environment variable
// In tests, it defaults to null (skips network calls)
const apiBaseUrl = getApiBaseUrl();

export const engine = new Engine({ apiBaseUrl });
