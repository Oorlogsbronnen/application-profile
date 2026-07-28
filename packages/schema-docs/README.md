# @oorlogsbronnen/schema-docs

Genereert de documentatie van het **Oorlogsbronnen Application Profile** op [data.oorlogsbronnen.nl/schema](https://data.oorlogsbronnen.nl/schema), rechtstreeks uit de SHACL-shapes in [`ontology/`](../../ontology/): de gedeelde bouwstenen (`shapes-bouwstenen.ttl`) en één bestand per kennisgraaf (`shapes-personen.ttl` en `shapes-collecties.ttl`).

**De shapes-bestanden zijn de source of truth.** Deze package leest die bestanden en schrijft documentatie; hij wijzigt er nooit iets aan. Wil je iets aanpassen aan de inhoud van de schema-pagina (een naam, beschrijving, kardinaliteit), pas dan de shapes aan — bij de eerstvolgende build staat het op de site.

## Wat wordt er gegenereerd?

| Output                    | Waarheen                  | Wat                                                                              |
| ------------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| `application-profile.mdx` | `website/docs/datamodel/` | De pagina op `/schema`                                                           |
| `schema.ttl`              | `website/static/`         | Het volledige profiel (bouwstenen + beide grafen) op `/schema.ttl`               |
| `schema-personen.ttl`     | `website/static/`         | De kennisgraaf personen incl. bouwstenen, op `/schema-personen.ttl`              |
| `schema-collecties.ttl`   | `website/static/`         | De kennisgraaf objecten/collecties incl. bouwstenen, op `/schema-collecties.ttl` |

Deze bestanden zijn **ge-gitignored**: ze worden bij elke build opnieuw gemaakt en horen niet in git.

De pagina bevat:

1. **Overzicht** — per kennisgraaf een Mermaid-klassendiagram naar het model van [SCHEMA-AP-NDE](https://docs.nde.nl/schema-profile/#class-diagram): per klasse een box met de properties (pad, waardetype en kardinaliteit; relaties zonder waardetype — de pijl toont hun doel al), overerving (via `sh:node`) en verwijzingen (via `sh:class`-constraints van de gebruikte regels) als pijlen. Een verwijzing naar de andere graaf verschijnt als kale node, en elke node linkt naar zijn eigen sectie (mermaid-`securityLevel` staat daarvoor op `antiscript` in `docusaurus.config.ts`).
2. **Datamodellen en vocabulaires** _(optioneel)_ — redactionele toelichting uit het handgeschreven fragment [`website/docs/datamodel/_schema-toelichting.mdx`](../../website/docs/datamodel/_schema-toelichting.mdx). Is dat bestand leeg of verwijderd, dan vervalt dit hoofdstuk en schuift de nummering op.
3. **Personen** en **Objecten** — per kennisgraaf een hoofdstuk dat opent met een handgeschreven intro (`_schema-personen.mdx` / `_schema-objecten.mdx`, weggelaten als het bestand ontbreekt of leeg is), gevolgd door per NodeShape een genummerde sectie met de volledige IRI, de Nederlandse naam en beschrijving, de target classes en een tabel van de properties (kardinaliteit en waardetype), plus een JSON-LD-voorbeeld als dat bestaat.
4. **Volledige voorbeelden** _(optioneel)_ — één sectie per bestand in `ontology/examples/volledig/`.

## Voorbeelden toevoegen

Voorbeelden zijn JSON-LD-bestanden in `ontology/examples/`; er is geen generator-aanpassing nodig om er een toe te voegen:

- **Per klasse:** `ontology/examples/<LocalName>.jsonld` (bv. `CreativeWorkShape.jsonld`) verschijnt als "Voorbeeld"-codeblok onderaan de sectie van die klasse. Een bestandsnaam die bij geen enkele shape hoort breekt de build — een typefout verdwijnt dus nooit geruisloos.
- **Volledig:** bestanden in `ontology/examples/volledig/` verschijnen als eigen sectie in het hoofdstuk "Volledige voorbeelden" (bestandsnaam zonder extensie = sectiekop, alfabetisch gesorteerd).

Elk voorbeeldbestand wordt bij het genereren gevalideerd als JSON; kapotte JSON breekt de build met een melding die het bestand noemt.

## Gedrag en conventies

- **Koppen tonen de Nederlandse naam, ankers de local name.** De koptitel van een klasse is de `sh:name` van de shape (bv. "Archieven"), zodat de inhoudsopgave leesbaar blijft. Het URL-anker is altijd exact de Engelse local name van de IRI, zodat `https://data.oorlogsbronnen.nl/schema#ArchiveShape` — tegelijk de IRI van de shape én een URL — naar de juiste sectie blijft verwijzen. Ontbreekt de naam, dan valt de kop terug op de local name.
- **Klassen volgen de documentvolgorde van hun shapes-bestand.** Wil je de leesvolgorde op de pagina veranderen, herorden dan de shapes in `shapes-personen.ttl` of `shapes-collecties.ttl`. De volgorde van de hoofdstukken (personen vóór objecten) ligt vast in de generator.
- **De `Rule_*`/`Base_*`-bouwstenen worden niet getoond.** Ze blijven de bron voor kardinaliteit en waardetype per property, maar krijgen geen eigen hoofdstuk of ankers meer (besluit klantfeedback, zie `specs/2026-07-28-schema-pagina-klantfeedback.md`).
- **Kardinaliteit** komt uit `sh:minCount`/`sh:maxCount`. Inline constraints op een property gaan vóór die van de regel (zo wordt `sh:maxCount 0` weergegeven als "0 — niet toegestaan").
- **Waardetypen** worden herleid via de bouwstenen: `sh:datatype` → bv. `xsd:string`, `sh:nodeKind sh:IRI` → "IRI", `sh:class` of `sh:or` van klassen → "IRI van …" met een link. Verwijst een klasse naar een shape uit dit profiel, dan is dat een interne link.
- **Overerving** (`sh:node` op shape-niveau, zoals `ArchiveShape` → `CreativeWorkShape`) wordt getoond als verwijzing naar de basis-shape; de tabel toont alleen de eigen properties.
- **Lege beschrijvingen** (zoals `""@nl`) zijn geen fout en worden niet getoond.
- **Een niet-parseerbaar shapes-bestand breekt de build** met een duidelijke foutmelding — kapotte Turtle komt zo nooit onopgemerkt op de site.

## Teksten aanpassen

Alle vaste teksten van de pagina (intro, sectietitels, tabelkoppen, labels) staan bij elkaar in [`src/texts.ts`](src/texts.ts). Copy-wijzigingen kunnen daar, zonder de renderlogica te raken. De koptitels van klassen staan er bewust niet in: die komen uit de `sh:name` in de shapes-bestanden (zie hierboven).

## Gebruik

De generator draait automatisch mee met de website:

```sh
pnpm start   # (vanaf de repo-root) genereert en start de dev-server
pnpm build   # genereert en bouwt de site
```

Losse commando's, vanuit deze map of met `--filter`:

```sh
pnpm generate    # alleen genereren
pnpm test        # unit tests (vitest)
pnpm typecheck   # TypeScript-check
```

## Opbouw van de code

```
src/
  cli.ts             # entrypoint: lezen → parsen → renderen → wegschrijven
  parse-shapes.ts    # Turtle (N3.js) → domeinmodel
  model.ts           # het domeinmodel: ClassShape, RuleBlock, BaseBlock, …
  page-content.ts    # types voor redactionele en voorbeeld-inhoud
  load-content.ts    # laadt toelichting-fragment en voorbeelden van schijf
  presenter.ts       # gedeelde weergavelogica (kardinaliteit, toegestane klassen)
  render-page.ts     # domeinmodel + inhoud → MDX-pagina
  render-diagram.ts  # domeinmodel → Mermaid-classDiagram
  texts.ts           # alle vaste teksten van de pagina
test/                # unit tests op fixtures én op de echte shapes-bestanden
```
