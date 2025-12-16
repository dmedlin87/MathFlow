## 2024-05-23 - [Optimized Problem Bank Sampling]
**Learning:** `sort(() => Math.random() - 0.5)` is both biased and inefficient (O(N log N)). For random sampling from large arrays, Fisher-Yates (O(N)) or sparse index selection (O(K)) is vastly superior.
**Action:** Always use Fisher-Yates for shuffling or random index selection for sampling. Avoid `sort` for randomization.

## 2024-05-23 - [Vitest Setup for Backend]
**Learning:** `server/src` shares the root `package.json` but `vitest` needs to be installed in the root devDependencies to run backend tests.
**Action:** Ensure `npm install` is run before running tests if dependencies might be missing.
