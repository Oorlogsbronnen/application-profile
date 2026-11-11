/**
 * Basis-URL van de Oorlogsbronnen-API, zoals bezoekers hem zien en kopiëren.
 *
 * Gebruikt door de ApiRequest-component. De cookbook-pagina's en
 * docs/services/apis.mdx noemen de URL ook letterlijk.
 */
export const OORLOGSBRONNEN_API_BASE =
  "https://data.oorlogsbronnen.nl/services/api";

/**
 * De API stuurt geen CORS-headers, maar draait op elke Webslice-omgeving onder
 * /services/api op hetzelfde domein als de site (acceptatie én productie).
 * Daarom vraagt de browser een API-URL op via het eigen domein. Andere URL's
 * (een handmatig ingevulde, externe URL) blijven ongewijzigd. Lokaal met
 * `pnpm start` en op Netlify draait de API niet mee; daar meldt de
 * ApiRequest-component dat de API niet bereikbaar is.
 */
export function toSameOrigin(url: string): string {
  if (!url.startsWith(OORLOGSBRONNEN_API_BASE)) return url;
  return url.slice(new URL(OORLOGSBRONNEN_API_BASE).origin.length);
}
