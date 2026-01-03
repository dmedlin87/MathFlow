## 2024-05-23 - DoS Protection
**Vulnerability:** Missing input validation and rate limiting on server endpoints `/api/problems` and `/api/factory/run`.
**Learning:** Even internal or "mock" endpoints can be vectors for DoS if they allow unbounded loops or resource consumption.
**Prevention:** Always validate and clamp numeric inputs (e.g., `limit`, `count`) to reasonable maximums (e.g., 50) before using them in loops or resource-intensive operations.

## 2024-05-23 - Rate Limiting Middleware
**Vulnerability:** The API lacked global rate limiting, allowing a single IP to flood the server with requests.
**Learning:** Checking limits inside business logic (like checking `limit < 50`) prevents large single requests but doesn't prevent thousands of small requests (volumetric DoS).
**Prevention:** Implement a global rate limiter at the middleware level (e.g., Token Bucket or Leaky Bucket) to cap requests per IP per time window.
## 2024-05-22 - Mitigation of Timing Attacks in API Auth
**Vulnerability:** The API Key authentication middleware used a standard string comparison (`apiKey !== config.factoryApiKey`). This operation is not constant-time, meaning it returns faster if the first character mismatches than if the last character mismatches, potentially allowing attackers to brute-force the key by measuring response times.
**Learning:** Even with long API keys, standard string comparison introduces a theoretical side-channel vulnerability. Security-critical comparisons should always be constant-time.
**Prevention:** Use `crypto.timingSafeEqual` for all secret comparisons. Ensure buffers are of equal length before comparison to avoid errors, while handling the length check carefully.
