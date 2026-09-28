# Facts

Facts is an offline-first, card-based learning application. Topics are arranged as connected sequences so every card complements the next and moves the learner from foundations toward practical outcomes.

## Included topics

The catalog contains **16 authored topics**, **1,512 cards**, and **101 guided paths**, including **five curated Vibe Coding modules**. The three other oversized legacy curricula remain under explicitly separate compatibility limits. Previously, ten topics received 100 additional repetitive reference cards each at runtime; that automatic padding has now been retired. **Every newly generated/imported topic is limited to 100 cards** by a progressive, quality-first generation contract (see [Card generation rules](docs/CARD_GENERATION_RULES.md)). Existing larger authored curricula are preserved pending a non-destructive split into smaller topics:

1. Frontend Programming
2. Backend Programming
3. Data Science
4. Statistics
5. Python Programming
6. Databases & SQL
7. Machine Learning
8. Cybersecurity Fundamentals
9. Cloud & DevOps
10. Git & GitHub
11. Docker
12. Vibe Coding 01 — Foundations, Product & Context
13. Vibe Coding 02 — Architecture, Git & Agentic Workflows
14. Vibe Coding 03 — Secure Application Engineering
15. Vibe Coding 04 — Debugging, Review & Product Quality
16. Vibe Coding 05 — Environments, Delivery & Production

The Frontend Programming curriculum contains **400 curated cards across 20 deep paths** covering the web platform, semantic HTML, forms, CSS, layout, responsive design, visual systems, JavaScript, DOM and browser APIs, asynchronous data, state and component architecture, TypeScript and tooling, accessibility, routing and complete UX states, frontend security, performance, media and offline capabilities, testing and debugging, framework/rendering architecture, and production delivery. It remains an existing authored masterclass of **400 cards across 20 paths**; no synthetic reference-library cards are appended.

The Backend Programming curriculum contains **400 curated cards across 20 deep paths** covering server/runtime behavior, HTTP semantics, API design, Node.js concurrency, routing and middleware, validation and error contracts, relational data, transactions and migrations, caching and storage, authentication, authorization and multi-tenancy, API security and abuse resistance, configuration/secrets/TLS, durable jobs and queues, streams and file processing, realtime systems and integrations, testing and contracts, observability and reliability, deployment architecture, and backup/recovery/incident operations. It remains an existing authored masterclass of **400 cards across 20 paths**; no synthetic reference-library cards are appended.

The Docker curriculum contains 116 authored cards across 12 focused paths covering foundations, images and Dockerfiles, runtime behavior, storage, networking, Docker Compose, development workflows, security and supply chain, production operations, troubleshooting, and hands-on Node.js/API + PostgreSQL projects.

Vibe Coding has been fully revised into **five independently selectable 100-card topics**, covering its original 25 focused paths. [See the Vibe Coding curriculum and migration map](docs/VIBE_CODING_CURRICULUM.md). All 500 stable legacy card IDs are retained, but every front is now an authored retrieval question or task and every revealed answer is distinct. Each path has contextually authored scenarios, practical sequences, checks, and a code/example card paired with the corresponding lesson. The original generic 20-slot card-type template is not used for these curated decks. An explicit one-time progress migration preserves stored card statuses across the five topic IDs.

## Learning journey

The application uses a focused three-step journey:

1. Choose a topic.
2. Choose a complete topic or a guided learning path.
3. Choose sequential or random order, customize the deck, and start learning.

Once learning starts, the interface becomes a distraction-free full-screen card reader.

### Reader gestures

- Swipe left or tap the right edge for the next card.
- Swipe right or tap the left edge for the previous card.
- Tap the center to reveal or hide non-question answers.
- Swipe upward to mark a card mastered.
- Swipe downward to mark a card for review.
- Use the subtle progress controls inside the card when preferred.
- Keyboard: left/right arrows, Space to reveal, `M` for mastered, `R` for review, and Escape to exit.

## Card design studio

Each topic can have its own visual design. Available controls include:

- Classic, minimal, editorial, notebook, neon, and photo presets;
- accent, background, text, and muted-text colors;
- system, serif, monospace, and rounded typography;
- compact, comfortable, and spacious content density;
- corner radius and shadow strength;
- uploaded background images;
- images imported from compatible URLs;
- image fit, position, visibility, and overlay strength.

Design settings are saved locally per topic. Uploaded or imported images are copied into IndexedDB so they remain available offline.

## Offline-first PWA

Facts includes:

- a web app manifest;
- an installable application icon;
- a service worker;
- pre-caching of the application shell;
- pre-caching of all 16 learning decks, including other sharded lesson sources;
- stale-while-revalidate asset updates;
- network-first navigation fallback;
- local progress and design persistence;
- IndexedDB storage for card background images.

After the first successful visit, the application and every included topic can be opened without a network connection.

## Card types

- Concepts
- Facts and statements
- Multiple-choice questions
- Code examples
- Step-by-step procedures
- Checklists

## Run locally

No build step or third-party runtime package is required.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

Service workers require `localhost` or HTTPS.

## Validate the repository

Node.js 20 or newer is recommended.

```bash
npm run check
```

The check command validates JavaScript syntax, catalog parity, sharded lesson-deck assembly, all five Vibe Coding topic sizes and quality rules, every card and path relationship, retirement of repetitive topic expansion, the 100-card AI import limit, content-quality checks, and the learning and design unit tests.

## Data model

`data/decks.json` is the single catalog of topic files. Most `data/*.json` topics contain:

- deck metadata;
- guided paths and ordered card ids;
- cards with unique ids and sequence numbers;
- card type, title, prompt, tags, difficulty, and path membership;
- type-specific question, code, steps, or checklist fields.

Large authored curricula may use the `lesson-fragments-v1` source format. A compact topic manifest lists reviewable lesson-fragment files; `src/lesson-deck.js` deterministically assembles those fragments into the same strict deck schema before validation and learning. A fragment may provide 20 explicit lessons, or a technical curriculum may provide 10 compact topics that expand into paired concept/application lessons. The service worker pre-caches both the manifest and its fragments so the assembled topic remains offline-first.

To add another topic, create a matching JSON deck and add its filename to `data/decks.json`. Built-in topics must also be registered in `src/deck-schema.js`. The service worker reads the same catalog when pre-caching topics for offline use.

## AI card-generation policy

The AI Deck Import dialog offers a **maximum of 25, 50, 75, or 100 cards**, never 200; it accepts fewer when that avoids filler. Its prompt requires topic-specific prerequisites, 3–8 progressive guided paths, atomic learning objectives, a useful question/cue on the front and a **distinct, explanatory answer on the back**, realistic examples and distractors, and a self-audit before emitting JSON.

The import validator rejects over 100 generated cards, exact/leading front-answer echoes, duplicate titles/prompts/answers, selected generic filler, duplicate multiple-choice options, and paths in the wrong teaching order. These deterministic checks complement, rather than replace, expert review of correctness, scope, and pedagogy.

**Legacy compatibility:** The longer existing authored Frontend, Backend, and Docker curricula remain under a separate compatibility ceiling pending a distinct content migration. All Vibe Coding modules now comply with the 100-card limit, as do all newly generated/imported topics.
