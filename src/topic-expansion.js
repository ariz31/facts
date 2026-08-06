const TOPICS = Object.freeze({
  "frontend-programming": { prefix: "fe", terms: [
    ["HTML", "The markup language that structures and describes web content.", "Use HTML to give headings, controls, regions, and media a meaningful document structure."],
    ["Semantic HTML", "HTML elements selected for their meaning rather than only their appearance.", "Semantic elements improve keyboard behavior, accessibility, search indexing, and maintainability."],
    ["DOM", "The browser object model representing a loaded document as nodes and properties.", "JavaScript reads and updates the DOM to change text, attributes, classes, and elements."],
    ["CSS cascade", "The process that resolves competing CSS declarations for the same property.", "Understand origin, importance, specificity, scope, and source order before overriding a style."],
    ["Specificity", "A selector weight used by the cascade when declarations compete.", "Prefer low, predictable specificity so components can be extended without excessive overrides."],
    ["Box model", "The content, padding, border, and margin areas used to calculate an element's size.", "Inspect the box model when spacing, overflow, or measured dimensions do not match expectations."],
    ["Flexbox", "A one-dimensional CSS layout model for distributing and aligning items.", "Use Flexbox for rows, columns, toolbars, navigation, and alignment along one primary axis."],
    ["CSS Grid", "A two-dimensional CSS layout model based on rows, columns, and named areas.", "Use Grid when horizontal and vertical placement must be coordinated."],
    ["Responsive design", "Design that adapts layout and interaction to available space and input methods.", "Start with a usable narrow layout, then add enhancements at content-driven breakpoints."],
    ["Accessibility", "The practice of making interfaces perceivable, operable, understandable, and robust.", "Use native controls, clear labels, visible focus, sufficient contrast, and meaningful reading order."],
    ["Event", "A browser notification that something occurred, such as a click, key press, or submission.", "Connect behavior to events with listeners while preserving native interaction semantics."],
    ["Event propagation", "The path an event follows through capture, target, and bubble phases.", "Use propagation deliberately for delegation and avoid stopping it without a clear reason."],
    ["UI state", "Information that determines the interface's current visible condition.", "Model selected items, loading, errors, form values, and open panels as explicit state."],
    ["Component", "A reusable interface unit with a focused responsibility and defined inputs.", "Create components around stable behavior and meaning rather than arbitrary visual fragments."],
    ["ES module", "A JavaScript file that explicitly exports and imports bindings.", "Modules create clear dependency boundaries and allow code to load in a controlled graph."],
    ["Fetch API", "The browser interface for making HTTP requests and receiving responses.", "Check response status and represent loading, success, empty, and error states in the UI."],
    ["Promise", "An object representing the eventual completion or failure of an asynchronous operation.", "Compose asynchronous work with then, catch, finally, or await while handling rejection."],
    ["Async function", "A function that returns a promise and permits await expressions.", "Use async functions to express sequential asynchronous logic without blocking the main thread."],
    ["Form validation", "Checking submitted values for required shape, format, bounds, and relationships.", "Combine accessible client feedback with authoritative server-side validation."],
    ["Progressive enhancement", "Building a functional baseline before adding optional advanced behavior.", "Keep essential content and actions usable when scripts, APIs, or newer features fail."],
    ["Performance budget", "A measurable limit for loading, rendering, or interaction cost.", "Use budgets to prevent images, scripts, and third-party code from silently degrading experience."],
    ["Lazy loading", "Deferring a resource or computation until it is likely to be needed.", "Lazy-load below-the-fold media and noncritical modules without delaying essential content."],
    ["Web Storage", "Browser key-value storage exposed through localStorage and sessionStorage.", "Store small non-sensitive preferences, not secrets or large structured databases."],
    ["Service worker", "A background browser worker that can intercept requests and support offline behavior.", "Use versioned caches and explicit update strategies so installed apps receive fresh assets."],
    ["Content Security Policy", "A browser policy restricting which sources may execute or load content.", "Adopt a restrictive policy to reduce the impact of injected scripts and untrusted resources."]
  ]},
  "backend-programming": { prefix: "be", terms: [
    ["Server", "A process that listens for requests or events and performs trusted work.", "Use servers to enforce permissions, protect secrets, coordinate storage, and share application state."],
    ["Request-response cycle", "The sequence from a client request through processing to a returned response.", "Trace each stage when diagnosing latency, validation failures, or incorrect status codes."],
    ["HTTP method", "A verb expressing the intended operation of an HTTP request.", "Choose GET, POST, PUT, PATCH, or DELETE according to semantics and retry behavior."],
    ["HTTP status code", "A three-digit response code summarizing the outcome of an HTTP request.", "Return specific success and error codes so clients can react without parsing prose."],
    ["Route", "A method-and-path pattern mapped to backend behavior.", "Keep routes predictable and resource-oriented so an API is easy to discover and test."],
    ["Handler", "A function that processes a matched request and creates a response.", "Keep handlers thin by delegating domain logic and storage operations to focused modules."],
    ["Middleware", "Reusable processing that runs before or after request handlers.", "Use middleware for cross-cutting concerns such as authentication, logging, limits, and headers."],
    ["REST", "An architectural style centered on resources, representations, and stateless requests.", "Apply REST constraints consistently instead of treating every JSON endpoint as automatically RESTful."],
    ["RPC", "A style where clients invoke named remote operations with structured arguments.", "Use RPC when operation-oriented commands communicate intent more clearly than resource manipulation."],
    ["Serialization", "Converting runtime values into a transferable or storable representation.", "Define stable JSON or binary contracts and handle dates, precision, and optional values explicitly."],
    ["Input validation", "Checking external data against types, formats, bounds, and business rules.", "Validate every trust boundary before data reaches domain logic or persistent storage."],
    ["Authentication", "Establishing the identity associated with a request.", "Verify credentials securely and separate identity proof from permission decisions."],
    ["Authorization", "Determining whether an identity may perform a specific action.", "Enforce authorization on the server for every protected object and operation."],
    ["Session", "Server-recognized state that associates multiple requests with one authenticated context.", "Protect session identifiers, define expiry, and invalidate sessions after sensitive changes."],
    ["Token", "A signed or opaque credential carrying or referencing authorization information.", "Limit token scope and lifetime, validate every claim, and avoid exposing tokens in URLs or logs."],
    ["Rate limiting", "Restricting request volume over a defined identity, resource, and time window.", "Apply limits to reduce abuse while returning clear retry information to legitimate clients."],
    ["Cache", "A faster copy of data or computation retained for reuse.", "Define cache keys, freshness, invalidation, and failure behavior before adding caching."],
    ["Message queue", "A durable buffer that decouples producers from asynchronous consumers.", "Use queues for retries, workload smoothing, and tasks that should not delay an HTTP response."],
    ["Idempotency", "The property that repeating an operation has the same intended effect as doing it once.", "Use idempotency keys or stable resource identifiers for safely retried state-changing requests."],
    ["Transaction", "A set of database changes committed or rolled back as one unit.", "Wrap related updates in a transaction when partial completion would corrupt business state."],
    ["Connection pool", "A managed set of reusable database or service connections.", "Size pools to protect downstream systems and always release connections after use."],
    ["Observability", "The ability to understand system behavior through metrics, logs, traces, and context.", "Instrument user-visible operations and preserve correlation identifiers across service boundaries."],
    ["Health check", "An endpoint or probe reporting whether a service can accept and perform work.", "Separate basic process liveness from readiness that depends on required resources."],
    ["Graceful shutdown", "Stopping a service while allowing accepted work to complete safely.", "Stop taking new traffic, drain active requests, close resources, and respect a bounded timeout."],
    ["Secret management", "Secure storage, delivery, rotation, and revocation of credentials and keys.", "Inject secrets at runtime and keep them out of source control, browser bundles, and logs."]
  ]},
  "data-science": { prefix: "ds", terms: [
    ["Question framing", "Turning a broad concern into a specific analytical question tied to a decision.", "Define the decision, population, outcome, comparison, and useful level of certainty before analysis."],
    ["Population", "The complete group about which an analysis intends to draw conclusions.", "State the population explicitly so sample findings are not generalized beyond their scope."],
    ["Sample", "The observed subset of a population used for analysis.", "Evaluate how the sample was selected and which members could not appear."],
    ["Observation", "The unit represented by one record or row in a dataset.", "Confirm the unit before joining tables or calculating rates to avoid accidental duplication."],
    ["Variable", "A measured, recorded, or derived characteristic that varies across observations.", "Document meaning, type, unit, allowable values, and collection method for each variable."],
    ["Categorical variable", "A variable whose values represent labels or groups rather than magnitude.", "Treat nominal and ordered categories according to their real relationships rather than arbitrary codes."],
    ["Numerical variable", "A variable whose values represent counts or measured quantities.", "Check units, precision, valid ranges, and whether zero has substantive meaning."],
    ["Missing data", "Values absent because they were not collected, recorded, applicable, or retained.", "Investigate the missingness process before deleting or imputing records."],
    ["Outlier", "An observation unusually distant from others under a stated criterion.", "Determine whether an outlier is an error, rare valid case, or signal before changing it."],
    ["Tidy data", "A structure where each variable is a column and each observation is a row.", "Use tidy structure to make filtering, grouping, visualization, and modeling more predictable."],
    ["Data provenance", "The documented origin, custody, and transformation history of data.", "Preserve sources and transformation steps so results can be audited and reproduced."],
    ["Data dictionary", "A reference describing fields, meanings, types, units, and allowed values.", "Maintain a data dictionary alongside datasets to prevent silent interpretation drift."],
    ["Exploratory data analysis", "Systematic inspection of distributions, relationships, quality, and anomalies.", "Use EDA to discover structure and problems without treating every observed pattern as confirmation."],
    ["Distribution", "The pattern of possible values and how frequently or probably they occur.", "Inspect shape, center, spread, tails, and unusual concentrations before selecting summaries."],
    ["Correlation", "A measure of association between variables under a specified definition.", "Use correlation to describe co-movement, not to claim one variable causes another."],
    ["Confounder", "A variable related to both an exposure and outcome that can distort their association.", "Use design knowledge and causal reasoning to identify plausible confounders before adjustment."],
    ["Feature engineering", "Creating model inputs from raw data using domain-informed transformations.", "Build features only from information available at prediction time and reproduce them consistently."],
    ["Data leakage", "Using information during analysis or modeling that would be unavailable at real use time.", "Split data before learned preprocessing and audit timestamps, labels, and downstream fields."],
    ["Train-test split", "Separating data used for development from data reserved for final evaluation.", "Choose random, grouped, or time-based splitting according to how future observations will arrive."],
    ["Reproducibility", "The ability to rerun an analysis and obtain the same results from documented inputs.", "Version data, code, dependencies, parameters, and random seeds."],
    ["Analytical pipeline", "An ordered, repeatable sequence from raw inputs to validated outputs.", "Automate transformations and checks instead of relying on undocumented manual edits."],
    ["Data visualization", "Encoding data into visual marks and scales to reveal a comparison or pattern.", "Choose charts based on the question and use honest axes, labels, and uncertainty displays."],
    ["Uncertainty", "The range of plausible conclusions arising from sampling, measurement, and modeling limits.", "Quantify uncertainty where possible and describe sources that cannot be captured numerically."],
    ["Sensitivity analysis", "Testing how conclusions change under alternative defensible assumptions.", "Vary exclusions, definitions, models, and missing-data treatments to assess robustness."],
    ["Data ethics", "Evaluating privacy, fairness, consent, ownership, and potential harm in data work.", "Consider who is represented, who is excluded, and how results may affect people before deployment."]
  ]},
  statistics: { prefix: "st", terms: [
    ["Population", "The complete set of units or outcomes targeted by a statistical question.", "Define the population before interpreting any sample estimate."],
    ["Sample", "A subset of a population observed to learn about the whole.", "Use a sampling process that supports the intended generalization."],
    ["Parameter", "A fixed but usually unknown numerical characteristic of a population.", "Examples include a population mean, proportion, variance, or regression coefficient."],
    ["Statistic", "A numerical summary calculated from sample data.", "Use statistics to estimate parameters while accounting for sampling variability."],
    ["Mean", "The arithmetic average obtained by summing values and dividing by their count.", "Report the mean with spread and inspect sensitivity to extreme values."],
    ["Median", "The middle ordered value that divides observations into two equal halves.", "Use the median when a resistant center is more representative than the mean."],
    ["Mode", "The value or category occurring most frequently.", "Use the mode for common categories or discrete peaks, not as a universal center."],
    ["Variance", "The average squared deviation from the mean under a stated population or sample formula.", "Variance supports many models but is expressed in squared units."],
    ["Standard deviation", "The square root of variance expressed in the original measurement units.", "Interpret it as a typical scale of deviation only in the context of the distribution."],
    ["Quantile", "A cut point below which a stated proportion of ordered observations falls.", "Use quantiles to describe position without assuming symmetry or normality."],
    ["Interquartile range", "The distance between the third and first quartiles.", "Use the IQR as a resistant measure of spread for skewed data."],
    ["Skewness", "Asymmetry in a distribution's shape or tails.", "Inspect skewness before choosing summaries or transformations."],
    ["Probability", "A numerical measure of uncertainty assigned to a defined event under a model.", "State the event and assumptions before interpreting a probability."],
    ["Random variable", "A numerical function assigning values to outcomes of a random process.", "Use random variables to connect events with distributions and expectations."],
    ["Probability distribution", "A rule describing possible values and their probabilities or densities.", "Select a distribution whose support and assumptions fit the process being modeled."],
    ["Expected value", "The probability-weighted long-run average of a random variable.", "Use expected value for average consequences while also considering variability and tail risk."],
    ["Independence", "A relationship where learning one event does not change the probability of another.", "Do not assume independence merely because variables are uncorrelated."],
    ["Sampling distribution", "The distribution of a statistic over repeated samples from the same process.", "Use it to understand estimator variability and construct inferential procedures."],
    ["Standard error", "The standard deviation of an estimator's sampling distribution.", "Use standard error to quantify precision, not the spread of individual observations."],
    ["Confidence interval", "A range generated by a method with a stated long-run coverage rate.", "Interpret the interval through its procedure, assumptions, estimate, and practical width."],
    ["Null hypothesis", "A specific reference claim evaluated by a statistical test.", "Define the null before examining results and avoid treating failure to reject as proof."],
    ["P-value", "The probability, under a specified null model, of data at least as incompatible as observed.", "Use p-values with effect sizes, uncertainty, assumptions, and multiplicity considerations."],
    ["Effect size", "A quantitative measure of the magnitude of a difference or relationship.", "Interpret effect size in domain units and practical context rather than only significance."],
    ["Statistical power", "The probability that a test detects a specified effect when it is present.", "Plan sample size using meaningful effects, variability, error rates, and design."],
    ["Type I and Type II errors", "False positive and false negative decisions under a testing procedure.", "Balance error costs according to the consequences of each decision."]
  ]},
  "python-programming": { prefix: "py", terms: [
    ["Interpreter", "A program that executes Python code and manages runtime objects and errors.", "Use a known interpreter version so local, test, and deployment behavior remains consistent."],
    ["Variable", "A name bound to an object in a namespace.", "Choose descriptive names and avoid rebinding one name to unrelated meanings."],
    ["Data type", "A classification defining an object's values, behavior, and supported operations.", "Inspect types when parsing input, combining values, or designing function contracts."],
    ["String", "An immutable sequence of Unicode characters.", "Use strings for text and apply explicit encoding when converting to or from bytes."],
    ["List", "An ordered mutable collection that permits repeated values.", "Use lists for sequences whose contents or order may change."],
    ["Tuple", "An ordered immutable collection commonly used for fixed records.", "Use tuples when the grouping should not be mutated after construction."],
    ["Set", "An unordered collection of unique hashable elements.", "Use sets for membership tests, uniqueness, and mathematical set operations."],
    ["Dictionary", "A mutable mapping from unique hashable keys to values.", "Use dictionaries for named fields and fast lookup by stable keys."],
    ["Conditional", "Control flow that selects statements based on boolean conditions.", "Keep conditions readable and make mutually exclusive branches explicit."],
    ["Loop", "Control flow that repeats work over items or while a condition remains true.", "Prefer direct iteration over collections and guarantee while loops can terminate."],
    ["Function", "A named reusable unit of behavior that accepts inputs and may return output.", "Design small functions with one responsibility and a clear contract."],
    ["Parameter", "A function-local name receiving an argument supplied by a caller.", "Use defaults and keyword-only parameters when they improve call-site clarity."],
    ["Return value", "The object a function sends back to its caller.", "Return data rather than printing inside reusable logic so behavior is easier to test."],
    ["Scope", "The region in which a name can be resolved.", "Limit mutable global state and understand local, enclosing, global, and built-in lookup."],
    ["Comprehension", "Compact syntax for creating collections from iterables with expressions and filters.", "Use comprehensions for simple transformations, not deeply nested logic."],
    ["Iterator", "An object that produces one item at a time through the iteration protocol.", "Iterators process streams without requiring every value to exist in memory at once."],
    ["Generator", "A function or expression that lazily yields a sequence of values.", "Use generators for pipelines, large inputs, and incremental computation."],
    ["Exception", "An object representing a failed or exceptional operation.", "Catch only errors that can be handled meaningfully and preserve useful context."],
    ["Context manager", "An object coordinating setup and cleanup around a with block.", "Use context managers for files, locks, transactions, and resources that must be released."],
    ["Module", "A Python file that exposes names for reuse through imports.", "Separate responsibilities into modules with directional dependencies."],
    ["Package", "A collection of importable modules organized under a namespace.", "Use packages to structure larger applications and publish reusable functionality."],
    ["Virtual environment", "An isolated Python environment with its own installed packages.", "Create one per project and record dependencies for reproducible setup."],
    ["Class", "A definition that creates objects combining data and behavior.", "Use classes when state and related operations form a stable abstraction."],
    ["Dataclass", "A class enhanced with generated methods for structured data fields.", "Use dataclasses for explicit records while validating invariants separately."],
    ["Unit test", "An automated check of a focused behavior in isolation from unnecessary dependencies.", "Test normal, boundary, and failure cases with deterministic inputs."]
  ]},
  "databases-sql": { prefix: "sql", terms: [
    ["Table", "A named relation organized as rows and columns under a schema.", "Create tables around coherent entities or relationships with enforced invariants."],
    ["Row", "One record or tuple stored in a relational table.", "Define what one row represents before loading or joining data."],
    ["Column", "A named attribute with a data type and optional constraints.", "Choose types and nullability that reflect the real domain."],
    ["Schema", "The definitions of database structures, relationships, constraints, and types.", "Version schema changes and review their effects on existing data and clients."],
    ["Primary key", "A column or column set that uniquely identifies every row.", "Use stable keys for relationships and avoid values that change with business attributes."],
    ["Foreign key", "A constraint linking values in one table to a candidate key in another.", "Use foreign keys to prevent orphaned references and define delete behavior."],
    ["Constraint", "A database rule rejecting invalid stored states.", "Enforce NOT NULL, UNIQUE, CHECK, and referential rules at the shared data boundary."],
    ["Index", "An auxiliary structure that accelerates selected access patterns at storage and write cost.", "Create indexes from measured filters, joins, and ordering needs, then inspect plans."],
    ["Normalization", "Organizing facts to reduce contradictory duplication and dependency anomalies.", "Normalize authoritative data first, then denormalize deliberately for measured needs."],
    ["Transaction", "A unit of work whose changes commit or roll back together.", "Use transactions whenever partial completion would leave inconsistent state."],
    ["SELECT", "The SQL statement used to retrieve expressions and rows.", "Select only required columns and make result ordering explicit when it matters."],
    ["WHERE", "A clause filtering rows before grouping and projection results are returned.", "Write predicates that preserve intended null semantics and can use appropriate indexes."],
    ["ORDER BY", "A clause defining the sequence of rows in a query result.", "Use deterministic tie-breakers for pagination and repeatable output."],
    ["GROUP BY", "A clause partitioning rows into groups for aggregate calculation.", "Group by every non-aggregated dimension needed in the result."],
    ["Aggregate function", "A function combining values from multiple rows into a summary.", "Use COUNT, SUM, AVG, MIN, and MAX while checking null and duplicate behavior."],
    ["JOIN", "An operation combining rows according to a relationship predicate.", "Choose inner or outer joins based on which unmatched records must remain."],
    ["Subquery", "A query nested inside another SQL statement.", "Use subqueries for readable intermediate sets while checking correlation cost."],
    ["Common table expression", "A named query expression introduced with WITH for one statement.", "Use CTEs to clarify multi-stage logic and recursive relationships."],
    ["View", "A stored query exposed as a virtual table.", "Use views to centralize stable read logic and limit direct table exposure."],
    ["Window function", "A calculation across related rows without collapsing them into one row per group.", "Use windows for rankings, running totals, lag comparisons, and partitioned statistics."],
    ["Query plan", "The database engine's chosen strategy for executing a statement.", "Inspect actual plans to identify scans, join choices, row estimates, and bottlenecks."],
    ["Isolation level", "The visibility and ordering guarantees between concurrent transactions.", "Choose isolation according to anomalies the application must prevent."],
    ["Deadlock", "A cycle where transactions wait on locks held by one another.", "Keep transactions short, lock resources consistently, and retry selected failures."],
    ["Backup", "A recoverable copy of database data and required metadata.", "Test restoration regularly because an untested backup is not proven recovery."],
    ["Migration", "A versioned change that moves schema or data from one known state to another.", "Design migrations for deployment order, rollback limits, and backward compatibility."]
  ]},
  "machine-learning": { prefix: "ml", terms: [
    ["Feature", "An input variable supplied to a model for training or prediction.", "Define features consistently and ensure each is available at prediction time."],
    ["Label", "The target value a supervised model learns to predict.", "Audit how labels are measured because label errors directly shape learned behavior."],
    ["Supervised learning", "Learning a mapping from examples with known input-output pairs.", "Use supervised learning when representative labeled examples exist and prediction is useful."],
    ["Unsupervised learning", "Finding structure in data without predefined target labels.", "Use unsupervised methods for exploration while validating whether discovered structure is meaningful."],
    ["Classification", "Predicting a discrete category or class probability.", "Choose metrics and thresholds according to class balance and decision costs."],
    ["Regression", "Predicting a continuous numerical quantity.", "Evaluate errors in domain units and inspect performance across relevant ranges."],
    ["Clustering", "Grouping observations by similarity under a representation and distance rule.", "Check stability and usefulness rather than assuming clusters are natural truths."],
    ["Training", "Estimating model parameters from examples by optimizing an objective.", "Fit all learned transformations only on training data."],
    ["Inference", "Applying a trained model to new feature values to produce predictions.", "Match training preprocessing, monitor latency, and handle invalid inputs."],
    ["Loss function", "A numerical objective measuring model error during optimization.", "Choose a loss aligned with the task and consequences of different errors."],
    ["Optimizer", "An algorithm updating model parameters to reduce an objective.", "Tune optimizer settings while monitoring convergence and generalization."],
    ["Hyperparameter", "A model or training setting chosen outside direct parameter fitting.", "Select hyperparameters using validation data rather than the final test set."],
    ["Baseline", "A simple reference method used to judge whether a model adds value.", "Compare complex models with transparent rules, averages, or majority predictions."],
    ["Training set", "The data used to estimate model parameters.", "Keep evaluation-only observations out of the training set and learned preprocessing."],
    ["Validation set", "Data used to compare choices and tune a model during development.", "Treat repeated validation use as part of model selection and preserve a final test set."],
    ["Test set", "Held-out data used for a final estimate of generalization.", "Do not repeatedly inspect or tune against the test set."],
    ["Cross-validation", "Repeated resampling that evaluates models across multiple train-validation partitions.", "Choose folds that respect groups, time, and leakage boundaries."],
    ["Overfitting", "Learning training-specific patterns that do not generalize to new data.", "Detect overfitting through held-out performance, learning curves, and simpler alternatives."],
    ["Underfitting", "Failing to capture important structure even on training data.", "Improve features, capacity, optimization, or problem formulation when both train and validation results are weak."],
    ["Regularization", "A constraint or penalty discouraging overly complex fitted behavior.", "Use regularization to improve generalization while checking its effect on important subgroups."],
    ["Precision", "The proportion of predicted positive cases that are truly positive.", "Prioritize precision when false positives are especially costly."],
    ["Recall", "The proportion of actual positive cases correctly identified.", "Prioritize recall when missing a positive case is especially costly."],
    ["Calibration", "Agreement between predicted probabilities and observed outcome frequencies.", "Evaluate calibration when probabilities drive risk, ranking, or resource allocation."],
    ["Data drift", "A change in the distribution of model inputs after deployment.", "Monitor input distributions and investigate whether drift affects outcomes."],
    ["Fairness", "Assessment of model performance and harm across affected people and groups.", "Define relevant harms, groups, metrics, oversight, and appeal paths before deployment."]
  ]},
  cybersecurity: { prefix: "sec", terms: [
    ["Confidentiality", "Protecting information from unauthorized disclosure.", "Use access control, encryption, minimization, and secure handling to preserve confidentiality."],
    ["Integrity", "Protecting data and systems from unauthorized or undetected alteration.", "Use validation, signatures, permissions, and audit trails to detect or prevent changes."],
    ["Availability", "Keeping systems and information usable by authorized users when needed.", "Design redundancy, capacity, recovery, and incident response around required service levels."],
    ["Asset", "Something valuable that requires protection, such as data, credentials, or services.", "Inventory assets and assign owners before choosing controls."],
    ["Threat", "A circumstance or actor capable of causing harm to an asset.", "Model realistic threat capabilities, intent, and access rather than only generic lists."],
    ["Vulnerability", "A weakness that can be exploited to violate a security objective.", "Prioritize vulnerabilities by exploitability, exposure, asset value, and available mitigations."],
    ["Risk", "The combination of likelihood and impact for a harmful event.", "Make risk decisions using business context, not scanner severity alone."],
    ["Attack surface", "All reachable points where an attacker may influence a system.", "Reduce exposed services, privileges, inputs, and dependencies that are not required."],
    ["Defense in depth", "Layering independent controls so one failure does not become total compromise.", "Combine preventive, detective, and recovery controls across identities, networks, apps, and data."],
    ["Least privilege", "Granting only the minimum access needed for a task and duration.", "Review permissions regularly and use temporary elevation for sensitive operations."],
    ["Authentication", "Verifying the identity associated with a user, device, or service.", "Protect credential enrollment, verification, recovery, and session creation."],
    ["Authorization", "Determining which actions an authenticated identity may perform.", "Check object-level and action-level permission on every trusted endpoint."],
    ["Multi-factor authentication", "Authentication requiring evidence from more than one factor category.", "Prefer phishing-resistant factors for privileged and high-impact accounts."],
    ["Phishing", "Deceptive communication intended to steal information or trigger unsafe action.", "Verify domains, requests, and unusual urgency through an independent channel."],
    ["Social engineering", "Manipulating people into bypassing normal security controls.", "Design processes that make verification easy and pressure-based exceptions difficult."],
    ["Malware", "Software intentionally designed to disrupt, spy, steal, or gain unauthorized control.", "Use layered prevention, least privilege, monitoring, isolation, and recovery."],
    ["Ransomware", "Malware that encrypts or exfiltrates data to demand payment.", "Maintain protected backups, segmentation, rapid containment, and tested restoration."],
    ["Encryption", "Transforming data with a key so unauthorized parties cannot read it.", "Use established algorithms and manage keys separately from encrypted data."],
    ["Hashing", "One-way transformation producing a fixed-length digest from input data.", "Use password-specific hashing for credentials and cryptographic hashes for integrity checks."],
    ["TLS", "A protocol providing encrypted and authenticated network communication.", "Use supported TLS configurations and validate certificates and hostnames."],
    ["Secret", "Sensitive credential material such as an API key, password, or private key.", "Store secrets in managed systems, rotate them, and keep them out of logs and repositories."],
    ["Patching", "Applying updates that correct vulnerabilities, defects, or unsupported components.", "Prioritize exposed and exploited weaknesses and verify updates through deployment controls."],
    ["Security logging", "Recording security-relevant events for detection and investigation.", "Capture identity, permission, configuration, and sensitive-data events without logging secrets."],
    ["Incident response", "A coordinated process for detecting, containing, eradicating, and recovering from incidents.", "Prepare roles, evidence procedures, communication, and exercises before an incident occurs."],
    ["Zero trust", "An approach that continually verifies access rather than trusting network location alone.", "Base access on identity, device, context, least privilege, and continuous evaluation."]
  ]},
  "cloud-devops": { prefix: "cd", terms: [
    ["Compute", "Resources that execute application instructions, including machines and managed runtimes.", "Choose compute based on workload duration, scaling, isolation, latency, and operational needs."],
    ["Virtual machine", "An isolated software-defined computer with its own operating system environment.", "Use VMs when operating-system control or strong workload isolation is required."],
    ["Container", "A packaged process and dependencies isolated with operating-system features.", "Build immutable images and keep runtime configuration outside the image."],
    ["Serverless function", "Managed event-driven compute that runs code without direct server administration.", "Use functions for bounded stateless work while accounting for limits and cold starts."],
    ["Region", "A geographic cloud location containing multiple isolated facilities or zones.", "Choose regions based on users, latency, resilience, cost, and data governance."],
    ["Availability zone", "An isolated location within a region designed to limit correlated failures.", "Distribute critical workloads across zones and test zone-loss behavior."],
    ["Virtual private cloud", "A logically isolated network boundary for cloud resources.", "Use network segmentation and explicit routing to limit unnecessary reachability."],
    ["Subnet", "A range of network addresses used to organize and route resources.", "Separate public, private, and data tiers according to access requirements."],
    ["Load balancer", "A service distributing traffic across healthy backend targets.", "Configure health checks, timeouts, and draining so failed or retiring targets stop receiving traffic."],
    ["Object storage", "Durable key-addressed storage for files and binary objects.", "Use object storage for uploads, media, archives, and backups with lifecycle policies."],
    ["Block storage", "Low-level persistent storage presented as addressable disk blocks.", "Use block volumes for filesystems and databases requiring attached disk semantics."],
    ["Managed database", "A database service where the provider operates much of the underlying platform.", "Still manage schema, access, backups, capacity, queries, and recovery objectives."],
    ["Content delivery network", "A distributed cache serving content closer to users.", "Use a CDN for static and cacheable responses with correct cache keys and invalidation."],
    ["DNS", "The distributed naming system mapping domain names to network destinations.", "Plan record changes, time-to-live, verification, and failover before migrations."],
    ["Identity and access management", "Policies and identities controlling access to cloud resources.", "Use roles, short-lived credentials, least privilege, and audited changes."],
    ["Infrastructure as code", "Version-controlled definitions that create and configure infrastructure.", "Review plans, reuse modules, detect drift, and avoid untracked manual changes."],
    ["Continuous integration", "Automated validation of proposed code changes.", "Run deterministic builds, linting, tests, and security checks before merge."],
    ["Continuous delivery", "Keeping validated software deployable through an automated release process.", "Promote the same artifact through environments with controlled approvals and rollback."],
    ["Artifact", "A versioned build output intended for testing, deployment, or distribution.", "Build once, sign or checksum it, and promote the exact artifact that passed validation."],
    ["Autoscaling", "Automatically changing resource capacity based on demand or schedules.", "Scale on meaningful signals and confirm downstream systems can handle added concurrency."],
    ["Observability", "Understanding system behavior through metrics, logs, traces, and events.", "Connect telemetry to user journeys and service objectives rather than infrastructure alone."],
    ["Service-level indicator", "A measured quantity representing an aspect of user-visible service behavior.", "Use indicators such as successful request rate, latency, or freshness."],
    ["Service-level objective", "A target value or range for a service-level indicator over time.", "Use objectives to balance reliability work with feature delivery and manage error budgets."],
    ["Rollback", "Returning a deployment or configuration to a known safer version.", "Automate rollback triggers and use backward-compatible data migrations."],
    ["Disaster recovery", "Plans and capabilities for restoring service after severe disruption.", "Define recovery time and recovery point objectives, then test full restoration."]
  ]},
  "git-github": { prefix: "git", terms: [
    ["Repository", "A Git-managed project history containing commits, references, and working files.", "Keep repository scope, generated assets, secrets, and contribution rules explicit."],
    ["Commit", "An immutable snapshot with metadata and parent relationships.", "Create focused commits whose messages explain the intent of one understandable change."],
    ["Branch", "A movable reference to a commit used to develop a line of work.", "Use short-lived branches to isolate changes and compare them with a target branch."],
    ["Merge", "Combining histories and recording how lines of development meet.", "Resolve conflicts according to intended final behavior and validate the integrated result."],
    ["Rebase", "Replaying commits onto a new base to create new commit identities.", "Rebase private work for clarity and avoid rewriting shared history without coordination."],
    ["Remote", "A named reference to another repository location.", "Use remotes to fetch, compare, and publish branches across repository copies."],
    ["Clone", "Creating a local repository copy with history and remote configuration.", "Clone the correct repository and verify the default remote before pushing."],
    ["Fetch", "Downloading remote objects and reference updates without integrating them.", "Fetch before review or integration so comparisons use current remote history."],
    ["Pull", "Fetching remote changes and integrating them into the current branch.", "Inspect local changes and choose merge or rebase behavior deliberately before pulling."],
    ["Push", "Sending local commits and reference updates to a remote repository.", "Push only reviewed commits to the intended branch and avoid force updates on shared work."],
    ["Working tree", "The checked-out files currently available for editing.", "Inspect working-tree changes before staging so unrelated edits remain separate."],
    ["Staging area", "The index defining the exact snapshot that the next commit will record.", "Stage explicit files or hunks and review the staged diff before committing."],
    ["HEAD", "The reference identifying the currently checked-out commit or branch.", "Understand HEAD before reset, checkout, rebase, or detached-history operations."],
    ["Tag", "A stable named reference commonly used to mark releases or milestones.", "Create annotated, signed tags for important published versions."],
    ["Stash", "Temporary storage for selected uncommitted changes.", "Use stashes for short interruptions and apply them carefully when surrounding code changed."],
    ["Diff", "A representation of changes between files, trees, commits, or the index.", "Review unstaged, staged, and branch diffs to understand exact scope."],
    ["Merge conflict", "A situation where Git cannot automatically reconcile competing changes.", "Understand both intentions, edit the correct final form, and test after resolution."],
    ["Revert", "A new commit that inverses the effect of an earlier commit.", "Use revert to safely undo published history without deleting prior commits."],
    ["Reset", "Moving a reference and optionally changing the index or working tree.", "Use reset cautiously and distinguish soft, mixed, and hard modes before execution."],
    ["Cherry-pick", "Applying the change introduced by selected commits onto another branch.", "Cherry-pick focused commits when selective transfer is clearer than merging a full branch."],
    ["Pull request", "A proposal to compare, discuss, test, and merge branch changes.", "Keep pull requests focused and document purpose, impact, tests, and limitations."],
    ["Code review", "Structured examination of a proposed change for correctness and maintainability.", "Review behavior, risks, tests, architecture, accessibility, security, and operational impact."],
    ["Branch protection", "Repository rules restricting how a branch may be updated.", "Require pull requests, passing checks, and appropriate reviews for important branches."],
    ["Status check", "A reported automated result associated with a commit or pull request.", "Make critical validation required and investigate flaky checks rather than ignoring them."],
    ["Release", "A named, documented distribution of a specific project version.", "Tie releases to tags, artifacts, notes, compatibility information, and rollback plans."]
  ]}
});

const PATH_ID = "reference-library";
const CARDS_PER_TERM = 4;

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
      description: "Definitions, practical applications, knowledge checks, and review prompts covering 25 essential concepts.",
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
  topic.terms.forEach(([term, definition, application], index) => {
    const base = index * CARDS_PER_TERM;
    const difficulty = index < 10 ? "beginner" : index < 20 ? "intermediate" : "advanced";
    const common = {
      difficulty,
      pathIds: [PATH_ID],
      tags: [slug(term), deck.id, "reference"],
    };
    const id = (offset) => `${topic.prefix}-x${String(base + offset).padStart(3, "0")}`;
    const sequence = (offset) => start + base + offset - 1;
    const nextDefinition = definitions[(index + 1) % definitions.length];
    const thirdDefinition = definitions[(index + 2) % definitions.length];

    cards.push({
      id: id(1), sequence: sequence(1), type: "concept",
      title: `${term}: definition`, prompt: definition,
      content: `${application} This concept belongs to the ${deck.title} reference foundation.`,
      ...common,
    });
    cards.push({
      id: id(2), sequence: sequence(2), type: "fact",
      title: `${term}: practical use`, prompt: application,
      content: `Accurate use begins with the defining condition: ${definition}`,
      ...common,
    });
    cards.push({
      id: id(3), sequence: sequence(3), type: "question",
      title: `Identify ${term}`, prompt: `Which statement best defines ${term}?`, content: "",
      question: {
        options: [definition, nextDefinition, thirdDefinition],
        answerIndex: 0,
        explanation: `${term} means: ${definition}`,
      },
      ...common,
    });
    cards.push({
      id: id(4), sequence: sequence(4), type: "checklist",
      title: `Review ${term}`, prompt: `Confirm that you can explain and apply ${term}.`,
      content: application,
      items: [
        `I can define ${term} without relying on the title.`,
        "I can identify one valid example and one non-example.",
        "I can explain why the concept matters in practice.",
        "I can distinguish it from a related term.",
        "I can state one limitation, risk, or common mistake.",
      ],
      ...common,
    });
  });
  return cards;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
