import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ALL_SKILLS_LIST } from "./registry";

/**
 * Registry Consistency Check
 *
 * Ensures that every Skill object exported in the codebase is present in the central ALL_SKILLS_LIST.
 * This prevents "ghost skills" that exist in code but are never loaded by the application.
 */

// Helper to recursively find .ts files
function findFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else if (file.endsWith(".ts") && !file.endsWith(".test.ts")) {
      results.push(filePath);
    }
  });
  return results;
}

describe("Skill Registry Consistency", () => {
  it("should contain all exported Skill objects from the skills directory", async () => {
    const skillsDir = path.resolve(__dirname);
    // Scan grade directories
    const files = findFiles(skillsDir);

    const registeredIds = new Set(ALL_SKILLS_LIST.map((s) => s.id));
    const foundSkills: { id: string; file: string }[] = [];

    for (const file of files) {
      if (file.includes("registry.ts") || file.includes("generatorMap.ts"))
        continue;

      // Dynamic import to inspect exports
      // Note: We need to handle the path for dynamic import
      try {
        const module = await import(file);
        for (const value of Object.values(module)) {
          // Heuristic: Check if it looks like a Skill object
          if (
            value &&
            typeof value === "object" &&
            "id" in value &&
            "gradeBand" in value &&
            "standards" in value
          ) {
            foundSkills.push({ id: (value as { id: string }).id, file });
          }
        }
      } catch {
        // Ignore files that aren't modules or fail to load
      }
    }

    const missingSkills = foundSkills.filter((s) => !registeredIds.has(s.id));

    if (missingSkills.length > 0) {
      console.error("Found unregistered skills:", missingSkills);
    }

    expect(missingSkills).toEqual([]);
  });
});
