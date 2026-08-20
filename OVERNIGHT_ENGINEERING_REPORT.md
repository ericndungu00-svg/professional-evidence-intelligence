# Overnight Core Evidence Iteration — Engineering Report

## Fixed

Objective B no longer silently converts a failed generation into a completed empty report. The appraisal generator now rejects API failures, non-string content, malformed JSON, an invalid top-level report schema, malformed finding objects, all-empty reports, and reports with no valid source-linked finding. The router records these cases as **failed** with `objectiveReport: null`, rather than as complete. The interface has a persistent alert stating that the analysis was not saved and that the evidence library remains unchanged.

The full-library Objective B failure has been reproduced with a controlled 140-item evidence corpus and repaired without changing evidence extraction or Objectives A/C. The browser-facing HTML-response guard prevents gateway HTML from reaching the tRPC JSON parser. Separately, the appraisal request now selects a bounded, category-diverse source-linked evidence set and specifies an exact six-array report contract, explicitly prohibiting an `appraisal_report` wrapper or alternative report layout. Valid JSON in common markdown fences remains recoverable; genuinely malformed or non-conforming outputs remain rejected.

The subsequent live **524** report was a gateway timeout, not a recurrence of client-side JSON parsing. The Objective B request previously waited synchronously for remote model output and could therefore exceed the gateway window. Its initial JSON-mode request was also incompatible with the deployed provider configuration. The repaired primary path now uses provider-compatible Claude Haiku text mode, limiting the request to 12 concise, category-diverse evidence items, one source-linked finding per required appraisal section, a 900-token output budget, and a 25-second application deadline. In a controlled 140-item evidence library, this produced all six schema-valid report sections in **4.9 seconds**. Remote API failures and deadline expiry retain a populated **source-only appraisal fallback** drawn exclusively from the supplied evidence rather than an empty report or a gateway HTML page. This fallback labels every finding as documented activity, source scope, development evidence, an evidence-building objective, or evidence to retain; it does not invent impact, leadership, ownership, or citations.

The shared Evidence Map retains its stricter discipline. Compound requirements use component-level checks and five distinct assessment classes: **directly evidenced**, **indirectly/relevantly evidenced**, **inferred**, **not found**, and **contradicted**. General leadership is not automatically senior support or role modelling. QI participation or initiation is not formal policy development or policy leadership. Named populations remain distinct. Explicit Education, qualification, certification, training, and CPD evidence is prioritised over general learning statements.

Objective C has not been changed. It continues to require a current role description and compares formal current responsibilities with documented activity using neutral alignment outcomes only.

## Changed

| Area | Change | Evidence discipline preserved |
| --- | --- | --- |
| Objective B validation | The six expected appraisal arrays and each finding’s required fields are validated before a report can be accepted. | Every accepted report must contain at least one retained, valid source identifier. |
| Objective B failure state | Generation failure is persisted as `failed`, not `complete`; no report payload is retained. | The failure message does not create or alter evidence claims. |
| Objective B UI | A persistent actionable failure alert replaces the misleading all-empty appraisal view. | It states that the library and earlier analyses are unchanged. |
| Objective B full-library contract | A bounded, diverse evidence subset is passed to a six-array schema with an explicit no-wrapper instruction. | Unselected evidence is never treated as absent, and every accepted finding retains valid source IDs. |
| Client transport boundary | HTML gateway responses are converted to actionable errors before JSON parsing. | Transport errors cannot be misrepresented as evidence-analysis output. |
| Objective B timeout safety | The provider-compatible primary model request is limited to 12 concise, diverse evidence items with one finding per appraisal section and a 25-second application deadline; a source-only report is returned on remote API failure or deadline expiry. | The fallback uses only supplied source IDs and explicitly qualifies what each individual source does not establish. |
| Evidence Map | Components are assessed independently and surfaced with their evidence qualification. | No favourable aggregation of partial, indirect, or contradictory evidence. |
| CPD retrieval | Structured explicit CPD/qualification items are given priority; fallback extraction retains them. | General innovation or interest statements do not substitute for qualifications. |

## Tests passed

The final automated run passed **34 tests across 10 test files**, with a successful TypeScript check. In addition, the provider-compatible primary run against a controlled 140-item appraisal library completed within **4.9 seconds** and returned one source-linked finding in each of the six required sections. The coverage includes:

| Coverage | Verified result |
| --- | --- |
| Objective B API, non-string, malformed JSON, invalid schema, empty report, and unlinked report | Rejected explicitly; not converted into an empty success. |
| Objective B failed persistence | Router test verifies `status: failed`, `objectiveReport: null`, and an actionable diagnostic. |
| Objective B visible failure message | The rendered alert contains the persistent, actionable user-facing message. |
| Objective B valid source-linked report | Accepted with only valid evidence IDs retained. |
| Objective B production-sized controlled library | Returned 4 achievements, 1 impact, 4 limitations, 4 development themes, 4 objectives, and 4 retained-evidence recommendations, with 21 source links. |
| Objective B response boundaries | Fenced valid JSON is recovered; browser HTML is stopped before tRPC JSON parsing; invalid wrappers and schemas remain failed analyses. |
| Objective B fallback | A malformed or non-conforming first response receives one shorter, source-linked JSON-object retry; a failing retry preserves the original explicit diagnostic. |
| Objective B deadline | A simulated 25-second remote-call deadline returns a source-linked appraisal fallback rather than waiting for a gateway timeout. |
| Evidence Map leadership, policy, population, and CPD examples | Component-level, source-gated classification tests pass. |
| Contradiction handling | A project-lead claim conflicts with a participation-only audit and is not treated as proven leadership. |
| Sarah Mwangi objectives A, B, and C | Regression tests confirm distinct source-consistent lenses and unchanged Objective C neutrality. |

Individual controlled live runs completed for all three objectives using non-private, source-linked evidence. Objective A labelled informal clinical advice as relevant to senior support rather than direct senior support, left role modelling not found, left policy development not found, treated implementation contribution as relevant, classified policy leadership as contradicted by the participation-only audit, and used the explicit CPD certificate as direct evidence. Objective B returned a populated source-linked appraisal report. Objective C returned neutral current-role comparisons, including one potentially narrower responsibility and one aligned QI contribution. The earlier combined A/B/C runner exceeded its runtime window, but the individual reruns completed.

## Remaining issues

The actual user CV library has not been read, copied, or modified in this session. On 20 August 2026, the available production and development browser contexts displayed the signed-out entry screen rather than the saved-library view. A subsequent owner-scoped database check found no non-demo library in the database context available to this task, so no attempt was made to select or inspect another user’s library. Therefore, a successful Objective B result from the user’s own private evidence is **not yet claimed**, notwithstanding the controlled full-library validation.

Live runtime verification of the alert is covered by a router failure regression plus rendered alert test, rather than by an authenticated production-session screenshot. The next authenticated run should verify the exact production interaction.

## Recommended next test

In the production app, select **Objective B** and run the existing library once. Confirm one of two expected outcomes: a populated, source-linked appraisal report; or the explicit persistent failure alert with no empty completed report saved. Then compare the source-linked Objective B findings against the same Evidence Map evidence IDs and review any mismatch as a source-traceability defect.

> The system is optimised for **accuracy, traceability, and usefulness**, not for making the candidate appear stronger. It must not convert a claim into an independently verified fact.
