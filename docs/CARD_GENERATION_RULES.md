# Card generation rules (v3: parent/subtopic hierarchy)

These are normative requirements for **every newly AI-generated/imported Facts topic**. The runtime source of truth for the user-visible generator is `src/card-generation-rules.js`, and import validation is in `src/deck-schema.js`. This document explains the editorial rules; changing it alone does not change the app.

## 1. Size and topic boundaries

- A **main topic/deck has NO aggregate card-count limit**. Example: Vibe Coding is ONE catalog entry with 500 cards.
- Every **subtopic/guided path has at most 100 cards** (`path.cardIds.length <= 100`). The import interface provides selectable maxima of 25, 50, 75 or 100 **per subtopic**, not per parent. These are ceilings, not quotas.
- Divide larger subjects into coherent paths *within the same parent topic* rather than generating multiple unrelated top-level catalog entries simply because the total exceeds 100. Generate fewer cards when appropriate; never pad a path to reach the maximum.
- When a card appears in more than one guided path, count its membership toward the ceiling of **each** such path. Keep card IDs unique within the parent and preserve path relationships.
- Payload-size and browser-storage safeguards are implementation constraints, not an instructional cap on total main-topic cards.

## 2. Pedagogical sequence before drafting

1. Analyze the **actual main topic and audience**. Normally define 3–8 coherent subtopics/paths for one generation batch, or more if needed for a substantial course. State the learning objective and prerequisites of every subtopic.
2. Build an ordered prerequisite map. Sequence foundational terms and intuition before depending on them in formulas, reasoning, cases or design decisions.
3. Work toward intermediate relationships, assumptions, methods, illustrative examples, mistakes, boundary conditions and realistic synthesis. Adapt the progression to the discipline rather than applying a one-size-fits-all outline.
4. Each card must introduce or test **one identifiable new knowledge item** and naturally connect to prior instruction. Do not skip essential prerequisites, repeat a learning outcome in new words, or expand an old sentence using a generic template.
5. Use the global `sequence` as the teaching order. Every `path.cardIds` list must be in ascending sequence, and `pathIds` and `path.cardIds` must agree bidirectionally. A card may belong to several paths if that improves reuse without duplication.

**Illustrative statistics sequence:** data and variation → population, sample and variables → descriptive distributions → probability and random variables → sampling and sampling distributions → estimation → hypothesis testing → effect sizes and uncertainty → practical interpretation. Change the sequence appropriately for a different subject.

## 3. Front/back writing contract

| Field | Instruction |
| --- | --- |
| `title` | Concise, specific knowledge or skill, not generic “application”/“more facts.” |
| `prompt` (front) | A precise retrieval cue, question, calculation, debugging task, decision or situation. Give enough context without providing the answer. |
| `content` (back) | A *different*, direct response to the prompt: accurate explanation, the reason it works, and an example, counterexample or condition where genuinely helpful. |
| `question` | 2–12 distinct, credible topic-specific choices, one correct answer, zero-based index and explanatory feedback. No recycled absurd distractors. |
| `code` | Correct and contextually meaningful `language`/`snippet`, with a prompt asking the learner to predict or understand the behavior. |
| `steps` and `checklist` | Authored domain-specific actions or criteria. Do not force a procedure when the topic is better taught as a concept or question. |

Keep cards legible on mobile. Reject answers that repeat all or the beginning of the front, generic statements such as “correct application of X requires preserving semantics under real data,” obvious repeated examples, recycled checklist items, or a “definition / application / review” sequence that simply says the same thing several times. Prefer distinct conceptual, discriminative, worked, diagnostic and transfer questions when pedagogically relevant.

### Example of the intended distinction

**Title:** Sampling distribution of the mean

**Front:** A researcher draws 100 independent random samples of the same size and calculates each sample mean. What distribution do the 100 calculated means approximate?

**Back:** The sampling distribution of the sample mean. It describes how a *statistic* varies between repeated samples, unlike the distribution of individual observations. Its standard deviation is the standard error; for independent identically distributed observations with finite variance, it is population standard deviation divided by the square root of sample size.

This is preferable to repeating “the sampling distribution describes sampling variability” verbatim on both faces.

## 4. Technical and editorial checks

- Validate factual accuracy, units, assumptions and edge cases for quantitative content. Prefer a short correctly worked example over unsupported generality.
- Avoid invented APIs, steps, citations and definitions. Explain where claims depend on context or model assumptions.
- Audit the full deck for meaningful breadth within its chosen topic, distinct learning outcomes, conceptual dependencies, duplication and weak transitions.
- Check every subtopic contains 1–100 cards; do **not** apply a total card-count ceiling to the main topic. Verify valid schema, unique kebab-case IDs, globally consecutive sequences starting at 1, meaningful tags, required type-specific fields, sorted path membership, valid answer indexes and bidirectional path relations.
- The importer additionally rejects duplicate front/answer text, known generic padding, repeated titles/prompts/answers and duplicate choices. **Automated checks cannot establish truth or full semantic relevance:** a human subject-matter pass is still required for release-quality authored content.

## 5. Existing authored-topic templates

- Do not manufacture a second “application” lesson using one generic sentence that is reused for every concept.
- Where compact source lessons supply a principle and practice, render these as genuinely **different** definition/meaning and application answers, rather than repeating the first face on the revealed face.
- Build multiple-choice distractors from related, distinct concepts in that learning path, not three universally wrong stock responses.
- The old automatic four-cards-per-glossary-term reference library was retired; adding volume without a new learning objective is not compliant.

## 6. Non-destructive migration note

Frontend (400), Backend (400), Docker (116) and Vibe Coding (500) are valid **single main topics**, provided no individual guided subtopic exceeds 100 cards. Vibe Coding has 25 subtopics (20 cards each) whose authored content is stored in internal JSON shards and assembled into ONE user-visible topic. The temporary five-top-level-topic representation introduced by PR #13 was consolidated in PR #14 without discarding stable card IDs or archived learner progress.
