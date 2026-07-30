import { GROUPS } from "./groups.js";

/** Base voor bronverwijzingen naar de repository in de gegenereerde pagina. */
const REPO_URL = "https://github.com/Oorlogsbronnen/application-profile";

/**
 * Alle vaste (Nederlandstalige) teksten van de gegenereerde /schema-pagina
 * op één plek, zodat copy-wijzigingen geen renderlogica raken.
 *
 * Koptitels van klassen staan hier bewust NIET in: die komen uit de
 * `sh:name` van de shape zelf. Hun URL-anker blijft altijd de Engelse local
 * name van de IRI (bv. `ArchiveShape`), zodat identifier en anker gelijk zijn.
 */
export const texts = {
  page: {
    title: "Oorlogsbronnen Application Profile",
    slug: "/schema",
    sidebarPosition: 3,
    metaDescription:
      "De klassen en properties van de kennisgrafen personen en objecten van Oorlogsbronnen, gegenereerd uit de SHACL-shapes in ontology/.",
    intro: `Het application profile van Oorlogsbronnen definieert de klassen en properties waarmee metadata over personen, gebeurtenissen en bronnen wordt vastgelegd, verdeeld over twee kennisgrafen: **personen** en **objecten**. Deze pagina is automatisch gegenereerd uit de SHACL-shapes in [\`ontology/\`](${REPO_URL}/tree/main/ontology) (\`shapes-bouwstenen.ttl\`, \`shapes-personen.ttl\` en \`shapes-collecties.ttl\`) — die bestanden zijn en blijven de source of truth.`,
    namespaceLabel: "Namespace",
    machineReadableLabel: "Machine-leesbaar",
    machineReadableLink:
      [
        "[schema.ttl](/schema.ttl) (volledig)",
        ...GROUPS.map((group) => `[${group.staticName}](/${group.staticName})`),
      ].join(" · ") + " (Turtle)",
    generatedComment: [
      "GEGENEREERD BESTAND — niet handmatig bewerken.",
      "Bron: ontology/shapes-*.ttl · generator: packages/schema-docs",
      "Toelichting-hoofdstuk bewerken: website/docs/datamodel/_schema-toelichting.mdx",
      "Intro's van de kennisgraaf-hoofdstukken: website/docs/datamodel/_schema-personen.mdx en _schema-objecten.mdx",
      "Voorbeelden toevoegen: ontology/examples/ (zie packages/schema-docs/README.md)",
    ],
  },

  sections: {
    overview: "Overzicht",
    editorial: "Datamodellen en vocabulaires",
    fullExamples: "Volledige voorbeelden",
  },

  classShape: {
    appliesToLabel: "Van toepassing op",
    inheritanceTitle: "Overerving",
    inheritanceText: (parentLink: string): string =>
      `Deze shape erft alle regels van ${parentLink}; de tabel hieronder toont alleen de eigen properties.`,
    tableHeader: [
      "Property",
      "Naam en beschrijving",
      "Kardinaliteit",
      "Waardetype",
    ],
  },

  examples: {
    classExampleTitle: "Voorbeeld",
    fullExamplesIntro: `Volledige JSON-LD-voorbeelden van records volgens dit profiel. De bestanden staan in [\`ontology/examples/volledig/\`](${REPO_URL}/tree/main/ontology/examples/volledig).`,
  },

  cardinality: {
    notAllowed: "0 — niet toegestaan",
    required: "verplicht",
  },

  valueType: {
    iri: "IRI",
    iriOfClass: "IRI van",
    or: "of",
  },
} as const;
