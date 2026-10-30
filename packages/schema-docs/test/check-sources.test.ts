import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkSources,
  explainTurtleError,
  formatProblems,
  githubAnnotation,
} from "../src/check-sources.js";

const PREFIXES = `@prefix ob: <https://data.oorlogsbronnen.nl/schema#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix sdo: <https://schema.org/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix picom: <https://personsincontext.org/model/#> .
`;

// De twee fouten die eerder ongemerkt op main belandden, letterlijk overgenomen.
const DUBBELE_SH_CLASS = `${PREFIXES}
ob:Base_IRI a sh:PropertyShape ; sh:nodeKind sh:IRI .
ob:Rule_children_rec       sh:path sdo:children;      sh:node ob:Base_IRI ;  sh:or ([ sh:class sh:class picom:PersonReconstruction ] [ sh:class sdo:Person ]) .
`;

const ONGEBONDEN_PREFIX = `${PREFIXES}
ob:Archiefmateriaal a rdfs:Class ;
	rdfs:label "Archiefmateriaal"@nl ;
	rdfs:subClassOf schema:CreativeWork .
`;

describe("checkSources", () => {
  it("vindt de dubbele sh:class met bestand, regel en uitleg", () => {
    const [problem, ...rest] = checkSources([
      {
        file: "ontology/shapes-bouwstenen.ttl",
        turtle: DUBBELE_SH_CLASS,
        shapes: true,
      },
    ]);
    expect(rest).toEqual([]);
    expect(problem?.file).toBe("ontology/shapes-bouwstenen.ttl");
    expect(problem?.line).toBe(8);
    expect(problem?.lineText).toContain("sh:class sh:class");
    expect(problem?.explanation).toContain("Staat er een woord dubbel");
  });

  it("vindt het ongebonden voorvoegsel schema: met bestand, regel en uitleg", () => {
    const [problem] = checkSources([
      {
        file: "ontology/schema_ext-oorlogsbronnen.ttl",
        turtle: ONGEBONDEN_PREFIX,
        shapes: false,
      },
    ]);
    expect(problem?.file).toBe("ontology/schema_ext-oorlogsbronnen.ttl");
    expect(problem?.line).toBe(9);
    expect(problem?.lineText).toBe("rdfs:subClassOf schema:CreativeWork .");
    expect(problem?.explanation).toContain('voorvoegsel "schema:"');
  });

  it("meldt een shape die de generator weigert, met bestand en ontbrekend waardetype", () => {
    const [problem] = checkSources([
      {
        file: "ontology/shapes-bouwstenen.ttl",
        turtle: `${PREFIXES}\nob:Base_Leeg a sh:PropertyShape .\n`,
        shapes: true,
      },
    ]);
    expect(problem?.file).toBe("ontology/shapes-bouwstenen.ttl");
    expect(problem?.explanation).toContain("Bouwsteen Base_Leeg");
    expect(problem?.explanation).toContain("geen herkenbaar waardetype");
  });

  it("haalt de vocabulaire niet door de generator", () => {
    expect(
      checkSources([
        {
          file: "ontology/schema_ext-oorlogsbronnen.ttl",
          turtle: `${PREFIXES}\nob:Archive a rdfs:Class .\n`,
          shapes: false,
        },
      ]),
    ).toEqual([]);
  });

  it("keurt de echte bronbestanden goed", () => {
    const ontologyDir = resolve(__dirname, "../../../ontology");
    const sources = readdirSync(ontologyDir)
      .filter((name) => name.endsWith(".ttl"))
      .map((name) => ({
        file: `ontology/${name}`,
        turtle: readFileSync(resolve(ontologyDir, name), "utf8"),
        shapes: name.startsWith("shapes-"),
      }));
    expect(sources.length).toBeGreaterThanOrEqual(4);
    expect(checkSources(sources)).toEqual([]);
  });
});

describe("explainTurtleError", () => {
  it("legt een ontbrekende punt uit", () => {
    expect(
      explainTurtleError("Expected dot to follow quad on line 4."),
    ).toContain("Ontbreekt er een punt");
  });

  it("valt terug op een algemene uitleg bij een onbekende melding", () => {
    expect(explainTurtleError("Iets heel anders")).toBe(
      "De Turtle-syntax klopt hier niet.",
    );
  });
});

describe("meldingen", () => {
  const [problem] = checkSources([
    {
      file: "ontology/shapes-bouwstenen.ttl",
      turtle: DUBBELE_SH_CLASS,
      shapes: true,
    },
  ]);

  it("toont bestand, regel, de regel zelf, de uitleg en de technische melding", () => {
    const text = formatProblems([problem!]);
    expect(text).toContain("De bronbestanden bevatten 1 fout:");
    expect(text).toContain("✗ ontology/shapes-bouwstenen.ttl, regel 8");
    expect(text).toContain("  8 | ob:Rule_children_rec");
    expect(text).toContain("Staat er een woord dubbel");
    expect(text).toContain("(technische melding: Expected punctuation");
  });

  it("maakt er een GitHub-annotatie op de juiste regel van", () => {
    expect(githubAnnotation(problem!)).toMatch(
      /^::error file=ontology\/shapes-bouwstenen\.ttl,line=8,title=Fout in bronbestand::Na een waarde/,
    );
  });

  it("escapet regeleinden in een GitHub-annotatie", () => {
    expect(
      githubAnnotation({ ...problem!, explanation: "regel 1\nregel 2 100%" }),
    ).toContain("::regel 1%0Aregel 2 100%25");
  });
});
