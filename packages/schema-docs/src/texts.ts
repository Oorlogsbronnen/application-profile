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
    metaDescription:
      "De klassen, properties en bouwstenen van het Oorlogsbronnen application profile, gegenereerd uit de SHACL-shapes in ontology/shapes.ttl.",
    intro:
      "Het application profile van Oorlogsbronnen definieert de klassen en properties waarmee metadata over personen, gebeurtenissen en bronnen wordt vastgelegd. Deze pagina is automatisch gegenereerd uit de SHACL-shapes in [`ontology/shapes.ttl`](https://github.com/Oorlogsbronnen/application-profile/blob/main/ontology/shapes.ttl) — dat bestand is en blijft de source of truth.",
    namespaceLabel: "Namespace",
    machineReadableLabel: "Machine-leesbaar",
    machineReadableLink: "[schema.ttl](/schema.ttl) (Turtle)",
    generatedComment: [
      "GEGENEREERD BESTAND — niet handmatig bewerken.",
      "Bron: ontology/shapes.ttl · generator: packages/schema-docs",
      "Toelichting-hoofdstuk bewerken: website/docs/datamodel/_schema-toelichting.mdx",
      "Voorbeelden toevoegen: ontology/examples/ (zie packages/schema-docs/README.md)",
    ],
  },

  sections: {
    overview: "Overzicht",
    editorial: "Gebruikte datamodellen en vocabulaires",
    classes: "Klassen",
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
    fullExamplesIntro:
      "Volledige JSON-LD-voorbeelden van records volgens dit profiel. De bestanden staan in [`ontology/examples/volledig/`](https://github.com/Oorlogsbronnen/application-profile/tree/main/ontology/examples/volledig).",
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
