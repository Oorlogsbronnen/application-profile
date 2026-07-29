# Data tastbaar maken: voorbeeldpersoon, live queryblokken en cookbook

`2026-07-28` · Steven Otto

## Waarom

De documentatie op data.oorlogsbronnen vertelt óver de data, maar laat die nergens zien: de schema-pagina toont abstracte shapes, de SPARQL- en API-pagina's zijn stubs zonder werkende voorbeelden. Voor een ontwikkelaar die wil afnemen is er geen bewijs dat het werkt en geen kortste-weg-naar-eerste-resultaat. Dit is de combinatie 1+2+3 uit `IDEAS.md` ("de meest zichtbare sprong"): één echte persoon als rode draad door alle documentatie, direct uitvoerbare queryblokken en een taakgericht cookbook. Eén overkoepelende spec, uit te voeren in fasen (besluit 2026-07-28).

## Scope

- **Wel:** keuze en verwerking van een voorbeeldpersoon (JSON-LD-voorbeelden op `/schema`, zelfde persoon in alle query- en API-voorbeelden), ingebedde uitvoerbare SPARQL-blokken, live API-voorbeelden, een cookbook-hoofdstuk, en het invullen van de stub-pagina's `services/sparql.md` en `services/apis.md` met de echte endpoints.
- **Niet:** MCP-server (idee 11), statistiekendashboard (4), starter-templates (6), SHACL-validatie in CI (9), wijzigingen aan de data zelf.

## Acceptatiecriteria

**Fase A — voorbeeldpersoon als rode draad**

1. De voorbeeldpersoon voldoet aan vastgelegde criteria: publiek bekend en overleden, rijke data (≥ 5 persoonsvermeldingen, gebeurtenissen via de vermeldingen, geboorte-/overlijdensgegevens, trefwoorden uit de WO2 Thesaurus). Kandidaten uit de data (2026-07-28): **Hannie Schaft** (11 vermeldingen, 6 gebeurtenissen, 7 trefwoorden — voorkeur), Willem Arondeus (8 vermeldingen), Erik Hazelhoff Roelfzema (8 vermeldingen). Definitieve keuze door team/NIOD (open vraag).
2. De JSON-LD-voorbeelden in `ontology/examples/` (per klasse van de personen-graaf plus één volledig voorbeeld) tonen échte, herleidbare records van de voorbeeldpersoon — geen verzonnen data; de IRI (`n2t.net/ark:…`) resolvet naar het record.
3. Alle query- en API-voorbeelden op de site gebruiken dezelfde persoon; de persoon is de rode draad van `/schema`-voorbeeld tot cookbook-recept.

**Fase B — live SPARQL**

4. `services/sparql.md` en `CLAUDE.md` documenteren het echte query-endpoint `https://sparql.ldmax.nl/wo2net`; de huidige verwijzing (`platform.ldmax.nl/organisaties/wo2net/query`) blijkt de query-UI en wordt als zodanig benoemd.
5. De SPARQL-pagina bevat een ingebedde editor (YASGUI of vergelijkbaar, client-side) met ≥ 3 vooringevulde, direct uitvoerbare queries rond de voorbeeldpersoon; elke voorbeeldquery voltooit ruim binnen de endpoint-timeout.
6. De editor werkt zonder keys of proxy, op zowel de Netlify-preview als productie (het endpoint stuurt `access-control-allow-origin: *`, geverifieerd 2026-07-28).

**Fase C — live API**

7. `services/apis.md` documenteert de echte Spinque-basis (`https://rest.spinque.com/4/oorlogsbronnen/api/in10/e/`), het endpoint-patroon (`{endpoint}/p/{parameter}/{waarde}/results?config=production`) en de voor afnemers relevante endpoints, met voorbeelden in curl en `@spinque/query-api`.
8. API-voorbeelden tonen echte (vastgelegde) responses; "probeer het nu"-uitvoering vanuit de browser werkt vanaf `data.oorlogsbronnen.nl` zodra het domein op de origin-allowlist van Spinque staat — tot die tijd degradeert het blok naar de vastgelegde response met een melding.

**Fase D — cookbook**

9. Een nieuw docs-hoofdstuk "Cookbook" bevat ≥ 3 taakgerichte recepten (bv. "bouw een tijdlijn van iemands oorlogsgebeurtenissen", "vind alle bronnen bij een persoon", "van zoekterm naar thesaurusconcept"), elk met een uitvoerbare query of API-call, de verwachte output en een korte toelichting.

## Bevindingen uit de verkenning (2026-07-28)

- Spinque API is publiek en keyloos, maar filtert op `Origin`: `https://www.oorlogsbronnen.nl` krijgt 200, `https://data.oorlogsbronnen.nl` krijgt 403. **Actiepunt:** Spinque/IN10 vragen `data.oorlogsbronnen.nl` toe te voegen aan de allowlist (blokkeert criterium 8, niets anders).
- De live data wijkt af van het profiel: `http://schema.org/` in plaats van `https://schema.org/`, en `pico:` = `…/model#` waar het profiel `picom:` = `…/model/#` documenteert. Voorbeeldqueries volgen noodgedwongen de live data; de discrepantie zelf is een apart te agenderen datakwestie (zie open vragen).
- Gebeurtenissen hangen in de data aan de persoonsvermeldingen (`schema:actor` → vermelding), niet aan de reconstructie; recepten en voorbeelden moeten die indirectie tonen — dat is precies het soort inzicht dat deze documentatie waardevol maakt.
- Spinque publiceert een OpenAPI 3.0-spec per API (`…/api/in10/swagger.json?config=production`): 116 paths (48 endpoints, 64 opbouw-componenten), maar zonder beschrijvingen ("description not available") en met generieke summaries (2026-07-29).

## Open vraag: endpoint-referentie

Hoe sommen we de ±112 endpoints netjes op zonder Spinque Desk na te bouwen? Gangbare patronen elders: een volledige gegenereerde referentie uit een OpenAPI-spec (Swagger UI/Redoc; voor Docusaurus: `docusaurus-openapi-docs` met try-it-panel) naast een handvol handgeschreven gidsen (het Stripe/GitHub-model: curated gidsen dragen het verhaal, de referentie is naslagwerk). **Advies:** de curated aanpak van nu voortzetten (gidsen + cookbook rond de kernendpoints) en de volledige lijst als compacte, gegenereerde referentietabel uit `swagger.json` toevoegen (naam, parameters, output-type, gegroepeerd op onderwerp) — zelfde filosofie als de schema-generator. Een volledige `docusaurus-openapi-docs`-referentie wordt pas waardevol als Spinque beschrijvingen aan de spec toevoegt; dat verzoek bij Spinque uitzetten. Beslissen met het team.

Proefopstelling `docusaurus-openapi-docs` (2026-07-29, beoordeeld en weer verwijderd): 116 gegenereerde pagina's onder `/api-referentie`, gegroepeerd op de tags uit de spec (meta/start/stack/end, mét tagbeschrijvingen). Het raamwerk is sterk (parameters, code-snippets in zes talen, try-it-panel, tag-landingspagina's), maar vrijwel alle inhoud toonde "description not available"; de paden tonen de composable `/q/…/...`-vorm in plaats van de praktische `/e/…/results`-aanroep; het try-it-panel mist de verplichte `config`-parameter en loopt tegen dezelfde origin-allowlist aan; en de magere pagina's vervuilden sidebar en `llms.txt` (140 i.p.v. 19 documenten). **Besluit (Steven, 2026-07-29): niet waardevol in deze staat; verwijderd.** Terugzetten zodra Spinque de spec verrijkt kan zo:

1. `pnpm --filter website add docusaurus-plugin-openapi-docs docusaurus-theme-openapi-docs @docusaurus/theme-common` (dat laatste pakket importeren de gegenereerde pagina's).
2. Spec ophalen: `curl "https://rest.spinque.com/4/oorlogsbronnen/api/in10/swagger.json?config=production" -o website/openapi/spinque-in10.json`.
3. In `docusaurus.config.ts`: theme `docusaurus-theme-openapi-docs` toevoegen, `docItemComponent: "@theme/ApiItem"` op de docs-preset, en een plugin-blok `docusaurus-plugin-openapi-docs` met `specPath: "openapi/spinque-in10.json"`, `outputDir: "docs/api-referentie"` en `sidebarOptions: { groupPathsBy: "tag", categoryLinkSource: "tag" }`.
4. Genereren: `npx docusaurus gen-api-docs all` (vanuit `website/`), plus een `_category_.json` in de outputmap.
5. Dan ook regelen: `config=production` en de `/e/…`-vorm in de spec (verzoek bij Spinque), de proxy/allowlist voor het try-it-panel, en `docs/api-referentie` uitsluiten in de llms-plugin.

## Besluiten (2026-07-28/29)

- De API-voorbeelden hebben een bewerkbare request-URL, zodat bezoekers parameters kunnen aanpassen en live uitvoeren (met herstel-knop); dit is bewust een lichte "probeer het"-ervaring, geen herbouw van Spinque Desk.
- Naast curl en JavaScript tonen de API-voorbeelden ook Python (`spinque-query-api`; live geverifieerd tegen de API).
- Yasgui biedt geen theming-API; de editor is met CSS-overrides op de Infima-tokens in de huisstijl gebracht, inclusief dark mode (aparte tokenkleuren voor variabelen en IRI's).

- De voorbeeldpersoon is **Hannie Schaft** (bevestigd door Steven).
- Het allowlist-verzoek bij Spinque wordt door Steven uitgezet; tot het rond is degraderen de live API-blokken overal (ook previews) naar de vastgelegde responses met melding, conform criterium 8.
- Aanvullend (2026-07-29): om live gedrag toch direct te kunnen testen proxied Netlify `/spinque-api/*` server-side naar de Spinque API (`website/static/_redirects`). De browser doet dan een same-origin request zonder `Origin`-header, dus de allowlist speelt niet. De component probeert eerst de directe URL (gaat vanzelf werken zodra de allowlist rond is), dan de proxy, dan pas de vastgelegde response. De `Origin`-header zelf vervalsen kan niet — browsers staan dat niet toe. De proxy is tijdelijk en verdwijnt zodra de allowlist is bijgewerkt; let op dat dit bij de migratie naar shared hosting anders opgelost moet worden als hij dan nog nodig is.
- De namespace-discrepantie tussen data en profiel wordt nu genegeerd: voorbeelden en queries tonen de daadwerkelijke responses van endpoint en API, zonder de shapes, `context.jsonld` of de data aan te passen. Herstel is een apart, later traject.
