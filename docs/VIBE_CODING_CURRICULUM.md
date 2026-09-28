# Vibe Coding curriculum v2: editorial and migration map

## Overview

The former 500-card single Vibe Coding deck was explicitly rewritten into **five separately selectable topics**, **100 cards per topic**, and **25 progressive guided paths**. The authored text no longer passes through the shared assembler's fixed 20-type sequence or generic procedures. Instead, the five normal JSON decks store independently reviewed, topic-specific front questions and distinct explanatory content, with one contextual scenario question, one matched code/document example, one substantive procedure, and one genuine checklist in each path.

All **500 original `vc-001` through `vc-500` card IDs** remain stable to migrate existing progress; `sequence` restarts at 1 in each of the five new topics. One of the 50 original samples is selected per path and paired with a genuinely corresponding lesson, rather than arbitrarily attached to the sixth or fourteenth card. Inconsistent or contextually unrelated samples are not carried forward. The original data remains retrievable through Git history rather than as obsolete live lesson fragments.

## Recommended learning order

| Topic ID / title | Guided paths, in reading order | Legacy card ranges used |
| --- | --- | --- |
| `vibe-coding` — 01 Foundations, Product & Context | mindset foundations → product framing → specifications and acceptance → prompting → context engineering | 001–100 |
| `vibe-coding-agentic` — 02 Architecture, Git & Agentic Workflows | planning/decomposition → architecture → Git and PRs → scoped agents and MCP → AI failure/recovery | 101–140, 261–280, 421–460 |
| `vibe-coding-application` — 03 Secure Application Engineering | frontend and UX → backend/API → databases/data → security/privacy → testing | 141–240 |
| `vibe-coding-quality` — 04 Debugging, Review & Product Quality | debugging → code review → dependencies → performance → accessibility/i18n | 241–260, 281–360 |
| `vibe-coding-production` — 05 Environments, Delivery & Production | development environments → CI/CD/deployment → observability/operations → legacy refactoring → production readiness | 361–420, 461–500 |

The new sequence deliberately covers defining the problem and accepted behavior before proposing system changes; planning and agent control precede the application build; verification and diagnostic disciplines precede production release.

## Editorial corrections

- Every card now has a distinct, authored, discipline-specific retrieval prompt rather than placing the source principle directly on the front or asking the same generic question repeatedly.
- The revealed content connects the actual principle to the actual practice. No steps/checklist card repeats the exact original front as an explanatory note.
- Every multiple-choice scenario has four authored choices, explicit rationale, and a deliberately varying correct index. Distractors are tied to the specific failure or decision, not generic “accept it if it looks plausible” boilerplate.
- Procedures and checklists contain actionable domain steps and acceptance signals; they are not the reused original “inspect/change/test/review” sequence.
- Code snippets are shown only next to the corresponding lesson: e.g., reduced-motion CSS with reduced-motion behavior, an idempotent payments route with idempotency, an authorization test with authorization, and `git bisect` with regression isolation.
- The agentic section explicitly covers untrusted MCP results, prompt injection and poisoned tool metadata, least-privilege, sandbox/dry-run, human review, multi-agent integration, context/cost budgets, exfiltration protection, and evidence-based evaluation.
- Selected code samples are explanatory excerpts, not promises of a complete runnable production system. The illustrative local Compose example includes the database password required to start a developer instance and clearly separates this from real secret management.

## Existing learner-progress compatibility

The browser previously stored `progress["vibe-coding"][cardId] = "review" | "mastered"`. On the first successful load of **all five** new topics, `src/vibe-progress.js` copies valid statuses to each new owning topic using the **unchanged card IDs**. The original progress record is never removed. Existing destination-specific status wins over copied source status. An old selected guided path also maps to its new topic. A persisted migration version makes this one-time and prevents deleted statuses from being repopulated on subsequent launches.

The first topic retains the original `vibe-coding` ID, so progress on cards 001–100 continues to resolve directly. A partial offline fetch does not mark migration complete. Card-design preferences remain per-topic; the existing original topic's settings are preserved.

## Files, checks, and future revisions

- `data/vibe-coding.json` and `data/vibe-coding-{agentic,application,quality,production}.json`: the five explicit editorial sources.
- `data/decks.json`, `src/deck-schema.js`: updated catalog/registry, with only Frontend, Backend and Docker exempted for pre-existing size.
- `src/vibe-progress.js`: progress/selected-path migration.
- `test/vibe-coding-deck.test.js`, `test/vibe-progress.test.js`, `scripts/validate-data.mjs`: completeness, stable IDs, non-repetition, question coverage, code-lesson alignment, schema, and migration gates.
- `sw.js`: new cache version; all five static deck files follow the usual catalog-based offline pre-cache.

New edits must keep every topic under 100 cards, preserve old card IDs for unchanged learning objectives, and review the pedagogical dependency order before reordering paths. If an objective changes meaningfully, assign a new ID rather than silently transferring a user's mastery of an unrelated concept.
