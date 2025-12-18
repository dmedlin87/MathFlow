# MathFlow Architecture

## Overview

MathFlow is an AI-powered tutoring system designed to help students master mathematics through adaptive learning and generated practice problems.

## 1. AI Integration & Hybrid Approach

MathFlow employs a **Hybrid Architecture** combining verifying "Pedagogical Truth" with "Conversational AI".

- **Pedagogical Truth (Deterministic):**
  - The core math logic resides in `src/domain`.
  - Problem generators (e.g., `src/domain/skills/grade5/fractions.ts`) allow for infinite, verified practice problems.
  - This layer is **independent of AI** to ensure mathematical correctness.

- **Conversational AI (Probabilistic):**
  - AI models (e.g., LLMs) are used for natural language interaction, explanation, and encouragement.
  - **Grounding:** AI responses are grounded in the verified data produced by the content generators. The AI does not "solve" the math; it explains the verified solution provided by the engine.

## 2. Scalability: The Problem Factory

The `src/domain/skills` directory acts as a content factory.

- **Extensibility:** Adding a new skill involves creating a new generator file implementing the `SkillGenerator` interface.
- **Registration:** New skills are registered in the Skill Registry (e.g., `src/domain/skills/registry.ts`) to be accessible by the Engine.

## 3. Observability & Logging

- **Structured Logging:** We use a custom logger (`src/utils/logger.ts`) to track significant events (skill generation, user attempts, errors).
- **Future Integration:** This logger is designed to be pluggable, allowing easy integration with APM tools (e.g., Datadog, Sentry) in production.

## 4. Deployment & Operationalization

- **Containerization:** The application can be containerized using Docker.
  - Frontend: Nginx serving static build.
  - Backend: Node.js process.
- **CI/CD:** GitHub Actions (or similar) running `npm test` and `npm run lint` on PRs.
- **Database:** Currently stateless/local implementation. Production would use a persistent store (Postgres/MongoDB) for user progress.

## 5. Error Handling & Resilience

- **Graceful Degradation:** If the AI service is unavailable, the system falls back to providing the raw, pre-generated hints and solutions from the domain engine.
- **Circuit Breakers:** To be implemented for external AI API calls to prevent cascading failures.
