/**
 * Alle vaste (Nederlandstalige) teksten van de gegenereerde /schema-pagina
 * op één plek, zodat copy-wijzigingen geen renderlogica raken.
 *
 * Koptitels van klassen en bouwstenen staan hier bewust NIET in: die zijn
 * altijd de Engelse local name van de IRI (bv. `ArchiveShape`), zodat
 * identifier, URL-anker en koptitel exact gelijk blijven.
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
    ],
  },

  sections: {
    overview: "Overzicht",
    classes: "Klassen",
    buildingBlocks: "Bouwstenen",
    rules: "Regels",
    baseTypes: "Basistypen",
  },

  classShape: {
    nameLabel: "Naam",
    appliesToLabel: "Van toepassing op",
    inheritanceTitle: "Overerving",
    inheritanceText: (parentLink: string): string =>
      `Deze shape erft alle regels van ${parentLink}; de tabel hieronder toont alleen de eigen properties.`,
    tableHeader: [
      "Property",
      "Naam en beschrijving",
      "Kardinaliteit",
      "Waardetype",
      "Regel",
    ],
  },

  buildingBlocks: {
    intro:
      "De klasse-shapes hierboven zijn opgebouwd uit herbruikbare bouwstenen: **regels** (`Rule_*`) die een property-pad koppelen aan een waardetype en kardinaliteit, en **basistypen** (`Base_*`) die alleen een waardetype definiëren.",
    rulesTableHeader: ["Regel", "Property-pad", "Kardinaliteit", "Waardetype"],
    baseTypesTableHeader: ["Basistype", "Waardetype"],
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
