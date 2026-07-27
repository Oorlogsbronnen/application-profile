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

  it("geeft elke klasse-shape een anker gelijk aan de local name", () => {
    for (const shape of profile.classShapes) {
      expect(page).toContain(`{#${shape.localName}}`);
    }
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
      "erft alle regels van [`:CreativeWorkShape`](#CreativeWorkShape)",
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

describe("renderDiagram", () => {
  const diagram = renderDiagram(profile);

  it("tekent overerving en verwijzingen tussen shapes", () => {
    expect(diagram).toContain("ArchiveShape --|> CreativeWorkShape");
    expect(diagram).toContain(
      "EventShape --> PersoonReconstructionShape : actor",
    );
  });

  it("gebruikt de Nederlandse naam als label", () => {
    expect(diagram).toContain(
      'class PersoonReconstructionShape["Persoonsreconstructie"]',
    );
  });
});
