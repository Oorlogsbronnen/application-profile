import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseShapes } from "../src/parse-shapes.js";
import {
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
  const { profile } = parseShapes(FIXTURE);

  it("vindt klasse-shapes met naam en target class", () => {
    const person = profile.classShapes.find(
      (shape) => shape.localName === "PersonShape",
    );
    expect(person?.name).toBe("Persoon");
    expect(person?.targetClasses.map((t) => t.compact)).toEqual([
      "schema:Person",
    ]);
  });

  it("behandelt een lege beschrijving als afwezig", () => {
    const person = profile.classShapes.find(
      (shape) => shape.localName === "PersonShape",
    );
    expect(person?.description).toBeNull();
  });

  it("herkent overerving via sh:node", () => {
    const extended = profile.classShapes.find(
      (shape) => shape.localName === "ExtendedShape",
    );
    expect(extended?.inheritsFrom).toEqual(["PersonShape"]);
  });

  it("parseert regels met kardinaliteit en basistype-verwijzing", () => {
    const rule = profile.rules.find((r) => r.localName === "Rule_name");
    expect(rule?.path.compact).toBe("schema:name");
    expect(rule?.baseRef).toBe("Base_String");
    expect(rule?.cardinality).toEqual({ min: 1, max: 1 });
  });

  it("parseert sh:or van datatypes in basistypen", () => {
    const base = profile.bases.find(
      (b) => b.localName === "Base_DateOrInteger",
    );
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
    const rule = profile.rules.find((r) => r.localName === "Rule_actor");
    expect(rule && allowedClasses(rule).map((c) => c.compact)).toEqual([
      "schema:Person",
      "schema:Organization",
    ]);
  });

  it("laat inline kardinaliteit voorgaan op de regel", () => {
    const extended = profile.classShapes.find(
      (shape) => shape.localName === "ExtendedShape",
    );
    const property = extended?.properties[0];
    const rule = profile.rules.find((r) => r.localName === "Rule_name");
    const merged = effectiveCardinality(
      property!.inlineCardinality,
      rule!.cardinality,
    );
    expect(cardinalityText(merged)).toBe("0 — niet toegestaan");
  });
});

describe("parseShapes op de echte shapes.ttl", () => {
  const turtle = readFileSync(
    resolve(__dirname, "../../../ontology/shapes.ttl"),
    "utf8",
  );
  const { profile } = parseShapes(turtle);

  it("houdt de documentvolgorde van shapes.ttl aan", () => {
    expect(profile.classShapes[0]?.localName).toBe(
      "PersoonReconstructionShape",
    );
    expect(profile.classShapes.at(-1)?.localName).toBe("ConceptShape");
  });

  it("vindt alle klasse-shapes van het profiel", () => {
    const names = profile.classShapes.map((shape) => shape.localName);
    expect(names).toContain("PersoonReconstructionShape");
    expect(names).toContain("CreativeWorkShape");
    expect(names).toContain("ConceptShape");
    expect(profile.classShapes.length).toBeGreaterThanOrEqual(10);
  });

  it("herkent de overerving van ArchiveShape op CreativeWorkShape", () => {
    const archive = profile.classShapes.find(
      (shape) => shape.localName === "ArchiveShape",
    );
    expect(archive?.inheritsFrom).toEqual(["CreativeWorkShape"]);
  });

  it("vindt de bouwstenen", () => {
    expect(profile.rules.length).toBeGreaterThanOrEqual(60);
    expect(profile.bases.length).toBeGreaterThanOrEqual(7);
  });

  it("behandelt de lege beschrijving van EventShape als afwezig", () => {
    const event = profile.classShapes.find(
      (shape) => shape.localName === "EventShape",
    );
    expect(event?.description).toBeNull();
  });
});
