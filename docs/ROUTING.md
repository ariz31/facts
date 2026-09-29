# Stable routing: main topics, subtopics, and individual cards

Facts is a static, offline-first PWA. URL state is represented by a **hash route**
so bookmarks and direct links work without a server-side rewrite and keep working
when served from a subdirectory or the installed PWA shell.

## Canonical URLs

| View | Hash path |
| --- | --- |
| Main topic catalog | `#/topics` |
| Main topic, showing its subtopics | `#/topic/vibe-coding` |
| Selected guided subtopic (pre-study controls) | `#/topic/vibe-coding/subtopic/prompting` |
| Whole parent topic (all cards) pre-study | `#/topic/vibe-coding/subtopic/all` |
| Exact learning card | `#/topic/vibe-coding/subtopic/prompting/card/vc-062` |
| Exact card in randomized study order | `#/topic/vibe-coding/subtopic/prompting/card/vc-062?mode=random` |

The URL names a **main deck**, then a **guided path/subtopic**, then an optional
**stable card ID**. There is no assumption that a main topic has only 100 cards.
A shared card URL retains its card identity on refresh; a new random-mode session
may generate a different card *ordering*, not a different selected card.

## Client behavior and data integrity

- `src/routes.js` contains pure parser, validator, route resolver, serializer
  and explicit redirects. Route IDs are restricted to lowercase kebab-case;
  malformed/oversized hashes are rejected without injecting URL text into HTML.
- `src/app.js` sends **every user navigation transition** through the router:
  choose topic, choose subtopic, Back/Forward, enter/exit study and next/previous
  card. Changes to reveal/mastery, themes or visual styling are deliberately
  **local UI/storage state**, not separate page routes.
- Hash state wins over prior localStorage navigation when loading a direct link;
  mastery and appearance remain in localStorage and are not reset by navigation.
- Unknown top-level routes lead to the catalog; missing/renamed subtopics lead to
  the parent subtopic list; missing cards lead to the selected subtopic's ready
  screen. A card outside the requested subtopic is **never** shown as a guessed
  replacement. Canonical aliases use `history.replaceState`, not an extra
  Back-button entry.
- Browser Back and Forward restore the indicated screen and selected card.
  `popstate` and `hashchange` may both occur for one action; duplicate events
  are ignored before invalidating an in-flight render. Last navigation wins
  when asynchronous background loads overlap.
- If a topic is listed but its JSON failed to load temporarily (e.g., offline
  partial cache), its original deep link is preserved and the app requests
  reconnect/reload instead of rewriting the URL to a different topic.
- The service worker precaches `src/routes.js`; hash fragments are client-only
  and require no special Vercel rewrite.
- Imported decks from the established import catalog use the same route rules.

## Redirect maintenance for future curriculum changes

When renaming/removing an existing ID, update the explicit alias maps in
`src/routes.js` in the **same PR** as the data change. Preserve old card IDs
when the learning objective is equivalent; for a deliberately changed objective,
assign a new ID and provide a route alias only if it is pedagogically correct.
Keep former main topic aliases in `LEGACY_TOPIC_ROUTES` and path/card renames
in `SUBTOPIC_ROUTE_ALIASES`/`CARD_ROUTE_ALIASES`, keyed by the current parent.
Add tests proving both the old URL and the new canonical URL resolve correctly.

The historical Vibe split from PR #13 is explicitly redirected:
`vibe-coding-agentic`, `vibe-coding-application`, `vibe-coding-quality`
and `vibe-coding-production` all resolve to the canonical `vibe-coding`
parent, with the original section selected for bare legacy links.
The independent `src/vibe-progress.js` v2 process preserves mastery saved
under the temporary split deck keys; URL redirects do not mutate card progress.

## Validation

`npm run check` includes `test/routes.test.js`, which resolves direct links
for all 25 current Vibe Coding subtopics and 500 cards, checks old aliases,
invalid IDs, subtopic/card membership and random-mode routes. During manual
preview review, test address-bar refresh, pasted links, Back/Forward from
an individual card, missing/offline content, random study, and mobile PWA
navigation. Pure tests do not substitute for real-browser interaction testing.
