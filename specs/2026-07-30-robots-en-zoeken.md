# robots.txt en lokale zoekfunctie

`2026-07-30` · Steven Otto · voorbereiding livegang (zie ook specs/2026-07-29-wcag-fixes-audit.md)

## Waarom

Twee gaten uit de livegang-check van 30 juli. Zoekmachines vinden de (automatisch
gegenereerde) sitemap niet omdat een `robots.txt` met verwijzing ontbreekt. En bezoekers
hebben geen zoekfunctie — alleen de sidebar — terwijl het cookbook en de schema-pagina
groeien. Omdat de site uiteindelijk op shared hosting draait, kiezen we een lokale
zoekindex (`@easyops-cn/docusaurus-search-local`) die bij de build wordt gegenereerd:
geen externe dienst, geen API-keys, werkt overal.

## Scope

- **Wel:** `robots.txt` in `website/static/` die alle crawlers toestaat en naar de
  sitemap verwijst.
- **Wel:** lokale zoekfunctie via `@easyops-cn/docusaurus-search-local`, geconfigureerd
  voor Nederlands en de docs-only mode (`routeBasePath: "/"`).
- **Wel:** Nederlandse vertaling van de zoek-UI via `website/i18n/nl/code.json`
  (de plugin levert zelf geen nl-vertaling mee).
- **Niet:** Algolia DocSearch (externe dienst, aanvraagtraject).
- **Niet:** de social card (`og:image`) en analytics uit dezelfde livegang-check.
- **Niet:** aanmelden bij Google Search Console — handmatige actie na livegang.

## Acceptatiecriteria

1. `/robots.txt` wordt geserveerd, staat alle crawlers toe en verwijst naar
   `https://data.oorlogsbronnen.nl/sitemap.xml`.
2. De navbar toont op elke pagina een zoekveld; zoeken op bijv. "thesaurus" geeft
   relevante pagina's als resultaat, volledig client-side (geen requests naar externe
   domeinen).
3. De zoekindex wordt bij de build gegenereerd (met content-hash voor cache-busting) en
   dekt alle docs-pagina's, inclusief de gegenereerde `/schema`-pagina.
4. De zoek-UI (placeholder, "geen resultaten", zoekpagina) is Nederlandstalig.
5. Het zoekveld en de resultatenlijst zijn met het toetsenbord bedienbaar en introduceren
   geen nieuwe axe-violations (WCAG 2.2 A/AA, aansluitend op de audit van 29 juli).
6. `pnpm build` en `pnpm typecheck` zijn groen.
