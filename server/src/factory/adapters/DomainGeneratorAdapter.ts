import type {
  MathProblemItem,
  Generator,
} from "../../../../src/domain/types.js";
import type { OfflineGenerator } from "../base.js";

export class DomainGeneratorAdapter implements OfflineGenerator {
  constructor(private readonly domainGenerator: Generator) {}

  get skillId() {
    return this.domainGenerator.skillId;
  }

  async generate(difficulty: number): Promise<MathProblemItem> {
    // Wrap synchronous domain generation in a Promise
    const result = this.domainGenerator.generate(difficulty);
    return Promise.resolve(result);
  }
}
