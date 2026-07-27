import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseShapes } from "../src/parse-shapes.js";
import { renderPage } from "../src/render-page.js";
import { renderDiagram } from "../src/render-diagram.js";

const turtle = readFileSync(
  resolve(__dirname, "../../../ontology/shapes.ttl"),
  "utf8",
);
const { profile } = parseShapes(turtle);

describe("renderPage", () => {
  const page = renderPage(profile);

  it("gebruikt de local name als genummerde koptitel én anker", () => {
    for (const shape of profile.classShapes) {
      expect(page).toMatch(
        new RegExp(`### 2\\.\\d+ ${shape.localName} \\{#${shape.localName}\\}`),
      );
    }
  });

  it("toont de volledige IRI onder elke klasse-kop", () => {
    expect(page).toContain(
      "`https://data.oorlogsbronnen.nl/schema#ArchiveShape`",
    );
  });

  it("nummert de hoofdsecties", () => {
    expect(page).toContain("## 1. Overzicht {#overzicht}");
    expect(page).toContain("## 2. Klassen {#klassen}");
    expect(page).toContain("## 3. Bouwstenen {#bouwstenen}");
    expect(page).toContain("### 3.1 Regels {#regels}");
    expect(page).toContain("### 3.2 Basistypen {#basistypen}");
  });

  it("geeft elke bouwsteen een anker gelijk aan de local name", () => {
    for (const rule of profile.rules) {
      expect(page).toContain(`<a id="${rule.localName}"></a>`);
    }
    for (const base of profile.bases) {
      expect(page).toContain(`<a id="${base.localName}"></a>`);
    }
  });

  it("verwijst bij overerving naar de basis-shape", () => {
    expect(page).toContain(
      "erft alle regels van [`CreativeWorkShape`](#CreativeWorkShape)",
    );
  });

  it("toont de Nederlandse naam als omschrijving bij de klasse", () => {
    expect(page).toContain("**Naam:** Persoonsreconstructie");
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

describe("renderDiagram", () => {
  const diagram = renderDiagram(profile);

  it("tekent overerving en verwijzingen tussen shapes", () => {
    expect(diagram).toContain("ArchiveShape --|> CreativeWorkShape");
    expect(diagram).toContain(
      "EventShape --> PersoonReconstructionShape : actor",
    );
  });

  it("gebruikt de local name als knooppunt, gelijk aan kop en anker", () => {
    expect(diagram).toContain("class PersoonReconstructionShape\n");
    expect(diagram).not.toContain('["');
  });
});
