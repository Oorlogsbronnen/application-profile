import type {
  ApplicationProfile,
  ClassShape,
  LocalizedText,
  PropertyDoc,
  RuleBlock,
  ShapeGroup,
  Term,
  ValueType,
  Vocabulary,
  VocabularyTerm,
} from "./model.js";
import type { Example, PageContent } from "./page-content.js";
import { groupTitle } from "./groups.js";
import {
  buildRenderContext,
  cardinalityText,
  effectiveCardinality,
  resolveRuleValueType,
  type RenderContext,
} from "./presenter.js";
import { localName } from "./iri.js";
import { renderGroupDiagram } from "./render-diagram.js";
import { SCHEMA_NS } from "./parse-shapes.js";
import { texts } from "./texts.js";

/**
 * Genereert de volledige MDX-pagina voor /schema.
 *
 * Elke kennisgraaf (personen, objecten) krijgt een eigen hoofdstuk; de
 * klassen daarbinnen volgen de documentvolgorde van hun shapes-bestand.
 * Koppen van klassen tonen de Nederlandse naam (`sh:name`) zodat de
 * inhoudsopgave leesbaar is; het anker blijft altijd exact de Engelse local
 * name van de IRI, zodat `…/schema#<LocalName>` blijft resolven. Secties
 * zijn genummerd (1, 2, 2.1, …) zodat de inhoudsopgave leest als een
 * specificatie; de nummering schuift op wanneer het redactionele hoofdstuk
 * aanwezig is.
 */
export function renderPage(
  profile: ApplicationProfile,
  content: PageContent,
  vocabulary: Vocabulary,
): string {
  const vocabularyIris = new Set(
    [...vocabulary.classes, ...vocabulary.properties].map(
      (term) => term.term.iri,
    ),
  );

  let chapterNumber = 1;
  const chapters: string[] = [renderOverview(profile, chapterNumber)];
  if (content.editorial) {
    chapterNumber += 1;
    chapters.push(
      `## ${chapterNumber}. ${texts.sections.editorial} {#datamodellen}\n\n${content.editorial}`,
    );
  }
  for (const group of profile.groups) {
    chapterNumber += 1;
    chapters.push(
      renderGroup(
        group,
        chapterNumber,
        buildRenderContext(profile, group.id, vocabularyIris),
        content,
      ),
    );
  }
  if (hasTerms(vocabulary)) {
    chapterNumber += 1;
    chapters.push(renderVocabulary(vocabulary, chapterNumber, vocabularyIris));
  }
  if (content.fullExamples.length > 0) {
    chapters.push(renderFullExamples(content.fullExamples, chapterNumber + 1));
  }

  return `---
title: ${texts.page.title}
sidebar_label: ${texts.page.title}
sidebar_position: ${texts.page.sidebarPosition}
slug: ${texts.page.slug}
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

/** Hoofdstuk 1: per kennisgraaf een klassendiagram, met de graafnaam als caption. */
function renderOverview(
  profile: ApplicationProfile,
  chapterNumber: number,
): string {
  const parts = [
    `## ${chapterNumber}. ${texts.sections.overview} {#overzicht}`,
  ];
  for (const group of profile.groups) {
    parts.push(`**${groupTitle(group.id)}**`);
    parts.push(`\`\`\`mermaid\n${renderGroupDiagram(group, profile)}\n\`\`\``);
  }
  return parts.join("\n\n");
}

/** Hoofdstuk per kennisgraaf: optionele redactionele intro, dan de klassen. */
function renderGroup(
  group: ShapeGroup,
  chapterNumber: number,
  context: RenderContext,
  content: PageContent,
): string {
  const parts = [`## ${chapterNumber}. ${groupTitle(group.id)} {#${group.id}}`];
  const intro = content.groupIntros[group.id];
  if (intro) {
    parts.push(intro);
  }
  for (const [index, shape] of group.shapes.entries()) {
    parts.push(
      renderClassShape(
        shape,
        `${chapterNumber}.${index + 1}`,
        context,
        content.classExamples.get(shape.localName) ?? null,
      ),
    );
  }
  return parts.join("\n\n");
}

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
      `**${texts.classShape.appliesToLabel}:** ${shape.targetClasses.map((t) => termLink(t, context.vocabularyIris)).join(", ")}`,
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

function hasTerms(vocabulary: Vocabulary): boolean {
  return (
    vocabulary.classes.length +
      vocabulary.properties.length +
      vocabulary.eventTypes.length >
    0
  );
}

/**
 * Hoofdstuk met de eigen vocabulaire. Elke `ob:`-term krijgt een blok met
 * als anker exact zijn local name, zodat `…/schema#<LocalName>` resolvet
 * (net als de shapes). De `niod:`-gebeurtenistypen staan in een tabel: het
 * zijn er veel, met vaak alleen een naam en een thesauruslink.
 */
function renderVocabulary(
  vocabulary: Vocabulary,
  chapterNumber: number,
  vocabularyIris: ReadonlySet<string>,
): string {
  const sections = [
    {
      id: "vocabulaire-klassen",
      title: texts.vocabulary.classes,
      terms: vocabulary.classes,
    },
    {
      id: "vocabulaire-properties",
      title: texts.vocabulary.properties,
      terms: vocabulary.properties,
    },
  ]
    .filter((section) => section.terms.length > 0)
    .map((section, index) =>
      [
        `### ${chapterNumber}.${index + 1} ${section.title} {#${section.id}}`,
        ...section.terms.map((term) =>
          renderVocabularyTerm(term, vocabularyIris),
        ),
      ].join("\n\n"),
    );
  if (vocabulary.eventTypes.length > 0) {
    sections.push(
      renderEventTypes(
        vocabulary.eventTypes,
        `${chapterNumber}.${sections.length + 1}`,
        vocabularyIris,
      ),
    );
  }
  return [
    `## ${chapterNumber}. ${texts.sections.vocabulary} {#vocabulaire}`,
    texts.vocabulary.intro,
    ...sections,
  ].join("\n\n");
}

function renderVocabularyTerm(
  term: VocabularyTerm,
  vocabularyIris: ReadonlySet<string>,
): string {
  const parentLabel =
    term.kind === "class"
      ? texts.vocabulary.parentClassLabel
      : texts.vocabulary.parentPropertyLabel;
  return [
    `#### ${escapeText(term.label)} {#${term.localName}}`,
    `\`${term.term.iri}\``,
    term.parents.length > 0
      ? `**${parentLabel}:** ${term.parents.map((parent) => termLink(parent, vocabularyIris)).join(", ")}`
      : null,
    term.description ? localizedBlock(term.description) : null,
  ]
    .filter((part): part is string => part !== null)
    .join("\n\n");
}

function renderEventTypes(
  terms: VocabularyTerm[],
  sectionNumber: string,
  vocabularyIris: ReadonlySet<string>,
): string {
  const rows = terms.map((term) =>
    tableRow([
      `<span id="niod-${term.localName}"></span>**${escapeCell(term.label)}**<br/>${termLink(term.term, vocabularyIris)}`,
      term.parents.map((parent) => termLink(parent, vocabularyIris)).join(", "),
      term.description ? localizedInline(term.description) : "",
      term.definedBy
        ? `[${texts.vocabulary.definedByLink}](${term.definedBy})`
        : "",
    ]),
  );
  return [
    `### ${sectionNumber} ${texts.vocabulary.eventTypes} {#gebeurtenistypen}`,
    "",
    texts.vocabulary.eventTypesIntro,
    "",
    tableHeader(texts.vocabulary.eventTypesHeader),
    ...rows,
  ].join("\n");
}

/**
 * Een beschrijving als alinea; een niet-Nederlandse tekst krijgt een
 * `lang`-attribuut, zodat voorleessoftware hem goed uitspreekt (WCAG 3.1.2).
 */
function localizedBlock(text: LocalizedText): string {
  const escaped = escapeText(text.text);
  return isDutch(text) ? escaped : `<p lang="${text.language}">${escaped}</p>`;
}

function localizedInline(text: LocalizedText): string {
  const escaped = escapeCell(text.text);
  return isDutch(text)
    ? escaped
    : `<span lang="${text.language}">${escaped}</span>`;
}

function isDutch(text: LocalizedText): boolean {
  return text.language === null || text.language === "nl";
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
    termLink(property.path, context.vocabularyIris),
    nameAndDescription,
    cardinality,
    rule ? ruleValueTypeText(rule, context) : "",
  ]);
}

/** Weergave van het waardetype van een regel, met links naar eigen shapes. */
function ruleValueTypeText(rule: RuleBlock, context: RenderContext): string {
  const resolved = resolveRuleValueType(rule, context.bases);
  if (!resolved) {
    return "";
  }
  if (resolved.kind === "classes") {
    return `${texts.valueType.iriOfClass} ${resolved.classes
      .map((c) => classLink(c, context))
      .join(` ${texts.valueType.or} `)}`;
  }
  return valueTypeLabel(resolved.valueType, context);
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
  return termLink(term, context.vocabularyIris);
}

/** Link naar het eigen vocabulaireblok als de term daar staat, anders naar de externe IRI. */
function termLink(term: Term, vocabularyIris: ReadonlySet<string>): string {
  if (vocabularyIris.has(term.iri)) {
    return `[\`${term.compact}\`](#${localName(term.iri)})`;
  }
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
