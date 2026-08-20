import { describe, expect, it } from "vitest";
import { detectPlainTextConflicts, locationForParagraph, paragraphize } from "./evidenceEngine";

describe("evidence source safeguards", () => {
  it("uses only a known paragraph when describing a source location", () => {
    const paragraphs = paragraphize("Heading\n\nSarah participated in the audit team.");
    expect(locationForParagraph(1, paragraphs)).toBe("Section: Heading · Paragraph 2");
    expect(locationForParagraph(5, paragraphs)).toBe("Location not established");
  });

  it("flags contradictory experience durations rather than choosing one", () => {
    const findings = detectPlainTextConflicts([
      { id: 1, title: "CV", extractedText: "Sarah has 3 years specialist experience." },
      { id: 2, title: "Appraisal", extractedText: "Sarah has 2 years specialist experience." },
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("review");
  });
});
