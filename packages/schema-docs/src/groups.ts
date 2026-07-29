/**
 * Eén bron voor de kennisgrafen van het profiel: id, paginatitel,
 * shapes-bestand, downloadnaam en intro-fragment horen bij elkaar en
 * wijzigen samen. Een nieuwe graaf toevoegen = hier één regel (plus het
 * shapes-bestand en eventueel een intro-fragment); cli, renderer en teksten
 * volgen. Let op: de downloadnamen staan als glob in de root-.gitignore.
 */
export const GROUPS = [
  {
    id: "personen",
    title: "Personen",
    shapesFile: "shapes-personen.ttl",
    staticName: "schema-personen.ttl",
    introFile: "_schema-personen.mdx",
  },
  {
    id: "objecten",
    title: "Objecten",
    shapesFile: "shapes-collecties.ttl",
    staticName: "schema-collecties.ttl",
    introFile: "_schema-objecten.mdx",
  },
] as const;

export type Group = (typeof GROUPS)[number];

/** De kennisgrafen die Oorlogsbronnen beheert, in leesvolgorde van de pagina. */
export type GroupId = Group["id"];

export function groupTitle(id: GroupId): string {
  const group = GROUPS.find((candidate) => candidate.id === id);
  if (!group) {
    throw new Error(`Onbekende kennisgraaf: ${id}`);
  }
  return group.title;
}
