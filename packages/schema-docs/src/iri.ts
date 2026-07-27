import type { Term } from "./model.js";

export type Prefixes = Record<string, string>;

/** Compacteert een IRI naar prefixvorm op basis van de langste passende namespace. */
export function compactIri(iri: string, prefixes: Prefixes): string {
  const match = Object.entries(prefixes)
    .filter(([, ns]) => iri.startsWith(ns) && iri.length > ns.length)
    .sort(([, a], [, b]) => b.length - a.length)[0];

  if (!match) {
    return iri;
  }
  const [prefix, ns] = match;
  return `${prefix}:${iri.slice(ns.length)}`;
}

export function toTerm(iri: string, prefixes: Prefixes): Term {
  return { iri, compact: compactIri(iri, prefixes) };
}

/** De local name van een IRI: het deel na `#`, of anders na de laatste `/`. */
export function localName(iri: string): string {
  const hashIndex = iri.indexOf("#");
  if (hashIndex >= 0) {
    return iri.slice(hashIndex + 1);
  }
  return iri.slice(iri.lastIndexOf("/") + 1);
}
