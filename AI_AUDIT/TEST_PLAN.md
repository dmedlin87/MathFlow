
| Test Name | Behavior | Branch/Line | Happy/Boundary/Invalid |
|---|---|---|---|
| **Engine Tests** | | | |
| `generate` fetches from API | Returns problem from API when `apiBaseUrl` is set and API returns 200 | `engine.ts:41` | Happy |
| `generate` handles API failure | Falls back to local generator when API returns 500 or error | `engine.ts:60` | Boundary |
| `generate` uses factory fallback | Calls `/factory/run` when `/problems` is empty | `engine.ts:53` | Happy |
| `generate` validates API response | Validates problem shape before returning | `engine.ts:43` | Invalid |
| **State Tests** | | | |
| `recommendNextItem` throws if empty | Throws error if no skills provided | `state.ts:145` | Invalid |
| `recommendNextItem` increases difficulty | Sets difficulty to 0.9 for high mastery (>0.8) items | `state.ts:170` | Boundary |
