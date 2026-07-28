# Schema-pagina: klantfeedback (volgorde, toelichting, voorbeelden)

`2026-07-28` · Steven Otto

## Waarom

De klant heeft feedback gegeven op de gegenereerde `/schema`-pagina: de alfabetische volgorde van de klassen leest niet logisch, er is behoefte aan een eigen redactionele toelichting op de gebruikte datamodellen en vocabularies, het hoofdstuk Bouwstenen voegt voor de lezer niets toe, en er is vraag naar JSON-LD-voorbeelden per klasse plus volledige voorbeelden — naar het model van [docs.nde.nl/schema-profile](https://docs.nde.nl/schema-profile/). Zonder deze aanpassingen blijft de pagina een technische dump in plaats van leesbare documentatie.

## Scope

- **Wel:** volgorde van klassen, redactioneel tussenhoofdstuk, verwijderen Bouwstenen-hoofdstuk + Regel-kolom, Voorbeeld-blokken per klasse, hoofdstuk met volledige voorbeelden.
- **Niet:** inhoudelijke wijzigingen aan `shapes.ttl`, styling, de overige documentatiepagina's.

## Acceptatiecriteria

1. De klassen in hoofdstuk "Klassen" volgen de **documentvolgorde van `shapes.ttl`** (niet meer alfabetisch). Herordenen voor de lezer = de shapes in `shapes.ttl` herordenen; de generator volgt.
2. Tussen "Overzicht" en "Klassen" staat een redactioneel hoofdstuk (bv. "Gebruikte datamodellen en vocabularies") uit een **handgeschreven MDX-fragment** (`website/docs/datamodel/_schema-toelichting.mdx`, underscore = geen eigen Docusaurus-pagina). De redactie bewerkt dat bestand rechtstreeks; de generator voegt het in en de hoofdstuknummering schuift automatisch op. Ontbreekt of leeg bestand → hoofdstuk weggelaten.
3. Het hoofdstuk "Bouwstenen" en de kolom "Regel" in de property-tabellen zijn verwijderd. Kardinaliteit en waardetype blijven per property zichtbaar (nog steeds afgeleid uit de `Rule_*`/`Base_*`-blokken in `shapes.ttl` — alleen de weergave vervalt).
4. Een bestand `ontology/examples/<LocalName>.jsonld` (bv. `CreativeWorkShape.jsonld`) wordt gerenderd als **"Voorbeeld"-codeblok** onderaan de sectie van die klasse. Geen bestand → geen blok; geen generator-aanpassing nodig om een voorbeeld toe te voegen.
5. Bestanden in `ontology/examples/volledig/` worden gerenderd als afsluitend hoofdstuk **"Volledige voorbeelden"**, één sectie per bestand, naar het model van NDE's "Full examples".
6. Voorbeeldbestanden worden bij het genereren gevalideerd als JSON; een kapot bestand breekt de build met een duidelijke foutmelding.
7. Bestaande ankers van klassen (`/schema#ArchiveShape`) blijven ongewijzigd werken.

## Besluiten

- Dit herroept het eerdere besluit (spec schema-docs-generator, 2026-07-27) om `Rule_*`/`Base_*` zichtbaar te documenteren. Gevolg: ankers als `/schema#Rule_title` verwijzen niet langer naar een sectie op de pagina; de blokken blijven wel bestaan in `shapes.ttl` en `/schema.ttl`.
- Documentvolgorde volstaat; geen zichtbare groepen met tussenkopjes binnen "Klassen" (2026-07-28).
- Voorbeelden alleen in JSON-LD, geen Turtle-tab (2026-07-28).
