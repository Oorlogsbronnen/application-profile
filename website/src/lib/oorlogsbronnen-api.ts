/**
 * Eén bron voor de koppeling tussen de Oorlogsbronnen-API en de same-origin
 * proxy. De API stuurt geen CORS-headers, dus de browser kan hem alleen
 * aanroepen via hetzelfde domein:
 *
 * - op acc-data.oorlogsbronnen.nl draait de API naast de site;
 * - op Netlify doet website/static/_redirects de doorverwijzing — een letterlijk
 *   tekstbestand dat niet kan importeren, dus wijzig dat mee.
 *
 * Lokaal (`pnpm start`) is er geen proxy: daar meldt de ApiRequest-component dat
 * de API niet bereikbaar is.
 *
 * Gebruikt door de ApiRequest-component. De voorbeelden in
 * docs/cookbook/persoon.mdx noemen de URL ook letterlijk.
 */
export const OORLOGSBRONNEN_API_BASE =
  "https://acc-data.oorlogsbronnen.nl/services/api";
export const OORLOGSBRONNEN_API_PROXY_PREFIX = "/services/api";
