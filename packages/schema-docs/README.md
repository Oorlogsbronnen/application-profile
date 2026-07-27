# @oorlogsbronnen/schema-docs

Genereert de documentatie van het **Oorlogsbronnen Application Profile** op [data.oorlogsbronnen.nl/schema](https://data.oorlogsbronnen.nl/schema), rechtstreeks uit de SHACL-shapes in [`ontology/shapes.ttl`](../../ontology/shapes.ttl).

**`shapes.ttl` is de source of truth.** Deze package leest dat bestand en schrijft documentatie; hij wijzigt er nooit iets aan. Wil je iets aanpassen aan de inhoud van de schema-pagina (een naam, beschrijving, kardinaliteit), pas dan `shapes.ttl` aan — bij de eerstvolgende build staat het op de site.

## Wat wordt er gegenereerd?

| Output                    | Waarheen                  | Wat                                                                             |
| ------------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| `application-profile.mdx` | `website/docs/datamodel/` | De pagina op `/schema`                                                          |
| `schema.ttl`              | `website/static/`         | Kopie van `ontology/shapes.ttl`, als machine-leesbare download op `/schema.ttl` |

Beide bestanden zijn **ge-gitignored**: ze worden bij elke build opnieuw gemaakt en horen niet in git.

De pagina bevat:

1. **Overzicht** — een Mermaid-diagram van de klasse-shapes: overerving (via `sh:node`) en verwijzingen (via `sh:class`-constraints van de gebruikte regels).
2. **Klassen** — per NodeShape een genummerde sectie met de volledige IRI, de Nederlandse naam en beschrijving, de target classes en een tabel van de properties (kardinaliteit en waardetype).
3. **Bouwstenen** — de herbruikbare blokken waaruit de klasse-shapes zijn opgebouwd: **regels** (`Rule_*`: property-pad + waardetype + kardinaliteit) en **basistypen** (`Base_*`: alleen een waardetype).

## Gedrag en conventies

- **Koppen zijn Engelse local names.** De koptitel van een klasse is exact de local name van de IRI (bv. `ArchiveShape`), en het URL-anker is daaraan gelijk. Zo verwijst `https://data.oorlogsbronnen.nl/schema#ArchiveShape` — tegelijk de IRI van de shape én een URL — altijd naar de juiste sectie. Beschrijvende teksten blijven Nederlands.
- **Elke bouwsteen heeft een eigen anker**, ook gelijk aan de local name (`/schema#Rule_title`). De property-tabellen linken ernaar.
- **Kardinaliteit** komt uit `sh:minCount`/`sh:maxCount`. Inline constraints op een property gaan vóór die van de regel (zo wordt `sh:maxCount 0` weergegeven als "0 — niet toegestaan").
- **Waardetypen** worden herleid via de bouwstenen: `sh:datatype` → bv. `xsd:string`, `sh:nodeKind sh:IRI` → "IRI", `sh:class` of `sh:or` van klassen → "IRI van …" met een link. Verwijst een klasse naar een shape uit dit profiel, dan is dat een interne link.
- **Overerving** (`sh:node` op shape-niveau, zoals `ArchiveShape` → `CreativeWorkShape`) wordt getoond als verwijzing naar de basis-shape; de tabel toont alleen de eigen properties.
- **Lege beschrijvingen** (zoals `""@nl`) zijn geen fout en worden niet getoond.
- **Een niet-parseerbare `shapes.ttl` breekt de build** met een duidelijke foutmelding — kapotte Turtle komt zo nooit onopgemerkt op de site.

## Teksten aanpassen

Alle vaste teksten van de pagina (intro, sectietitels, tabelkoppen, labels) staan bij elkaar in [`src/texts.ts`](src/texts.ts). Copy-wijzigingen kunnen daar, zonder de renderlogica te raken. De koptitels van klassen en bouwstenen staan er bewust niet in: die zijn altijd de local name (zie hierboven).

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
  presenter.ts       # gedeelde weergavelogica (kardinaliteit, toegestane klassen)
  render-page.ts     # domeinmodel → MDX-pagina
  render-diagram.ts  # domeinmodel → Mermaid-classDiagram
  texts.ts           # alle vaste teksten van de pagina
test/                # unit tests op een fixture én op de echte shapes.ttl
```
