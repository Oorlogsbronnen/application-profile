import { describe, expect, it } from "vitest";
import type { PageContent } from "../src/page-content.js";
import { renderPage } from "../src/render-page.js";
import { renderGroupDiagram } from "../src/render-diagram.js";
import { parseProfile } from "../src/parse-shapes.js";
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
      "`https://data.oorlogsbronnen.nl/schema#ArchiefShape`",
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
  });

  it("markeert verplichte properties in de kardinaliteit", () => {
    expect(page).toContain("1 — verplicht");
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
      "**sdo:birthPlace**: xsd:string | IRI [0..1]",
    );
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
      'click PersoonsReconstructieShape href "#PersoonsReconstructieShape"',
    );
  });

  it("tekent overerving en verwijzingen binnen de graaf", () => {
    expect(personenDiagram).toContain(
      "PersoonsReconstructieShape --> PersoonsvermeldingShape : wasDerivedFrom",
    );
    expect(personenDiagram).toContain(
      "SourceShape --> DatasetShape : isPartOf",
    );
    expect(objectenDiagram).toContain("ArchiefShape --|> CreativeWorkShape");
  });

  it("toont een verwijzing naar de andere graaf als kale node", () => {
    expect(objectenDiagram).toContain(
      "CreativeWorkShape --> PersoonsReconstructieShape : about",
    );
    expect(objectenDiagram).toContain(
      '  class PersoonsReconstructieShape["Persoonsreconstructies"]\n',
    );
    expect(objectenDiagram).not.toContain(
      'class PersoonsReconstructieShape["Persoonsreconstructies"] {',
    );
  });

  it("houdt de klassen van de andere graaf verder buiten het diagram", () => {
    expect(personenDiagram).not.toContain("CreativeWorkShape");
    expect(objectenDiagram).not.toContain("DatasetShape");
  });
});

const PREFIXES = `
@prefix : <https://data.oorlogsbronnen.nl/schema#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix sdo: <https://schema.org/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
`;

/**
 * Twee kennisgrafen die allebei een shape voor sdo:ArchiveComponent hebben,
 * zoals SourceShape (personen) en ArchiefShape (collecties) in het echte profiel.
 */
const gedeeldeKlasse = parseProfile(
  `${PREFIXES}
:Base_IRI a sh:PropertyShape ; sh:nodeKind sh:IRI .
:Rule_bron sh:path prov:hadPrimarySource ; sh:node :Base_IRI ; sh:or ([ sh:class prov:Entity ] [ sh:class sdo:ArchiveComponent ]) .
:Rule_about sh:path sdo:about ; sh:node :Base_IRI ; sh:class sdo:Person .
`,
  [
    {
      id: "personen",
      turtle: `${PREFIXES}
:VermeldingShape a sh:NodeShape ; sh:targetClass sdo:Person ; sh:name "Vermelding"@nl ;
    sh:property [ sh:path prov:hadPrimarySource ; sh:node :Rule_bron ] .
:BronShape a sh:NodeShape ; sh:targetClass prov:Entity, sdo:ArchiveComponent ; sh:name "Bron"@nl .
`,
    },
    {
      id: "objecten",
      turtle: `${PREFIXES}
:ArchiefShape a sh:NodeShape ; sh:targetClass sdo:ArchiveComponent ; sh:name "Archief"@nl ;
    sh:property [ sh:path prov:hadPrimarySource ; sh:node :Rule_bron ] ,
                [ sh:path sdo:about ; sh:node :Rule_about ] .
`,
    },
  ],
);

describe("klasse die in meerdere kennisgrafen een shape heeft", () => {
  const [personenGraaf, objectenGraaf] = gedeeldeKlasse.groups;
  const personenDiagram = renderGroupDiagram(personenGraaf!, gedeeldeKlasse);
  const objectenDiagram = renderGroupDiagram(objectenGraaf!, gedeeldeKlasse);
  const [personenTabellen, objectenTabellen] = renderPage(
    gedeeldeKlasse,
    emptyContent,
  ).split("{#objecten}");

  it("wijst in het diagram naar de shape uit dezelfde graaf, met één pijl", () => {
    expect(
      personenDiagram.match(
        /VermeldingShape --> BronShape : hadPrimarySource/g,
      ),
    ).toHaveLength(1);
    expect(personenDiagram).not.toContain("ArchiefShape");
  });

  it("verwijst in het diagram naar een andere graaf als alleen die de klasse beschrijft", () => {
    expect(objectenDiagram).toContain(
      "ArchiefShape --> BronShape : hadPrimarySource",
    );
    expect(objectenDiagram).toContain(
      "ArchiefShape --> VermeldingShape : about",
    );
  });

  it("linkt in de tabellen naar de shape uit dezelfde graaf", () => {
    expect(personenTabellen).toContain("[`sdo:ArchiveComponent`](#BronShape)");
    expect(objectenTabellen).toContain(
      "[`sdo:ArchiveComponent`](#ArchiefShape)",
    );
  });

  it("linkt in de tabellen naar een andere graaf als alleen die de klasse beschrijft", () => {
    expect(objectenTabellen).toContain("[`prov:Entity`](#BronShape)");
    expect(objectenTabellen).toContain("[`sdo:Person`](#VermeldingShape)");
  });
});

describe("hadPrimarySource in het echte personendiagram", () => {
  const personenDiagram = renderGroupDiagram(personen!, profile);

  it("loopt vanuit Persoonsvermeldingen en Gebeurtenissen alleen naar Bronrecords", () => {
    const pijlen = personenDiagram
      .split("\n")
      .filter((line) => line.endsWith(": hadPrimarySource"))
      .map((line) => line.trim());
    expect(pijlen).toEqual([
      "EventShape --> SourceShape : hadPrimarySource",
      "PersoonsvermeldingShape --> SourceShape : hadPrimarySource",
    ]);
    expect(personenDiagram).not.toContain("ArchiefShape");
  });
});
