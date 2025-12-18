import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function findFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else if (file.endsWith(".ts") && !file.endsWith(".test.ts")) {
      results.push(filePath);
    }
  });
  return results;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("Skill Modules Engine Side-Effect Guardrail", () => {
  it("should not import engine or call engine.register inside skills modules", () => {
    const skillsDir = path.resolve(__dirname);
    const files = findFiles(skillsDir);

    const offenders: { file: string; reason: string }[] = [];

    for (const file of files) {
      const raw = fs.readFileSync(file, "utf8");
      const content = stripComments(raw);

      if (/from\s*["'][^"']*generator\/engine["']/.test(content)) {
        offenders.push({ file, reason: "imports generator/engine" });
      }

      if (/\bengine\.register\s*\(/.test(content)) {
        offenders.push({ file, reason: "calls engine.register" });
      }
    }

    if (offenders.length > 0) {
      console.error("Disallowed engine side-effects found:", offenders);
    }

    expect(offenders).toEqual([]);
  });
});
