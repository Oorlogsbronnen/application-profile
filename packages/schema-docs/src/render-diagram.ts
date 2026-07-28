import type {
  ApplicationProfile,
  BaseBlock,
  Cardinality,
  ClassShape,
  RuleBlock,
  ShapeGroup,
} from "./model.js";
import {
  allShapes,
  allowedClasses,
  effectiveCardinality,
  rulesByName,
  shapeByTargetClass,
  valueTypeText,
} from "./presenter.js";
import { localName } from "./iri.js";

/**
 * Mermaid-classDiagram van één kennisgraaf, naar het model van SCHEMA-AP-NDE:
 * per klasse een box met de Nederlandse naam en de eigen properties
 * (pad, waardetype en kardinaliteit), overerving via sh:node als
 * overervingspijl en verwijzingen via de klasse-constraints van de gebruikte
 * regels als pijlen met de propertynaam. Relatie-properties tonen geen
 * waardetype in de box — de pijl toont hun doel al. Een verwijzing naar een
 * shape uit de andere kennisgraaf verschijnt als kale node zonder properties.
 *
 * Knooppunten blijven de local names, zodat het diagram matcht met de
 * ankers; de getoonde labels zijn de Nederlandse namen uit `sh:name`.
 * Elke node linkt naar zijn eigen sectie op de pagina (vereist een mermaid
 * securityLevel die kliks toestaat, zie docusaurus.config.ts).
 */
export function renderGroupDiagram(
  group: ShapeGroup,
  profile: ApplicationProfile,
): string {
  const targetIndex = shapeByTargetClass(profile);
  const rules = rulesByName(profile);
  const bases = new Map(profile.bases.map((base) => [base.localName, base]));
  const groupNames = new Set(group.shapes.map((shape) => shape.localName));
  const labels = new Map(
    allShapes(profile).map((shape) => [
      shape.localName,
      shape.name ?? shape.localName,
    ]),
  );

  const lines: string[] = ["classDiagram", "  direction TB"];
  const foreign = new Set<string>();
  const edges = new Set<string>();

  for (const shape of group.shapes) {
    lines.push(...classBlock(shape, rules, bases));

    for (const parent of shape.inheritsFrom) {
      if (!labels.has(parent)) {
        continue;
      }
      if (!groupNames.has(parent)) {
        foreign.add(parent);
      }
      edges.add(`  ${shape.localName} --|> ${parent}`);
    }

    for (const property of shape.properties) {
      const rule = property.ruleRef ? rules.get(property.ruleRef) : undefined;
      if (!rule) {
        continue;
      }
      for (const allowedClass of allowedClasses(rule)) {
        const target = targetIndex.get(allowedClass.iri);
        if (!target || target.localName === shape.localName) {
          continue;
        }
        if (!groupNames.has(target.localName)) {
          foreign.add(target.localName);
        }
        edges.add(
          `  ${shape.localName} --> ${target.localName} : ${localName(property.path.iri)}`,
        );
      }
    }
  }

  for (const name of [...foreign].sort()) {
    lines.push(`  class ${name}["${labels.get(name) ?? name}"]`);
  }
  lines.push(...[...edges].sort());
  for (const name of [...groupNames, ...[...foreign].sort()]) {
    lines.push(`  click ${name} href "#${name}"`);
  }
  return lines.join("\n");
}

function classBlock(
  shape: ClassShape,
  rules: Map<string, RuleBlock>,
  bases: Map<string, BaseBlock>,
): string[] {
  const label = shape.name ?? shape.localName;
  const lines = [`  class ${shape.localName}["${label}"] {`];
  for (const property of shape.properties) {
    const rule = property.ruleRef ? rules.get(property.ruleRef) : undefined;
    const cardinality = effectiveCardinality(
      property.inlineCardinality,
      rule?.cardinality ?? null,
    );
    const type = rule ? ruleTypeText(rule, bases) : null;
    // Markdown-bold voor de propertynaam, zoals NDE; mermaid rendert dit in members.
    lines.push(
      `    **${property.path.compact}**${type ? `: ${type}` : ""} ${bracketText(cardinality)}`,
    );
  }
  lines.push("  }");
  return lines;
}

/**
 * Waardetype voor in de klassebox. Relaties (regels met klasse-constraints)
 * krijgen géén type: hun doel staat al als pijl in het diagram.
 */
function ruleTypeText(
  rule: RuleBlock,
  bases: Map<string, BaseBlock>,
): string | null {
  if (allowedClasses(rule).length > 0) {
    return null;
  }
  if (rule.orValueType) {
    return valueTypeText(rule.orValueType, " | ");
  }
  const base = rule.baseRef ? bases.get(rule.baseRef) : undefined;
  return base ? valueTypeText(base.valueType, " | ") : null;
}

/** Compacte kardinaliteit in NDE-stijl: `[1]`, `[0..1]`, `[0..*]`. */
function bracketText({ min, max }: Cardinality): string {
  const low = min ?? 0;
  if (max === null) {
    return `[${low}..*]`;
  }
  return low === max ? `[${low}]` : `[${low}..${max}]`;
}
