# Generator voor de application profile-documentatie op /schema

`2026-07-27` · Steven Otto

## Waarom

Het application profile moet voor ontwikkelaars leesbaar gedocumenteerd zijn, zoals [SCHEMA-AP-NDE](https://docs.nde.nl/schema-profile/) en [Persons in Context](https://www.personsincontext.org/model/) dat doen. Handmatig bijhouden loopt onvermijdelijk uit de pas met de werkelijkheid; daarom wordt de documentatie gegenereerd uit `ontology/shapes.ttl`, dat altijd de source of truth is en blijft. Extra reden om dit goed te doen: de namespace van het profiel ís `https://data.oorlogsbronnen.nl/schema#`, dus de pagina op `/schema` is tegelijk het namespace-document — een term-IRI als `https://data.oorlogsbronnen.nl/schema#PersoonReconstructionShape` moet direct naar de juiste sectie leiden.

## Tooling-afweging

- **[shacl-play](https://github.com/sparna-git/shacl-play)** (Sparna, Java): genereert kant-en-klare HTML-documentatie en UML-diagrammen uit een SHACL-profiel. Actief onderhouden, maar de output is een losstaande pagina met eigen styling en eigen ankerstructuur — integreert niet in Docusaurus en geeft geen controle over de ankers.
- **pyLODE** (Python): gericht op OWL-ontologieën, beperkte SHACL-ondersteuning.
- **Eigen generator**: NDE bouwde er zelf ook één (Bikeshed + Liquid over hun `shacl.ttl`) — er is geen kant-en-klare tool die SHACL naar Docusaurus-pagina's vertaalt.

**Keuze:** een eigen TypeScript-generator in `packages/schema-docs/`, die `shapes.ttl` parseert (met [N3.js](https://github.com/rdfjs/N3.js)) en één MDX-pagina genereert. Dit geeft volledige controle over ankers, structuur en huisstijl, past in de monorepo en de Norday-standaarden, en de shapes hebben een regelmatige structuur (NodeShapes met `sh:name`/`sh:description` in het Nederlands). shacl-play blijft optioneel inzetbaar voor een UML-diagram als aanvulling.

## Scope

- **Wel:** generator-package dat uit `ontology/shapes.ttl` een Nederlandstalige documentatiepagina genereert op `/schema`; per NodeShape een sectie met naam, beschrijving, target classes en een property-tabel (property-IRI met link, naam, beschrijving, kardinaliteit, waardetype); generatie als onderdeel van de website-build (niet met de hand bijgewerkt, gegenereerde output wordt niet gecommit); `shapes.ttl` zelf downloadbaar als machine-leesbare variant.
- **Niet:** wijzigingen aan `shapes.ttl` zelf; JSON-LD-voorbeelden per klasse (zoals NDE heeft — kan later, handmatig of via MDX-partials); UML-diagram; content negotiation op `/schema` (Netlify ondersteunt geen Accept-header-redirects zonder functions).

## Acceptatiecriteria

1. `pnpm build` genereert de pagina op `/schema` uit `ontology/shapes.ttl`; een wijziging in de shapes is na een nieuwe build zichtbaar zonder verdere handelingen.
2. Elke NodeShape in de `:`-namespace krijgt een anker dat exact gelijk is aan de local name van zijn IRI, zodat `https://data.oorlogsbronnen.nl/schema#<LocalName>` naar de juiste sectie navigeert.
3. Per NodeShape toont de pagina: `sh:name` (nl), `sh:description` (nl), de target classes (als externe links naar hun vocabulaire), en een tabel met alle properties: pad-IRI (gelinkt), naam, beschrijving, kardinaliteit (uit `sh:minCount`/`sh:maxCount`, incl. "verplicht" bij minCount ≥ 1) en waardetype (uit `sh:datatype`, `sh:nodeKind`, `sh:class` of `sh:or`, herleid via de `:Rule_*`- en `:Base_*`-bouwstenen).
4. Shapes die andere shapes hergebruiken via `sh:node` (zoals `:ArchiveShape` → `:CreativeWorkShape`) tonen de overgeërfde properties of verwijzen expliciet naar de basis-shape.
5. De generator faalt de build met een duidelijke foutmelding als `shapes.ttl` niet parseert.
6. De ruwe `ontology/shapes.ttl` is op de site beschikbaar als download (bv. `/schema.ttl`).
7. De pagina staat in de sidebar onder Datamodel → Oorlogsbronnen Application Profile (vervangt de huidige placeholder).
8. Het generator-package heeft unit tests voor het vertalen van shapes naar paginamodel (kardinaliteit, waardetypen, `sh:or`, overerving).

## Open vragen

- Moeten de `:Rule_*`/`:Base_*`-bouwstenen zelf ook zichtbaar gedocumenteerd worden, of alleen de klasse-shapes waarin ze zijn toegepast?
- Is een UML-/relatiediagram (via shacl-play of Mermaid) gewenst als vervolg?
- `:EventShape` heeft een lege beschrijving (`""@nl`) — vullen we die in `shapes.ttl` aan?
