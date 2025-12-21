import { problemBank } from "./src/store/ProblemBank.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPersistence() {
  console.log("--- Testing Persistence ---");

  const testItem = {
    meta: {
      id: "test-auth-123",
      version: 1,
      skill_id: "test-skill",
      difficulty: 3,
      created_at: new Date().toISOString(),
      status: "VERIFIED",
      provenance: {
        generator_model: "test",
        critic_model: "test",
        judge_model: "test",
        verifier: { type: "none", passed: true },
        attempt: 1,
      },
      verification_report: {
        rubric_scores: {
          solvability: 1,
          ambiguity: 0,
          procedural_correctness: 1,
          pedagogical_alignment: 1,
        },
        underspecified: false,
        issues: [],
      },
    },
    problem_content: { stem: "What is 1+1?", format: "text" },
    answer_spec: { answer_mode: "final_only", input_type: "integer" },
    solution_logic: {
      final_answer_canonical: "2",
      final_answer_type: "numeric",
      steps: [],
    },
    misconceptions: [],
  };

  console.log("1. Saving item to ProblemBank...");
  await problemBank.save(testItem as any);

  const dbPath = path.join(__dirname, "data", "problems.json");
  console.log(`2. Checking if file exists at ${dbPath}...`);

  try {
    const stats = await fs.stat(dbPath);
    console.log(`- File exists, size: ${stats.size} bytes`);

    const content = await fs.readFile(dbPath, "utf8");
    const data = JSON.parse(content);
    const item = data.find((i: any) => i.meta.id === "test-auth-123");

    if (item) {
      console.log("- SUCCESS: Item found in JSON file!");
    } else {
      console.error("- FAILURE: Item NOT found in JSON file.");
      process.exit(1);
    }
  } catch (err) {
    console.error("- FAILURE: Error reading file:", err);
    process.exit(1);
  }
}

testPersistence().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
