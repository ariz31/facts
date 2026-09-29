# Facts

Facts is an offline-first, card-based learning application. Topics are arranged as connected sequences so every card complements the next and moves the learner from foundations toward practical outcomes.

## Included topics

The catalog contains **12 main topics**, **1,512 authored cards**, and **101 guided subtopics/paths**, including a **single comprehensive Vibe Coding main topic** with 25 subtopics and 500 curated cards. Every main topic has **no aggregate card-count ceiling**; the hard maximum is **100 cards in each subtopic**, not the parent. The former 1,000 repetitive reference-library cards were retired. See the [card generation rules](docs/CARD_GENERATION_RULES.md).

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
12. Vibe Coding: AI-Assisted Software Engineering

The Frontend Programming curriculum contains **400 curated cards across 20 deep paths** covering the web platform, semantic HTML, forms, CSS, layout, responsive design, visual systems, JavaScript, DOM and browser APIs, asynchronous data, state and component architecture, TypeScript and tooling, accessibility, routing and complete UX states, frontend security, performance, media and offline capabilities, testing and debugging, framework/rendering architecture, and production delivery. It remains an existing authored masterclass of **400 cards across 20 paths**; no synthetic reference-library cards are appended.

The Backend Programming curriculum contains **400 curated cards across 20 deep paths** covering server/runtime behavior, HTTP semantics, API design, Node.js concurrency, routing and middleware, validation and error contracts, relational data, transactions and migrations, caching and storage, authentication, authorization and multi-tenancy, API security and abuse resistance, configuration/secrets/TLS, durable jobs and queues, streams and file processing, realtime systems and integrations, testing and contracts, observability and reliability, deployment architecture, and backup/recovery/incident operations. It remains an existing authored masterclass of **400 cards across 20 paths**; no synthetic reference-library cards are appended.

The Docker curriculum contains 116 authored cards across 12 focused paths covering foundations, images and Dockerfiles, runtime behavior, storage, networking, Docker Compose, development workflows, security and supply chain, production operations, troubleshooting, and hands-on Node.js/API + PostgreSQL projects.

Vibe Coding appears **once** in the main topic catalog. It contains **25 guided subtopics with 20 cards each**, for a total of 500 (the parent total is not capped). Five files under `data/vibe-coding/` are **internal storage shards, not user-visible topics or independent 100-card quotas**. [See the curriculum and migration map](docs/VIBE_CODING_CURRICULUM.md). Every stable `vc-001`–`vc-500` ID is retained with meaningful retrieval questions, distinct answers and aligned examples. A second non-destructive migration combines any mastery saved under the temporary split-topics layout of PR #13 back into the one main topic.

## Stable navigation and deep links

Every main topic, guided subtopic and individual card has a shareable, reloadable URL,
with native browser Back/Forward support. Facts uses hash routing so links also work
in offline PWA installations without extra server rewrites. Examples:

- `#/topic/vibe-coding` — one comprehensive main topic.
- `#/topic/vibe-coding/subtopic/prompting` — a selected learning path.
- `#/topic/vibe-coding/subtopic/prompting/card/vc-062` — an exact card.

Old Vibe Coding links from the temporary five-topic structure redirect to the
canonical main topic. Future topic/subtopic/card renames must add a tested
compatibility alias to `src/routes.js` rather than silently breaking saved links.
See [routing and redirect conventions](docs/ROUTING.md).

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
- pre-caching of all 12 main learning topics and all required internal shards;
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

The check command validates JavaScript syntax, catalog parity, sharded lesson-deck assembly, the single 500-card Vibe Coding parent and independent subtopic maxima, every card and path relationship, retirement of repetitive topic expansion, the 100-card AI import limit, content-quality checks, and the learning and design unit tests.

## Data model

`data/decks.json` is the single catalog of topic files. Most `data/*.json` topics contain:

- deck metadata;
- guided paths and ordered card ids;
- cards with unique ids and sequence numbers;
- card type, title, prompt, tags, difficulty, and path membership;
- type-specific question, code, steps, or checklist fields.

Large authored curricula may use `lesson-fragments-v1` (legacy authored lessons) or `subtopic-fragments-v1` (one parent with multiple explicitly curated internal JSON shards). A compact topic manifest lists reviewable lesson-fragment files; `src/lesson-deck.js` deterministically assembles those fragments into the same strict deck schema before validation and learning. A fragment may provide 20 explicit lessons, or a technical curriculum may provide 10 compact topics that expand into paired concept/application lessons. The service worker pre-caches both the manifest and its fragments so the assembled topic remains offline-first.

To add another topic, create a matching JSON deck and add its filename to `data/decks.json`. Built-in topics must also be registered in `src/deck-schema.js`. The service worker reads the same catalog when pre-caching topics for offline use.

## AI card-generation policy

The AI Deck Import dialog offers a **maximum of 25, 50, 75, or 100 cards PER SUBTOPIC**, never a maximum for an entire main topic; it accepts fewer in any subtopic when that avoids filler. Its prompt requires topic-specific prerequisites, 3–8 progressive guided paths, atomic learning objectives, a useful question/cue on the front and a **distinct, explanatory answer on the back**, realistic examples and distractors, and a self-audit before emitting JSON.

The import validator rejects subtopics containing over 100 generated cards (the main topic has no aggregate count limit), exact/leading front-answer echoes, duplicate titles/prompts/answers, selected generic filler, duplicate multiple-choice options, and paths in the wrong teaching order. These deterministic checks complement, rather than replace, expert review of correctness, scope, and pedagogy.

**Hierarchy:** One catalog entry is one main topic. Guided paths are its subtopics. Each subtopic has 1–100 cards, even when the parent holds hundreds or thousands; storage/payload safeguards are separate from curriculum-count rules.
