# Ideeën: data.oorlogsbronnen naar een hoger niveau

`2026-07-28` · geparkeerde brainstorm, nog niet besproken met het team. Leidend principe: **de data zelf laten zien, niet alleen erover vertellen.**

## De data tastbaar maken

1. **Eén echte entiteit als rode draad** — kies één persoon uit de data en laat die overal terugkomen: in JSON-LD, via de API, via SPARQL, in het datamodel. Abstracte shapes worden een verhaal.
2. **Live "probeer het nu"-blokken** — ingebedde SPARQL-editor (YASGUI) met direct uitvoerbare voorbeeldqueries; API-voorbeelden met echte responses.
3. **Cookbook met data stories** — taakgerichte recepten: "bouw een tijdlijn van gebeurtenissen", "vind alle foto's bij een persoon", "koppel je collectie aan de thesaurus".
4. **Automatisch statistiekendashboard** — bij elke build actuele aantallen (personen, gebeurtenissen, bronnen per dataset) via SPARQL ophalen en tonen.

## Voor ontwikkelaars

5. **Code-tabs per taal** — elk voorbeeld in curl, JavaScript (`@spinque/query-api`) en Python naast elkaar.
6. **Starter-templates** — StackBlitz/CodeSandbox met werkende mini-app op de API, gelinkt vanaf de introductie.
7. **Interactieve modelgraaf** — het Mermaid-overzicht op `/schema` opwaarderen naar een klikbare visualisatie.

## Vertrouwen en volwassenheid

8. **Versionering van het profiel** — releases met semver en gegenereerde changelog uit de git-historie van `shapes.ttl`.
9. **SHACL-validatie in CI met badge** — voorbeelddata die aantoonbaar valideert tegen de shapes; het profiel als getest contract.
10. **Showcase-galerij** — "gebouwd met Oorlogsbronnen-data" op de Meedoen-pagina.

## Voor AI-agents

11. **MCP-server** — SPARQL en Spinque als tools, zodat onderzoekers in Claude of andere agents rechtstreeks vragen aan de data kunnen stellen. Onderscheidend in de erfgoedsector; verdient een eigen spec.

## Eerder benoemde punten (kleiner)

- AI-crawl-/robots.txt-beleid (besluit team/NIOD, i.v.m. NC-licentie) — open vraag uit `specs/2026-07-27-llms-txt.md`.
- Zoekfunctie op de site (lokale search of Algolia DocSearch).
- Inhoud voor de stub-pagina's: Termennetwerk, IIIF, Contact, Datasetregister.
- `wgs:`-prefix in `shapes.ttl` mist een `#` — door het team te bevestigen en fixen.
- Migratie Netlify → shared hosting + DNS `data.oorlogsbronnen.nl`.
- Promotie-PR `data` → `main` en verhouding tot de Widoco-pipeline.
- Datasetregister-aansluiting bij NDE (schema.org `Dataset`-beschrijvingen).

**Advies destijds:** combinatie 1 + 2 + 3 geeft de meest zichtbare sprong; 11 is de strategische langetermijnzet; 8 + 9 zijn goedkoop maar belangrijk zodra externe partijen serieus afnemen.
