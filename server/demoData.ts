export const demoProfile = {
  currentRole: "Grade 6 Specialist Advisor",
  profession: "Specialist Advisor",
  specialty: "Service delivery",
  experience: "7 years post-qualification",
  currentLevel: "Grade 6",
  targetRole: "Grade 7 Specialist Advisor",
  careerObjective: "Understand the documentary evidence available for promotion preparation.",
  ownClaims:
    "I feel like I'm already doing a lot of Grade 7 work. I run sessions independently, people come to me for advice, I've been involved in improving the service and I train junior colleagues. But every time I apply for Grade 7 I don't seem to get shortlisted. I don't know what I'm missing.",
};

export const demoDocuments = [
  {
    title: "Sarah Mwangi CV",
    fileName: "sarah-mwangi-cv.txt",
    sourceKind: "CV",
    documentType: "evidence" as const,
    extractedText: `Sarah Mwangi — Grade 6 Specialist Advisor\n\nService delivery team\n\nCurrent responsibilities\nManages an independent caseload and conducts specialist advisory sessions. Assesses complex cases and liaises with senior specialists, external partners and other professional teams. Participates in cross-team meetings. Supports junior colleagues and trainees. Contributes to audit and quality improvement activity. Provides briefings to colleagues and service users.\n\nProfessional development\nCompleted advanced case assessment, independent case authorisation, complex case management, leadership fundamentals, QI methodology, difficult conversations, safeguarding and mentorship preparation.`,
  },
  {
    title: "2025 Annual Appraisal",
    fileName: "sarah-mwangi-appraisal-2025.txt",
    sourceKind: "Appraisal",
    documentType: "evidence" as const,
    extractedText: `Annual appraisal — fictional demonstration data\n\nCasework practice\nSarah handles approximately 60% of follow-up cases independently and demonstrates sound professional judgement with complex ongoing cases.\n\nColleague support and teaching\nSarah supported two newly qualified colleagues and provided an informal teaching session.\n\nService improvement\nSarah participated in process improvement, helped introduce a revised case-allocation approach and contributed to the apparent reduction in turnaround time.\n\nDevelopment discussion\nSarah has been advised to develop leadership and take ownership of a future improvement project.`,
  },
  {
    title: "Case Turnaround Audit",
    fileName: "case-turnaround-audit.txt",
    sourceKind: "Audit / QI report",
    documentType: "evidence" as const,
    extractedText: `Case turnaround audit — fictional demonstration data\n\nProject team contribution\nSarah collected data, attended project meetings, helped redesign case allocation and communicated the revised process.\n\nOutcome\nThe project recorded a reduction in the average case turnaround time from approximately 21 days to 14 days after the revised allocation process was introduced.\n\nAttribution\nThe report identifies Sarah as a participant in the project team. It does not identify Sarah as project lead.`,
  },
  {
    title: "Manager Feedback",
    fileName: "manager-feedback.txt",
    sourceKind: "Manager feedback",
    documentType: "evidence" as const,
    extractedText: `Manager feedback — fictional demonstration data\n\nSarah is increasingly confident in managing complex cases. Junior colleagues approach Sarah for advice regarding case decisions. Sarah is active in process improvement.\n\nSarah is encouraged to lead a future improvement project to develop service-level leadership experience.`,
  },
  {
    title: "Informal Teaching Record",
    fileName: "teaching-record.txt",
    sourceKind: "Teaching record",
    documentType: "evidence" as const,
    extractedText: `Informal teaching record — fictional demonstration data\n\nSarah delivered a 30-minute informal teaching session to six colleagues on complex case management. Feedback was positive. No formal teaching evaluation methodology was recorded.`,
  },
  {
    title: "Trainee Feedback",
    fileName: "trainee-feedback.txt",
    sourceKind: "Trainee feedback",
    documentType: "evidence" as const,
    extractedText: `Trainee feedback — fictional demonstration data\n\nSarah provided supportive supervision and helped develop my professional reasoning when managing complex cases.`,
  },
];

export const demoTarget = {
  title: "Fictional Grade 7 Specialist Advisor Person Specification",
  fileName: "fictional-grade-7-person-specification.txt",
  sourceKind: "Person specification",
  documentType: "target" as const,
  extractedText: `Fictional demonstration specification: Grade 7 Specialist Advisor\n\nQualifications\n- Relevant professional qualification or registration\n- Relevant specialist qualification\n- Evidence of CPD\n\nExperience\n- Significant post-qualification experience\n- Specialist casework experience\n- Complex case management\n- Autonomous practice\n- Cross-team working\n\nLeadership\n- Professional leadership\n- Supporting and developing colleagues\n- Leading change within the service\n- Influencing others\n\nQuality improvement\n- Participation in quality improvement\n- Use of data to improve practice\n- Implementing change\n- Evaluating impact\n\nCommunication\n- Excellent communication\n- Communicating complex information\n- Effective cross-team working\n\nDesirable\n- Formal leadership qualification\n- Experience leading a service improvement project\n- Presentation of audit or quality improvement findings\n- Research experience`,
};

export const demoCurrentRole = {
  title: "Fictional Grade 6 Specialist Advisor Role Responsibilities",
  fileName: "fictional-grade-6-specialist-advisor-role.txt",
  sourceKind: "Current role responsibilities",
  documentType: "current_role" as const,
  extractedText: `Fictional demonstration current role: Grade 6 Specialist Advisor

Casework practice
- Manage an allocated caseload under agreed protocols and escalate complex decisions where required.
- Contribute to cross-team case planning and communicate with colleagues and service users.

People development
- Support trainees and newly qualified colleagues in day-to-day case work.
- Deliver planned teaching as allocated by the service.

Quality improvement
- Contribute to audits and improvement activity under the direction of the service lead.
- Support implementation of agreed changes and communicate revised local processes.

Role boundaries
- Formal leadership of service improvement projects and independent service-level accountability are not assigned within this role description.`,
};

export const DEMO_LABEL = "Fictional demonstration data — not a real person, organisation, or specification.";

export const demoEvidence = [
  { id: 101, documentId: "demo-cv", statement: "Manages an independent caseload and conducts specialist advisory sessions.", excerpt: "Manages an independent caseload and conducts specialist advisory sessions.", sourceLocation: "Paragraph 3", category: "Casework practice", evidenceType: "Documented responsibility", confidence: "high" },
  { id: 102, documentId: "demo-cv", statement: "Assesses complex cases and liaises with senior specialists, external partners and other professional teams.", excerpt: "Assesses complex cases and liaises with senior specialists, external partners and other professional teams.", sourceLocation: "Paragraph 3", category: "Casework practice", evidenceType: "Documented responsibility", confidence: "high" },
  { id: 103, documentId: "demo-appraisal", statement: "Handles approximately 60% of follow-up cases independently.", excerpt: "Sarah handles approximately 60% of follow-up cases independently and demonstrates sound professional judgement with complex ongoing cases.", sourceLocation: "Paragraph 2", category: "Casework practice", evidenceType: "Appraisal evidence", confidence: "high" },
  { id: 104, documentId: "demo-appraisal", statement: "Supported two newly qualified colleagues and provided informal teaching.", excerpt: "Sarah supported two newly qualified colleagues and provided an informal teaching session.", sourceLocation: "Paragraph 3", category: "Teaching and development", evidenceType: "Appraisal evidence", confidence: "high" },
  { id: 105, documentId: "demo-feedback", statement: "Junior colleagues approach Sarah for advice regarding case decisions.", excerpt: "Junior colleagues approach Sarah for advice regarding case decisions.", sourceLocation: "Paragraph 2", category: "Leadership", evidenceType: "Manager feedback", confidence: "medium" },
  { id: 106, documentId: "demo-audit", statement: "Collected data, attended meetings, helped redesign case allocation and communicated the revised process.", excerpt: "Sarah collected data, attended project meetings, helped redesign case allocation and communicated the revised process.", sourceLocation: "Paragraph 2", category: "Quality improvement", evidenceType: "Audit report", confidence: "high" },
  { id: 107, documentId: "demo-audit", statement: "The project reduced the average case turnaround time from approximately 21 days to 14 days.", excerpt: "The project recorded a reduction in the average case turnaround time from approximately 21 days to 14 days after the revised allocation process was introduced.", sourceLocation: "Paragraph 3", category: "Quality improvement", evidenceType: "Project outcome", confidence: "high" },
  { id: 108, documentId: "demo-audit", statement: "Sarah is identified as a participant in the project team, not as project lead.", excerpt: "The report identifies Sarah as a participant in the project team. It does not identify Sarah as project lead.", sourceLocation: "Paragraph 4", category: "Quality improvement", evidenceType: "Attribution qualification", confidence: "high" },
  { id: 109, documentId: "demo-teaching", statement: "Delivered a 30-minute informal teaching session to six colleagues with positive feedback.", excerpt: "Sarah delivered a 30-minute informal teaching session to six colleagues on complex case management. Feedback was positive. No formal teaching evaluation methodology was recorded.", sourceLocation: "Paragraph 2", category: "Teaching and development", evidenceType: "Teaching record", confidence: "high" },
];

export const demoRequirements = [
  { id: 201, category: "Experience", criterion: "Autonomous practice", sourceLocation: "Paragraph 4" },
  { id: 202, category: "Experience", criterion: "Complex case management", sourceLocation: "Paragraph 4" },
  { id: 203, category: "Leadership", criterion: "Professional leadership", sourceLocation: "Paragraph 5" },
  { id: 204, category: "Leadership", criterion: "Supporting and developing colleagues", sourceLocation: "Paragraph 5" },
  { id: 205, category: "Leadership", criterion: "Leading change within the service", sourceLocation: "Paragraph 5" },
  { id: 206, category: "Quality improvement", criterion: "Participation in quality improvement", sourceLocation: "Paragraph 6" },
  { id: 207, category: "Quality improvement", criterion: "Use of data to improve practice", sourceLocation: "Paragraph 6" },
  { id: 208, category: "Quality improvement", criterion: "Evaluating impact", sourceLocation: "Paragraph 6" },
  { id: 209, category: "Desirable", criterion: "Experience leading a service improvement project", sourceLocation: "Paragraph 8" },
  { id: 210, category: "Desirable", criterion: "Presentation of audit or quality improvement findings", sourceLocation: "Paragraph 8" },
];

export const demoCurrentRoleResponsibilities = [
  { id: 401, category: "Casework practice", criterion: "Manage an allocated caseload under agreed protocols and escalate complex decisions where required.", sourceLocation: "Paragraph 3" },
  { id: 402, category: "People development", criterion: "Support trainees and newly qualified colleagues in day-to-day case work.", sourceLocation: "Paragraph 6" },
  { id: 403, category: "People development", criterion: "Deliver planned teaching as allocated by the service.", sourceLocation: "Paragraph 7" },
  { id: 404, category: "Quality improvement", criterion: "Contribute to audits and improvement activity under the direction of the service lead.", sourceLocation: "Paragraph 10" },
  { id: 405, category: "Quality improvement", criterion: "Support implementation of agreed changes and communicate revised local processes.", sourceLocation: "Paragraph 11" },
  { id: 406, category: "Role boundaries", criterion: "Formal leadership of service improvement projects and independent service-level accountability are not assigned within this role description.", sourceLocation: "Paragraph 14" },
];

export const demoAssessments = [
  { requirementId: 201, assessment: "directly_evidenced", strength: "strong", evidenceIds: [101, 103], interpretation: "The CV and appraisal directly document independent sessions and follow-up cases.", gap: "No material gap identified in the supplied evidence.", nextStep: null, components: [{ component: "Independent specialist sessions", assessment: "directly_evidenced", evidenceIds: [101], interpretation: "Independent caseload management and specialist sessions are explicitly documented.", gap: "No material gap identified." }, { component: "Independent follow-up cases", assessment: "directly_evidenced", evidenceIds: [103], interpretation: "Approximately 60% of follow-up cases are documented as independent.", gap: "No material gap identified." }] },
  { requirementId: 202, assessment: "directly_evidenced", strength: "strong", evidenceIds: [102, 103], interpretation: "The supplied sources directly record complex case assessment and professional judgement.", gap: "No material gap identified in the supplied evidence.", nextStep: null },
  { requirementId: 203, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [105], interpretation: "Manager feedback supports informal leadership: junior colleagues seek Sarah's advice. It does not establish formal leadership responsibility.", gap: "Formal leadership accountability or a defined leadership remit is not documented.", nextStep: "Seek a documented leadership responsibility and retain a role brief, feedback, and outcome evidence.", components: [{ component: "Informal advice", assessment: "indirectly_relevantly_evidenced", evidenceIds: [105], interpretation: "Advice-seeking is relevant to leadership but does not establish a formal leadership remit.", gap: "Retain a defined leadership responsibility or role brief." }, { component: "Formal leadership responsibility", assessment: "not_found", evidenceIds: [], interpretation: "No source identifies a formal leadership accountability.", gap: "Retain an allocated leadership remit and corroborated outcome evidence." }] },
  { requirementId: 204, assessment: "demonstrated", strength: "strong", evidenceIds: [104, 109], interpretation: "The appraisal and teaching record document support for newly qualified colleagues and teaching for peers.", gap: "Formal teaching evaluation is limited, but colleague development is documented.", nextStep: "For future teaching, retain learning objectives and structured evaluation feedback." },
  { requirementId: 205, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [106, 108], interpretation: "Sarah participated in implementing a service change. The audit explicitly does not identify her as project lead.", gap: "Ownership of service-level change, decision-making responsibility, and leadership of implementation are not demonstrated.", nextStep: "Lead a bounded improvement project and retain the project plan, stakeholder record, implementation log, outcome data, and reflection.", components: [{ component: "Contribute to implementation", assessment: "directly_evidenced", evidenceIds: [106], interpretation: "The audit directly records redesign contribution and communication of the revised process.", gap: "The source does not establish implementation leadership." }, { component: "Lead service-level change", assessment: "contradicted", evidenceIds: [108], interpretation: "The audit explicitly identifies participation and does not identify Sarah as project lead.", gap: "Retain a defined leadership remit, decision authority, and implementation accountability." }] },
  { requirementId: 206, assessment: "demonstrated", strength: "strong", evidenceIds: [106], interpretation: "The audit directly records data collection, meetings, redesign activity, and communication of the change.", gap: "No material gap identified for participation.", nextStep: null },
  { requirementId: 207, assessment: "demonstrated", strength: "strong", evidenceIds: [106, 107], interpretation: "The audit records data collection and an outcome following the allocation intervention.", gap: "Personal responsibility for the evaluation is not separated from the project team.", nextStep: "In future work, document your individual analytical contribution and how the data informed decisions." },
  { requirementId: 208, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [107, 108], interpretation: "The source documents a project outcome, but it does not establish that Sarah alone evaluated or caused the result.", gap: "A documented personal role in outcome evaluation is missing.", nextStep: "Retain your evaluation plan, analysis notes, and a reflection on what the outcome means for practice.", components: [{ component: "Project-level outcome", assessment: "directly_evidenced", evidenceIds: [107], interpretation: "The turnaround-time change is directly recorded as a project outcome.", gap: "This does not show individual causation." }, { component: "Individual evaluation responsibility", assessment: "not_found", evidenceIds: [], interpretation: "No source describes Sarah's individual responsibility for evaluating the outcome.", gap: "Retain analysis notes and an evaluation role record." }] },
  { requirementId: 209, assessment: "contradicted", strength: "contradicted", evidenceIds: [108], interpretation: "The audit identifies Sarah as a participant and explicitly does not identify her as project lead.", gap: "There is no supplied evidence of leading a service improvement project.", nextStep: "Build direct evidence of project ownership before describing a project as led.", components: [{ component: "Lead a service improvement project", assessment: "contradicted", evidenceIds: [108], interpretation: "The source explicitly states that Sarah is a participant and is not identified as project lead.", gap: "Retain direct project-lead appointment, plan, decision record, and outcome evidence." }] },
  { requirementId: 210, assessment: "not_found", strength: "not_demonstrated", evidenceIds: [], interpretation: "No supplied document records a presentation of audit or QI findings.", gap: "Presentation evidence is not found in the current library.", nextStep: "Present future findings to a team or meeting and retain the agenda, slides, attendance record, and feedback." },
];

export const demoContradictions = [
  { id: 301, type: "Participation versus ownership", severity: "unsupported", claim: "A project-lead claim would not be supported by the audit.", explanation: "The audit identifies Sarah as a participant in the project team and does not identify her as project lead. The record should not be represented as proof of project leadership.", evidenceIds: [108] },
  { id: 302, type: "Outcome attribution", severity: "review", claim: "The turnaround-time reduction should be attributed to the project intervention, not solely to Sarah.", explanation: "The report records a 21-to-14-day project outcome but does not establish that one individual caused it.", evidenceIds: [107, 108] },
];

export const demoObjectiveReports = {
  A: { objective: "A" as const, mappings: demoAssessments },
  B: {
    objective: "B" as const,
    documentedAchievements: [
      { title: "Independent casework practice", statement: "The evidence documents independent sessions and approximately 60% of follow-up cases undertaken independently.", evidenceIds: [101, 103], qualification: "The supplied sources do not quantify the full scope of autonomous decision-making beyond these documented examples.", action: null },
      { title: "Colleague support and informal teaching", statement: "Sarah supported two newly qualified colleagues and delivered an informal teaching session to six colleagues.", evidenceIds: [104, 109], qualification: "Formal teaching evaluation methodology is not recorded.", action: null },
      { title: "Quality-improvement contribution", statement: "The audit records data collection, project meeting attendance, redesign contribution, and communication of a revised allocation process.", evidenceIds: [106], qualification: "The record identifies participation, not project leadership.", action: null },
    ],
    documentedImpact: [{ title: "Documented project-level turnaround-time change", statement: "The audit records an average case turnaround time reduction from approximately 21 days to 14 days after the revised allocation process.", evidenceIds: [107], qualification: "This is documented project-level impact, not evidence that Sarah alone caused or evaluated the change.", action: null }],
    evidenceLimitations: [{ title: "Project ownership and individual causation are not established", statement: "The audit identifies Sarah as a participant in the project team and does not identify her as project lead.", evidenceIds: [107, 108], qualification: "Sarah's contribution remains a documented achievement; the limitation concerns project leadership and individual causation only.", action: "Use participation language when describing this work and retain any future defined leadership remit separately." }],
    developmentThemes: [{ title: "Formal service-level leadership", statement: "The current evidence documents informal support and QI participation, but not a defined leadership remit or project ownership.", evidenceIds: [105, 108], qualification: "The absence is within the supplied corpus, not a statement about potential.", action: "Seek a bounded leadership responsibility with a clear role brief." }],
    evidenceGroundedObjectives: [{ title: "Lead a bounded improvement activity", statement: "Build on documented QI participation by taking a defined future responsibility for planning, stakeholder coordination, implementation, and evaluation.", evidenceIds: [106, 108], qualification: "This is a future evidence-building objective, not a claim that leadership is already demonstrated.", action: "Retain the project plan, role brief, stakeholder record, outcome data, and reflection." }],
    suggestedEvidenceToRetain: [{ title: "Structured teaching evaluation", statement: "Teaching activity is documented, but formal evaluation is limited.", evidenceIds: [109], qualification: "Positive feedback alone does not show structured evaluation.", action: "Retain learning objectives, attendance, evaluation feedback, and a reflection on changes made." }],
  },
  C: {
    objective: "C" as const,
    comparisons: [
      { responsibilityId: 401, documentedActualActivity: "Independent caseload management, specialist sessions, and approximately 60% of follow-up cases handled independently are documented.", alignment: "aligned" as const, evidenceIds: [101, 103], qualification: "The evidence documents activity; it does not determine a job-evaluation outcome.", discussionPoint: "How is the documented independent casework activity reflected in the current role description and local protocols?", strengtheningEvidence: "Retain a current session template, scope-of-practice document, and corroborated examples of autonomous decisions." },
      { responsibilityId: 402, documentedActualActivity: "Support for newly qualified colleagues is documented, with trainee feedback describing supportive supervision.", alignment: "aligned" as const, evidenceIds: [104, 109], qualification: "A formal supervisory allocation or remit is not documented.", discussionPoint: "Is regular support for trainees and new colleagues formally recognised within the current role?", strengtheningEvidence: "Retain supervision allocations, role briefs, and corroborated feedback." },
      { responsibilityId: 403, documentedActualActivity: "One informal teaching session to six colleagues is documented, with positive feedback.", alignment: "unclear_ambiguous" as const, evidenceIds: [109], qualification: "The evidence does not establish whether the session was planned, allocated, regular, or part of a formal teaching remit.", discussionPoint: "How does the recorded informal teaching relate to any planned teaching responsibility in the current role?", strengtheningEvidence: "Retain teaching allocations, session plans, attendance, structured evaluation, and a formal teaching remit where applicable." },
      { responsibilityId: 404, documentedActualActivity: "Data collection, project meetings, case-allocation redesign, and communication of revised process are documented.", alignment: "aligned" as const, evidenceIds: [106, 108], qualification: "The audit confirms participation, not independent project leadership.", discussionPoint: "How is participation in audit and improvement activity under service-lead direction reflected in the current role?", strengtheningEvidence: "Retain project terms of reference, allocated tasks, and corroborated contribution records." },
      { responsibilityId: 405, documentedActualActivity: "The audit records redesign contribution and communication of the revised case-allocation process.", alignment: "potentially_broader_responsibility" as const, evidenceIds: [106, 108], qualification: "The evidence may indicate activity beyond simple implementation support, but it does not establish service-level ownership or project leadership.", discussionPoint: "Could the documented redesign and communication contribution be clarified against the current wording of implementation support?", strengtheningEvidence: "Retain the allocated change remit, decision records, role boundaries, stakeholder feedback, and implementation log." },
      { responsibilityId: 406, documentedActualActivity: "The available QI evidence identifies Sarah as a participant and does not identify her as project lead.", alignment: "aligned" as const, evidenceIds: [108], qualification: "This does not establish formal service-improvement leadership or independent service-level accountability.", discussionPoint: "Are the current role boundaries and the documented QI contribution understood consistently by Sarah and the service?", strengtheningEvidence: "Retain any future defined leadership remit separately from participation evidence." },
    ],
    questionsForDiscussion: [
      { title: "Clarifying scope of change activity", statement: "Which parts of redesign, implementation, and communication are routinely expected in the current role, and which are additional allocated responsibilities?", evidenceIds: [106, 108], qualification: "This question does not assume that the activity changes grading or entitlement.", action: null },
      { title: "Clarifying teaching activity", statement: "Is the documented teaching a one-off informal contribution or part of a planned and allocated teaching responsibility?", evidenceIds: [109], qualification: "The current evidence does not establish a formal teaching remit.", action: null },
    ],
  },
};
