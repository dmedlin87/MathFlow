import type { MathProblemItem } from "@domain/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config.js";

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ProblemBank {
  private items: Map<string, MathProblemItem> = new Map();
  private bySkill: Map<string, string[]> = new Map(); // skillId -> itemIds
  private initialized: boolean = false;
  private dbPath: string;

  constructor() {
    // Resolve path relative to server root if it's relative
    this.dbPath = path.isAbsolute(config.dataPath)
      ? config.dataPath
      : path.join(__dirname, "..", "..", config.dataPath);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

      const data = await fs.readFile(this.dbPath, "utf8");
      const parsed = JSON.parse(data) as MathProblemItem[];

      for (const item of parsed) {
        this.items.set(item.meta.id, item);
        const skillId = item.meta.skill_id;
        if (!this.bySkill.has(skillId)) {
          this.bySkill.set(skillId, []);
        }
        this.bySkill.get(skillId)?.push(item.meta.id);
      }
      console.log(`[ProblemBank] Loaded ${parsed.length} problems from disk.`);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.log(
          `[ProblemBank] No database found at ${this.dbPath}, starting fresh.`
        );
      } else {
        console.error(`[ProblemBank] Error loading data:`, err);
      }
    }

    this.initialized = true;
  }

  private async persist(): Promise<void> {
    try {
      const data = JSON.stringify(Array.from(this.items.values()), null, 2);
      await fs.writeFile(this.dbPath, data, "utf8");
    } catch (err) {
      console.error(`[ProblemBank] Error persisting data:`, err);
    }
  }

  async save(item: MathProblemItem): Promise<void> {
    await this.ensureInitialized();
    if (item.meta.status !== "VERIFIED") {
      throw new Error("Cannot save unverified item to Problem Bank");
    }

    this.items.set(item.meta.id, item);

    const skillId = item.meta.skill_id;
    if (!this.bySkill.has(skillId)) {
      this.bySkill.set(skillId, []);
    }
    this.bySkill.get(skillId)?.push(item.meta.id);

    await this.persist();
  }

  async fetch(skillId: string, limit: number = 1): Promise<MathProblemItem[]> {
    await this.ensureInitialized();
    const itemIds = this.bySkill.get(skillId) || [];

    // Use optimized sampling instead of full shuffle
    const selectedIds = this.sample(itemIds, limit);

    return selectedIds.map((id) => this.items.get(id)!).filter(Boolean);
  }

  async getById(id: string): Promise<MathProblemItem | undefined> {
    await this.ensureInitialized();
    return this.items.get(id);
  }

  /**
   * Efficiently selects `count` random unique elements from `array`.
   * Uses Set-based selection for small counts relative to array size (avoiding O(N) copy).
   * Uses Fisher-Yates shuffle for larger counts.
   */
  private sample<T>(array: T[], count: number): T[] {
    const len = array.length;
    if (count === 0 || len === 0) return [];
    if (count >= len) {
      // If we need all items (or more), return a shuffled copy
      // Fisher-Yates
      const copy = [...array];
      for (let i = len - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    // Optimization: If count is small compared to length (e.g. < 50%),
    // use random index selection to avoid O(N) array copy.
    // This is O(count) on average.
    if (count < len / 2) {
      const selectedIndices = new Set<number>();
      const result: T[] = [];

      // Safety counter to prevent infinite loop in edge cases (though mathematically rare)
      let attempts = 0;
      const maxAttempts = count * 10;

      while (result.length < count && attempts < maxAttempts) {
        const idx = Math.floor(Math.random() * len);
        if (!selectedIndices.has(idx)) {
          selectedIndices.add(idx);
          result.push(array[idx]);
        }
        attempts++;
      }

      // Fallback if we somehow got stuck (unlikely with count < len/2)
      if (result.length < count) {
        // Fill the rest with linear scan skipping already selected
        for (let i = 0; i < len && result.length < count; i++) {
          if (!selectedIndices.has(i)) {
            result.push(array[i]);
          }
        }
      }
      return result;
    }

    // Otherwise, Partial Fisher-Yates on a copy
    // This is O(N) due to copy, plus O(count) for swaps.
    const copy = [...array];
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(Math.random() * (len - i));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }
}

// Singleton instance
export const problemBank = new ProblemBank();
