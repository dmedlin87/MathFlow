import { EquivFractionGenerator } from "../src/domain/skills/grade4-fractions";
import { DomainGeneratorAdapter } from "../server/src/factory/adapters/DomainGeneratorAdapter";

async function verify() {
  console.log("Verifying Server <-> Domain Link...");
  const adapter = new DomainGeneratorAdapter(EquivFractionGenerator);
  console.log(`Loaded Generator for Skill: ${adapter.skillId}`);

  const item = await adapter.generate(0.5);
  console.log("Generated Item ID:", item.meta.id);

  if (item.problem_content.stem) {
    console.log(
      "SUCCESS: Domain logic executed in server context via Adapter."
    );
  } else {
    console.error("FAILURE: Item empty.");
    process.exit(1);
  }
}

verify().catch((e) => {
  console.error("CRITICAL FAILURE:", e);
  process.exit(1);
});
