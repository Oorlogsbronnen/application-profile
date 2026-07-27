import type {
  ApplicationProfile,
  BaseBlock,
  ClassShape,
  PropertyDoc,
  RuleBlock,
  Term,
  ValueType,
} from "./model.js";
import {
  allowedClasses,
  cardinalityText,
  effectiveCardinality,
  rulesByName,
  shapeByTargetClass,
} from "./presenter.js";
import { renderDiagram } from "./render-diagram.js";

/** Genereert de volledige MDX-pagina voor /schema. */
export function renderPage(profile: ApplicationProfile): string {
  const context: RenderContext = {
    rules: rulesByName(profile),
    bases: new Map(profile.bases.map((base) => [base.localName, base])),
    targetIndex: shapeByTargetClass(profile),
  };

  const classSections = profile.classShapes
    .map((shape) => renderClassShape(shape, context))
    .join("\n\n");

  return `---
title: Oorlogsbronnen Application Profile
sidebar_label: Oorlogsbronnen Application Profile
sidebar_position: 3
slug: /schema
---

{/* GEGENEREERD BESTAND — niet handmatig bewerken. */}
{/* Bron: ontology/shapes.ttl · generator: packages/schema-docs */}

# Oorlogsbronnen Application Profile

Het application profile van Oorlogsbronnen definieert de klassen en properties waarmee metadata over personen, gebeurtenissen en bronnen wordt vastgelegd. Deze pagina is automatisch gegenereerd uit de SHACL-shapes in [\`ontology/shapes.ttl\`](https://github.com/Oorlogsbronnen/application-profile/blob/main/ontology/shapes.ttl) — dat bestand is en blijft de source of truth.

- Namespace: \`https://data.oorlogsbronnen.nl/schema#\`
- Machine-leesbaar: [schema.ttl](/schema.ttl) (Turtle)

## Overzicht {#overzicht}

\`\`\`mermaid
${renderDiagram(profile)}
\`\`\`

## Klassen {#klassen}

${classSections}

## Bouwstenen {#bouwstenen}

De klasse-shapes hierboven zijn opgebouwd uit herbruikbare bouwstenen: **regels** (\`:Rule_*\`) die een property-pad koppelen aan een waardetype en kardinaliteit, en **basistypen** (\`:Base_*\`) die alleen een waardetype definiëren.

### Regels {#regels}

| Regel | Property-pad | Kardinaliteit | Waardetype |
| --- | --- | --- | --- |
${profile.rules.map((rule) => renderRuleRow(rule, context)).join("\n")}

### Basistypen {#basistypen}

| Basistype | Waardetype |
| --- | --- |
${profile.bases.map((base) => renderBaseRow(base, context)).join("\n")}
`;
}

type RenderContext = {
  rules: Map<string, RuleBlock>;
  bases: Map<string, BaseBlock>;
  targetIndex: Map<string, ClassShape>;
};

function renderClassShape(shape: ClassShape, context: RenderContext): string {
  const lines: string[] = [
    `### ${escapeText(shape.name ?? shape.localName)} {#${shape.localName}}`,
  ];

  lines.push("");
  lines.push(
    `\`:${shape.localName}\` · Van toepassing op: ${shape.targetClasses.map((t) => termLink(t, context)).join(", ")}`,
  );

  if (shape.description) {
    lines.push("");
    lines.push(escapeText(shape.description));
  }

  for (const parent of shape.inheritsFrom) {
    lines.push("");
    lines.push(
      `:::info Overerving\n\nDeze shape erft alle regels van [\`:${parent}\`](#${parent}); de tabel hieronder toont alleen de eigen properties.\n\n:::`,
    );
  }

  lines.push("");
  lines.push(
    "| Property | Naam en beschrijving | Kardinaliteit | Waardetype | Regel |",
  );
  lines.push("| --- | --- | --- | --- | --- |");
  for (const property of shape.properties) {
    lines.push(renderPropertyRow(property, context));
  }

  return lines.join("\n");
}

function renderPropertyRow(
  property: PropertyDoc,
  context: RenderContext,
): string {
  const rule = property.ruleRef
    ? context.rules.get(property.ruleRef)
    : undefined;
  const cardinality = cardinalityText(
    effectiveCardinality(property.inlineCardinality, rule?.cardinality ?? null),
  );
  const nameAndDescription = [
    property.name ? `**${escapeCell(property.name)}**` : null,
    property.description ? escapeCell(property.description) : null,
  ]
    .filter((part): part is string => part !== null)
    .join("<br/>");

  return tableRow([
    termLink(property.path, context),
    nameAndDescription,
    cardinality,
    rule ? ruleValueTypeText(rule, context) : "",
    property.ruleRef ? `[\`:${property.ruleRef}\`](#${property.ruleRef})` : "",
  ]);
}

function renderRuleRow(rule: RuleBlock, context: RenderContext): string {
  return tableRow([
    `<a id="${rule.localName}"></a>\`:${rule.localName}\``,
    termLink(rule.path, context),
    cardinalityText(rule.cardinality),
    ruleValueTypeText(rule, context),
  ]);
}

function renderBaseRow(base: BaseBlock, context: RenderContext): string {
  return tableRow([
    `<a id="${base.localName}"></a>\`:${base.localName}\``,
    valueTypeLabel(base.valueType, context),
  ]);
}

/**
 * Weergave van het waardetype van een regel: klasse-constraints (sh:class of
 * sh:or van klassen) gaan boven het basistype, dat dan altijd Base_IRI is.
 */
function ruleValueTypeText(rule: RuleBlock, context: RenderContext): string {
  const classes = allowedClasses(rule);
  if (classes.length > 0) {
    return `IRI van ${classes.map((c) => classLink(c, context)).join(" of ")}`;
  }
  if (rule.orValueType) {
    return valueTypeLabel(rule.orValueType, context);
  }
  const base = rule.baseRef ? context.bases.get(rule.baseRef) : undefined;
  return base ? valueTypeLabel(base.valueType, context) : "";
}

function valueTypeLabel(valueType: ValueType, context: RenderContext): string {
  switch (valueType.kind) {
    case "datatype":
      return `\`${valueType.datatype.compact}\``;
    case "iri":
      return "IRI";
    case "class":
      return valueType.classes.map((c) => classLink(c, context)).join(" of ");
    case "or":
      return valueType.options
        .map((option) => valueTypeLabel(option, context))
        .join(" of ");
  }
}

/** Link naar de eigen shape-sectie als de klasse door dit profiel wordt beschreven, anders naar de externe IRI. */
function classLink(term: Term, context: RenderContext): string {
  const shape = context.targetIndex.get(term.iri);
  if (shape) {
    return `[\`${term.compact}\`](#${shape.localName})`;
  }
  return termLink(term, context);
}

function termLink(term: Term, _context: RenderContext): string {
  return `[\`${term.compact}\`](${term.iri})`;
}

function tableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

/** MDX interpreteert `{`, `<` en `&`; beschrijvingen zijn platte tekst en worden ontsmet. */
function escapeText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll("{", "&#123;")
    .replaceAll("}", "&#125;");
}

function escapeCell(text: string): string {
  return escapeText(text).replaceAll("|", "\\|").replaceAll("\n", " ");
}
