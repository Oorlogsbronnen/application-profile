# Generator voor de application profile-documentatie op /schema

`2026-07-27` · Steven Otto

## Waarom

Het application profile moet voor ontwikkelaars leesbaar gedocumenteerd zijn, zoals [SCHEMA-AP-NDE](https://docs.nde.nl/schema-profile/) en [Persons in Context](https://www.personsincontext.org/model/) dat doen. Handmatig bijhouden loopt onvermijdelijk uit de pas met de werkelijkheid; daarom wordt de documentatie gegenereerd uit `ontology/shapes.ttl`, dat altijd de source of truth is en blijft. Extra reden om dit goed te doen: de namespace van het profiel ís `https://data.oorlogsbronnen.nl/schema#`, dus de pagina op `/schema` is tegelijk het namespace-document — een term-IRI als `https://data.oorlogsbronnen.nl/schema#PersoonReconstructionShape` moet direct naar de juiste sectie leiden.

## Tooling-afweging

- **[shacl-play](https://github.com/sparna-git/shacl-play)** (Sparna, Java): genereert kant-en-klare HTML-documentatie en UML-diagrammen uit een SHACL-profiel. Actief onderhouden, maar de output is een losstaande pagina met eigen styling en eigen ankerstructuur — integreert niet in Docusaurus en geeft geen controle over de ankers.
- **pyLODE** (Python): gericht op OWL-ontologieën, beperkte SHACL-ondersteuning.
- **Eigen generator**: NDE bouwde er zelf ook één (Bikeshed + Liquid over hun `shacl.ttl`) — er is geen kant-en-klare tool die SHACL naar Docusaurus-pagina's vertaalt.

**Keuze:** een eigen TypeScript-generator in `packages/schema-docs/`, die `shapes.ttl` parseert (met [N3.js](https://github.com/rdfjs/N3.js)) en één MDX-pagina genereert. Dit geeft volledige controle over ankers, structuur en huisstijl, past in de monorepo en de Norday-standaarden, en de shapes hebben een regelmatige structuur (NodeShapes met `sh:name`/`sh:description` in het Nederlands). Het relatiediagram wordt met Mermaid gegenereerd (native ondersteund door Docusaurus via `@docusaurus/theme-mermaid`), niet met shacl-play.

## Scope

- **Wel:** generator-package dat uit `ontology/shapes.ttl` een Nederlandstalige documentatiepagina genereert op `/schema`; per NodeShape een sectie met naam, beschrijving, target classes en een property-tabel (property-IRI met link, naam, beschrijving, kardinaliteit, waardetype); een zichtbare sectie voor de `:Rule_*`/`:Base_*`-bouwstenen; een gegenereerd Mermaid-relatiediagram van de shapes; Mermaid-ondersteuning site-breed aanzetten (ook bruikbaar op handgeschreven pagina's); generatie als onderdeel van de website-build (niet met de hand bijgewerkt, gegenereerde output wordt niet gecommit); `shapes.ttl` zelf downloadbaar als machine-leesbare variant.
- **Niet:** wijzigingen aan `shapes.ttl` zelf; JSON-LD-voorbeelden per klasse (zoals NDE heeft — kan later, handmatig of via MDX-partials); content negotiation op `/schema` (Netlify ondersteunt geen Accept-header-redirects zonder functions).

## Acceptatiecriteria

1. `pnpm build` genereert de pagina op `/schema` uit `ontology/shapes.ttl`; een wijziging in de shapes is na een nieuwe build zichtbaar zonder verdere handelingen.
2. Elke NodeShape én elke `:Rule_*`/`:Base_*`-bouwsteen in de `:`-namespace krijgt een anker dat exact gelijk is aan de local name van zijn IRI, zodat `https://data.oorlogsbronnen.nl/schema#<LocalName>` naar de juiste sectie navigeert.
3. Per NodeShape toont de pagina: `sh:name` (nl), `sh:description` (nl), de target classes (als externe links naar hun vocabulaire), en een tabel met alle properties: pad-IRI (gelinkt), naam, beschrijving, kardinaliteit (uit `sh:minCount`/`sh:maxCount`, incl. "verplicht" bij minCount ≥ 1) en waardetype (uit `sh:datatype`, `sh:nodeKind`, `sh:class` of `sh:or`, herleid via de `:Rule_*`- en `:Base_*`-bouwstenen).
4. Shapes die andere shapes hergebruiken via `sh:node` (zoals `:ArchiveShape` → `:CreativeWorkShape`) tonen de overgeërfde properties of verwijzen expliciet naar de basis-shape.
5. De pagina bevat een eigen sectie voor de `:Rule_*`- en `:Base_*`-bouwstenen (pad, waardetype en constraints per bouwsteen); de property-tabellen van de klasse-shapes linken intern naar de gebruikte bouwsteen.
6. Mermaid werkt site-breed: een ` ```mermaid `-codeblok in een willekeurige docs-pagina rendert als diagram, en `/schema` bevat een gegenereerd Mermaid-diagram van de NodeShapes met hun onderlinge relaties (overerving via `sh:node`, verwijzingen via `sh:class`).
7. De generator faalt de build met een duidelijke foutmelding als `shapes.ttl` niet parseert; een lege of ontbrekende `sh:description` is géén fout en wordt simpelweg niet getoond.
8. De ruwe `ontology/shapes.ttl` is op de site beschikbaar als download (bv. `/schema.ttl`).
9. De pagina staat in de sidebar onder Datamodel → Oorlogsbronnen Application Profile (vervangt de huidige placeholder).
10. Het generator-package heeft unit tests voor het vertalen van shapes naar paginamodel (kardinaliteit, waardetypen, `sh:or`, overerving).

## Besluiten

- De `:Rule_*`/`:Base_*`-bouwstenen worden zichtbaar gedocumenteerd, met eigen ankers.
- Het relatiediagram wordt met Mermaid gegenereerd; Mermaid-ondersteuning wordt site-breed aangezet zodat ook handgeschreven pagina's diagrammen kunnen bevatten.
- De lege beschrijving van `:EventShape` blokkeert niets: de generator toont lege beschrijvingen gewoon niet. Aanvullen in `shapes.ttl` kan later, los van deze feature.
