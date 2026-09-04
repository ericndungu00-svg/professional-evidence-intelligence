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

// A second demonstration scenario, distinct from Sarah Mwangi's traditional
// person-specification promotion case above. This one uses a criteria/
// behaviour-statement target (in the shape of the UK Civil Service's Success
// Profile behaviours) rather than a person specification, since that's a
// different, common structure for "map my evidence against named criteria"
// applications outside a single sector. It deliberately mirrors the same
// participation-vs-ownership and informal-vs-formal pedagogical points as
// Sarah's scenario, using this format's own vocabulary (working-group
// membership vs. chairing it; informal guidance vs. formal mentoring).
export const civilServiceProfile = {
  currentRole: "Executive Officer (EO), Operational Delivery",
  profession: "Civil Servant",
  specialty: "Operational casework",
  experience: "5 years in the Civil Service",
  currentLevel: "EO",
  targetRole: "Higher Executive Officer (HEO)",
  careerObjective: "Understand the documentary evidence available to write my Success Profile behaviour statements for HEO.",
  ownClaims:
    "I feel like I'm already doing a lot of HEO-level work. I manage my own caseload, I sit on a process-improvement working group, and colleagues often come to me with questions. But I keep getting marked 'partially met' against the behaviours at interview and I don't know what's missing.",
};

export const civilServiceDocuments = [
  {
    title: "Amara Okafor CV",
    fileName: "amara-okafor-cv.txt",
    sourceKind: "CV",
    documentType: "evidence" as const,
    extractedText: `Amara Okafor — Executive Officer (EO)\n\nOperational Delivery team\n\nCurrent responsibilities\nManages an independent caseload of operational cases end to end. Liaises with other teams and external stakeholders on complex cases. Attends the directorate's case-quality working group. Provides informal guidance to newer team members when asked. Contributed data and testing to a case-triage redesign. Completed L&D: Effective Communication for EOs, Decision Making for EOs, and a Working Together workshop.`,
  },
  {
    title: "2025 Performance Review",
    fileName: "amara-okafor-review-2025.txt",
    sourceKind: "Performance review",
    documentType: "evidence" as const,
    extractedText: `Annual performance review — fictional demonstration data\n\nCasework practice\nAmara handles the great majority of her caseload independently and applies sound judgement on complex or borderline cases.\n\nColleague support\nAmara has given informal guidance to two newer colleagues when they've asked for it.\n\nWorking group contribution\nAmara took part in the case-triage redesign working group: she helped gather baseline data and tested the new process before rollout.\n\nDevelopment discussion\nAmara has been encouraged to seek out a chairing or leading opportunity ahead of her HEO application.`,
  },
  {
    title: "Case-Triage Redesign Report",
    fileName: "case-triage-redesign-report.txt",
    sourceKind: "Working group report",
    documentType: "evidence" as const,
    extractedText: `Case-triage redesign report — fictional demonstration data\n\nWorking group membership\nAmara collected baseline processing-time data, attended working group sessions, and tested the redesigned triage process ahead of rollout.\n\nOutcome\nAverage case processing time fell from approximately 18 days to 11 days after the redesigned triage process was introduced.\n\nAttribution\nThe report names the working group's sponsor as a named HEO. It identifies Amara as a working-group member. It does not identify Amara as the working group's chair or lead.`,
  },
  {
    title: "Line Manager Feedback",
    fileName: "line-manager-feedback.txt",
    sourceKind: "Manager feedback",
    documentType: "evidence" as const,
    extractedText: `Line manager feedback — fictional demonstration data\n\nAmara is a reliable and increasingly confident caseworker. Colleagues sometimes ask her for guidance on tricky cases. She has been a useful contributor to the triage working group.\n\nAmara is encouraged to seek out a chance to chair or lead a piece of work ahead of her HEO application, to build direct evidence of leading change.`,
  },
  {
    title: "Colleague Thank-You Note",
    fileName: "colleague-note.txt",
    sourceKind: "Colleague feedback",
    documentType: "evidence" as const,
    extractedText: `Colleague note — fictional demonstration data\n\nThanks for talking me through how to handle that escalation last week — really helped me get my head around it. No formal record of this guidance was kept beyond this note.`,
  },
];

export const civilServiceTarget = {
  title: "Fictional HEO Success Profile — Behaviour Statements",
  fileName: "fictional-heo-success-profile.txt",
  sourceKind: "Success Profile behaviours",
  documentType: "target" as const,
  extractedText: `Fictional demonstration specification: Higher Executive Officer (HEO) — Success Profile behaviours, Level 2\n\nWorking Together\n- Actively build relationships across teams and organisations\n- Encourage input from a diverse range of people and perspectives\n- Model inclusive behaviour and challenge poor behaviour when you see it\n\nCommunicating and Influencing\n- Communicate clearly and concisely, adapting style to the audience\n- Provide advice and recommendations to others outside own direct area\n- Manage the expectations of stakeholders confidently\n\nMaking Effective Decisions\n- Use evidence and analysis to support decisions\n- Take responsibility for decisions, and escalate where required\n- Ask questions to understand the reasons behind decisions\n\nDelivering at Pace\n- Take responsibility for delivering own and team objectives\n- Show resilience when working under pressure or facing setbacks\n- Manage overall performance of a piece of work against agreed milestones\n\nLeadership\n- Role-model expected behaviours and organisational values\n- Take a lead role in developing colleagues, including through coaching and mentoring\n- Lead and support others through change, engaging with people to explain the reasons for it\n\nDesirable\n- Chaired or led a working group or project\n- Formally mentored or coached a colleague\n- Evidence of leading a piece of change from start to finish`,
};

export const civilServiceCurrentRole = {
  title: "Fictional EO Role Responsibilities",
  fileName: "fictional-eo-role.txt",
  sourceKind: "Current role responsibilities",
  documentType: "current_role" as const,
  extractedText: `Fictional demonstration current role: Executive Officer (EO), Operational Delivery

Casework practice
- Manage an allocated operational caseload under agreed procedures, escalating complex or borderline decisions.
- Liaise with other teams and stakeholders on individual cases.

Working with others
- Contribute to team and working-group meetings as a member.
- Offer informal guidance to colleagues when asked, within own area of experience.

Process improvement
- Take part in process-improvement activity as directed, including data collection and testing.
- Support implementation of agreed process changes within own team.

Role boundaries
- Chairing or leading a working group, formally mentoring colleagues, and independent ownership of a change initiative are not assigned within this role description.`,
};

export const civilServiceEvidence = [
  { id: 1101, documentId: "demo-cs-cv", statement: "Manages an independent caseload of operational cases end to end.", excerpt: "Manages an independent caseload of operational cases end to end.", sourceLocation: "Paragraph 3", category: "Casework practice", evidenceType: "Documented responsibility", confidence: "high" },
  { id: 1102, documentId: "demo-cs-cv", statement: "Liaises with other teams and external stakeholders on complex cases.", excerpt: "Liaises with other teams and external stakeholders on complex cases.", sourceLocation: "Paragraph 3", category: "Casework practice", evidenceType: "Documented responsibility", confidence: "high" },
  { id: 1103, documentId: "demo-cs-review", statement: "Handles the great majority of her caseload independently and applies sound judgement on complex or borderline cases.", excerpt: "Amara handles the great majority of her caseload independently and applies sound judgement on complex or borderline cases.", sourceLocation: "Paragraph 2", category: "Casework practice", evidenceType: "Performance review evidence", confidence: "high" },
  { id: 1104, documentId: "demo-cs-review", statement: "Gave informal guidance to two newer colleagues when they've asked for it.", excerpt: "Amara has given informal guidance to two newer colleagues when they've asked for it.", sourceLocation: "Paragraph 3", category: "Working with others", evidenceType: "Performance review evidence", confidence: "high" },
  { id: 1105, documentId: "demo-cs-manager", statement: "Colleagues sometimes ask her for guidance on tricky cases.", excerpt: "Colleagues sometimes ask her for guidance on tricky cases.", sourceLocation: "Paragraph 2", category: "Leadership", evidenceType: "Manager feedback", confidence: "medium" },
  { id: 1106, documentId: "demo-cs-audit", statement: "Collected baseline processing-time data, attended working group sessions, and tested the redesigned triage process ahead of rollout.", excerpt: "Amara collected baseline processing-time data, attended working group sessions, and tested the redesigned triage process ahead of rollout.", sourceLocation: "Paragraph 2", category: "Process improvement", evidenceType: "Working group report", confidence: "high" },
  { id: 1107, documentId: "demo-cs-audit", statement: "Average case processing time fell from approximately 18 days to 11 days after the redesigned triage process was introduced.", excerpt: "Average case processing time fell from approximately 18 days to 11 days after the redesigned triage process was introduced.", sourceLocation: "Paragraph 3", category: "Process improvement", evidenceType: "Project outcome", confidence: "high" },
  { id: 1108, documentId: "demo-cs-audit", statement: "Amara is identified as a working-group member, not as the group's chair or lead.", excerpt: "The report names the working group's sponsor as a named HEO. It identifies Amara as a working-group member. It does not identify Amara as the working group's chair or lead.", sourceLocation: "Paragraph 4", category: "Process improvement", evidenceType: "Attribution qualification", confidence: "high" },
  { id: 1109, documentId: "demo-cs-peer", statement: "Provided informal guidance to a colleague on handling an escalation, with no formal record kept.", excerpt: "Thanks for talking me through how to handle that escalation last week — really helped me get my head around it. No formal record of this guidance was kept beyond this note.", sourceLocation: "Paragraph 1", category: "Working with others", evidenceType: "Colleague feedback", confidence: "medium" },
];

export const civilServiceRequirements = [
  { id: 1201, category: "Working Together", criterion: "Actively build relationships across teams and organisations", sourceLocation: "Paragraph 2" },
  { id: 1202, category: "Communicating and Influencing", criterion: "Provide advice and recommendations to others outside own direct area", sourceLocation: "Paragraph 3" },
  { id: 1203, category: "Making Effective Decisions", criterion: "Take responsibility for decisions, and escalate where required", sourceLocation: "Paragraph 4" },
  { id: 1204, category: "Delivering at Pace", criterion: "Manage overall performance of a piece of work against agreed milestones", sourceLocation: "Paragraph 5" },
  { id: 1205, category: "Leadership", criterion: "Take a lead role in developing colleagues, including through coaching and mentoring", sourceLocation: "Paragraph 6" },
  { id: 1206, category: "Leadership", criterion: "Lead and support others through change, engaging with people to explain the reasons for it", sourceLocation: "Paragraph 6" },
  { id: 1207, category: "Desirable", criterion: "Chaired or led a working group or project", sourceLocation: "Paragraph 8" },
  { id: 1208, category: "Desirable", criterion: "Formally mentored or coached a colleague", sourceLocation: "Paragraph 8" },
];

export const civilServiceCurrentRoleResponsibilities = [
  { id: 1401, category: "Casework practice", criterion: "Manage an allocated operational caseload under agreed procedures, escalating complex or borderline decisions.", sourceLocation: "Paragraph 3" },
  { id: 1402, category: "Working with others", criterion: "Contribute to team and working-group meetings as a member.", sourceLocation: "Paragraph 6" },
  { id: 1403, category: "Working with others", criterion: "Offer informal guidance to colleagues when asked, within own area of experience.", sourceLocation: "Paragraph 7" },
  { id: 1404, category: "Process improvement", criterion: "Take part in process-improvement activity as directed, including data collection and testing.", sourceLocation: "Paragraph 10" },
  { id: 1405, category: "Process improvement", criterion: "Support implementation of agreed process changes within own team.", sourceLocation: "Paragraph 11" },
  { id: 1406, category: "Role boundaries", criterion: "Chairing or leading a working group, formally mentoring colleagues, and independent ownership of a change initiative are not assigned within this role description.", sourceLocation: "Paragraph 14" },
];

export const civilServiceAssessments = [
  { requirementId: 1201, assessment: "directly_evidenced", strength: "strong", evidenceIds: [1101, 1102], interpretation: "The CV directly documents cross-team liaison on complex cases.", gap: "No material gap identified in the supplied evidence.", nextStep: null },
  { requirementId: 1202, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [1105, 1109], interpretation: "Colleague and manager feedback show Amara is approached informally for advice. This is relevant but doesn't establish advising outside her own direct area or influencing stakeholders.", gap: "Advice or influence beyond her immediate team or area is not documented.", nextStep: "Look for or create an opportunity to advise a different team or stakeholder group, and keep a record of it.", components: [{ component: "Informal advice within own team", assessment: "directly_evidenced", evidenceIds: [1105, 1109], interpretation: "Colleagues within her own team ask for guidance; this is directly documented.", gap: "No material gap for this narrower point." }, { component: "Advice or influence outside own direct area", assessment: "not_found", evidenceIds: [], interpretation: "No source shows advice given to people outside her own team or area.", gap: "Retain a record of any cross-team advice or stakeholder influence." }] },
  { requirementId: 1203, assessment: "directly_evidenced", strength: "strong", evidenceIds: [1101, 1103], interpretation: "The CV and review directly document independent casework and escalation of complex or borderline decisions.", gap: "No material gap identified.", nextStep: null },
  { requirementId: 1204, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [1106], interpretation: "The working-group report shows Amara delivered specific tasks (data collection, testing) to a working group's timeline, but it doesn't show her personally managing a piece of work's overall milestones.", gap: "Ownership of a work plan or its milestones isn't documented.", nextStep: "Take on a bounded piece of work with its own milestones and keep the plan and progress record." },
  { requirementId: 1205, assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [1104, 1109], interpretation: "The review and colleague note document informal, ad hoc guidance. This is relevant to developing colleagues but doesn't establish structured coaching or mentoring.", gap: "No formal coaching or mentoring relationship, plan, or review is documented.", nextStep: "Take on a formal mentoring assignment and retain the mentoring agreement, session notes, and outcome.", components: [{ component: "Informal guidance", assessment: "directly_evidenced", evidenceIds: [1104, 1109], interpretation: "Ad hoc guidance to colleagues is directly documented.", gap: "This alone does not establish structured coaching or mentoring." }, { component: "Formal coaching or mentoring", assessment: "not_found", evidenceIds: [], interpretation: "No source describes a formal coaching or mentoring assignment.", gap: "Retain a mentoring agreement, session record, and outcome." }] },
  { requirementId: 1206, assessment: "contradicted", strength: "contradicted", evidenceIds: [1108], interpretation: "The working-group report explicitly names a different person as the group's sponsor and identifies Amara as a member, not as leading the group or the change.", gap: "There is no supplied evidence of Amara leading colleagues through a change.", nextStep: "Build direct evidence of leading a change: seek a defined leadership remit, and retain the plan, communications, and outcome.", components: [{ component: "Contribute to a change process", assessment: "directly_evidenced", evidenceIds: [1106], interpretation: "Data collection and testing contribution is directly documented.", gap: "This does not establish leading colleagues through the change." }, { component: "Lead colleagues through change", assessment: "contradicted", evidenceIds: [1108], interpretation: "The report explicitly identifies membership, not leadership of the working group.", gap: "Retain a defined leadership remit and evidence of engaging colleagues through a change." }] },
  { requirementId: 1207, assessment: "contradicted", strength: "contradicted", evidenceIds: [1108], interpretation: "The report explicitly identifies Amara as a member, not as chair or lead, of the working group.", gap: "No supplied evidence of chairing or leading a working group.", nextStep: "Seek a chairing or leading opportunity and retain the appointment, agendas, and decisions record." },
  { requirementId: 1208, assessment: "not_found", strength: "not_demonstrated", evidenceIds: [], interpretation: "No supplied document records a formal mentoring or coaching relationship.", gap: "Formal mentoring/coaching evidence is not found in the current library.", nextStep: "Take on a mentoring assignment and retain the agreement, session notes, and a reflection on progress." },
];

export const civilServiceContradictions = [
  { id: 1301, type: "Participation versus leadership", severity: "unsupported", claim: "A claim of chairing or leading the triage working group would not be supported by the report.", explanation: "The report names a different person as the working group's sponsor and identifies Amara as a member, not chair or lead. This shouldn't be represented as proof of leading the group.", evidenceIds: [1108] },
  { id: 1302, type: "Outcome attribution", severity: "review", claim: "The processing-time reduction should be attributed to the working group's redesigned process, not solely to Amara.", explanation: "The report records an 18-to-11-day change following the process redesign but doesn't establish that one individual caused it.", evidenceIds: [1107, 1108] },
];

export const civilServiceObjectiveReports = {
  A: { objective: "A" as const, mappings: civilServiceAssessments },
  B: {
    objective: "B" as const,
    documentedAchievements: [
      { title: "Independent casework practice", statement: "The CV and review document an independent caseload with escalation of complex or borderline decisions.", evidenceIds: [1101, 1103], qualification: "The supplied sources don't quantify decision volume beyond these documented examples.", action: null },
      { title: "Colleague support", statement: "Amara has given informal guidance to colleagues within her own team when asked.", evidenceIds: [1104, 1109], qualification: "This is informal and ad hoc, not a structured coaching or mentoring role.", action: null },
      { title: "Process-improvement contribution", statement: "The working-group report records data collection, meeting attendance, and testing of the redesigned triage process.", evidenceIds: [1106], qualification: "The record identifies working-group membership, not chairing or leading the group.", action: null },
    ],
    documentedImpact: [{ title: "Documented working-group-level processing-time change", statement: "The report records an average processing-time reduction from approximately 18 to 11 days following the redesigned triage process.", evidenceIds: [1107], qualification: "This is documented working-group-level impact, not evidence that Amara alone caused or evaluated the change.", action: null }],
    evidenceLimitations: [{ title: "Working-group leadership and individual causation are not established", statement: "The report names a different person as the working group's sponsor and identifies Amara as a member, not chair or lead.", evidenceIds: [1107, 1108], qualification: "Amara's contribution remains a documented achievement; the limitation concerns leadership and individual causation only.", action: "Use membership/contribution language when describing this work, and retain any future chairing or leading role separately." }],
    developmentThemes: [{ title: "Formal leadership and mentoring", statement: "The current evidence documents informal guidance and working-group participation, but not a formal mentoring role or a chairing/leading remit.", evidenceIds: [1105, 1108], qualification: "The absence is within the supplied corpus, not a statement about potential.", action: "Seek a defined mentoring assignment or a chance to chair a piece of work." }],
    evidenceGroundedObjectives: [{ title: "Chair or lead a bounded piece of work", statement: "Build on documented working-group participation by taking a defined future responsibility for chairing or leading a piece of work, including its plan, stakeholder engagement, and outcome.", evidenceIds: [1106, 1108], qualification: "This is a future evidence-building objective, not a claim that leadership is already demonstrated.", action: "Retain the appointment, plan, meeting notes, and outcome record." }],
    suggestedEvidenceToRetain: [{ title: "Formal mentoring record", statement: "Guidance to colleagues is documented, but no formal mentoring relationship is recorded.", evidenceIds: [1109], qualification: "A thank-you note alone does not show a structured mentoring relationship.", action: "Retain a mentoring agreement, session notes, and a reflection on the colleague's progress." }],
  },
  C: {
    objective: "C" as const,
    comparisons: [
      { responsibilityId: 1401, documentedActualActivity: "Independent caseload management with escalation of complex or borderline decisions is documented.", alignment: "aligned" as const, evidenceIds: [1101, 1103], qualification: "The evidence documents activity; it does not determine a job-evaluation outcome.", discussionPoint: "How is the documented independent casework activity reflected in the current role description and local procedures?", strengtheningEvidence: "Retain a current casework log and corroborated examples of independent decisions." },
      { responsibilityId: 1402, documentedActualActivity: "Working-group meeting attendance and contribution (data collection, testing) is documented.", alignment: "aligned" as const, evidenceIds: [1106], qualification: "The report confirms membership, not chairing or leading the group.", discussionPoint: "How is working-group membership and contribution reflected in the current role?", strengtheningEvidence: "Retain working-group terms of reference, allocated tasks, and corroborated contribution records." },
      { responsibilityId: 1403, documentedActualActivity: "Informal guidance to colleagues within her own team, given when asked, is documented.", alignment: "aligned" as const, evidenceIds: [1104, 1109], qualification: "A formal mentoring or coaching allocation isn't documented.", discussionPoint: "Is informal, ad hoc guidance to colleagues formally recognised within the current role?", strengtheningEvidence: "Retain any mentoring allocation, role brief, and corroborated feedback." },
      { responsibilityId: 1404, documentedActualActivity: "Data collection and testing for the triage redesign, as directed, is documented.", alignment: "aligned" as const, evidenceIds: [1106], qualification: "The evidence documents directed participation, not independent ownership of the change.", discussionPoint: "How is directed process-improvement participation reflected in the current role wording?", strengtheningEvidence: "Retain the working-group's terms of reference and Amara's allocated tasks within it." },
      { responsibilityId: 1405, documentedActualActivity: "The report records testing of the redesigned triage process ahead of rollout.", alignment: "potentially_broader_responsibility" as const, evidenceIds: [1106, 1108], qualification: "The evidence may indicate activity somewhat beyond simple implementation support, but it doesn't establish independent ownership of the change or the working group.", discussionPoint: "Could the documented testing and data contribution be clarified against the current wording of \"support implementation\"?", strengtheningEvidence: "Retain the allocated change remit, decision records, and implementation log." },
      { responsibilityId: 1406, documentedActualActivity: "The available evidence identifies Amara as a working-group member and does not identify her as chair, lead, or a formal mentor.", alignment: "aligned" as const, evidenceIds: [1108], qualification: "This does not establish independent ownership of a change initiative or a formal mentoring role.", discussionPoint: "Are the current role boundaries and the documented working-group contribution understood consistently by Amara and her manager?", strengtheningEvidence: "Retain any future chairing, leading, or formal mentoring role separately from membership evidence." },
    ],
    questionsForDiscussion: [
      { title: "Clarifying scope of change activity", statement: "Which parts of testing and implementation support are routinely expected in the current role, and which would be additional if Amara took on a leading role?", evidenceIds: [1106, 1108], qualification: "This question does not assume that the activity changes grade.", action: null },
      { title: "Clarifying guidance and mentoring", statement: "Is the documented guidance a one-off informal contribution or part of a role that could include a formal mentoring assignment?", evidenceIds: [1104, 1109], qualification: "The current evidence does not establish a formal mentoring remit.", action: null },
    ],
  },
};

export type DemoScenarioId = "specialist-advisor" | "civil-service";

export const demoScenarios: { id: DemoScenarioId; personName: string; blurb: string }[] = [
  { id: "specialist-advisor", personName: "Sarah Mwangi", blurb: "a made-up Grade 6 specialist advisor going for Grade 7, checked against a traditional person specification" },
  { id: "civil-service", personName: "Amara Okafor", blurb: "a made-up Civil Service EO going for HEO, checked against Success Profile behaviour statements" },
];

// The document ids these two scenarios' evidence items reference by
// documentId, in the same order as their documents array -- kept alongside
// getDemoBundle so a mismatch between the two can't silently drop evidence.
const specialistAdvisorDocumentKeys = ["demo-cv", "demo-appraisal", "demo-audit", "demo-feedback", "demo-teaching"];
const civilServiceDocumentKeys = ["demo-cs-cv", "demo-cs-review", "demo-cs-audit", "demo-cs-manager", "demo-cs-peer"];

export function getDemoBundle(scenario: DemoScenarioId = "specialist-advisor") {
  if (scenario === "civil-service") {
    return {
      scenario,
      personName: "Amara Okafor",
      profile: civilServiceProfile,
      documents: civilServiceDocuments,
      documentKeys: civilServiceDocumentKeys,
      target: civilServiceTarget,
      currentRole: civilServiceCurrentRole,
      evidence: civilServiceEvidence,
      requirements: civilServiceRequirements,
      currentRoleResponsibilities: civilServiceCurrentRoleResponsibilities,
      assessments: civilServiceAssessments,
      contradictions: civilServiceContradictions,
      objectiveReports: civilServiceObjectiveReports,
    };
  }
  return {
    scenario: "specialist-advisor" as const,
    personName: "Sarah Mwangi",
    profile: demoProfile,
    documents: demoDocuments,
    documentKeys: specialistAdvisorDocumentKeys,
    target: demoTarget,
    currentRole: demoCurrentRole,
    evidence: demoEvidence,
    requirements: demoRequirements,
    currentRoleResponsibilities: demoCurrentRoleResponsibilities,
    assessments: demoAssessments,
    contradictions: demoContradictions,
    objectiveReports: demoObjectiveReports,
  };
}

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
