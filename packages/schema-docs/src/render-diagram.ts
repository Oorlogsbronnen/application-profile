import type {
  ApplicationProfile,
  Cardinality,
  ClassShape,
  RuleBlock,
  ShapeGroup,
} from "./model.js";
import {
  allShapes,
  allowedClasses,
  buildRenderContext,
  effectiveCardinality,
  resolveRuleValueType,
  valueTypeText,
  type RenderContext,
} from "./presenter.js";
import { groupTitle } from "./groups.js";
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
  context: RenderContext = buildRenderContext(profile),
): string {
  const groupNames = new Set(group.shapes.map((shape) => shape.localName));
  const labels = new Map(
    allShapes(profile).map((shape) => [
      shape.localName,
      shape.name ?? shape.localName,
    ]),
  );

  // accTitle/accDescr geven de SVG een accessible name (WCAG 1.1.1); de
  // tabellen op de pagina zijn het volwaardige tekstalternatief.
  const lines: string[] = [
    "classDiagram",
    `  accTitle: Klassendiagram van de kennisgraaf ${groupTitle(group.id)}`,
    "  accDescr: De tabellen verderop op deze pagina beschrijven dezelfde klassen en eigenschappen volledig in tekst.",
    "  direction TB",
  ];
  const foreign = new Set<string>();
  const edges = new Set<string>();

  for (const shape of group.shapes) {
    lines.push(...classBlock(shape, context));

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
      const rule = property.ruleRef
        ? context.rules.get(property.ruleRef)
        : undefined;
      if (!rule) {
        continue;
      }
      for (const allowedClass of allowedClasses(rule)) {
        const target = context.targetIndex.get(allowedClass.iri);
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

  const sortedForeign = [...foreign].sort();
  for (const name of sortedForeign) {
    lines.push(`  class ${name}["${labels.get(name) ?? name}"]`);
  }
  lines.push(...[...edges].sort());
  for (const name of [...groupNames, ...sortedForeign]) {
    lines.push(`  click ${name} href "#${name}"`);
  }
  return lines.join("\n");
}

function classBlock(shape: ClassShape, context: RenderContext): string[] {
  const label = shape.name ?? shape.localName;
  const lines = [`  class ${shape.localName}["${label}"] {`];
  for (const property of shape.properties) {
    const rule = property.ruleRef
      ? context.rules.get(property.ruleRef)
      : undefined;
    const cardinality = effectiveCardinality(
      property.inlineCardinality,
      rule?.cardinality ?? null,
    );
    const type = rule ? ruleTypeText(rule, context) : null;
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
function ruleTypeText(rule: RuleBlock, context: RenderContext): string | null {
  const resolved = resolveRuleValueType(rule, context.bases);
  if (!resolved || resolved.kind === "classes") {
    return null;
  }
  return valueTypeText(resolved.valueType, " | ");
}

/** Compacte kardinaliteit in NDE-stijl: `[1]`, `[0..1]`, `[0..*]`. */
function bracketText({ min, max }: Cardinality): string {
  const low = min ?? 0;
  if (max === null) {
    return `[${low}..*]`;
  }
  return low === max ? `[${low}]` : `[${low}..${max}]`;
}
