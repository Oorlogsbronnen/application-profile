# Schema-pagina: herstructurering naar twee kennisgrafen

`2026-07-28` · Steven Otto

## Waarom

Oorlogsbronnen beheert twee kennisgrafen — personen ([`wo2net/personen`](https://platform.ldmax.nl/datasets/wo2net/personen/)) en objecten/collecties ([`wo2net/collecties`](https://platform.ldmax.nl/datasets/wo2net/collecties/)) — maar de `/schema`-pagina presenteert alle elf klassen als één vlakke lijst onder "Klassen". Voor afnemers is zo onzichtbaar welke klassen bij welke graaf (en welk SPARQL-dataset) horen. Daarnaast toont het overzichtsdiagram alleen shape-namen met pijlen; het laat niet zien welke properties een klasse heeft, zoals het klassendiagram van [SCHEMA-AP-NDE](https://docs.nde.nl/schema-profile/#class-diagram) dat wél doet. Deze herstructurering maakt de pagina leesbaar langs de lijnen waarop de data daadwerkelijk gepubliceerd wordt.

## Scope

- **Wel:** `shapes.ttl` splitsen per kennisgraaf, hoofdstukken "Personen" en "Objecten" op de pagina, NDE-achtig klassendiagram per graaf, volgorde en naamgeving van shapes, meebewegen van CI, downloads en documentatieverwijzingen.
- **Niet:** inhoudelijke wijzigingen aan properties/constraints in de shapes, `schema_ext-oorlogsbronnen.ttl` (zie Besluiten), styling, overige documentatiepagina's.

## Acceptatiecriteria

1. `ontology/shapes.ttl` is gesplitst in drie bestanden: `ontology/shapes-bouwstenen.ttl` (ontology-declaratie + alle `Base_*`/`Rule_*`-blokken, gedeeld door beide grafen), `ontology/shapes-personen.ttl` (PersoonsReconstructie-, Persoonsvermelding-, Event-, Source-, DatasetShape) en `ontology/shapes-collecties.ttl` (CreativeWork-, Archive-, Bekendmaking-, Media-, Monument-, ConceptShape). Samen bevatten ze exact dezelfde triples als het huidige bestand, op de wijzigingen in criterium 4 na.
2. De pagina heeft de hoofdstukken: 1. Overzicht · 2. Datamodellen en vocabulaires (redactioneel) · 3. Personen · 4. Objecten · 5. Volledige voorbeelden (indien aanwezig). Klassen staan als genummerde subkoppen (3.1, 4.2, …) onder hun graaf-hoofdstuk, in documentvolgorde van hun shape-bestand.
3. Hoofdstukken 3 en 4 openen elk met een korte redactionele intro (welke kennisgraaf, welke LDmax-dataset) uit een handgeschreven MDX-fragment, naar het model van `_schema-toelichting.mdx`; ontbreekt het fragment, dan alleen de klassen.
4. In de shapes zelf: `SourceShape` heet `"Archiefrecords (personen)"` (onderscheid met "Archieven" onder Objecten) en `BekendmakingShape` staat vóór `MediaShape` in documentvolgorde. Herordenen of hernoemen voor de lezer blijft = de shapes bewerken; de generator volgt. Daarnaast twee defecten die bij de splitsing aan het licht kwamen (restanten van de eerdere hernoeming naar `PersoonsReconstructieShape`): de overervings-verwijzing van `PersoonsvermeldingShape` wees naar het niet-bestaande `ob:PersoonReconstructionShape` en is rechtgezet, de nergens gedefinieerde bouwsteen `ob:Rule_dateCreated` is alsnog gedefinieerd (`xsd:date`, max 1), en het voorbeeldbestand `ontology/examples/PersoonReconstructionShape.jsonld` is hernoemd naar de huidige shape-naam (de build brak hierop).
5. "Overzicht" bevat twee Mermaid-klassendiagrammen (Personen en Objecten). Per klasse een box met de Nederlandse naam en de eigen properties als regels in NDE-stijl (`pad: waardetype [kardinaliteit]`; relatie-properties zonder waardetype — de pijl toont hun doel al); relaties naar andere klassen uit het profiel als pijl met propertynaam; overerving via `sh:node` als overervingspijl. Relaties die de grafen kruisen (bv. Persoonsvermelding → Archiefrecord) staan in het diagram van de bron-shape, met de doelklasse als kale node. Elke node linkt naar zijn eigen sectie op de pagina.
6. Bestaande klasse-ankers (`/schema#ArchiveShape` e.d.) blijven werken; de hoofdstukken krijgen ankers `#personen` en `#objecten`. Het anker `#klassen` vervalt.
7. `/schema.ttl` blijft de volledige machine-leesbare download (samenvoeging van de drie bestanden); daarnaast zijn `/schema-personen.ttl` en `/schema-collecties.ttl` per graaf beschikbaar (elk inclusief de bouwstenen, zodat het bestand zelfstandig valideert).
8. Alle verwijzingen naar `ontology/shapes.ttl` zijn bijgewerkt: generator (`packages/schema-docs`), CI (`generate-docs.yml`), `CLAUDE.md` (incl. het rdflib-validatiecommando) en README's. Het oude bestand bestaat niet meer.
9. `pnpm build` en `pnpm test` slagen; de generator-tests dekken de groepsindeling en het diagram met properties.

## Besluiten

- Twee (feitelijk drie) shape-bestanden in plaats van groepsannotaties in één bestand: de splitsing sluit 1-op-1 aan op de LDmax-datasets en de groepering volgt uit de bestanden zelf, zonder eigen hulpvocabulaire (2026-07-28).
- Twee diagrammen in plaats van één gecombineerd: met 11 klassen en tot ~20 properties per klasse is één NDE-achtig diagram onleesbaar; de tweedeling onderstreept bovendien precies het onderscheid dat deze wijziging wil maken (2026-07-28).
- Dit herroept het besluit uit de klantfeedback-spec (2026-07-28) dat documentvolgorde zonder zichtbare groepen volstond: de groepen worden nu wél zichtbare hoofdstukken.
- `schema_ext-oorlogsbronnen.ttl` blijft buiten scope. Richting voor later: het bestand is de vocabulaire-extensie (NL-labels, ~45 gebeurtenis-subklassen, Bekendmaking/Afbeelding-klassen) en is nu alleen via Widoco op GitHub Pages gedocumenteerd; een logische vervolgstap is een eigen gegenereerde pagina (bv. `/vocabulaire`), waarbij de gebeurtenis-subklassen als lijst bij sectie "Gebeurtenissen" kunnen verschijnen. Losse fix om mee te nemen: de `picom:`-prefix verschilt tussen beide bestanden (`…/model#` vs. `…/model/#`) — dat zijn nu twee verschillende namespaces.

- De twee aanvankelijk open vragen zijn beide bevestigend beantwoord (2026-07-28): de diagramboxen linken naar hun sectie (Mermaid `click … href`; hiervoor staat de mermaid-`securityLevel` in `docusaurus.config.ts` op `antiscript`, dat kliks toestaat maar HTML-encoding aanhoudt), en property-regels tonen het waardetype naast de kardinaliteit — behalve bij relaties, waar de pijl het doel al toont.
