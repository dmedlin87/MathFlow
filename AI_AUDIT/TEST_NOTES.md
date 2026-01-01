# Test Notes

## Call-Site Map

### `src/services/persistence.ts`

**Exported Functions:**
1.  `PersistenceService.saveState(state: LearnerState): void`
2.  `PersistenceService.loadState(): LearnerState | null`
3.  `PersistenceService.clearState(): void`

**Call Sites:**
*   `src/App.tsx`: Calls `loadState` during initialization of `learnerState`.
*   *Note*: `saveState` was found to be **unused** in `MathTutor` or `App.tsx` (a potential bug), but is tested here to enforce the contract for future use.

**Contracts:**

1.  `saveState`
    *   **Inputs**: `LearnerState` object.
    *   **Outputs**: `void`.
    *   **Side Effects**: Writes JSON string to `localStorage` under key `mathflow_learner_state_v1`.
    *   **Errors**: Catches all errors (e.g., QuotaExceeded) and logs to console; does not throw.
    *   **Example**: `saveState({ userId: 'u1', ... })` -> `localStorage.setItem(...)`.

2.  `loadState`
    *   **Inputs**: None.
    *   **Outputs**: `LearnerState | null`.
    *   **Logic**: Reads from `localStorage`. Returns `null` if missing or invalid JSON.
    *   **Errors**: Catches parsing errors and access errors, logs them, returns `null`.

3.  `clearState`
    *   **Inputs**: None.
    *   **Outputs**: `void`.
    *   **Side Effects**: Removes key from `localStorage`.

## Test Plan & Coverage

| Test Name | Behavior | Branch/Line | Type |
| :--- | :--- | :--- | :--- |
| `saveState` -> `saves valid state` | Verifies `setItem` call with correct JSON | Happy Path | Unit |
| `saveState` -> `handles error` | Verifies no throw & log on storage failure | Error Path | Unit |
| `loadState` -> `returns parsed state` | Verifies `getItem` & parsing | Happy Path | Unit |
| `loadState` -> `returns null if missing` | Verifies null return | Boundary | Unit |
| `loadState` -> `returns null if invalid` | Verifies parse error handling | Invalid Input | Unit |
| `loadState` -> `returns null if access fails` | Verifies access error handling | Error Path | Unit |

**Coverage Summary:**
*   `src/services/persistence.ts`: **100%** (up from ~40%).
*   `src/domain/learner/state.ts`: Already 100%, but adding behavior constraint tests next.

## Mutation Sanity Check

**Mutation:**
Commented out `localStorage.setItem` in `PersistenceService.saveState`.

```typescript
// localStorage.setItem(STORAGE_KEY, serializable);
```

**Result:**
Test `saves valid state to localStorage` **FAILED** as expected.
`AssertionError: expected "vi.fn()" to be called with arguments...`

**Evidence:**
```
FAIL src/services/persistence.test.ts > PersistenceService > saveState > saves valid state to localStorage
AssertionError: expected "vi.fn()" to be called with arguments: [ 'mathflow_learner_state_v1', …(1) ]
Number of calls: 0
```
