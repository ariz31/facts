# Facts

Facts is an offline-first, card-based learning application. Topics are arranged as connected sequences so every card complements the next and moves the learner from foundations toward practical outcomes.

## Included topics

The authored catalog contains **12 topics**, **760 source cards**, and **67 guided learning paths**. Ten established topics also receive 100-card reference libraries at runtime, bringing the complete learning experience to **1,760 rendered cards** and **77 guided paths**:

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

The Docker curriculum contains 116 authored cards across 12 focused paths covering foundations, images and Dockerfiles, runtime behavior, storage, networking, Docker Compose, development workflows, security and supply chain, production operations, troubleshooting, and hands-on Node.js/API + PostgreSQL projects.

The Vibe Coding curriculum uses the deck schema's full **500-card** capacity across **25 focused paths**. It progresses from product framing, specifications, prompting, context engineering, planning, and architecture through frontend, backend, databases, security, testing, debugging, Git, review, dependency hygiene, performance, accessibility, reproducible environments, CI/CD, observability, agent/tool workflows, AI failure recovery, legacy refactoring, and production-readiness governance. Its source is split into reviewable lesson fragments and deterministically assembled into a normal Facts deck at runtime and during repository validation.

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
- pre-caching of all 12 learning decks, including sharded lesson sources;
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

The check command validates JavaScript syntax, exact parity between the built-in topic registry and the 12-topic deck catalog, sharded lesson-deck assembly, every card and path relationship, runtime topic expansion, and the learning and design unit tests.

## Data model

`data/decks.json` is the single catalog of topic files. Most `data/*.json` topics contain:

- deck metadata;
- guided paths and ordered card ids;
- cards with unique ids and sequence numbers;
- card type, title, prompt, tags, difficulty, and path membership;
- type-specific question, code, steps, or checklist fields.

Large authored curricula may use the `lesson-fragments-v1` source format. A compact topic manifest lists reviewable lesson-fragment files; `src/lesson-deck.js` deterministically assembles those fragments into the same strict deck schema before validation and learning. The service worker pre-caches both the manifest and its fragments so the assembled topic remains offline-first.

To add another topic, create a matching JSON deck and add its filename to `data/decks.json`. Built-in topics must also be registered in `src/deck-schema.js`. The service worker reads the same catalog when pre-caching topics for offline use.
