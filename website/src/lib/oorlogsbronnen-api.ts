/**
 * Basis-URL van de Oorlogsbronnen-API. De API stuurt geen CORS-headers, maar
 * draait op hetzelfde domein als deze site (data.oorlogsbronnen.nl), dus de
 * browser kan hem daar rechtstreeks aanroepen. Op andere domeinen (lokaal met
 * `pnpm start`, Netlify-previews) meldt de ApiRequest-component dat de API niet
 * bereikbaar is.
 *
 * Gebruikt door de ApiRequest-component. De cookbook-pagina's en
 * docs/services/apis.mdx noemen de URL ook letterlijk.
 */
export const OORLOGSBRONNEN_API_BASE =
  "https://data.oorlogsbronnen.nl/services/api";
