## 2025-12-16 - Async Button Loading Pattern
**Learning:** For async actions like answer submission, standardizing on a disabled button with `aria-busy="true"` and a spinner icon provides essential feedback. We encountered dead code in `MathTutor` that was hiding behind conditional logic; cleaning it up enabled stricter type checking.
**Action:** Use the new loading button pattern for all future async form submissions. Ensure unit tests use `waitFor` to assert the transient "Checking..." state.
