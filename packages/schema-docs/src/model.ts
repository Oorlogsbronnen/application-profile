/**
 * Domeinmodel van het application profile zoals dat op /schema wordt
 * gedocumenteerd. De taal volgt de shapes-bestanden in ontology/:
 * klasse-shapes (NodeShapes), regels (:Rule_*, property-bouwstenen) en
 * basistypen (:Base_*, waardetype-bouwstenen), verdeeld over twee
 * kennisgrafen (personen en objecten).
 */

export type Cardinality = {
  min: number | null;
  max: number | null;
};

export type ValueType =
  | { kind: "datatype"; datatype: Term }
  | { kind: "iri" }
  | { kind: "class"; classes: Term[] }
  | { kind: "or"; options: ValueType[] };

/** Een IRI met zijn compacte weergave (bv. `schema:name`). */
export type Term = {
  iri: string;
  compact: string;
};

/** Basistype-bouwsteen (`:Base_*`): definieert alleen een waardetype. */
export type BaseBlock = {
  localName: string;
  valueType: ValueType;
};

/** Regel-bouwsteen (`:Rule_*`): koppelt een property-pad aan waardetype en kardinaliteit. */
export type RuleBlock = {
  localName: string;
  path: Term;
  baseRef: string | null;
  cardinality: Cardinality;
  classConstraints: Term[];
  orValueType: ValueType | null;
};

/** Eén property zoals toegepast binnen een klasse-shape. */
export type PropertyDoc = {
  path: Term;
  name: string | null;
  description: string | null;
  ruleRef: string | null;
  inlineCardinality: Cardinality;
};

/** Een klasse-shape (NodeShape) uit het profiel. */
export type ClassShape = {
  localName: string;
  name: string | null;
  description: string | null;
  targetClasses: Term[];
  inheritsFrom: string[];
  properties: PropertyDoc[];
};

/** De shapes, regels en basistypen zoals geparseerd uit één Turtle-bron. */
export type ShapeSet = {
  classShapes: ClassShape[];
  rules: RuleBlock[];
  bases: BaseBlock[];
};

import type { GroupId } from "./groups.js";

export type { GroupId } from "./groups.js";

/** Eén kennisgraaf binnen het profiel, met zijn klasse-shapes in documentvolgorde. */
export type ShapeGroup = {
  id: GroupId;
  shapes: ClassShape[];
};

export type ApplicationProfile = {
  groups: ShapeGroup[];
  rules: RuleBlock[];
  bases: BaseBlock[];
};
