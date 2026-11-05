/** Hulpfuncties voor de weergave van responses van de Oorlogsbronnen-API. */

export type Json = any;

/** Alle velden in een entiteit zijn lijsten; `first()` pakt de eerste waarde. */
export const first = (v: Json): Json => (Array.isArray(v) ? v[0] : v);
export const arr = (v: Json): Json[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];
export const idOf = (v: Json): string | undefined =>
  typeof v === "string" ? v : v?.id;

/** De entiteiten uit een response: { items: [ { tuple: [ entiteit ] } ] } */
export const entities = (data: Json): Json[] =>
  arr(data?.items)
    .map((item) => item?.tuple?.[0])
    .filter(Boolean);

/** Metadata komt van veel bronnen: alleen http(s) mag een link worden. */
export const safeUrl = (url: unknown): string | undefined =>
  typeof url === "string" && /^https?:\/\//i.test(url) ? url : undefined;

/**
 * Sommige beschrijvingen bevatten HTML. Die tonen we als platte tekst: React
 * escapet de uitkomst, dus ook onvolledig verwijderde opmaak blijft onschadelijk.
 */
export const stripHtml = (s: string): string =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Nederlands label uit `prefLabel`/`label`: { nl: ["…"] } of ["…"]. */
export function labelOf(v: Json): string | undefined {
  for (const label of [v?.prefLabel, v?.label]) {
    if (!label) continue;
    const text = Array.isArray(label)
      ? label[0]
      : (label.nl?.[0] ?? label.en?.[0] ?? first(Object.values(label)[0]));
    if (text) return text;
  }
  return undefined;
}

/** Leesbare tekst van een veld dat een string of een thesaurusterm kan zijn. */
export const textOf = (v: Json): string | undefined =>
  typeof v === "string" ? v : (labelOf(v) ?? first(v?.name));

/** De link naar de oorspronkelijke bron valt terug op de ID van de bron. */
export const sourceUrl = (source: Json): string | undefined =>
  safeUrl(first(source?.url)) ?? safeUrl(idOf(source));

/** Bekende bronnen: domein → leesbare naam */
const SOURCES: Record<string, string> = {
  "kampwesterbork.nl": "Herinneringscentrum Kamp Westerbork",
  "stolpersteine.app": "Stolpersteine",
  "arolsen-archives.org": "Arolsen Archives",
  "joodsmonument.nl": "Joods Monument",
  "oorlogsgravenstichting.nl": "Oorlogsgravenstichting",
  "oorlogslevens.nl": "Oorlogslevens",
  "oorlogsbronnen.nl": "Oorlogsbronnen",
  "data.niod.nl": "NIOD",
  "noord-hollandsarchief.nl": "Noord-Hollands Archief",
  "iisg.amsterdam": "IISG",
  "documentatiegroep40-45.nl": "Documentatiegroep 40-45",
  "scouting.nl": "Scouting Nederland",
};

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function sourceName(url: string): string {
  const h = host(url);
  const key = Object.keys(SOURCES).find((d) => h === d || h.endsWith("." + d));
  return key ? SOURCES[key] : h;
}

export function fmtDate(d?: string): string | null {
  if (!d) return null;
  const parts = d.split("-");
  if (parts.length === 1) return d; // alleen een jaartal
  const date = new Date(d + "T12:00:00");
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("nl-NL", {
    day: parts.length === 3 ? "numeric" : undefined,
    month: "long",
    year: "numeric",
  });
}
