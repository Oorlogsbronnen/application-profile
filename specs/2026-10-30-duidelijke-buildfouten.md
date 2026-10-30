# Duidelijke foutmeldingen bij fouten in de bronbestanden

`2026-10-30` · Steven Otto · [SUPP-4692](https://in10-rotterdam.atlassian.net/browse/SUPP-4692)

## Waarom

- Recent zijn twee Turtle-fouten op `main` beland zonder dat iemand ze opmerkte. De eerste was een ongebonden prefix `schema:` in `schema_ext-oorlogsbronnen.ttl` (PR #37). De tweede was een dubbele `sh:class` in `shapes-bouwstenen.ttl` (`af5b461`), en die blokkeerde ruim een week elke deploy.
- De eerste fout viel in de build niet op, omdat niets in de build `schema_ext-oorlogsbronnen.ttl` inleest. De tweede was alleen te vinden in een lange, technische deploy-log.
- Wie de `.ttl`-bestanden wijzigt, moet een fout zien in de pull request, in gewone taal en vóór er iets live gaat.
- De controle staat los van de hosting. De site gaat binnenkort van Netlify naar eigen hosting, en de deploy daar kan op deze check voortbouwen.

## Scope

- **Wel:**
  - een controle die alle `ontology/*.ttl` inleest en de schema-generator draait zonder iets weg te schrijven;
  - een GitHub Actions-check op pull requests naar `main`;
  - een werkafspraak met Micon dat wijzigingen aan `.ttl`-bestanden via een pull request lopen, zodat de check vóór de merge draait;
  - een README-sectie die de verouderde sectie "Automatisering" (Widoco/gh-pages) vervangt.
- **Niet:**
  - Netlify-specifieke meldingen en uitleg over Netlify-storingen (Netlify verdwijnt binnenkort);
  - een eigen melding bij gebroken links (Docusaurus meldt die zelf al);
  - de deploy naar eigen hosting;
  - data valideren tegen de SHACL-shapes;
  - branch protection instellen.

## Acceptatiecriteria

1. Een Turtle-syntaxfout in een willekeurig `.ttl`-bestand in `ontology/` geeft een melding met bestandsnaam, regelnummer en oorzaak in gewone taal.
2. Beide eerdere fouten (het ongebonden prefix `schema:` en de dubbele `sh:class`) zijn als testgeval vastgelegd en geven zo'n melding.
3. Weigert de generator een shape, dan noemt de melding het bestand, de shape en wat er ontbreekt.
4. De controle draait lokaal met één commando, en `pnpm build` begint ermee.
5. Een PR naar `main` met een van deze fouten krijgt een rode check. De melding is in GitHub te lezen, en bij een `.ttl`-fout ook als annotatie op de betreffende regel in de PR-diff.
6. De check bouwt de website niet; hij leest alleen de bronbestanden in en draait de generator.
7. De meldingen zijn in het Nederlands en te begrijpen zonder kennis van Node, pnpm of Docusaurus.
8. De README legt op één scherm uit hoe je een `.ttl`-wijziging via de GitHub-website als pull request indient, en wat je doet bij een rode check.

## Open vragen

- Wordt de check verplicht voor het mergen (branch protection op `main`)? PR #37 is gemerged ondanks een rode deploy-preview. Dit is een GitHub-instelling en blokkeert de implementatie niet.
