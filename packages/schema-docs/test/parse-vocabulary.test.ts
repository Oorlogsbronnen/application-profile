import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseVocabulary } from "../src/parse-vocabulary.js";

const FIXTURE = `
@prefix ob: <https://data.oorlogsbronnen.nl/schema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sdo: <https://schema.org/> .
@prefix niod: <https://data.niod.nl/WO2_Thesaurus/> .
@prefix picom: <https://personsincontext.org/model#> .

sdo:Photograph rdfs:label "Foto"@nl .
sdo:Photograph rdfs:subClassOf ob:Afbeelding .

ob:Afbeelding a rdfs:Class ;
    rdfs:label "Afbeelding"@nl ;
    rdfs:subClassOf sdo:CreativeWork ;
    rdfs:comment "Superclass voor objecten met een afbeelding"@nl .

ob:Bekendmaking a rdfs:Class ;
    rdfs:label "Bekendmaking"@nl ;
    rdfs:subClassOf sdo:Event, ob:Afbeelding ;
    rdfs:comment "Official announcement"@en, "Officiële bekendmaking"@nl .

ob:Monument a rdfs:Class ;
    rdfs:label "Monument"@nl ;
    rdfs:comment "Class for monuments"@en .

ob:Rights a rdfs:Class ;
    rdfs:label "Rechten"@nl .

ob:slachtoffer a rdf:Property ;
    rdfs:label "slachtoffer"@nl ;
    rdfs:subPropertyOf sdo:actor .

niod:Geboren a rdfs:Class ;
    rdfs:label "Geboren"@nl ;
    rdfs:subClassOf sdo:Event ;
    rdfs:isDefinedBy <https://data.niod.nl/WO2_Thesaurus/events/6360> .

picom:PersonObservation a rdfs:Class ;
    rdfs:label "Persoonsvermelding"@nl .
`;

describe("parseVocabulary", () => {
  const vocabulary = parseVocabulary(FIXTURE);

  it("verdeelt de eigen termen over classes, properties en gebeurtenistypen, in bestandsvolgorde", () => {
    expect(vocabulary.classes.map((t) => t.term.compact)).toEqual([
      "ob:Afbeelding",
      "ob:Bekendmaking",
      "ob:Monument",
      "ob:Rights",
    ]);
    expect(vocabulary.properties.map((t) => t.term.compact)).toEqual([
      "ob:slachtoffer",
    ]);
    expect(vocabulary.eventTypes.map((t) => t.term.compact)).toEqual([
      "niod:Geboren",
    ]);
  });

  it("neemt termen uit andere namespaces niet op", () => {
    const all = [
      ...vocabulary.classes,
      ...vocabulary.properties,
      ...vocabulary.eventTypes,
    ].map((t) => t.term.compact);
    expect(all).not.toContain("sdo:Photograph");
    expect(all).not.toContain("picom:PersonObservation");
  });

  it("leest naam, soort, local name en superklassen", () => {
    const bekendmaking = vocabulary.classes[1]!;
    expect(bekendmaking.label).toBe("Bekendmaking");
    expect(bekendmaking.kind).toBe("class");
    expect(bekendmaking.localName).toBe("Bekendmaking");
    expect(bekendmaking.parents.map((p) => p.compact)).toEqual([
      "sdo:Event",
      "ob:Afbeelding",
    ]);
    expect(vocabulary.properties[0]?.kind).toBe("property");
    expect(vocabulary.properties[0]?.parents.map((p) => p.compact)).toEqual([
      "sdo:actor",
    ]);
  });

  it("kiest een Nederlandse beschrijving boven een Engelse", () => {
    expect(vocabulary.classes[1]?.description).toEqual({
      text: "Officiële bekendmaking",
      language: "nl",
    });
  });

  it("valt terug op een Engelse beschrijving", () => {
    expect(vocabulary.classes[2]?.description).toEqual({
      text: "Class for monuments",
      language: "en",
    });
  });

  it("laat ontbrekende velden leeg", () => {
    const rechten = vocabulary.classes[3]!;
    expect(rechten.description).toBeNull();
    expect(rechten.parents).toEqual([]);
    expect(rechten.definedBy).toBeNull();
  });

  it("leest de definitie in de thesaurus", () => {
    expect(vocabulary.eventTypes[0]?.definedBy).toBe(
      "https://data.niod.nl/WO2_Thesaurus/events/6360",
    );
  });

  it("weigert een eigen term zonder rdfs:label", () => {
    expect(() =>
      parseVocabulary(`
@prefix ob: <https://data.oorlogsbronnen.nl/schema#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
ob:Naamloos a rdfs:Class .
`),
    ).toThrow("ob:Naamloos heeft geen rdfs:label");
  });
});

describe("parseVocabulary op het echte vocabulairebestand", () => {
  const vocabulary = parseVocabulary(
    readFileSync(
      resolve(__dirname, "../../../ontology/schema_ext-oorlogsbronnen.ttl"),
      "utf8",
    ),
  );

  it("vindt alle eigen classes, properties en gebeurtenistypen", () => {
    expect(vocabulary.classes.length).toBeGreaterThanOrEqual(12);
    expect(vocabulary.properties.length).toBeGreaterThanOrEqual(3);
    expect(vocabulary.eventTypes.length).toBeGreaterThanOrEqual(47);
  });

  it("leest de beschrijvingen van de ob:-termen", () => {
    const archief = vocabulary.classes.find(
      (term) => term.localName === "Archive",
    );
    expect(archief?.description?.text).toBeTruthy();
  });
});
