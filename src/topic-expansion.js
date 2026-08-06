const TOPICS = Object.freeze({
  "frontend-programming": { prefix: "fe", terms: [
    ["HTML", "The markup language that structures and describes the meaning of web content."],
    ["Semantic HTML", "HTML elements chosen for their meaning rather than only their visual appearance."],
    ["DOM", "The browser object representation of a document that JavaScript can inspect and modify."],
    ["CSS cascade", "The rules the browser uses to resolve competing style declarations."],
    ["Specificity", "A selector-weight system used by the cascade when declarations compete."],
    ["Box model", "The content, padding, border, and margin areas used to calculate rendered size."],
    ["Flexbox", "A one-dimensional CSS layout model for arranging items along a row or column."],
    ["CSS Grid", "A two-dimensional CSS layout model for rows and columns."],
    ["Responsive design", "Design that adapts layout and interaction to available space and input methods."],
    ["Accessibility", "The practice of making interfaces perceivable, operable, understandable, and robust."]
  ]},
  "backend-programming": { prefix: "be", terms: [
    ["Server", "A process that listens for requests and returns responses or performs background work."],
    ["Request-response cycle", "The sequence from a client request through server processing to a response."],
    ["HTTP method", "A verb that expresses the intended operation for an HTTP request."],
    ["Route", "A method-and-path pattern mapped to a request handler."],
    ["Middleware", "Reusable code that processes requests or responses around route handlers."],
    ["REST", "An architectural style centered on resources, representations, and stateless requests."],
    ["Idempotency", "The property that repeating an operation has the same intended effect as doing it once."],
    ["Input validation", "Checking external data against required types, formats, bounds, and business rules."],
    ["Serialization", "Converting in-memory values into a transferable or storable representation."],
    ["Transaction", "A group of database changes committed or rolled back as one unit."]
  ]},
  "data-science": { prefix: "ds", terms: [
    ["Question framing", "Translating a broad concern into a specific analytical question tied to a decision."],
    ["Population", "The complete group about which an analysis intends to draw conclusions."],
    ["Sample", "The observed subset of a population used for analysis."],
    ["Observation", "The unit represented by one record or row in a dataset."],
    ["Variable", "A measured or derived characteristic that varies across observations."],
    ["Categorical variable", "A variable whose values represent labels or groups rather than magnitude."],
    ["Numerical variable", "A variable whose values represent counts or measurable quantities."],
    ["Missing data", "Values absent because they were not collected, recorded, applicable, or retained."],
    ["Outlier", "An observation unusually distant from most other values under a relevant definition."],
    ["Tidy data", "A structure where each variable is a column and each observation is a row."]
  ]},
  statistics: { prefix: "st", terms: [
    ["Population", "The full set of units or outcomes targeted by a statistical question."],
    ["Sample", "A subset of a population observed to learn about the whole."],
    ["Parameter", "A fixed but usually unknown numerical characteristic of a population."],
    ["Statistic", "A numerical summary calculated from sample data."],
    ["Mean", "The arithmetic average obtained by summing values and dividing by their count."],
    ["Median", "The middle ordered value that divides observations into two equal halves."],
    ["Mode", "The value or category occurring most frequently."],
    ["Variance", "The average squared deviation from the mean under a stated formula."],
    ["Standard deviation", "The square root of variance expressed in the original measurement units."],
    ["Quantile", "A cut point below which a stated proportion of ordered observations falls."]
  ]},
  "python-programming": { prefix: "py", terms: [
    ["Interpreter", "A program that executes Python code and manages runtime objects and errors."],
    ["Variable", "A name bound to an object in a namespace."],
    ["Data type", "A classification that determines an object's values and supported operations."],
    ["String", "An immutable sequence of Unicode characters."],
    ["List", "An ordered mutable collection that can contain repeated values."],
    ["Tuple", "An ordered immutable collection often used for fixed records."],
    ["Set", "An unordered collection of unique hashable elements."],
    ["Dictionary", "A mutable mapping from unique hashable keys to values."],
    ["Conditional", "Control flow that selects statements based on boolean conditions."],
    ["Loop", "Control flow that repeats work over items or while a condition remains true."]
  ]},
  "databases-sql": { prefix: "sql", terms: [
    ["Table", "A named relation organized as rows and columns under a schema."],
    ["Row", "One record or tuple in a relational table."],
    ["Column", "A named attribute with a defined data type and constraints."],
    ["Schema", "The definitions of database structures, relationships, constraints, and types."],
    ["Primary key", "A column or set of columns that uniquely identifies each row."],
    ["Foreign key", "A constraint linking values in one table to a key in another."],
    ["Constraint", "A database rule that rejects invalid stored states."],
    ["Index", "An auxiliary structure that speeds selected lookups at storage and write cost."],
    ["Normalization", "Organizing related facts to reduce contradictory duplication."],
    ["Transaction", "A unit of work whose changes commit or roll back together."]
  ]},
  "machine-learning": { prefix: "ml", terms: [
    ["Feature", "An input variable supplied to a model for training or prediction."],
    ["Label", "The target value a supervised model learns to predict."],
    ["Supervised learning", "Learning a mapping from examples with known input-output pairs."],
    ["Unsupervised learning", "Finding structure in data without predefined target labels."],
    ["Classification", "Predicting one of a finite set of categories or class probabilities."],
    ["Regression", "Predicting a continuous numerical quantity."],
    ["Clustering", "Grouping observations by similarity under a chosen representation and metric."],
    ["Training", "Estimating model parameters from examples by optimizing an objective."],
    ["Inference", "Applying a trained model to new feature values to produce predictions."],
    ["Loss function", "A numerical objective that measures model error for optimization."]
  ]},
  cybersecurity: { prefix: "sec", terms: [
    ["Confidentiality", "Protecting information from unauthorized disclosure."],
    ["Integrity", "Protecting data and systems from unauthorized or undetected alteration."],
    ["Availability", "Keeping systems and information accessible to authorized users when needed."],
    ["Asset", "Something valuable that requires protection, such as data, credentials, or services."],
    ["Threat", "A circumstance or actor capable of causing harm to an asset."],
    ["Vulnerability", "A weakness that can be exploited to violate a security objective."],
    ["Risk", "The combination of likelihood and impact for a harmful event."],
    ["Attack surface", "All reachable points where an attacker may try to influence a system."],
    ["Defense in depth", "Layering independent controls so one failure does not become total compromise."],
    ["Least privilege", "Granting only the minimum access needed for a defined task and duration."]
  ]},
  "cloud-devops": { prefix: "cd", terms: [
    ["Compute", "Resources that execute application instructions, including machines and managed runtimes."],
    ["Virtual machine", "An isolated software-defined computer with its own operating system environment."],
    ["Container", "A packaged process and dependencies isolated using operating-system features."],
    ["Serverless function", "Managed event-driven compute that runs code without directly managing servers."],
    ["Region", "A geographic cloud location containing multiple isolated facilities or zones."],
    ["Availability zone", "An isolated location within a region designed to limit correlated failure."],
    ["Virtual private cloud", "A logically isolated network boundary for cloud resources."],
    ["Subnet", "A range of network addresses used to organize and route resources."],
    ["Load balancer", "A service that distributes traffic across healthy backend targets."],
    ["Object storage", "Durable key-addressed storage for files and binary objects."]
  ]},
  "git-github": { prefix: "git", terms: [
    ["Repository", "A Git-managed project history containing commits, references, and working files."],
    ["Commit", "An immutable snapshot with metadata and parent relationships in Git history."],
    ["Branch", "A movable reference to a commit used to develop a line of work."],
    ["Merge", "Combining histories and recording how lines of development meet."],
    ["Rebase", "Replaying commits onto a new base to create a linearized history."],
    ["Remote", "A named reference to another repository location."],
    ["Clone", "Creating a local repository copy with history and remote configuration."],
    ["Pull", "Fetching remote changes and integrating them into the current branch."],
    ["Push", "Sending local commits and reference updates to a remote repository."],
    ["Staging area", "The index that defines the exact content of the next commit."]
  ]}
});

const PATH_ID = "reference-library";
const CARDS_PER_TERM = 10;

export function expandDeck(deck) {
  const topic = TOPICS[deck?.id];
  if (!topic || deck.paths?.some((path) => path.id === PATH_ID)) return deck;
  const start = Math.max(0, ...deck.cards.map((card) => Number(card.sequence) || 0)) + 1;
  const cards = buildCards(deck, topic, start);
  return {
    ...deck,
    estimatedMinutes: Number(deck.estimatedMinutes || 0) + 180,
    paths: [...deck.paths, {
      id: PATH_ID,
      title: "100-Card Reference Library",
      description: "Definitions, examples, misconceptions, procedures, and knowledge checks for ten essential concepts.",
      cardIds: cards.map((card) => card.id),
    }],
    cards: [...deck.cards, ...cards],
  };
}

export function getExpansionCount(deckId) {
  return TOPICS[deckId]?.terms.length * CARDS_PER_TERM || 0;
}

function buildCards(deck, topic, start) {
  const cards = [];
  const definitions = topic.terms.map(([, definition]) => definition);
  topic.terms.forEach(([term, definition], index) => {
    const base = index * CARDS_PER_TERM;
    const common = {
      difficulty: index < 5 ? "beginner" : "intermediate",
      pathIds: [PATH_ID],
      tags: [slug(term), deck.id, "reference"],
    };
    const id = (offset) => `${topic.prefix}-x${String(base + offset).padStart(3, "0")}`;
    const sequence = (offset) => start + base + offset - 1;
    const nextDefinition = definitions[(index + 1) % definitions.length];
    const thirdDefinition = definitions[(index + 2) % definitions.length];

    cards.push({ id: id(1), sequence: sequence(1), type: "concept", title: `${term}: definition`, prompt: definition, content: `${term} is a foundational idea in ${deck.title}. Learn the defining condition first, then identify where it appears in real work.`, ...common });
    cards.push({ id: id(2), sequence: sequence(2), type: "fact", title: `Why ${term} matters`, prompt: `${term} gives learners a precise way to describe an important mechanism or decision.`, content: `Use this reference definition: ${definition}`, ...common });
    cards.push({ id: id(3), sequence: sequence(3), type: "concept", title: `Recognizing ${term}`, prompt: "Look for the defining condition rather than relying only on the label.", content: `A valid example must satisfy this definition: ${definition}`, ...common });
    cards.push({ id: id(4), sequence: sequence(4), type: "fact", title: `A common mistake about ${term}`, prompt: "A technical term becomes misleading when it is used without checking its defining condition.", content: `Do not treat every nearby idea as ${term}. Verify: ${definition}`, ...common });
    cards.push({ id: id(5), sequence: sequence(5), type: "question", title: `Define ${term}`, prompt: `Which statement best defines ${term}?`, content: "", question: { options: [definition, nextDefinition, thirdDefinition], answerIndex: 0, explanation: `${term} means: ${definition}` }, ...common });
    cards.push({ id: id(6), sequence: sequence(6), type: "question", title: `Recognize ${term} in practice`, prompt: `What is the strongest evidence that ${term} applies?`, content: "", question: { options: ["The defining condition is directly observed.", "The label sounds familiar.", "The context is ignored."], answerIndex: 0, explanation: `Accurate recognition begins by testing the situation against this definition: ${definition}` }, ...common });
    cards.push({ id: id(7), sequence: sequence(7), type: "steps", title: `Apply ${term} step by step`, prompt: `Use a repeatable process before claiming that ${term} applies.`, content: `Reference definition: ${definition}`, steps: ["State the decision or observation being examined.", `Restate the definition of ${term}.`, "Identify evidence for each defining condition.", "Test the interpretation against a non-example.", "Document the conclusion and uncertainty."], ...common });
    cards.push({ id: id(8), sequence: sequence(8), type: "checklist", title: `Review ${term}`, prompt: "Use this checklist for retrieval practice and application.", content: `Reference definition: ${definition}`, items: [`I can define ${term} without notes.`, "I can identify one correct example.", "I can explain one common misuse.", "I can compare it with a related concept.", `I can state why it matters in ${deck.title}.`], ...common });
    cards.push({ id: id(9), sequence: sequence(9), type: "concept", title: `Compare ${term} with related ideas`, prompt: "Related terms may overlap, but their definitions are not interchangeable.", content: `Start with ${term}: ${definition} Then compare purpose, inputs, outputs, and boundaries with another concept.`, ...common });
    cards.push({ id: id(10), sequence: sequence(10), type: "question", title: `Use ${term} accurately`, prompt: `What is the best first step before applying the label ${term}?`, content: "", question: { options: ["Check whether the defining condition is present.", "Use the label because it sounds familiar.", "Ignore the context and evidence."], answerIndex: 0, explanation: `Accurate use starts by testing the situation against: ${definition}` }, ...common });
  });
  return cards;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
