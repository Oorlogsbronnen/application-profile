/**
 * Redactionele en voorbeeld-inhoud die naast shapes.ttl in de pagina wordt
 * gevoegd. De CLI laadt deze van schijf (zie load-content.ts); de renderer
 * blijft daardoor puur.
 */

/** Eén JSON-LD-voorbeeldbestand; `name` is de bestandsnaam zonder extensie. */
export type Example = {
  name: string;
  json: string;
};

export type PageContent = {
  /** Handgeschreven toelichting-fragment, of null als het ontbreekt of leeg is. */
  editorial: string | null;
  /** JSON-LD-voorbeeld per klasse-shape, op local name (bv. `CreativeWorkShape`). */
  classExamples: Map<string, string>;
  /** Volledige voorbeelden voor het afsluitende hoofdstuk. */
  fullExamples: Example[];
};

export const emptyPageContent: PageContent = {
  editorial: null,
  classExamples: new Map(),
  fullExamples: [],
};
