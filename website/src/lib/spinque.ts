/**
 * Eén bron voor de koppeling tussen de Spinque API en de same-origin proxy.
 * Gebruikt door de ApiExample-component (live-terugval) en de dev-proxy in
 * docusaurus.config.ts. De derde plek, website/static/_redirects (Netlify),
 * is een letterlijk tekstbestand en kan niet importeren — wijzig die mee.
 */
export const SPINQUE_API_BASE = "https://rest.spinque.com/4/oorlogsbronnen/api";
export const SPINQUE_PROXY_PREFIX = "/spinque-api";
