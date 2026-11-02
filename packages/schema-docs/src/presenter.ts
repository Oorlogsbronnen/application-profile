import type {
  ApplicationProfile,
  BaseBlock,
  Cardinality,
  ClassShape,
  GroupId,
  RuleBlock,
  Term,
  ValueType,
} from "./model.js";
import { texts } from "./texts.js";

/**
 * Weergavelogica die parser en renderers delen: effectieve kardinaliteit,
 * toegestane klassen per regel en de koppeling klasse-IRI → shape.
 */

/** Inline constraints op een property gaan vóór de constraints van de regel. */
export function effectiveCardinality(
  inline: Cardinality,
  rule: Cardinality | null,
): Cardinality {
  return {
    min: inline.min ?? rule?.min ?? null,
    max: inline.max ?? rule?.max ?? null,
  };
}

export function cardinalityText(cardinality: Cardinality): string {
  const { min, max } = cardinality;
  if (max === 0) {
    return texts.cardinality.notAllowed;
  }
  if (min === null || min === 0) {
    return max === null ? "0..n" : `0..${max}`;
  }
  const range =
    max === null ? `${min}..n` : min === max ? `${min}` : `${min}..${max}`;
  return `${range} — ${texts.cardinality.required}`;
}

/** De klassen die een regel als waarde toestaat (via sh:class of sh:or). */
export function allowedClasses(rule: RuleBlock): Term[] {
  const fromOr =
    rule.orValueType?.kind === "or"
      ? rule.orValueType.options.flatMap((option) =>
          option.kind === "class" ? option.classes : [],
        )
      : [];
  return [...rule.classConstraints, ...fromOr];
}

/** Alle klasse-shapes van het profiel, in leesvolgorde van de kennisgrafen. */
export function allShapes(profile: ApplicationProfile): ClassShape[] {
  return profile.groups.flatMap((group) => group.shapes);
}

/**
 * Index van klasse-IRI naar de shape die die klasse als targetClass heeft,
 * gezien vanuit één kennisgraaf. Heeft een klasse in meerdere grafen een
 * shape (zoals sdo:ArchiveComponent), dan wint die uit de eigen graaf;
 * anders de eerste in leesvolgorde.
 */
export function shapeByTargetClass(
  profile: ApplicationProfile,
  groupId: GroupId,
): Map<string, ClassShape> {
  const ownGroupFirst = [
    ...profile.groups.filter((group) => group.id === groupId),
    ...profile.groups.filter((group) => group.id !== groupId),
  ];
  const index = new Map<string, ClassShape>();
  for (const shape of ownGroupFirst.flatMap((group) => group.shapes)) {
    for (const targetClass of shape.targetClasses) {
      if (!index.has(targetClass.iri)) {
        index.set(targetClass.iri, shape);
      }
    }
  }
  return index;
}

export function rulesByName(
  profile: ApplicationProfile,
): Map<string, RuleBlock> {
  return new Map(profile.rules.map((rule) => [rule.localName, rule]));
}

export function basesByName(
  profile: ApplicationProfile,
): Map<string, BaseBlock> {
  return new Map(profile.bases.map((base) => [base.localName, base]));
}

/** De indexen die de pagina- en diagram-renderer delen, voor één kennisgraaf. */
export type RenderContext = {
  rules: Map<string, RuleBlock>;
  bases: Map<string, BaseBlock>;
  targetIndex: Map<string, ClassShape>;
  /** IRI's van de `ob:`-termen met een eigen blok in het vocabulaire-hoofdstuk. */
  vocabularyIris: ReadonlySet<string>;
};

export function buildRenderContext(
  profile: ApplicationProfile,
  groupId: GroupId,
  vocabularyIris: ReadonlySet<string> = new Set(),
): RenderContext {
  return {
    rules: rulesByName(profile),
    bases: basesByName(profile),
    targetIndex: shapeByTargetClass(profile, groupId),
    vocabularyIris,
  };
}

/**
 * Het waardetype van een regel, met de gedeelde precedentie: klasse-constraints
 * gaan vóór het or-type, dat weer vóór het basistype gaat. De renderers
 * bepalen alleen nog de weergave.
 */
export function resolveRuleValueType(
  rule: RuleBlock,
  bases: Map<string, BaseBlock>,
):
  | { kind: "classes"; classes: Term[] }
  | { kind: "type"; valueType: ValueType }
  | null {
  const classes = allowedClasses(rule);
  if (classes.length > 0) {
    return { kind: "classes", classes };
  }
  if (rule.orValueType) {
    return { kind: "type", valueType: rule.orValueType };
  }
  const base = rule.baseRef ? bases.get(rule.baseRef) : undefined;
  return base ? { kind: "type", valueType: base.valueType } : null;
}

/** Vlakke tekstweergave van een waardetype, zonder links (voor tests en diagram). */
export function valueTypeText(
  valueType: ValueType,
  separator = " of ",
): string {
  switch (valueType.kind) {
    case "datatype":
      return valueType.datatype.compact;
    case "iri":
      return "IRI";
    case "class":
      return valueType.classes.map((c) => c.compact).join(separator);
    case "or":
      return valueType.options
        .map((option) => valueTypeText(option, separator))
        .join(separator);
  }
}
