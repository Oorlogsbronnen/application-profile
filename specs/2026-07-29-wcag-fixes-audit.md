# WCAG-fixes uit de audit van 29 juli 2026

`2026-07-29` · Steven Otto · vervolg op PR #23/#24

## Waarom

De WCAG 2.2 A/AA-audit van 29 juli (axe-core op alle 19 pagina's + broncode-review) vond drie
schendingen die gebruikers daadwerkelijk blokkeren: JSON-syntaxkleuren in lichte modus halen
2,6:1 waar 4,5:1 vereist is (honderden elementen op `/schema` en `/services/apis`), de
SPARQL-editor heeft naamloze invoervelden en een onaangekondigde Esc-uitweg, en actieve
sidebar-links/breadcrumbs en links in inline-code zakken op hun grijze achtergrond net onder AA.
Toegankelijkheid is bij Norday een pre-conditie; zolang dit open staat is de kernfunctionaliteit
("probeer het direct") formeel kapot voor toetsenbord- en schermlezergebruikers.

## Scope

- **Wel:** contrastfixes lichte modus — Prism-tokenkleuren (licht codethema), actieve
  sidebar-link, actieve breadcrumb, links in inline-`code`.
- **Wel:** SPARQL-editor — accessible name op het invoerveld en zichtbare Esc-instructie.
- **Wel:** `accTitle`/`accDescr` op de gegenereerde Mermaid-diagrammen (`schema-docs`).
- **Niet:** herstructurering `aria-live` in `ApiExample`, statusmeldingen bij SPARQL-resultaten
  en Nederlandse Yasgui-knoplabels (audit-punten 4–6) — apart vervolg.
- **Niet:** de suggesties uit de audit ("Voorbeeld"-koppen, resize-handle, groepskoppen).

## Acceptatiecriteria

1. axe-core (WCAG 2.x A/AA-tags) rapporteert 0 violations op alle pagina's uit de sitemap,
   in lichte én donkere modus.
2. Alle tokenkleuren van het lichte Prism-codethema halen ≥ 4,5:1 op de
   codeblok-achtergrond (`#f6f8fa`) — ook kleuren die in de huidige content nog niet voorkomen.
   Het donkere thema (dracula) blijft ongewijzigd.
3. Actieve sidebar-link, actieve breadcrumb en links in inline-`code` halen ≥ 4,5:1 op hun
   werkelijke (grijze) achtergrond; de gebruikte kleuren komen uit de bestaande
   rood-schaal van het ontwerpsysteem.
4. De SPARQL-editorvelden hebben een Nederlandstalige accessible name (axe-regel `label`:
   0 violations op `/services/sparql` en de drie cookbook-pagina's).
5. Bij elke SPARQL-editor staat zichtbare tekst die meldt dat Esc de editor verlaat
   (WCAG 2.1.2: niet-standaard uitweg moet gemeld worden).
6. Beide diagrammen op `/schema` hebben via `accTitle`/`accDescr` een accessible name en een
   verwijzing naar de tabellen eronder als volwaardig tekstalternatief.
7. `pnpm build`, `pnpm typecheck` en `pnpm test` zijn groen.
