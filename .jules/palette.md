## 2024-05-23 - Focus State Consistency
**Learning:** Input fields were using `outline-none` with only a border color change on focus, while multiple-choice buttons used a clear `focus:ring`. This inconsistency makes keyboard navigation confusing and harder for users with low vision.
**Action:** Standardize on `focus:ring-2 focus:ring-blue-200 focus:border-blue-500` for all text-based inputs to provide a clear, glowing focus indicator that matches the design system's interactive elements.
