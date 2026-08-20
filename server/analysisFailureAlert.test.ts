import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalysisFailureAlert } from "../client/src/components/AnalysisFailureAlert";

describe("AnalysisFailureAlert", () => {
  it("renders a persistent actionable message for an invalid Objective B generation", () => {
    const html = renderToStaticMarkup(React.createElement(AnalysisFailureAlert, { message: "Objective B could not generate a validated, source-linked appraisal report (malformed json). No empty report has been saved." }));
    expect(html).toContain("Analysis was not saved");
    expect(html).toContain("malformed json");
    expect(html).toContain("No empty report has been saved");
    expect(html).toContain("evidence library and prior analyses remain unchanged");
  });
});
