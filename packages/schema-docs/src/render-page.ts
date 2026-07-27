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
import { SCHEMA_NS } from "./parse-shapes.js";
import { texts } from "./texts.js";

/**
 * Genereert de volledige MDX-pagina voor /schema.
 *
 * Koppen van klassen en bouwstenen zijn altijd de Engelse local name van de
 * IRI, met een anker dat daaraan exact gelijk is — zo blijven identifier,
 * URL en koptitel één geheel. Secties zijn genummerd (1, 2, 2.1, …) zodat de
 * inhoudsopgave leest als een specificatie.
 */
export function renderPage(profile: ApplicationProfile): string {
  const context: RenderContext = {
    rules: rulesByName(profile),
    bases: new Map(profile.bases.map((base) => [base.localName, base])),
    targetIndex: shapeByTargetClass(profile),
  };

  const classSections = profile.classShapes
    .map((shape, index) => renderClassShape(shape, `2.${index + 1}`, context))
    .join("\n\n");

  return `---
title: ${texts.page.title}
sidebar_label: ${texts.page.title}
sidebar_position: 3
slug: /schema
toc_max_heading_level: 3
---

${texts.page.generatedComment.map((line) => `{/* ${line} */}`).join("\n")}

# ${texts.page.title}

${texts.page.intro}

- **${texts.page.namespaceLabel}:** \`${SCHEMA_NS}\`
- **${texts.page.machineReadableLabel}:** ${texts.page.machineReadableLink}

## 1. ${texts.sections.overview} {#overzicht}

\`\`\`mermaid
${renderDiagram(profile)}
\`\`\`

## 2. ${texts.sections.classes} {#klassen}

${classSections}

## 3. ${texts.sections.buildingBlocks} {#bouwstenen}

${texts.buildingBlocks.intro}

### 3.1 ${texts.sections.rules} {#regels}

${tableHeader(texts.buildingBlocks.rulesTableHeader)}
${profile.rules.map((rule) => renderRuleRow(rule, context)).join("\n")}

### 3.2 ${texts.sections.baseTypes} {#basistypen}

${tableHeader(texts.buildingBlocks.baseTypesTableHeader)}
${profile.bases.map((base) => renderBaseRow(base, context)).join("\n")}
`;
}

type RenderContext = {
  rules: Map<string, RuleBlock>;
  bases: Map<string, BaseBlock>;
  targetIndex: Map<string, ClassShape>;
};

function renderClassShape(
  shape: ClassShape,
  sectionNumber: string,
  context: RenderContext,
): string {
  const lines: string[] = [
    `### ${sectionNumber} ${shape.localName} {#${shape.localName}}`,
  ];

  lines.push("");
  lines.push(`\`${SCHEMA_NS}${shape.localName}\``);

  const facts: string[] = [];
  if (shape.name) {
    facts.push(`**${texts.classShape.nameLabel}:** ${escapeText(shape.name)}`);
  }
  if (shape.targetClasses.length > 0) {
    facts.push(
      `**${texts.classShape.appliesToLabel}:** ${shape.targetClasses.map((t) => termLink(t)).join(", ")}`,
    );
  }
  if (facts.length > 0) {
    lines.push("");
    lines.push(facts.join(" · "));
  }

  if (shape.description) {
    lines.push("");
    lines.push(escapeText(shape.description));
  }

  for (const parent of shape.inheritsFrom) {
    lines.push("");
    lines.push(
      `:::info[${texts.classShape.inheritanceTitle}]\n\n${texts.classShape.inheritanceText(blockLink(parent))}\n\n:::`,
    );
  }

  lines.push("");
  lines.push(tableHeader(texts.classShape.tableHeader));
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
    termLink(property.path),
    nameAndDescription,
    cardinality,
    rule ? ruleValueTypeText(rule, context) : "",
    property.ruleRef ? blockLink(property.ruleRef) : "",
  ]);
}

function renderRuleRow(rule: RuleBlock, context: RenderContext): string {
  return tableRow([
    blockAnchor(rule.localName),
    termLink(rule.path),
    cardinalityText(rule.cardinality),
    ruleValueTypeText(rule, context),
  ]);
}

function renderBaseRow(base: BaseBlock, context: RenderContext): string {
  return tableRow([
    blockAnchor(base.localName),
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
    return `${texts.valueType.iriOfClass} ${classes
      .map((c) => classLink(c, context))
      .join(` ${texts.valueType.or} `)}`;
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
      return texts.valueType.iri;
    case "class":
      return valueType.classes
        .map((c) => classLink(c, context))
        .join(` ${texts.valueType.or} `);
    case "or":
      return valueType.options
        .map((option) => valueTypeLabel(option, context))
        .join(` ${texts.valueType.or} `);
  }
}

/** Link naar de eigen shape-sectie als de klasse door dit profiel wordt beschreven, anders naar de externe IRI. */
function classLink(term: Term, context: RenderContext): string {
  const shape = context.targetIndex.get(term.iri);
  if (shape) {
    return `[\`${term.compact}\`](#${shape.localName})`;
  }
  return termLink(term);
}

function termLink(term: Term): string {
  return `[\`${term.compact}\`](${term.iri})`;
}

/** Interne link naar een bouwsteen of shape, op local name. */
function blockLink(name: string): string {
  return `[\`${name}\`](#${name})`;
}

/** Ankerpunt + label voor een bouwsteen in een tabelcel. */
function blockAnchor(name: string): string {
  return `<a id="${name}"></a>\`${name}\``;
}

function tableHeader(columns: readonly string[]): string {
  return `${tableRow([...columns])}\n${tableRow(columns.map(() => "---"))}`;
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
