import { describe, expect, it } from "vitest";
import { demoAssessments, demoContradictions } from "./demoData";

describe("adversarial evidence safeguards", () => {
  it("labels participation as contradicted evidence when the source explicitly rules out project leadership", () => {
    const leadership = demoAssessments.find(item => item.requirementId === 209);
    expect(leadership).toMatchObject({ assessment: "contradicted", strength: "contradicted", evidenceIds: [108] });
  });

  it("treats informal clinical advice as indirectly relevant, not formal leadership", () => {
    const leadership = demoAssessments.find(item => item.requirementId === 203);
    expect(leadership).toMatchObject({ assessment: "indirectly_relevantly_evidenced", strength: "moderate", evidenceIds: [105] });
    expect(leadership?.components).toMatchObject([{ assessment: "indirectly_relevantly_evidenced" }, { assessment: "not_found", evidenceIds: [] }]);
  });

  it("qualifies a service outcome rather than assigning individual causality", () => {
    const attribution = demoContradictions.find(item => item.type === "Outcome attribution");
    expect(attribution?.explanation).toContain("does not establish that one individual caused it");
  });

  it("reports a missing presentation criterion without making up a source", () => {
    const presentation = demoAssessments.find(item => item.requirementId === 210);
    expect(presentation).toMatchObject({ assessment: "not_found", evidenceIds: [] });
  });
});
