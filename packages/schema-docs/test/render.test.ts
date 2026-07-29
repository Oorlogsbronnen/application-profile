import { describe, expect, it } from "vitest";
import type { PageContent } from "../src/page-content.js";
import { renderPage } from "../src/render-page.js";
import { renderGroupDiagram } from "../src/render-diagram.js";
import { allShapes } from "../src/presenter.js";
import { loadRealProfile } from "./helpers.js";

const profile = loadRealProfile();
const [personen, objecten] = profile.groups;

const emptyContent: PageContent = {
  editorial: null,
  groupIntros: {},
  classExamples: new Map(),
  fullExamples: [],
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("renderPage", () => {
  const page = renderPage(profile, emptyContent);

  it("gebruikt de Nederlandse naam als koptitel en de local name als anker", () => {
    for (const shape of allShapes(profile)) {
      const heading = shape.name ?? shape.localName;
      expect(page).toMatch(
        new RegExp(
          `### \\d+\\.\\d+ ${escapeRegExp(heading)} \\{#${shape.localName}\\}`,
        ),
      );
    }
  });

  it("maakt van elke kennisgraaf een genummerd hoofdstuk", () => {
    expect(page).toContain("## 2. Personen {#personen}");
    expect(page).toContain("## 3. Objecten {#objecten}");
    expect(page).toMatch(/### 2\.1 .+ \{#/);
    expect(page).toMatch(/### 3\.1 .+ \{#/);
  });

  it("volgt de documentvolgorde van de shapes-bestanden", () => {
    const [firstPersonenShape] = personen!.shapes;
    const [firstObjectenShape] = objecten!.shapes;
    expect(page.indexOf(`{#${firstPersonenShape!.localName}}`)).toBeLessThan(
      page.indexOf(`{#${firstObjectenShape!.localName}}`),
    );
  });

  it("toont de volledige IRI onder elke klasse-kop", () => {
    expect(page).toContain(
      "`https://data.oorlogsbronnen.nl/schema#ArchiveShape`",
    );
  });

  it("bevat in het overzicht een diagram per kennisgraaf", () => {
    expect(page).toContain("## 1. Overzicht {#overzicht}");
    expect(page.match(/```mermaid/g)).toHaveLength(2);
    expect(page).toContain("**Personen**");
    expect(page).toContain("**Objecten**");
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
    expect(page).toContain(
      "erft alle regels van [`PersoonsReconstructieShape`](#PersoonsReconstructieShape)",
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
    groupIntros: {
      personen: "Intro van de personen-graaf.",
      objecten: "Intro van de objecten-graaf.",
    },
    classExamples: new Map([["EventShape", '{\n  "@type": "sdo:Event"\n}']]),
    fullExamples: [{ name: "persoon", json: '{\n  "@id": "urn:x"\n}' }],
  };
  const page = renderPage(profile, content);

  it("voegt het toelichting-hoofdstuk in als hoofdstuk 2 en schuift de grafen op", () => {
    expect(page).toContain(
      "## 2. Datamodellen en vocabulaires {#datamodellen}",
    );
    expect(page).toContain("Dit profiel bouwt voort op **schema.org**.");
    expect(page).toContain("## 3. Personen {#personen}");
    expect(page).toContain("## 4. Objecten {#objecten}");
  });

  it("opent elk kennisgraaf-hoofdstuk met zijn intro", () => {
    expect(page).toContain(
      "## 3. Personen {#personen}\n\nIntro van de personen-graaf.",
    );
    expect(page).toContain(
      "## 4. Objecten {#objecten}\n\nIntro van de objecten-graaf.",
    );
  });

  it("rendert een klasse-voorbeeld als codeblok in de eigen sectie", () => {
    expect(page).toContain("#### Voorbeeld {#voorbeeld-EventShape}");
    expect(page).toContain('```json\n{\n  "@type": "sdo:Event"\n}\n```');
  });

  it("rendert de volledige voorbeelden als afsluitend hoofdstuk", () => {
    expect(page).toContain(
      "## 5. Volledige voorbeelden {#volledige-voorbeelden}",
    );
    expect(page).toContain("### 5.1 persoon {#voorbeeld-persoon}");
    expect(page).toContain('```json\n{\n  "@id": "urn:x"\n}\n```');
  });
});

describe("renderGroupDiagram", () => {
  const personenDiagram = renderGroupDiagram(personen!, profile);
  const objectenDiagram = renderGroupDiagram(objecten!, profile);

  it("toont per klasse een box met Nederlandse naam en vetgedrukte properties met waardetype en kardinaliteit", () => {
    expect(personenDiagram).toContain(
      'class PersoonsReconstructieShape["Persoonsreconstructies"] {',
    );
    expect(personenDiagram).toContain("**sdo:name**: xsd:string [1]");
    expect(personenDiagram).toContain("**sdo:birthDate**: xsd:date [0..1]");
    expect(personenDiagram).toContain(
      "**sdo:additionalType**: xsd:string | IRI [0..*]",
    );
    expect(personenDiagram).toContain("**prov:wasDerivedFrom** [0]");
  });

  it("laat het waardetype weg bij relaties — de pijl toont het doel al", () => {
    expect(personenDiagram).toContain("**sdo:children** [0..*]");
    expect(personenDiagram).not.toContain("**sdo:children**:");
  });

  it("linkt elke node naar zijn eigen sectie", () => {
    expect(personenDiagram).toContain(
      'click PersoonsReconstructieShape href "#PersoonsReconstructieShape"',
    );
    expect(objectenDiagram).toContain(
      'click CreativeWorkShape href "#CreativeWorkShape"',
    );
    expect(objectenDiagram).toContain(
      'click PersoonsvermeldingShape href "#PersoonsvermeldingShape"',
    );
  });

  it("tekent overerving en verwijzingen binnen de graaf", () => {
    expect(personenDiagram).toContain(
      "PersoonsvermeldingShape --|> PersoonsReconstructieShape",
    );
    expect(personenDiagram).toContain(
      "SourceShape --> DatasetShape : inDataset",
    );
    expect(objectenDiagram).toContain("ArchiveShape --|> CreativeWorkShape");
  });

  it("toont een verwijzing naar de andere graaf als kale node", () => {
    expect(objectenDiagram).toContain(
      "CreativeWorkShape --> PersoonsvermeldingShape : about",
    );
    expect(objectenDiagram).toContain(
      '  class PersoonsvermeldingShape["Persoonsvermeldingen"]\n',
    );
    expect(objectenDiagram).not.toContain(
      'class PersoonsvermeldingShape["Persoonsvermeldingen"] {',
    );
  });

  it("houdt de klassen van de andere graaf verder buiten het diagram", () => {
    expect(personenDiagram).not.toContain("CreativeWorkShape");
    expect(objectenDiagram).not.toContain("DatasetShape");
  });
});
