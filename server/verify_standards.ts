import { ALL_SKILLS_LIST } from "@domain/skills/registry.js";
import type { Skill } from "@domain/types.js";

console.log("Verifying Standards Alignment...");

let missingCount = 0;
let totalCount = 0;
let foundCount = 0;

ALL_SKILLS_LIST.forEach((skill: Skill) => {
  totalCount++;
  if (skill.standards && skill.standards.length > 0) {
    console.log(`[OK] ${skill.id}: ${skill.standards.join(", ")}`);
    foundCount++;
  } else {
    // console.log(`[MISSING] ${skill.id}`);
    missingCount++;
  }
});

console.log("\nSummary:");
console.log(`Total Skills: ${totalCount}`);
console.log(`Skills with Standards: ${foundCount}`);
console.log(`Skills missing Standards: ${missingCount}`);

if (foundCount > 0) {
  console.log(
    "\nSUCCESS: Standards field is accessible and populated for updated skills."
  );
  process.exit(0);
} else {
  console.error("\nFAILURE: No standards found.");
  process.exit(1);
}
