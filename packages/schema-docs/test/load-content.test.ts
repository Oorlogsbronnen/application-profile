import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPageContent } from "../src/load-content.js";

const fixtures = resolve(__dirname, "fixtures");

describe("loadPageContent", () => {
  it("laadt toelichting en voorbeelden van schijf", () => {
    const content = loadPageContent({
      editorialPath: resolve(fixtures, "_toelichting.mdx"),
      classExamplesDir: resolve(fixtures, "examples"),
      fullExamplesDir: resolve(fixtures, "examples/volledig"),
    });

    expect(content.editorial).toBe("Toelichting uit het fixture-bestand.");
    expect([...content.classExamples.keys()]).toEqual(["EventShape"]);
    expect(content.classExamples.get("EventShape")).toContain(
      "Voorbeeldgebeurtenis",
    );
    expect(content.fullExamples.map((example) => example.name)).toEqual([
      "persoon",
    ]);
  });

  it("levert lege inhoud als bestanden en mappen ontbreken", () => {
    const content = loadPageContent({
      editorialPath: resolve(fixtures, "bestaat-niet.mdx"),
      classExamplesDir: resolve(fixtures, "bestaat-niet"),
      fullExamplesDir: resolve(fixtures, "bestaat-niet/volledig"),
    });

    expect(content.editorial).toBeNull();
    expect(content.classExamples.size).toBe(0);
    expect(content.fullExamples).toEqual([]);
  });

  it("breekt met een duidelijke melding op een kapot voorbeeldbestand", () => {
    expect(() =>
      loadPageContent({
        editorialPath: resolve(fixtures, "bestaat-niet.mdx"),
        classExamplesDir: resolve(fixtures, "kapot"),
        fullExamplesDir: resolve(fixtures, "bestaat-niet"),
      }),
    ).toThrowError(/kapot\.jsonld bevat geen geldige JSON/);
  });
});
