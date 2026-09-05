// Content for the Civil Service Success Profiles behaviour guides
// (client/src/pages/guides/*, server/_core/guideHtml.ts). Lives under
// shared/ rather than client/src or server/ so both sides import the exact
// same data -- the server needs it to render real per-page <title>/meta/
// content for crawlers (see server/_core/guideHtml.ts, same reasoning as
// server/_core/sharedResultHtml.ts), and the client needs it for the
// interactive page. One source of truth, not a copy kept in sync by hand.
//
// These are genuinely written guides, not thin SEO filler -- each one
// explains what the behaviour actually means, what assessors are scored
// against (per the Civil Service Success Profiles / STAR framework), and a
// realistic worked example, because the whole point of ranking for these
// search terms is to be worth landing on, not just to exist.

export type CivilServiceBehaviourSlug =
  | "seeing-the-big-picture"
  | "changing-and-improving"
  | "making-effective-decisions"
  | "leadership"
  | "communicating-and-influencing"
  | "working-together"
  | "developing-self-and-others"
  | "managing-a-quality-service"
  | "delivering-at-pace";

export type CivilServiceBehaviourGuide = {
  slug: CivilServiceBehaviourSlug;
  name: string;
  standsFor: string;
  metaDescription: string;
  overview: string;
  assessorsLookFor: string[];
  commonMistakes: string[];
  starGuidance: { label: string; guidance: string }[];
  workedExample: { situation: string; task: string; action: string; result: string };
};

export const civilServiceBehaviourGuides: CivilServiceBehaviourGuide[] = [
  {
    slug: "delivering-at-pace",
    name: "Delivering at Pace",
    standsFor: "Planning and organising your own work and other people's to hit a high standard, on time, without losing sight of risk.",
    metaDescription: "How to write a strong Delivering at Pace example for a Civil Service application, with what assessors score and a worked STAR example.",
    overview: "Delivering at Pace is about proving you can plan realistically, keep momentum under pressure, and still produce good work — not just that you're busy or that you finished something quickly. Assessors are checking for evidence of planning, prioritisation, and taking ownership of outcomes, not just activity.",
    assessorsLookFor: [
      "A specific plan you made — not just \"I worked hard\"",
      "How you prioritised competing demands, and why",
      "What you did when something threatened the timeline or the quality bar",
      "A measurable result: what got delivered, by when, to what standard",
    ],
    commonMistakes: [
      "Describing a busy period rather than a specific piece of delivery",
      "Taking credit for a team's pace without describing your own planning or prioritisation",
      "Leaving out what happened when things went wrong — assessors want to see you handle pressure, not just describe a smooth run",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Set the deadline and the constraint plainly — what had to be done, by when, and what made that hard (competing priorities, limited resource, a moving deadline)." },
      { label: "Task", guidance: "State what you specifically were responsible for delivering, not what the team or department delivered." },
      { label: "Action", guidance: "Describe how you planned and re-planned — what you prioritised, what you deprioritised, and how you kept quality up under time pressure." },
      { label: "Result", guidance: "Give a concrete outcome with a number or a clear before/after if you can: delivered on time, reduced a backlog, hit a deadline that looked at risk." },
    ],
    workedExample: {
      situation: "Our team had eight weeks to migrate a case-handling process onto a new system before the old one was decommissioned, and two of the five people originally assigned were reassigned in week two.",
      task: "As the lead caseworker on the project, I was responsible for re-planning the migration and making sure live cases weren't disrupted during the switch.",
      action: "I re-sequenced the migration plan to move the highest-risk case types first while the team was still at full strength, built a simple daily tracker so gaps were visible immediately rather than at the next weekly check-in, and flagged the resourcing risk to my manager early enough that a temporary extra pair of hands was approved for the final two weeks.",
      result: "The migration completed on the original deadline with zero live cases lost or delayed, and the daily tracker was adopted by another team running a similar migration later that year.",
    },
  },
  {
    slug: "working-together",
    name: "Working Together",
    standsFor: "Building genuinely collaborative relationships, valuing diverse perspectives, and stepping outside your own team's interests for a shared outcome.",
    metaDescription: "How to write a strong Working Together example for a Civil Service application, with what assessors score and a worked STAR example.",
    overview: "Working Together is often under-scored because candidates describe being friendly or getting on with colleagues, rather than a specific instance of active collaboration — resolving a disagreement, bringing in a perspective that changed the outcome, or making an inconvenient compromise for a shared goal.",
    assessorsLookFor: [
      "A specific relationship or collaboration, not \"I'm a team player\"",
      "Evidence you actively sought out or valued a different perspective, rather than just working alongside people",
      "How you handled friction or disagreement, if there was any",
      "A shared outcome that wouldn't have happened without the collaboration",
    ],
    commonMistakes: [
      "Generic claims (\"I always work well with others\") with no specific incident behind them",
      "Describing your own individual contribution to a group project rather than the collaboration itself",
      "Avoiding any mention of disagreement or difficulty — a frictionless story is less convincing than one showing how you handled a real difference of opinion",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Describe who you needed to work with and why it mattered — a different team, an external partner, someone with a conflicting priority." },
      { label: "Task", guidance: "Say what the shared goal was, and what made reaching it require real collaboration rather than just parallel work." },
      { label: "Action", guidance: "Show what you actually did to build the relationship or resolve friction — asking questions, adjusting your own position, finding common ground." },
      { label: "Result", guidance: "State the outcome for the shared goal, and ideally something about the relationship itself (it continued, it improved, the other party changed their view)." },
    ],
    workedExample: {
      situation: "A policy change my team was implementing required sign-off from a delivery team who disagreed with our proposed rollout date, arguing it would clash with their own peak period.",
      task: "I needed to reach an agreement that kept our statutory deadline but didn't damage the working relationship or overload their team.",
      action: "I set up a joint working session rather than exchanging emails, asked them to walk me through exactly what their peak period involved, and we jointly redesigned a phased rollout that met our legal deadline for the highest-priority cases while pushing the lower-priority ones back four weeks.",
      result: "The statutory deadline was met in full, the delivery team's peak period was protected, and they proactively looped us into their planning on two later projects as a result.",
    },
  },
  {
    slug: "making-effective-decisions",
    name: "Making Effective Decisions",
    standsFor: "Using evidence and diverse perspectives to reach sound conclusions, and being able to justify decisions under scrutiny.",
    metaDescription: "How to write a strong Making Effective Decisions example for a Civil Service application, with what assessors score and a worked STAR example.",
    overview: "This behaviour is scored on your reasoning, not just your outcome. Assessors want to see that you gathered relevant evidence, considered more than one option, and can explain why you chose what you chose — including what you'd have done differently with more time or information.",
    assessorsLookFor: [
      "What evidence or information you actually gathered before deciding",
      "That you considered at least one genuine alternative, not just the option you picked",
      "Awareness of risk, and how you managed or accepted it",
      "A clear rationale you could defend if challenged",
    ],
    commonMistakes: [
      "Describing a decision with no visible reasoning process behind it — it reads as a guess that happened to work",
      "Picking an example where there was really only one sensible option, which gives the assessor nothing to score",
      "Focusing entirely on the outcome and skipping the actual decision-making process",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Describe the decision that had to be made and why it wasn't obvious — genuine trade-offs, incomplete information, or time pressure." },
      { label: "Task", guidance: "State that the decision (or the recommendation) was yours to make, and what was at stake if you got it wrong." },
      { label: "Action", guidance: "Walk through what you actually did: what you checked, who you consulted, what options you weighed, and why you ruled the others out." },
      { label: "Result", guidance: "Give the outcome, and — this is what separates strong answers — a brief, honest note on what you'd check differently next time." },
    ],
    workedExample: {
      situation: "A supplier missed a delivery date that risked a public-facing service going offline, and I had to decide within a day whether to switch to a more expensive backup supplier or delay the service launch.",
      task: "As the person managing the contract, the recommendation — and the final call within my delegated authority — was mine to make.",
      action: "I checked the backup supplier's actual capacity rather than assuming it from the contract, quantified the cost of a two-week delay against the backup supplier's premium, and consulted the service owner on how much reputational risk a delay would carry.",
      result: "I chose the backup supplier; the service launched on time at roughly 12% above the original budget, which I judged and later confirmed was the smaller risk compared to a public-facing delay.",
    },
  },
  {
    slug: "leadership",
    name: "Leadership",
    standsFor: "Showing pride and integrity in your work, and inspiring others toward a shared goal — with or without formal management authority.",
    metaDescription: "How to write a strong Leadership example for a Civil Service application, with what assessors score and a worked STAR example, including for non-managers.",
    overview: "Leadership doesn't require line-management responsibility. It's about taking ownership, setting a standard others followed, or influencing a group toward a better outcome. Candidates without direct reports often skip this behaviour by mistake — informal leadership (leading a project, setting a standard peers adopted, stepping up in a gap) counts.",
    assessorsLookFor: [
      "Evidence of influence or standard-setting, even without formal authority",
      "That you took ownership of an outcome rather than waiting to be told",
      "How you supported or motivated others, specifically",
      "Integrity under pressure — being honest about a problem rather than hiding it",
    ],
    commonMistakes: [
      "Assuming this behaviour only applies to people managers and skipping it or forcing a weak example",
      "Describing formal authority (\"I'm the team lead so I told them what to do\") instead of the influence or standard-setting itself",
      "No mention of how anyone else was actually affected by your leadership",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Set out the context that needed leadership — a gap, a problem nobody had picked up, a team that needed direction." },
      { label: "Task", guidance: "Be honest about your actual authority level; strong non-manager examples explicitly note you didn't have formal authority and led anyway." },
      { label: "Action", guidance: "Describe specifically how you influenced or supported others — what you said, modelled, or organised." },
      { label: "Result", guidance: "State what changed for the team or the outcome, and where possible, evidence that others adopted what you set in motion." },
    ],
    workedExample: {
      situation: "Our team lead was on long-term leave with no immediate replacement, and a backlog of urgent cases started building with nobody clearly coordinating the response.",
      task: "I had no formal authority to direct the team, but the backlog was a service risk and someone needed to coordinate a response.",
      action: "I proposed and ran a short daily stand-up to triage the backlog by urgency, volunteered to take the highest-risk cases myself, and was transparent with the wider team about what was and wasn't getting covered so nothing fell through silently.",
      result: "The backlog was cleared within three weeks with no missed statutory deadlines, and when our team lead returned, the daily triage stand-up was kept on as standard practice.",
    },
  },
  {
    slug: "communicating-and-influencing",
    name: "Communicating and Influencing",
    standsFor: "Communicating clearly and with impact, and being able to adapt your message and influence people who don't automatically agree with you.",
    metaDescription: "How to write a strong Communicating and Influencing example for a Civil Service application, with what assessors score and a worked STAR example.",
    overview: "This is scored on adapting your communication to your audience and genuinely changing a view or decision — not on being a confident speaker. A strong example usually involves someone who disagreed or was indifferent at the start, and a specific reason your communication moved them.",
    assessorsLookFor: [
      "That your audience started from a different position (disagreement, indifference, confusion) and your communication changed that",
      "Evidence you adapted your message for the audience, rather than delivering the same pitch regardless",
      "Clarity — a complex or technical point made genuinely understandable to a non-specialist",
      "The actual outcome of the influence, not just that you communicated",
    ],
    commonMistakes: [
      "Describing a presentation or report with no evidence anyone's mind was changed",
      "Confusing this with simply being articulate — assessors want influence, not just clear delivery",
      "No sense of who the audience actually was or why they needed convincing",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Set out who needed convincing and what their starting position was — sceptical, uninformed, actively opposed." },
      { label: "Task", guidance: "State what you needed them to agree to, understand, or do differently." },
      { label: "Action", guidance: "Show how you adapted the message for that specific audience — the language, the format, what you emphasised and what you left out." },
      { label: "Result", guidance: "Give the concrete change: a decision reversed, a plan adopted, a stakeholder who came on board." },
    ],
    workedExample: {
      situation: "A senior stakeholder was sceptical of a new evidence-based process I was proposing, having seen a similar initiative fail two years earlier under a previous team.",
      task: "I needed their sign-off to pilot the process with my team, but a straightforward pitch on the merits wasn't going to be enough given their prior experience.",
      action: "Rather than repeating the case for the process itself, I asked what specifically had gone wrong last time, addressed those two failure points directly in my proposal, and offered a four-week pilot with a clear stop point rather than asking for a full rollout commitment upfront.",
      result: "The stakeholder approved the pilot; it ran the full four weeks, cut processing errors by a fifth, and was extended to two further teams on their recommendation.",
    },
  },
  {
    slug: "developing-self-and-others",
    name: "Developing Self and Others",
    standsFor: "Investing time and effort in developing yourself and supporting others to develop, building capability across the team.",
    metaDescription: "How to write a strong Developing Self and Others example for a Civil Service application, with what assessors score and a worked STAR example.",
    overview: "Assessors want a specific development action with a visible outcome — a skill you built and applied, or someone else's capability you actively supported — not a general claim of caring about development.",
    assessorsLookFor: [
      "A specific development need identified (yours or someone else's), not a vague aspiration",
      "What you actually did to close the gap — not just attending a course, but applying it",
      "For developing others: evidence you tailored your support to that person, rather than generic advice",
      "A measurable change in capability or confidence as a result",
    ],
    commonMistakes: [
      "Listing training courses attended with no evidence of what changed as a result",
      "Vague claims about mentoring with no specific person, gap, or outcome",
      "Only covering self-development when the role also wants evidence of developing others (or vice versa) — check the job advert for which the assessors will focus on",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Identify the specific gap — a skill you lacked, or a colleague who was struggling with something specific." },
      { label: "Task", guidance: "State what closing that gap needed to look like, and by when if there was a deadline." },
      { label: "Action", guidance: "Describe the actual development activity and, crucially, how you applied or reinforced it in real work rather than leaving it as a course certificate." },
      { label: "Result", guidance: "Give the concrete change: a new skill used successfully, a colleague's independent performance, a measurable improvement." },
    ],
    workedExample: {
      situation: "A newer team member was consistently missing a specific compliance step in casework, which had already caused two cases to need rework.",
      task: "As the more experienced caseworker they were paired with, I needed to close that specific gap without undermining their confidence.",
      action: "Rather than a general 'be more careful' conversation, I sat with them through three live cases, isolated exactly which step of the checklist they were skipping and why, and built a one-page visual checklist tailored to that gap that they kept at their desk.",
      result: "No further compliance errors from that gap over the following two months, and two other new starters asked to use the same checklist after seeing it.",
    },
  },
  {
    slug: "managing-a-quality-service",
    name: "Managing a Quality Service",
    standsFor: "Being organised to deliver service objectives, and giving members of the public or service users a consistently good experience.",
    metaDescription: "How to write a strong Managing a Quality Service example for a Civil Service application, with what assessors score and a worked STAR example.",
    overview: "This behaviour is scored on service standards and consistency, not effort. Assessors want evidence you understood what a good service actually looked like from the user's perspective, and did something specific to protect or improve it.",
    assessorsLookFor: [
      "A clear standard or expectation you were working to (a service level, a policy requirement, a user need)",
      "Evidence you understood the service from the user's point of view, not just the process from your own side",
      "What you did specifically to maintain or improve quality under pressure",
      "A measurable service outcome — accuracy, timeliness, satisfaction, consistency",
    ],
    commonMistakes: [
      "Describing general diligence (\"I always double-check my work\") with no specific service standard or user impact behind it",
      "No mention of the user's actual experience — only the internal process",
      "Confusing this with Delivering at Pace by focusing entirely on speed rather than quality and consistency",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Describe the service standard at stake and what put it under pressure — high volume, a process gap, inconsistent practice." },
      { label: "Task", guidance: "State what quality outcome you were responsible for protecting or improving." },
      { label: "Action", guidance: "Show specifically what you did — a check you introduced, a process you tightened, feedback you acted on from users." },
      { label: "Result", guidance: "Give the measurable service outcome, and ideally something from the user's side (fewer complaints, faster resolution, more consistent decisions)." },
    ],
    workedExample: {
      situation: "Case decisions from our team were being returned for rework by the quality-assurance team at a noticeably higher rate than other teams, and complaints about inconsistent decisions had started coming in.",
      task: "I was asked to identify the cause and bring our rework rate back in line with the service standard.",
      action: "I reviewed a sample of the returned cases myself rather than assuming the QA feedback was self-explanatory, found the errors clustered around one ambiguous section of guidance, and ran a short session walking the team through worked examples of that specific section.",
      result: "The rework rate dropped from 18% to under 6% within one reporting period, and the clarified worked examples were adopted into the team's onboarding material.",
    },
  },
  {
    slug: "changing-and-improving",
    name: "Changing and Improving",
    standsFor: "Seeking out opportunities to create effective change, and being open to change and improvement yourself.",
    metaDescription: "How to write a strong Changing and Improving example for a Civil Service application, with what assessors score and a worked STAR example.",
    overview: "Assessors want evidence you identified an improvement yourself (rather than only implementing a change handed to you) and can show it actually worked, including how you handled resistance if there was any.",
    assessorsLookFor: [
      "That you identified the need for change, ideally proactively rather than being told to",
      "A reasoned case for the change, not just an instinct that something should be different",
      "How you handled any resistance or scepticism to the change",
      "A measured result — the change actually being adopted and working, not just proposed",
    ],
    commonMistakes: [
      "Describing a change that was mandated from above and implemented, with no evidence of your own initiative",
      "No mention of resistance or difficulty — most real improvements meet some pushback, and showing how you handled it is part of what's being assessed",
      "Stopping at the proposal stage without evidence the change actually delivered a result",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Describe what wasn't working and how you noticed it — a pattern, a piece of feedback, a repeated inefficiency." },
      { label: "Task", guidance: "State what you set out to change, and whether this was your own initiative." },
      { label: "Action", guidance: "Show how you built the case for the change and brought others with you, especially if there was resistance." },
      { label: "Result", guidance: "Give the outcome of the change once adopted — a measurable improvement, and evidence it stuck rather than being a one-off." },
    ],
    workedExample: {
      situation: "I noticed our team was manually re-entering the same applicant data into two separate systems, and had done so unquestioned for years.",
      task: "I wanted to remove the duplicate step, but the change needed sign-off from a manager who was cautious about altering an established process close to a busy period.",
      action: "I mapped exactly where the duplication happened and quantified the time cost per case, ran a two-week trial with my own caseload before proposing it team-wide, and addressed the manager's specific concern by scheduling the wider rollout after the busy period rather than during it.",
      result: "The duplicate step was removed for the whole team, saving roughly 15 minutes per case, and the trial-then-scale approach was later used as the template for two other process changes.",
    },
  },
  {
    slug: "seeing-the-big-picture",
    name: "Seeing the Big Picture",
    standsFor: "Understanding how your work fits into the wider organisational and public context, and keeping that context in mind when you act.",
    metaDescription: "How to write a strong Seeing the Big Picture example for a Civil Service application, with what assessors score and a worked STAR example.",
    overview: "Assessors want evidence that you look beyond your immediate task to the wider goal it serves — organisational priorities, other teams' needs, or the public interest — and that this understanding actually shaped a decision you made.",
    assessorsLookFor: [
      "Evidence you understood a wider context — organisational strategy, cross-government priorities, public impact — beyond your immediate task",
      "That the wider context genuinely changed what you did, not just that you were aware of it",
      "Balancing your own team's priorities against a bigger goal when they came into tension",
      "A result connected back to that bigger picture, not just your immediate task",
    ],
    commonMistakes: [
      "Describing awareness of the big picture with no evidence it affected an actual decision",
      "Staying entirely within your own team's perspective with no connection made to a wider goal",
      "Confusing this with Making Effective Decisions by focusing on the decision process rather than the wider context that shaped it",
    ],
    starGuidance: [
      { label: "Situation", guidance: "Set out the immediate task and the wider context it sat within — a department priority, a public commitment, another team's dependency on your work." },
      { label: "Task", guidance: "State what you needed to deliver, and why the wider context mattered to how you approached it." },
      { label: "Action", guidance: "Show specifically how the bigger picture changed what you did — a different priority order, a decision made with another team's needs in mind." },
      { label: "Result", guidance: "Give the outcome, ideally tying it back explicitly to the wider goal it served." },
    ],
    workedExample: {
      situation: "My team was asked to prioritise clearing our own backlog, but I was aware the department had a public commitment to reduce processing times for a specific vulnerable applicant group that overlapped with part of that backlog.",
      task: "I needed to decide how to sequence the backlog in a way that met our own targets without working against that wider commitment.",
      action: "I re-sequenced the backlog to clear the vulnerable-group cases first even though they weren't individually the fastest to process, and flagged the trade-off explicitly to my manager so it was a visible, agreed decision rather than a silent one.",
      result: "Our own backlog target was still met within the reporting period, and the department's public commitment on the vulnerable-group processing time was upheld rather than quietly missed.",
    },
  },
];

export function getCivilServiceBehaviourGuide(slug: string): CivilServiceBehaviourGuide | undefined {
  return civilServiceBehaviourGuides.find(guide => guide.slug === slug);
}
