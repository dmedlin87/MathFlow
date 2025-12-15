import type { Generator, MathProblemItem } from '../types';

class Engine {
  private generators: Map<string, Generator> = new Map();

  register(generator: Generator) {
    // In V1, we might validate the generator outputs a valid schema here
    this.generators.set(generator.skillId, generator);
  }

    async generate(skillId: string, difficulty: number, rng?: () => number): Promise<MathProblemItem> {
         // V1 Architecture: Runtime fetches verified items from Server
         // Fallback to local (dev mode/network error) is handled for robustness, 
         // but primary path is network.
         
         const API_BASE = 'http://localhost:3002/api';
         
         try {
             // 1. Try to fetch verified problem from Bank
             const res = await fetch(`${API_BASE}/problems?skillId=${skillId}&limit=1`);
             
             if (res.ok) {
                 const problems = await res.json();
                 if (problems && problems.length > 0) {
                     return problems[0];
                 }
                 // If bank is empty, try to trigger factory (Just-in-Time for V0 Prototype)
                 const runRes = await fetch(`${API_BASE}/factory/run`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ skillId, difficulty, count: 1 })
                 });
                 
                 if (runRes.ok) {
                     const runData = await runRes.json();
                     if (runData.items && runData.items.length > 0) {
                         return runData.items[0];
                     }
                 }
             }
         } catch (e) {
             console.warn("Network fetch failed, falling back to local generator (Dev Mode)", e);
         }

         // 2. Fallback: Local Generation (Legacy V0 path, kept for dev reliability)
         const generator = this.generators.get(skillId);
         if (!generator) {
             throw new Error(`No generator found for skill: ${skillId}`);
         }
         return generator.generate(difficulty, rng);
    }
}

export const engine = new Engine();
