## 2024-05-23 - DoS Protection
**Vulnerability:** Missing input validation and rate limiting on server endpoints `/api/problems` and `/api/factory/run`.
**Learning:** Even internal or "mock" endpoints can be vectors for DoS if they allow unbounded loops or resource consumption.
**Prevention:** Always validate and clamp numeric inputs (e.g., `limit`, `count`) to reasonable maximums (e.g., 50) before using them in loops or resource-intensive operations.
