import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseShapes } from "../src/parse-shapes.js";
import { emptyPageContent, type PageContent } from "../src/page-content.js";
import { renderPage } from "../src/render-page.js";
import { renderDiagram } from "../src/render-diagram.js";

const turtle = readFileSync(
  resolve(__dirname, "../../../ontology/shapes.ttl"),
  "utf8",
);
const { profile } = parseShapes(turtle);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("renderPage", () => {
  const page = renderPage(profile, emptyPageContent);

  it("gebruikt de Nederlandse naam als koptitel en de local name als anker", () => {
    for (const shape of profile.classShapes) {
      const heading = shape.name ?? shape.localName;
      expect(page).toMatch(
        new RegExp(
          `### \\d+\\.\\d+ ${escapeRegExp(heading)} \\{#${shape.localName}\\}`,
        ),
      );
    }
  });

  it("volgt de documentvolgorde van shapes.ttl", () => {
    expect(page).toContain(
      "### 2.1 Persoonsreconstructies {#PersoonReconstructionShape}",
    );
    expect(page.indexOf("{#PersoonsvermeldingShape}")).toBeLessThan(
      page.indexOf("{#ArchiveShape}"),
    );
  });

  it("toont de volledige IRI onder elke klasse-kop", () => {
    expect(page).toContain(
      "`https://data.oorlogsbronnen.nl/schema#ArchiveShape`",
    );
  });

  it("nummert de hoofdstukken zonder toelichting als 1 en 2", () => {
    expect(page).toContain("## 1. Overzicht {#overzicht}");
    expect(page).toContain("## 2. Klassen {#klassen}");
  });

  it("documenteert de bouwstenen niet meer", () => {
    expect(page).not.toContain("Bouwstenen");
    expect(page).not.toContain("| Regel |");
    expect(page).not.toContain("Rule_");
  });

  it("verwijst bij overerving naar de basis-shape", () => {
    expect(page).toContain(
      "erft alle regels van [`CreativeWorkShape`](#CreativeWorkShape)",
    );
  });

  it("markeert verplichte en uitgesloten properties in de kardinaliteit", () => {
    expect(page).toContain("1 — verplicht");
    expect(page).toContain("0 — niet toegestaan");
  });

  it("bevat de frontmatter voor /schema", () => {
    expect(page).toContain("slug: /schema");
    expect(page).toContain("title: Oorlogsbronnen Application Profile");
  });
});

describe("renderPage met redactionele en voorbeeld-inhoud", () => {
  const content: PageContent = {
    editorial: "Dit profiel bouwt voort op **schema.org**.",
    classExamples: new Map([["EventShape", '{\n  "@type": "sdo:Event"\n}']]),
    fullExamples: [{ name: "persoon", json: '{\n  "@id": "urn:x"\n}' }],
  };
  const page = renderPage(profile, content);

  it("voegt het toelichting-hoofdstuk in als hoofdstuk 2 en schuift Klassen op", () => {
    expect(page).toContain(
      "## 2. Gebruikte datamodellen en vocabulaires {#datamodellen}",
    );
    expect(page).toContain("Dit profiel bouwt voort op **schema.org**.");
    expect(page).toContain("## 3. Klassen {#klassen}");
    expect(page).toContain(
      "### 3.1 Persoonsreconstructies {#PersoonReconstructionShape}",
    );
  });

  it("rendert een klasse-voorbeeld als codeblok in de eigen sectie", () => {
    expect(page).toContain("#### Voorbeeld {#voorbeeld-EventShape}");
    expect(page).toContain('```json\n{\n  "@type": "sdo:Event"\n}\n```');
  });

  it("rendert de volledige voorbeelden als afsluitend hoofdstuk", () => {
    expect(page).toContain(
      "## 4. Volledige voorbeelden {#volledige-voorbeelden}",
    );
    expect(page).toContain("### 4.1 persoon {#voorbeeld-persoon}");
    expect(page).toContain('```json\n{\n  "@id": "urn:x"\n}\n```');
  });
});

describe("renderDiagram", () => {
  const diagram = renderDiagram(profile);

  it("tekent overerving en verwijzingen tussen shapes", () => {
    expect(diagram).toContain("ArchiveShape --|> CreativeWorkShape");
  });

  it("gebruikt de local name als knooppunt, gelijk aan het anker", () => {
    expect(diagram).toContain("class PersoonReconstructionShape\n");
    expect(diagram).not.toContain('["');
  });
});
