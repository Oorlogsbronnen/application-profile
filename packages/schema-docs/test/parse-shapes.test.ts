import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  combineTurtle,
  parseProfile,
  parseShapes,
} from "../src/parse-shapes.js";
import {
  allShapes,
  allowedClasses,
  cardinalityText,
  effectiveCardinality,
} from "../src/presenter.js";

const FIXTURE = `
@prefix : <https://data.oorlogsbronnen.nl/schema#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix schema: <https://schema.org/> .

:Base_String a sh:PropertyShape ; sh:datatype xsd:string .
:Base_IRI a sh:PropertyShape ; sh:nodeKind sh:IRI .
:Base_DateOrInteger a sh:PropertyShape ; sh:or ([sh:datatype xsd:date] [sh:datatype xsd:integer]) .

:Rule_name sh:path schema:name ; sh:node :Base_String ; sh:minCount 1 ; sh:maxCount 1 .
:Rule_date sh:path schema:startDate ; sh:node :Base_DateOrInteger ; sh:maxCount 1 .
:Rule_actor sh:path schema:actor ; sh:node :Base_IRI ; sh:or ([ sh:class schema:Person ] [ sh:class schema:Organization ]) .

:PersonShape a sh:NodeShape ;
    sh:targetClass schema:Person ;
    sh:name "Persoon"@nl ;
    sh:description ""@nl ;
    sh:property [ sh:path schema:name ; sh:name "Naam"@nl ; sh:node :Rule_name ] .

:ExtendedShape a sh:NodeShape ;
    sh:targetClass schema:Patient ;
    sh:name "Uitbreiding"@nl ;
    sh:node :PersonShape ;
    sh:property [ sh:path schema:name ; sh:maxCount 0 ; sh:node :Rule_name ] .
`;

describe("parseShapes", () => {
  const { shapes } = parseShapes(FIXTURE);

  it("vindt klasse-shapes met naam en target class", () => {
    const person = shapes.classShapes.find(
      (shape) => shape.localName === "PersonShape",
    );
    expect(person?.name).toBe("Persoon");
    expect(person?.targetClasses.map((t) => t.compact)).toEqual([
      "schema:Person",
    ]);
  });

  it("behandelt een lege beschrijving als afwezig", () => {
    const person = shapes.classShapes.find(
      (shape) => shape.localName === "PersonShape",
    );
    expect(person?.description).toBeNull();
  });

  it("herkent overerving via sh:node", () => {
    const extended = shapes.classShapes.find(
      (shape) => shape.localName === "ExtendedShape",
    );
    expect(extended?.inheritsFrom).toEqual(["PersonShape"]);
  });

  it("parseert regels met kardinaliteit en basistype-verwijzing", () => {
    const rule = shapes.rules.find((r) => r.localName === "Rule_name");
    expect(rule?.path.compact).toBe("schema:name");
    expect(rule?.baseRef).toBe("Base_String");
    expect(rule?.cardinality).toEqual({ min: 1, max: 1 });
  });

  it("parseert sh:or van datatypes in basistypen", () => {
    const base = shapes.bases.find((b) => b.localName === "Base_DateOrInteger");
    expect(base?.valueType).toEqual({
      kind: "or",
      options: [
        {
          kind: "datatype",
          datatype: {
            iri: "http://www.w3.org/2001/XMLSchema#date",
            compact: "xsd:date",
          },
        },
        {
          kind: "datatype",
          datatype: {
            iri: "http://www.w3.org/2001/XMLSchema#integer",
            compact: "xsd:integer",
          },
        },
      ],
    });
  });

  it("leidt toegestane klassen af uit sh:or met sh:class", () => {
    const rule = shapes.rules.find((r) => r.localName === "Rule_actor");
    expect(rule && allowedClasses(rule).map((c) => c.compact)).toEqual([
      "schema:Person",
      "schema:Organization",
    ]);
  });

  it("laat inline kardinaliteit voorgaan op de regel", () => {
    const extended = shapes.classShapes.find(
      (shape) => shape.localName === "ExtendedShape",
    );
    const property = extended?.properties[0];
    const rule = shapes.rules.find((r) => r.localName === "Rule_name");
    const merged = effectiveCardinality(
      property!.inlineCardinality,
      rule!.cardinality,
    );
    expect(cardinalityText(merged)).toBe("0 — niet toegestaan");
  });
});

describe("combineTurtle", () => {
  it("herhaalt @prefix-regels niet die al voorkwamen", () => {
    const a = '@prefix sh: <http://www.w3.org/ns/shacl#> .\n:A a sh:NodeShape .';
    const b = '@prefix sh: <http://www.w3.org/ns/shacl#> .\n:B a sh:NodeShape .';
    const combined = combineTurtle(a, b);
    expect(combined.match(/@prefix sh:/g)).toHaveLength(1);
    expect(combined).toContain(":A a sh:NodeShape .");
    expect(combined).toContain(":B a sh:NodeShape .");
  });
});

describe("parseProfile op de echte shapes-bestanden", () => {
  const ontologyDir = resolve(__dirname, "../../../ontology");
  const read = (file: string): string =>
    readFileSync(resolve(ontologyDir, file), "utf8");

  const profile = parseProfile(read("shapes-bouwstenen.ttl"), [
    { id: "personen", turtle: read("shapes-personen.ttl") },
    { id: "objecten", turtle: read("shapes-collecties.ttl") },
  ]);

  it("verdeelt de klasse-shapes over de twee kennisgrafen", () => {
    const names = (id: string) =>
      profile.groups
        .find((group) => group.id === id)!
        .shapes.map((shape) => shape.localName);
    expect(names("personen")).toEqual([
      "PersoonsReconstructieShape",
      "PersoonsvermeldingShape",
      "EventShape",
      "SourceShape",
      "DatasetShape",
    ]);
    expect(names("objecten")).toEqual([
      "CreativeWorkShape",
      "ArchiveShape",
      "BekendmakingShape",
      "MediaShape",
      "MonumentShape",
      "ConceptShape",
    ]);
  });

  it("herkent de overerving binnen beide grafen", () => {
    const shapes = allShapes(profile);
    const vermelding = shapes.find(
      (shape) => shape.localName === "PersoonsvermeldingShape",
    );
    expect(vermelding?.inheritsFrom).toEqual(["PersoonsReconstructieShape"]);
    const archive = shapes.find((shape) => shape.localName === "ArchiveShape");
    expect(archive?.inheritsFrom).toEqual(["CreativeWorkShape"]);
  });

  it("vindt de bouwstenen", () => {
    expect(profile.rules.length).toBeGreaterThanOrEqual(60);
    expect(profile.bases.length).toBeGreaterThanOrEqual(7);
  });

  it("kent elke gebruikte regel-verwijzing", () => {
    const ruleNames = new Set(profile.rules.map((rule) => rule.localName));
    for (const shape of allShapes(profile)) {
      for (const property of shape.properties) {
        if (property.ruleRef?.startsWith("Rule_")) {
          expect(
            ruleNames.has(property.ruleRef),
            `${shape.localName} → ${property.ruleRef}`,
          ).toBe(true);
        }
      }
    }
  });

  it("behandelt de lege beschrijving van EventShape als afwezig", () => {
    const event = allShapes(profile).find(
      (shape) => shape.localName === "EventShape",
    );
    expect(event?.description).toBeNull();
  });
});
