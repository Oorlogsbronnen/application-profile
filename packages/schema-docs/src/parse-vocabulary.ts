import { Parser } from "n3";
import type { Quad } from "n3";
import type {
  LocalizedText,
  Term,
  Vocabulary,
  VocabularyTerm,
} from "./model.js";
import { localName, toTerm, type Prefixes } from "./iri.js";
import { extractPrefixes, SCHEMA_NS } from "./parse-shapes.js";

/** Namespace van de WO2 Thesaurus (`niod:`). */
export const NIOD_NS = "https://data.niod.nl/WO2_Thesaurus/";

const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#";

/** Voorkeursvolgorde van talen voor labels en beschrijvingen; de site is Nederlandstalig. */
const LANGUAGE_PREFERENCE = ["nl", "en"];

/**
 * Leest de eigen classes en properties uit de vocabulaire
 * (`schema_ext-oorlogsbronnen.ttl`). Alleen termen in de namespaces van
 * Oorlogsbronnen (`ob:`) en de WO2 Thesaurus (`niod:`) tellen mee; de
 * Nederlandse labels voor schema.org-klassen in hetzelfde bestand niet.
 */
export function parseVocabulary(turtle: string): Vocabulary {
  const quads = new Parser().parse(turtle);
  const prefixes = extractPrefixes(turtle);

  // Documentvolgorde: de parser geeft de triples terug zoals ze in het
  // bestand staan, dus de eerste `a rdfs:Class` bepaalt de plek.
  const declarations = new Map<string, VocabularyTerm["kind"]>();
  for (const quad of quads) {
    if (quad.predicate.value !== `${RDF}type`) {
      continue;
    }
    const subject = quad.subject.value;
    if (!isOwnTerm(subject) || declarations.has(subject)) {
      continue;
    }
    if (quad.object.value === `${RDFS}Class`) {
      declarations.set(subject, "class");
    } else if (quad.object.value === `${RDF}Property`) {
      declarations.set(subject, "property");
    }
  }

  const terms = [...declarations].map(([iri, kind]) =>
    parseTerm(quads, iri, kind, prefixes),
  );
  return {
    classes: terms.filter(
      (term) => term.kind === "class" && term.term.iri.startsWith(SCHEMA_NS),
    ),
    properties: terms.filter(
      (term) => term.kind === "property" && term.term.iri.startsWith(SCHEMA_NS),
    ),
    eventTypes: terms.filter((term) => term.term.iri.startsWith(NIOD_NS)),
  };
}

function isOwnTerm(iri: string): boolean {
  return iri.startsWith(SCHEMA_NS) || iri.startsWith(NIOD_NS);
}

function parseTerm(
  quads: Quad[],
  iri: string,
  kind: VocabularyTerm["kind"],
  prefixes: Prefixes,
): VocabularyTerm {
  const objects = (predicate: string) =>
    quads
      .filter(
        (quad) =>
          quad.subject.value === iri && quad.predicate.value === predicate,
      )
      .map((quad) => quad.object);
  const literals = (predicate: string): LocalizedText[] =>
    objects(predicate)
      .filter((object) => object.termType === "Literal")
      .map((object) => ({
        text: object.value,
        language:
          "language" in object && object.language ? object.language : null,
      }));
  const term = toTerm(iri, prefixes);

  const label = preferred(literals(`${RDFS}label`));
  if (!label) {
    throw new Error(
      `${term.compact} heeft geen rdfs:label. Elke eigen class en property heeft een naam nodig voor de schemapagina.`,
    );
  }

  const parentPredicate =
    kind === "class" ? `${RDFS}subClassOf` : `${RDFS}subPropertyOf`;
  const parents: Term[] = objects(parentPredicate)
    .filter((object) => object.termType === "NamedNode")
    .map((object) => toTerm(object.value, prefixes));
  const definedBy =
    objects(`${RDFS}isDefinedBy`).find(
      (object) => object.termType === "NamedNode",
    )?.value ?? null;

  return {
    term,
    localName: localName(iri),
    kind,
    label: label.text,
    description: preferred(literals(`${RDFS}comment`)),
    parents,
    definedBy,
  };
}

/** De tekst in de voorkeurstaal; anders de eerste die er is. */
function preferred(texts: LocalizedText[]): LocalizedText | null {
  for (const language of LANGUAGE_PREFERENCE) {
    const match = texts.find((text) => text.language === language);
    if (match) {
      return match;
    }
  }
  return texts[0] ?? null;
}
