### Excalidraw AI — Natural Language to Diagrams, Instantly

Turn plain-English prompts into editable Excalidraw diagrams. Describe a system, flow, or sketch, and get a clean, labeled, and connected canvas in seconds.

[![Build](https://img.shields.io/badge/build-passing-28a745)](https://github.com/) [![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/) [![LangChain](https://img.shields.io/badge/LangChain-enabled-1f6feb)](https://python.langchain.com/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## Table of Contents
- Introduction
- How It Works (Architecture)
- Features
- Getting Started
- Usage
- Tech Stack
- Project Structure
- Contributing
- License

---

## Introduction

Excalidraw AI is a developer-focused Next.js app that converts natural language into a compact DSL (Domain-Specific Language) which maps directly to Excalidraw elements. It classifies intent, optimizes your prompt, produces a clean DSL JSON, and renders it live on the Excalidraw canvas. The system preserves IDs, handles inline text, and maintains arrow bindings for round-trippable, predictable diagrams.

Use it to:
- Draft system designs and architecture diagrams
- Create flowcharts and decision trees
- Sketch technical visuals quickly during ideation or reviews

---

## How It Works (Architecture)

High-level flow:
1. User types a prompt in the chat.
2. API validates the input and invokes the AI pipeline.
3. AI pipeline (LangChain + Groq Llama 3.3):
   - Classify intent (create/edit/general/question/reference)
   - If “create”: subclassify (system_design/technical_diagram/drawing/general)
   - Optimize the prompt into a structured, precise instruction
   - Generate minimal, valid DSL JSON using a guided prompt
4. Converter transforms DSL → Excalidraw elements:
   - Stable ID mapping for consistent updates
   - Inline text centering within shapes
   - Arrow bindings (`startBind`/`endBind`) resolved to shape IDs
5. Redux stores elements; Excalidraw renders the diagram.

Suggested diagram (add as an image/screenshot):
User → ChatInput → /api/ai/drawing → LangChain Pipeline → DSL → Converter → Redux Store → Excalidraw Canvas

Key modules:
- API: `client/app/api/ai/drawing/route.ts`
- Pipeline: `client/lib/chains/pipeline.ts`
- Prompt: `client/lib/prompts/dslPrompt.ts`
- Converter: `client/lib/converter.ts`
- Client API: `client/lib/api/ai.ts`
- State: `client/lib/slice/currentExcalidrawSlice.ts`
- Hooks: `client/hooks/useAIDrawing.ts`
- UI: `client/components/ChatInput.tsx`, `client/components/Excalidraw.tsx`

Optional utilities:
- `J2/` — a small Node package to experiment with DSL conversion and clipboard export.

---

## Features

- Intent classification with guardrails
- Subclassification for better DSL targeting (system design, technical, drawing)
- Prompt optimization for clarity and structure
- DSL generation with a compact, readable schema:
  - Elements: `rect`, `ellipse`, `diamond`, `arrow`, `line`, `freedraw`, `text`
  - Styling with color shorthands: `k,w,r,g,b,y,p,o,t`
  - Inline text for shape labels with auto-centering
  - Arrow bindings via `startBind` / `endBind`
- Robust converter (DSL ↔ Excalidraw):
  - Deterministic ID mapping
  - Inline/container text handling
  - Relationship resolution and `boundElements` support
- Live Excalidraw rendering, React 19 + Next.js App Router
- Consistent error handling and typed responses

---

## Getting Started

### Prerequisites
- Node.js 18+ (recommended for Next.js 15)
- npm (or pnpm/yarn/bun)
- Groq API Key

### Environment variables
Create `client/.env.local`:
```bash
GROQ_API_KEY=your_groq_api_key
# Optional if you customize axios baseURL; defaults to /api
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### Install and run (Client app)
```bash
cd client
npm install
npm run dev
```
Open http://localhost:3000

### Optional: Utilities package (J2)
```bash
cd J2
npm install
npm run dev
```
This provides a CLI-friendly converter and clipboard integration for DSL experiments.

---

## Usage

1. Start the client dev server and open the app.
2. Type a prompt, for example:
   - “Draw a login flow: User → Login → Auth Service → DB. Add decision on success/failure.”
   - “System design for URL shortener: API, Cache, DB, Worker.”
   - “Flowchart: Start → Process A → Decision Valid? Yes → End, No → Handle Error.”
3. Submit. The app will:
   - Classify and optimize your prompt
   - Generate DSL JSON
   - Convert and render it in Excalidraw

API (for direct programmatic use):
- Endpoint: `POST /api/ai/drawing`
- Body:
```json
{ "prompt": "Describe your diagram here" }
```
- Successful response:
```json
{ "success": true, "dsl": { "elements": [...], "flows": [...], "layout": "..." } }
```
Note: The UI consumes `dsl.elements` and renders them in Excalidraw.

Example DSL pattern:
```json
[
  {"id":"start","type":"ellipse","x":100,"y":50,"w":100,"h":60,"fill":"g","text":"Start"},
  {"id":"process","type":"rect","x":100,"y":150,"w":120,"h":80,"fill":"b","text":"Process"},
  {"id":"end","type":"ellipse","x":100,"y":280,"w":100,"h":60,"fill":"r","text":"End"},
  {"id":"a1","type":"arrow","x":150,"y":110,"endX":150,"endY":150,"startBind":"start","endBind":"process"},
  {"id":"a2","type":"arrow","x":150,"y":230,"endX":150,"endY":280,"startBind":"process","endBind":"end"}
]
```

Tips:
- Use concise, structured prompts for best results.
- Prefer inline shape labels (the `text` property on shapes) over standalone text when possible.

---

## Tech Stack

- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide
- Canvas: `@excalidraw/excalidraw`
- State: Redux Toolkit, React Redux
- Data fetching: TanStack Query
- AI Orchestration: LangChain + `@langchain/groq` (Llama 3.3 70B)
- HTTP: Axios
- Validation: Zod
- Backend: Next.js API Routes
- Optional persistence: Prisma client present (not required for core flow today)

Key dependencies (client):
- next 15.5.x, react 19.1.x
- @excalidraw/excalidraw
- @reduxjs/toolkit, react-redux
- @tanstack/react-query
- langchain, @langchain/groq
- zod, axios, tailwindcss

Utilities (J2):
- hono, zod, clipboardy, tsup, tsx

---

## Project Structure

- `client/` — Next.js app
  - `app/api/ai/drawing/route.ts` — AI endpoint
  - `components/ChatInput.tsx`, `components/Excalidraw.tsx` — UI
  - `hooks/useAIDrawing.ts` — React Query mutation
  - `lib/chains/pipeline.ts` — Classification, optimization, DSL generation
  - `lib/prompts/dslPrompt.ts` — DSL schema and guidance
  - `lib/converter.ts` — DSL ↔ Excalidraw conversion
  - `lib/api/ai.ts` — Axios client
  - `lib/slice/currentExcalidrawSlice.ts` — Redux slice
  - `config/axios.ts`, `config/store.ts` — Axios and Redux setup
  - `providers/ReduxProvider.tsx`, `providers/QueryProvider.tsx` — App providers
  - `types/ai.ts` — Request/response types (re-exporting converter types)
- `J2/` — Node utilities for DSL conversion and clipboard experimentation

---

## Contributing

1. Fork the repo and create a feature branch.
2. Keep PRs focused; add clear descriptions and steps to verify.
3. If extending the DSL:
   - Update both `lib/prompts/dslPrompt.ts` and `lib/converter.ts`
   - Add minimal examples and ensure round-trip integrity
4. For UI work, include a short screencap or before/after screenshot.

Local dev checklist:
- `GROQ_API_KEY` set in `client/.env.local`
- `npm run dev` in `client/`
- Test with small, representative prompts
- Prefer inline labels (`text` on shapes) for readability

---

## License

- App (client directory): MIT
- Utilities (`J2` package): ISC (as declared in `J2/package.json`)

Use, modify, and distribute under the terms of the respective licenses.