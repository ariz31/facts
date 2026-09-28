# Vibe Coding — one main topic, 25 guided subtopics

## Correct hierarchy

**Main catalog entry:** `vibe-coding` — Vibe Coding: AI-Assisted Software Engineering.

The parent has **no total card-count limit**. The maximum of **100 cards applies independently to EACH guided subtopic/path**, not to the main topic and not to an internal storage shard. Its currently curated content is 500 cards across 25 subtopics, 20 cards each.

The previous PR #13 accidentally created five separate top-level Vibe Coding entries. PR #14 corrects that structural interpretation **without deleting or downgrading the 500 improved cards**. The single source manifest is `data/vibe-coding.json` (`subtopic-fragments-v1`), and its five internal JSON shards are stored in `data/vibe-coding/`. Only the parent manifest appears in `data/decks.json` and `BUILT_IN_DECK_IDS`; the shards are not extra topics or five separate size quotas.

## Progressive study order

| Internal shard (not a top-level topic) | Guided subtopics in recommended order | Original stable card IDs |
| --- | --- | --- |
| 01 Foundations & Context | Foundations → Product Framing → Specifications & Acceptance → Prompting → Context Engineering | vc-001–vc-100 |
| 02 Architecture & Agentic Workflows | Planning → Architecture → Git & PRs → Agents/MCP → AI Failure Recovery | vc-101–vc-140; vc-261–vc-280; vc-421–vc-460 |
| 03 Application Engineering | Frontend/UX → Backend/API → Databases → Security/Privacy → Testing | vc-141–vc-240 |
| 04 Engineering Quality | Debugging → Code Review → Dependencies → Performance → Accessibility/i18n | vc-241–vc-260; vc-281–vc-360 |
| 05 Production Engineering | Environments → CI/CD → Observability → Legacy Refactoring → Production Readiness | vc-361–vc-420; vc-461–vc-500 |

Cards are assigned global `sequence: 1..500` in the displayed parent topic; their original `vc-NNN` identifiers stay stable. Every subtopic has its own ordered `cardIds` and each card lists its owning `pathIds`. A later subtopic may contain 100 cards without changing or creating another top-level topic.

## Content quality preserved

PR #13 revised all 500 fronts to teach or test specific knowledge, retained the relevant original principles and practices, aligned 25 code/document examples with their assigned learning objectives, and replaced repetitive steps/checklists and systematically positioned MCQ answers. Its audit also strengthened HTTP semantics, migration safety, agent evaluation, prompt injection/MCP trust, least privilege, debugging, concurrency, and evidence-based completion. PR #14 **consolidates the existing curated card content**, rather than regenerating it or forcing a global 100-card reduction.

Each lesson fragment is explicitly authored JSON, not the old fixed-position generic lesson generator. Automated content checks are supplemented by subject-matter review; no code-based score alone can guarantee every statement is pedagogically or factually perfect.

## Learner-progress migration (v2)

Earlier versions may have retained all statuses under `progress["vibe-coding"]`; PR #13 temporarily recorded cards 101–500 under four extra entries (`vibe-coding-{agentic,application,quality,production}`). The corrected app recombines these statuses into the original `vibe-coding` key on first valid load. For cards 101–500, statuses stored in those temporary split entries are newer and override stale historical parent copies. All original status objects are retained for recovery; no card IDs change.

The migration checks that all historical `vc-001..vc-500` IDs exist in the assembled parent before modifying saved progress. This is **a compatibility check, not a parent limit**—future additions beyond 500 remain allowed. An old active split-topic selection is mapped back to `vibe-coding`, preserving its selected guided path when that path exists. A persisted version 2 prevents old archived statuses from being reapplied after a learner clears progress.

## Implementation invariants

- `src/subtopic-deck.js`: combines internal source shards into a **single** deck, rebases local fragment sequences, rejects malformed shards, duplicate IDs or subtopics, and validates the parent.
- `src/deck-schema.js`: enforces `path.cardIds.length <= 100` for **every** built-in/imported path; it imposes **no aggregate parent card ceiling**.
- `src/card-generation-rules.js` and `src/runtime-data.js`: generate/import ONE parent deck with up to the selected count in EACH subtopic; avoid filler.
- `src/lesson-deck-runtime.js` and `sw.js`: retrieve/assemble/precache the one parent manifest and its child shards offline.
- `test/subtopic-deck.test.js`, `test/vibe-coding-deck.test.js`, `test/vibe-progress.test.js`, `scripts/validate-data.mjs`: protect single-topic catalog structure, stable card/path relationships, content integrity, large parent support and safe migration.

No future change should recreate five separate Vibe Coding entries, impose a deck-level 100-card limit, or truncate existing content to satisfy a subtopic maximum.
