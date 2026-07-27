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

## Besluiten

- Domein: `data.oorlogsbronnen.nl` (`url`/`baseUrl` in de Docusaurus-config).
- De minimale styling volgt het Oorlogsbronnen-ontwerpsysteem in [Figma (NOB | Oorlogsbronnen.nl)](https://www.figma.com/design/pL5QrzmTgnXz1SlCPCfofu/NOB-%7C-Oorlogsbronnen.nl?node-id=7898-1837); de uitwerking blijft buiten scope van deze spec.
- De site is uitsluitend Nederlandstalig.
