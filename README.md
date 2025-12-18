# MathFlow (AI Tutoring System)

A **hybrid AI intelligent tutoring system** that combines deterministic "Pedagogical Truth" (verified math problems) with a "Conversational Voice" (LLM) for explanations and hints.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
npm install
```

### Development

Start both the client (Vite) and server (Express):

```bash
npm run dev
```

> This runs:
> - Client: `http://localhost:5173`
> - Server: `http://localhost:3002`

## 🏗 Architecture

MathFlow separates content verification from runtime delivery.

- **Spec:** [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Problem Bank:** Verified items are currently generated via a simulated factory (see `src/domain/skills`).

## 🧪 Testing

Run unit and behavior tests:

```bash
npm run test
```

Generate coverage report:

```bash
npm run test:coverage
```

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS, Vite
- **Backend:** Express, Node.js
- **Testing:** Vitest, Testing Library
