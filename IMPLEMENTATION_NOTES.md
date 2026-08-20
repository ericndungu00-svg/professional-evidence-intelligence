# Professional Evidence Intelligence — MVP Implementation Notes

## What was built

This MVP is a full-stack, authenticated evidence-analysis workspace. It maintains a per-user profile, evidence-document library, target specifications, extracted evidence items, criteria, assessments, contradictions, and historical analysis records. Original uploaded bytes are stored outside the database, while the database retains the source metadata, extracted text, evidence items, and resulting source lineage.

The primary application view opens with **fictional demonstration data** for **Sarah Mwangi**, a Band 6 Specialist Nurse preparing evidence against a fictional Band 7 Specialist Nurse person specification. The demonstration is labelled as fictional in the application header, profile, and library. A signed-in user can separately import that demo into their own workspace, or start with their own profile and documents.

| Capability | MVP implementation |
| --- | --- |
| Evidence library | Per-user storage of document metadata, original document bytes, extracted text, and structured evidence items. |
| Guest analysis | A non-persistent, no-sign-in flow for pasted professional evidence and a pasted target specification, producing an in-session Evidence Map and **Objective A** output. |
| Document ingestion | TXT, PDF, and DOCX inputs up to 10 MB; a reviewed text copy can be supplied for difficult scanned files. |
| Target input | Upload a target specification or paste its full text without uploading a file. |
| Evidence extraction | Server-side structured extraction returns atomic evidence items tied to a document and a section/paragraph location. |
| Criterion mapping | Server-side analysis maps evidence IDs to target criteria as demonstrated, partial, not found, or unsupported. |
| Three objectives | The UI exposes **Objective A**, **Objective B**, and **Objective C** with the prescribed promotion, appraisal, and job-evaluation roles. |
| Traceability | Findings link to a source-inspector panel showing the stored excerpt, source document, location, and evidence type. |
| Guardrails | Persistent decision-support disclaimer; no inferred source locations; participation, ownership, and causality distinctions embedded in analysis instructions and test cases. |

## Workflow

Visitors can begin with a no-sign-in guest path: they paste professional evidence and a target specification, then receive a temporary **Evidence Map** and **Objective A** output in the same browser session. This path does not create a user profile, upload a file, write to the database, or retain analysis history. Signing in is required only for a persistent private library, uploaded original files, a saved profile, or saved analysis history.

Signed-in users can instead create an evidence profile, add professional evidence, then add a target specification by upload or pasted text. The server stores the original source where applicable, extracts structured evidence or criteria, and associates every extracted item with a document and an established location. The user selects **Objective A**, **Objective B**, or **Objective C** and runs a source-grounded analysis. The application displays an evidence map, source-inspection panel, qualified gaps, contradictions, and evidence-building next actions.

The application uses a cautious model instruction and strict structured output. Critically, the system stores only evidence IDs returned from the existing evidence library. It renders document titles and source locations from the stored record rather than accepting invented references from generated prose. When no evidence is selected, the assessment is shown as “not found” in the supplied material rather than as a conclusion about a person’s capability.

## Demonstrated safeguard behaviour

The fictional scenario deliberately shows the distinction between participation and ownership. Sarah’s audit source documents data collection, meeting attendance, appointment-allocation redesign, and communication of a revised process. It does not identify Sarah as project lead. Consequently, the promotion map can show QI participation while treating a project-lead criterion as unsupported. The waiting-time outcome is attributed to the project intervention rather than to Sarah alone.

The automated test suite covers inflated leadership, informal advice, participation versus ownership, outcome attribution, missing presentation evidence, conflicting duration detection, source-location fallback, and the no-auth guest-analysis access boundary. The final validation run completed successfully with **four test files and eight passing tests**, in addition to a successful TypeScript check, direct public endpoint exercise, and visual desktop review.

## Objective-layer architecture

The extracted evidence corpus is shared and immutable across all three objectives. A source-linked fact is not rewritten to suit a reporting lens: each objective can select and qualify that fact differently, but it must cite the same retained evidence item. **Objective A** maps evidence to formal target-role requirements and reports strength, gaps, and evidence-building actions. **Objective B** produces an appraisal report of documented achievements, observable impact, qualifications, development themes, future evidence-grounded objectives, and evidence to retain. **Objective C** compares documented actual activity with formal responsibilities, describing alignment or divergence and discussion evidence without making any AfC, rebanding, pay, entitlement, or legal determination.

Objective reports are stored independently from the shared evidence library and are rendered through distinct report components. Regression tests use the Sarah Mwangi corpus to verify that the QI contribution remains the same source-grounded fact while appearing as partial target-role evidence in Objective A, a documented appraisal achievement in Objective B, and a qualified formal-responsibility comparison in Objective C.

## Current-role comparison and appraisal clarification

The shared Evidence Map and **Objective A** remain unchanged. **Objective B** now displays three deliberately separate categories: documented achievement, documented impact, and evidence limitations. For example, Sarah’s data collection and redesign contribution remains a documented achievement, while the recorded 21-to-14-day interval change remains documented project-level impact. A separate limitation explains that the sources do not establish individual causation or project leadership; it does not erase either the contribution or the project outcome.

**Objective C** now uses two separate source sets: a stored current-role description and the existing evidence library. It no longer compares evidence with the target role specification. Each current-role responsibility is classified only as aligned, potentially broader responsibility, potentially narrower responsibility, insufficient evidence, or unclear/ambiguous. The report includes the formal responsibility, documented actual activity, source links, qualifications, neutral discussion questions, and specific evidence that would clarify the issue. It never infers that a difference is higher-level work and never determines AfC banding, entitlement, rebanding, pay, or any formal outcome.

## Component-level Evidence Map discipline

The shared Evidence Map now decomposes compound requirements into substantive source-checkable components. It distinguishes **directly evidenced**, **indirectly/relevantly evidenced**, **inferred**, **not found**, and **contradicted** findings. A requirement can be directly evidenced only when every substantive component is directly supported by selected source passages. Relevant leadership evidence is no longer treated as senior support or role modelling; initiating an initiative is not treated as formal policy development, policy approval, or policy leadership; and named groups such as patients, carers, staff, and external agencies are checked separately.

The map displays each component’s assessment, qualification, evidence limitation, and source links beneath the parent requirement. For CPD and qualification requirements, explicit Education, qualification, certification, training, and CPD entries are marked as priority evidence. A fallback extractor also retains explicit structured CPD entries when structured model extraction is unavailable. Regression coverage now tests leadership scope, policy scope, population coverage, CPD priority, and fallback qualification extraction.

## Assumptions made

The MVP makes evidence traceability the first priority. PDF page coordinates are not extracted in this initial version; the system preserves an available section heading and paragraph number instead. When text extraction fails, the original file remains stored and the user can add a reviewed text copy. The production design also uses a per-document analysis approach; users should upload a manageable set of documents rather than one very large, unstructured archive.

The built-in server-side language model is used for extraction and mapping of newly uploaded material. The fictional demonstration report is deterministic and preloaded so it can be explored without using an analysis call. This is intentional: it makes the core guardrail examples immediately inspectable.

## Component-level Evidence Map discipline

The shared Evidence Map now decomposes compound requirements into substantive source-checkable components. It distinguishes **directly evidenced**, **indirectly/relevantly evidenced**, **inferred**, **not found**, and **contradicted** findings. A requirement can be directly evidenced only when every substantive component is directly supported by selected source passages. Relevant leadership evidence is not treated as senior support or role modelling; initiating an initiative is not treated as formal policy development, policy approval, or policy leadership; and named groups such as patients, carers, staff, and external agencies are checked separately.

The map displays each component’s assessment, qualification, evidence limitation, and source links beneath the parent requirement. For CPD and qualification requirements, explicit Education, qualification, certification, training, and CPD entries are marked as priority evidence. A fallback extractor also retains explicit structured CPD entries when structured model extraction is unavailable. Regression coverage tests leadership scope, policy scope, population coverage, CPD priority, and fallback qualification extraction.

## What remains unproven

This implementation proves the workflow, not the commercial hypothesis. It has not been evaluated with real NHS professionals, real organisational documents, or formal NHS job-evaluation processes. Extraction quality on scanned PDFs, complex tables, and inconsistent third-party documents needs structured usability testing. Analysis prompts should also be calibrated with an expert-reviewed gold-standard set before any claim of decision quality.

The tool does not make employment, AfC banding, job-evaluation, legal, HR, or competence determinations. Those questions remain within the appropriate professional and organisational processes.

## Recommended next iteration

The next iteration should recruit a small number of appropriately consented test users, compare the map against an independent expert review, record false-positive and false-negative evidence links, and tune the extraction and mapping rubric. It should also add richer PDF page handling, document-version controls, configurable retention, exportable evidence packs, and explicit human-review workflows for uncertain or contradictory sources.
