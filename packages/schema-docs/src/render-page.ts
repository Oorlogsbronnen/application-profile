import type {
  ApplicationProfile,
  BaseBlock,
  ClassShape,
  PropertyDoc,
  RuleBlock,
  Term,
  ValueType,
} from "./model.js";
import type { Example, PageContent } from "./page-content.js";
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
 * Koppen van klassen tonen de Nederlandse naam (`sh:name`) zodat de
 * inhoudsopgave leesbaar is; het anker blijft altijd exact de Engelse local
 * name van de IRI, zodat `…/schema#<LocalName>` blijft resolven. De klassen
 * volgen de documentvolgorde van shapes.ttl. Secties zijn genummerd
 * (1, 2, 2.1, …) zodat de inhoudsopgave leest als een specificatie; de
 * nummering schuift op wanneer het redactionele hoofdstuk aanwezig is.
 */
export function renderPage(
  profile: ApplicationProfile,
  content: PageContent,
): string {
  const context: RenderContext = {
    rules: rulesByName(profile),
    bases: new Map(profile.bases.map((base) => [base.localName, base])),
    targetIndex: shapeByTargetClass(profile),
  };

  const classChapter = content.editorial ? 3 : 2;

  const classSections = profile.classShapes
    .map((shape, index) =>
      renderClassShape(
        shape,
        `${classChapter}.${index + 1}`,
        context,
        content.classExamples.get(shape.localName) ?? null,
      ),
    )
    .join("\n\n");

  const chapters: string[] = [
    `## 1. ${texts.sections.overview} {#overzicht}\n\n\`\`\`mermaid\n${renderDiagram(profile)}\n\`\`\``,
  ];
  if (content.editorial) {
    chapters.push(
      `## 2. ${texts.sections.editorial} {#datamodellen}\n\n${content.editorial}`,
    );
  }
  chapters.push(
    `## ${classChapter}. ${texts.sections.classes} {#klassen}\n\n${classSections}`,
  );
  if (content.fullExamples.length > 0) {
    chapters.push(renderFullExamples(content.fullExamples, classChapter + 1));
  }

  return `---
title: ${texts.page.title}
sidebar_label: ${texts.page.title}
sidebar_position: 3
slug: /schema
description: ${texts.page.metaDescription}
toc_max_heading_level: 3
---

${texts.page.generatedComment.map((line) => `{/* ${line} */}`).join("\n")}

# ${texts.page.title}

${texts.page.intro}

- **${texts.page.namespaceLabel}:** \`${SCHEMA_NS}\`
- **${texts.page.machineReadableLabel}:** ${texts.page.machineReadableLink}

${chapters.join("\n\n")}
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
  example: string | null,
): string {
  const heading = shape.name ? escapeText(shape.name) : shape.localName;
  const lines: string[] = [
    `### ${sectionNumber} ${heading} {#${shape.localName}}`,
  ];

  lines.push("");
  lines.push(`\`${SCHEMA_NS}${shape.localName}\``);

  if (shape.targetClasses.length > 0) {
    lines.push("");
    lines.push(
      `**${texts.classShape.appliesToLabel}:** ${shape.targetClasses.map((t) => termLink(t)).join(", ")}`,
    );
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

  if (example) {
    lines.push("");
    lines.push(
      `#### ${texts.examples.classExampleTitle} {#voorbeeld-${shape.localName}}`,
    );
    lines.push("");
    lines.push(jsonBlock(example));
  }

  return lines.join("\n");
}

function renderFullExamples(
  examples: Example[],
  chapterNumber: number,
): string {
  const sections = examples.map((example, index) =>
    [
      `### ${chapterNumber}.${index + 1} ${escapeText(example.name)} {#voorbeeld-${example.name}}`,
      "",
      jsonBlock(example.json),
    ].join("\n"),
  );
  return [
    `## ${chapterNumber}. ${texts.sections.fullExamples} {#volledige-voorbeelden}`,
    "",
    texts.examples.fullExamplesIntro,
    "",
    sections.join("\n\n"),
  ].join("\n");
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

/** Interne link naar een shape, op local name. */
function blockLink(name: string): string {
  return `[\`${name}\`](#${name})`;
}

function jsonBlock(json: string): string {
  return ["```json", json, "```"].join("\n");
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
