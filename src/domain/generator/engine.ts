import type { Generator, Item } from '../types';

class GeneratorEngine {
  private generators: Map<string, Generator> = new Map();

  register(generator: Generator) {
    this.generators.set(generator.templateId, generator);
  }

  getGenerator(templateId: string): Generator | undefined {
    return this.generators.get(templateId);
  }

  generateItem(templateId: string, difficulty: number): Item {
    const generator = this.generators.get(templateId);
    if (!generator) {
        throw new Error(`No generator found for template: ${templateId}`);
    }
    return generator.generate(difficulty);
  }
}

export const engine = new GeneratorEngine();
