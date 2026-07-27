# Docusaurus-documentatiesite in monorepo-opzet

`2026-07-27` · Steven Otto

## Waarom

Team Oorlogsbronnen wil de documentatie van het data.oorlogsbronnen-platform zelf in GitHub schrijven (markdown/MDX) en gepubliceerd zien als minisite. De huidige Widoco-pipeline dekt alleen de ontologie; er is geen plek voor uitleg van de REST API (Spinque), verwijzingen naar de LDmax-omgevingen en straks automatisch gegenereerde datamodel-documentatie uit de `.ttl`-bestanden (zoals personsincontext.org/model). Docusaurus wordt de basis van dat platform. Een monorepo-opzet laat de site, de RDF-bronbestanden en toekomstige tooling (ttl→docs-generator) in één repo samenleven.

## Scope

- **Wel:** pnpm-workspace als monorepo-basis; Docusaurus (classic, TypeScript) in `website/`; basisnavigatie met secties REST API, Linked Data (LDmax) en Datamodel; documentatie schrijfbaar als markdown/MDX; RDF-bestanden blijven op hun huidige plek.
- **Niet:** de ttl→documentatie-generator zelf (aparte spec); styling volgens het Oorlogsbronnen-ontwerpsysteem (aparte taak); deploy/hosting van de site; wijzigingen aan de bestaande Widoco-pipeline.

## Acceptatiecriteria

1. `pnpm install && pnpm --filter website build` slaagt vanaf een schone checkout.
2. `pnpm --filter website start` serveert een minisite met menu links, inhoud in het midden en paginanavigatie op subkoppen rechts.
3. De site bevat startpagina's voor drie secties: REST API (Spinque-endpoints en `@spinque/query-api`), Linked Data-omgevingen (LDmax, datasets `wo2net/personen` en `wo2net/collecties`) en Datamodel (placeholder voor gegenereerde ttl-documentatie).
4. Nieuwe documentatie is toe te voegen door een `.md`/`.mdx`-bestand in `website/docs/` te zetten, zonder code aan te raken.
5. Bestaande bestanden (`ontology/`, `context/`, `schemas/`) en de Widoco-workflow blijven ongewijzigd.

## Open vragen

- Waar wordt de site gehost en onder welk domein (data.oorlogsbronnen.nl?) — bepaalt `url`/`baseUrl` in de config.
- Wat is de bron van het Oorlogsbronnen-ontwerpsysteem (tokens, CSS, Figma?) voor de minimale styling?
- Eén- of tweetalig (nl/en)? De ontologie is tweetalig; de site start nu eentalig Nederlands.
