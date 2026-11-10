/** Hulpfuncties voor de weergave van responses van de Oorlogsbronnen-API. */

export type Json = any;

/** Bijna alle velden in een entiteit zijn lijsten; `first()` pakt de eerste waarde. */
export const first = (v: Json): Json => (Array.isArray(v) ? v[0] : v);
export const arr = (v: Json): Json[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];
export const idOf = (v: Json): string | undefined =>
  typeof v === "string" ? v : v?.id;

/** De UUID uit een ARK-link of persoons-URL, zoals …/person/48968c01-… */
export const uuidOf = (v: unknown): string | undefined =>
  typeof v === "string"
    ? v.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      )?.[0]
    : undefined;

/** De entiteiten uit een response: { items: [ { tuple: [ entiteit ] } ] } */
export const entities = (data: Json): Json[] =>
  arr(data?.items)
    .map((item) => item?.tuple?.[0])
    .filter(Boolean);

/**
 * Sinds `person` ook de vermeldingen en gebeurtenissen meelevert, zitten die
 * genest in het profiel: persoon.wasDerivedFrom[] zijn de persoonsvermeldingen,
 * vermelding.actor[] de gebeurtenissen uit die vermelding.
 */
export const observationsOf = (data: Json): Json[] =>
  entities(data).flatMap((person) => arr(person.wasDerivedFrom));

/** Een gebeurtenis heeft zelf geen bron: die erft hij van zijn vermelding. */
export const eventsOf = (data: Json): Json[] =>
  observationsOf(data).flatMap((observation) =>
    arr(observation.actor).map((event) => ({
      ...event,
      hadPrimarySource: arr(event.hadPrimarySource).length
        ? event.hadPrimarySource
        : observation.hadPrimarySource,
    })),
  );

/** Metadata komt van veel bronnen: alleen http(s) mag een link worden. */
export const safeUrl = (url: unknown): string | undefined =>
  typeof url === "string" && /^https?:\/\//i.test(url) ? url : undefined;

/**
 * Sommige beschrijvingen en titels bevatten HTML. Die tonen we als platte tekst:
 * React escapet de uitkomst, dus ook onvolledig verwijderde opmaak blijft
 * onschadelijk. Alleen echte tags gaan eruit, zodat "a < b" gewoon blijft staan.
 */
export const stripHtml = (s: string): string =>
  s
    .replace(/<\/?[a-z][^>]*>/gi, " ")
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
  "beeldbankwo2.nl": "Beeldbank WO2",
  "hetutrechtsarchief.nl": "Het Utrechts Archief",
  "archief.zaanstad.nl": "Gemeentearchief Zaanstad",
  "studiezaal.nijmegen.nl": "Regionaal Archief Nijmegen",
  "erfgoedleiden.nl": "Erfgoed Leiden",
  "collectiegelderland.nl": "Collectie Gelderland",
  "hdl.handle.net": "Persistente link (Handle)",
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

/**
 * De bronnen uit `hadPrimarySource`. Alleen `url` is een werkende link; de `id`
 * is een identifier die niet altijd opent en gebruiken we dus alleen voor de naam.
 */
export const primarySources = (v: Json): { name: string; url?: string }[] =>
  arr(v).flatMap((source) => {
    const url = safeUrl(first(source?.url));
    const reference = url ?? idOf(source);
    return reference ? [{ name: sourceName(reference), url }] : [];
  });

export function fmtDate(value?: string): string | null {
  if (!value) return null;
  // Een tijd erachter (1945-11-27T00:00:00) laten we weg.
  const d = /^\d{4}-\d{2}-\d{2}T/.test(value) ? value.slice(0, 10) : value;
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
