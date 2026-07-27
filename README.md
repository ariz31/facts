# Facts

Facts is a lightweight card-based learning app. A topic is organized as a deliberate sequence of complementary cards so a learner can move from fundamentals to a practical outcome without reading one long lesson.

## Included learning decks

- **Frontend Programming** — web foundations, a guided “Build Your First Web App” path, and modern frontend essentials.
- **Backend Programming** — server foundations, a guided “Build Your First API” path, and production backend essentials.

The starter data contains **48 cards** across six guided learning paths.

## Learning modes

- **Sequential** — follows the author-defined `sequence` so each card builds on the previous card.
- **Random** — shuffles the visible set without repeating a card until the set has been exhausted.
- **Focus display** — presents one large interactive card at a time.
- **Overview display** — presents the filtered deck as a browsable card grid.
- **Card-type filtering** — concepts, facts, questions, code, steps, and checklists.
- **Learning-path filtering** — study the complete topic or one guided outcome.
- **Progress tracking** — mark cards as mastered or needing review; progress is saved in local storage.

## Run locally

No build step or third-party package is required for the application.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Validate the repository

Node.js 20 or newer is recommended.

```bash
npm run check
```

The checks validate every JSON deck and run unit tests for filtering, sequencing, randomization, navigation, and progress calculations.

## Data model

Decks live in `data/*.json` and contain:

- deck metadata;
- guided paths and their ordered card ids;
- cards with a unique id and numeric sequence;
- a supported card type;
- prompt, answer content, tags, difficulty, and path membership;
- type-specific fields for questions, code samples, steps, or checklists.

To add a topic, create another JSON deck using the same schema and add its filename to `DATASETS` in `src/app.js`.
