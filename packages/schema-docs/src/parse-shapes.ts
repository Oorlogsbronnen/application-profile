import { Parser, Store } from "n3";
import type { Quad, Quad_Subject, Term as RdfTerm } from "n3";
import type {
  ApplicationProfile,
  BaseBlock,
  Cardinality,
  ClassShape,
  GroupId,
  PropertyDoc,
  RuleBlock,
  ShapeSet,
  ValueType,
} from "./model.js";
import { localName, toTerm, type Prefixes } from "./iri.js";

export const SCHEMA_NS = "https://data.oorlogsbronnen.nl/schema#";

const SH = "http://www.w3.org/ns/shacl#";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";

const sh = (name: string) => `${SH}${name}`;
const rdf = (name: string) => `${RDF}${name}`;

export type ParseResult = {
  shapes: ShapeSet;
  prefixes: Prefixes;
};

/** Eén kennisgraaf als Turtle-bron; de bouwstenen komen uit een gedeeld bestand. */
export type GroupSource = {
  id: GroupId;
  turtle: string;
};

/**
 * Bouwt het volledige profiel uit de gedeelde bouwstenen en de shapes-bestanden
 * van de kennisgrafen. Elk graafbestand is zelfstandig parseerbaar (eigen
 * prefix-kop; regel-verwijzingen zijn kale IRI's), dus de bouwstenen hoeven
 * niet per graaf mee geparseerd te worden.
 */
export function parseProfile(
  bouwstenen: string,
  groupSources: GroupSource[],
): ApplicationProfile {
  const shared = parseShapes(bouwstenen).shapes;
  const groups = groupSources.map(({ id, turtle }) => ({
    id,
    shapes: parseShapes(turtle).shapes.classShapes,
  }));
  return { groups, rules: shared.rules, bases: shared.bases };
}

/** Voegt Turtle-bronnen samen; `@prefix`-regels die al voorkwamen worden niet herhaald. */
export function combineTurtle(...parts: string[]): string {
  const seen = new Set<string>();
  return parts
    .map((part) =>
      part
        .split("\n")
        .filter((line) => {
          if (!line.startsWith("@prefix")) {
            return true;
          }
          if (seen.has(line)) {
            return false;
          }
          seen.add(line);
          return true;
        })
        .join("\n")
        .trim(),
    )
    .join("\n\n");
}

export function parseShapes(turtle: string): ParseResult {
  const parser = new Parser();
  const quads: Quad[] = parser.parse(turtle);
  const prefixes = extractPrefixes(turtle);
  const store = new Store(quads);

  const classShapeSubjects = store
    .getSubjects(rdf("type"), sh("NodeShape"), null)
    .filter((subject) => subject.termType === "NamedNode");

  const classShapeIris = new Set(
    classShapeSubjects.map((subject) => subject.value),
  );

  // Documentvolgorde van het shapes-bestand: de N3-store geeft subjects terug
  // in volgorde van eerste voorkomen, zodat de redactie de leesvolgorde
  // bepaalt door de shapes in het bestand te herordenen.
  const classShapes = classShapeSubjects.map((subject) =>
    parseClassShape(store, subject, prefixes),
  );

  const blockSubjects = store
    .getSubjects(null, null, null)
    .filter(
      (subject) =>
        subject.termType === "NamedNode" &&
        subject.value.startsWith(SCHEMA_NS) &&
        !classShapeIris.has(subject.value),
    );

  const rules: RuleBlock[] = [];
  const bases: BaseBlock[] = [];
  for (const subject of blockSubjects) {
    const path = firstNamedNode(store, subject, sh("path"));
    if (path) {
      rules.push(parseRuleBlock(store, subject, path.value, prefixes));
    } else {
      bases.push(parseBaseBlock(store, subject, prefixes));
    }
  }
  rules.sort(byLocalName);
  bases.sort(byLocalName);

  return { shapes: { classShapes, rules, bases }, prefixes };
}

/**
 * N3's synchrone parse-API geeft de prefixes niet terug; ze staan in de
 * vaste `@prefix`-kop van de shapes-bestanden en worden daar uitgelezen.
 */
function extractPrefixes(turtle: string): Prefixes {
  const prefixes: Prefixes = {};
  const pattern = /@prefix\s+([\w-]*):\s*<([^>]+)>\s*\./g;
  for (const match of turtle.matchAll(pattern)) {
    const [, prefix, ns] = match;
    if (prefix !== undefined && ns !== undefined) {
      prefixes[prefix] = ns;
    }
  }
  return prefixes;
}

function parseClassShape(
  store: Store,
  subject: Quad_Subject,
  prefixes: Prefixes,
): ClassShape {
  const inheritsFrom = store
    .getObjects(subject, sh("node"), null)
    .filter((object) => object.termType === "NamedNode")
    .map((object) => localName(object.value));

  const properties = store
    .getObjects(subject, sh("property"), null)
    .map((object) => parseProperty(store, object as Quad_Subject, prefixes))
    .filter((property): property is PropertyDoc => property !== null);

  return {
    localName: localName(subject.value),
    name: languageText(store, subject, sh("name")),
    description: languageText(store, subject, sh("description")),
    targetClasses: store
      .getObjects(subject, sh("targetClass"), null)
      .map((object) => toTerm(object.value, prefixes)),
    inheritsFrom,
    properties,
  };
}

function parseProperty(
  store: Store,
  propertyNode: Quad_Subject,
  prefixes: Prefixes,
): PropertyDoc | null {
  const path = firstNamedNode(store, propertyNode, sh("path"));
  if (!path) {
    return null;
  }
  return {
    path: toTerm(path.value, prefixes),
    name: languageText(store, propertyNode, sh("name")),
    description: languageText(store, propertyNode, sh("description")),
    ruleRef: schemaRef(store, propertyNode, sh("node")),
    inlineCardinality: cardinality(store, propertyNode),
  };
}

/** Local name van een verwijzing, mits die in de eigen namespace ligt. */
function schemaRef(
  store: Store,
  subject: Quad_Subject,
  predicate: string,
): string | null {
  const node = firstNamedNode(store, subject, predicate);
  return node && node.value.startsWith(SCHEMA_NS)
    ? localName(node.value)
    : null;
}

function parseRuleBlock(
  store: Store,
  subject: Quad_Subject,
  pathIri: string,
  prefixes: Prefixes,
): RuleBlock {
  return {
    localName: localName(subject.value),
    path: toTerm(pathIri, prefixes),
    baseRef: schemaRef(store, subject, sh("node")),
    cardinality: cardinality(store, subject),
    classConstraints: store
      .getObjects(subject, sh("class"), null)
      .map((object) => toTerm(object.value, prefixes)),
    orValueType: parseOr(store, subject, prefixes),
  };
}

function parseBaseBlock(
  store: Store,
  subject: Quad_Subject,
  prefixes: Prefixes,
): BaseBlock {
  const valueType =
    parseInlineValueType(store, subject, prefixes) ??
    parseOr(store, subject, prefixes);
  if (!valueType) {
    throw new Error(
      `Bouwsteen ${localName(subject.value)} heeft geen herkenbaar waardetype (sh:datatype, sh:nodeKind of sh:or).`,
    );
  }
  return { localName: localName(subject.value), valueType };
}

/** Waardetype uit sh:datatype, sh:nodeKind of sh:class op één node. */
function parseInlineValueType(
  store: Store,
  subject: Quad_Subject,
  prefixes: Prefixes,
): ValueType | null {
  const datatype = firstNamedNode(store, subject, sh("datatype"));
  if (datatype) {
    return { kind: "datatype", datatype: toTerm(datatype.value, prefixes) };
  }
  const nodeKind = firstNamedNode(store, subject, sh("nodeKind"));
  if (nodeKind && nodeKind.value === sh("IRI")) {
    return { kind: "iri" };
  }
  const classes = store.getObjects(subject, sh("class"), null);
  if (classes.length > 0) {
    return {
      kind: "class",
      classes: classes.map((object) => toTerm(object.value, prefixes)),
    };
  }
  return null;
}

function parseOr(
  store: Store,
  subject: Quad_Subject,
  prefixes: Prefixes,
): ValueType | null {
  const listHead = store.getObjects(subject, sh("or"), null)[0];
  if (!listHead) {
    return null;
  }
  const options: ValueType[] = [];
  let current: RdfTerm | undefined = listHead;
  while (current && current.value !== rdf("nil")) {
    const item = store.getObjects(
      current as Quad_Subject,
      rdf("first"),
      null,
    )[0];
    if (item) {
      const option = parseInlineValueType(
        store,
        item as Quad_Subject,
        prefixes,
      );
      if (option) {
        options.push(option);
      }
    }
    current = store.getObjects(current as Quad_Subject, rdf("rest"), null)[0];
  }
  if (options.length === 0) {
    return null;
  }
  return { kind: "or", options };
}

function cardinality(store: Store, subject: Quad_Subject): Cardinality {
  return {
    min: integerValue(store, subject, sh("minCount")),
    max: integerValue(store, subject, sh("maxCount")),
  };
}

function integerValue(
  store: Store,
  subject: Quad_Subject,
  predicate: string,
): number | null {
  const object = store.getObjects(subject, predicate, null)[0];
  if (!object || object.termType !== "Literal") {
    return null;
  }
  const value = Number.parseInt(object.value, 10);
  return Number.isNaN(value) ? null : value;
}

/** Eerste niet-lege tekstwaarde; lege strings (zoals `""@nl`) tellen als afwezig. */
function languageText(
  store: Store,
  subject: Quad_Subject,
  predicate: string,
): string | null {
  const literal = store
    .getObjects(subject, predicate, null)
    .find(
      (object) => object.termType === "Literal" && object.value.trim() !== "",
    );
  return literal ? literal.value : null;
}

function firstNamedNode(
  store: Store,
  subject: Quad_Subject,
  predicate: string,
) {
  const object = store
    .getObjects(subject, predicate, null)
    .find((o) => o.termType === "NamedNode");
  return object ?? null;
}

function byLocalName(
  a: { localName: string },
  b: { localName: string },
): number {
  return a.localName.localeCompare(b.localName, "nl");
}
