## 2024-05-23 - DoS Protection
**Vulnerability:** Missing input validation and rate limiting on server endpoints `/api/problems` and `/api/factory/run`.
**Learning:** Even internal or "mock" endpoints can be vectors for DoS if they allow unbounded loops or resource consumption.
**Prevention:** Always validate and clamp numeric inputs (e.g., `limit`, `count`) to reasonable maximums (e.g., 50) before using them in loops or resource-intensive operations.

## 2024-05-23 - Rate Limiting Middleware
**Vulnerability:** The API lacked global rate limiting, allowing a single IP to flood the server with requests.
**Learning:** Checking limits inside business logic (like checking `limit < 50`) prevents large single requests but doesn't prevent thousands of small requests (volumetric DoS).
**Prevention:** Implement a global rate limiter at the middleware level (e.g., Token Bucket or Leaky Bucket) to cap requests per IP per time window.

## 2025-05-23 - Strict CORS Configuration
**Vulnerability:** The server was configured with `app.use(cors())`, effectively allowing Cross-Origin Resource Sharing from ANY origin (`*`).
**Learning:** Defaulting to wildcard access increases the attack surface, allowing malicious sites to interact with the backend if they can trick a user's browser.
**Prevention:** Explicitly define an allowlist of origins (reading from environment variables) and configure the CORS middleware to reject unauthorized origins. Default to safe local ports (e.g., Vite's 5173) in development.
