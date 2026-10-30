# Vocabulaire op de schemapagina

`2026-10-30` · Steven Otto · [SUPP-4691](https://in10-rotterdam.atlassian.net/browse/SUPP-4691)

## Waarom

- De eigen classes en properties uit `ontology/schema_ext-oorlogsbronnen.ttl` staan nergens leesbaar op de site. Wie in de data een term als `ob:Archive` tegenkomt, kan nergens opzoeken wat die betekent.
- `ob:` is een hash-namespace: `ob:Archive` is `https://data.oorlogsbronnen.nl/schema#Archive`. Het document `/schema` hoort dus elke `ob:`-term te beschrijven, onder een anker gelijk aan de local name. De shapes werken al zo (`#ArchiefShape`), en `context/context.jsonld` gebruikt dezelfde namespace als `@vocab`.
- Een aparte vocabulairepagina zou elke `ob:`-IRI naar een anker laten wijzen dat niet bestaat. Het deel na de `#` bereikt de server niet, dus doorsturen kan niet.
- Alle beschrijvingen van `ob:`-termen staan als `rdf:comment`. Die property bestaat niet, dus geen enkele tool toont die beschrijvingen nu.

## Scope

- **Wel:**
  - een gegenereerd hoofdstuk "Vocabulaire" op `/schema`, met:
    - de `ob:`-classes en -properties als blokken met anker `#<local name>`;
    - de `niod:`-gebeurtenistypen als tabel;
  - `rdf:comment` → `rdfs:comment` in `schema_ext-oorlogsbronnen.ttl`, en `pnpm check` meldt `rdf:comment` voortaan als fout;
  - verwijzingen in de shape-tabellen naar een `ob:`-term uit de vocabulaire worden interne links;
  - de links naar `ob:` en `niod:` in het toelichtingshoofdstuk wijzen naar het nieuwe hoofdstuk.
- **Niet:**
  - een diagram;
  - de Nederlandse labels voor `sdo:`-klassen bovenaan het bestand;
  - subklassen uit andere vocabulaires tonen (zoals `sdo:Photograph` onder `ob:Afbeelding`);
  - de vocabulaire als download;
  - ontbrekende termen aanvullen (zie open vragen).

## Acceptatiecriteria

1. Elke `ob:`- en `niod:`-class en -property uit `schema_ext-oorlogsbronnen.ttl` staat in het hoofdstuk Vocabulaire, en niets anders.
2. Het hoofdstuk heeft drie onderdelen in deze volgorde: classes Oorlogsbronnen, properties Oorlogsbronnen, gebeurtenistypen WO2 Thesaurus. Binnen elk onderdeel volgen de termen de volgorde in het bestand.
3. Elke `ob:`-term heeft een kop met de naam (`rdfs:label`), het anker `#<local name>` en de volledige IRI. Een link naar `/schema#Archive` landt dus op `ob:Archive`.
4. Waar aanwezig toont een `ob:`-blok ook de superklasse of -property en de beschrijving. De soort (class of property) blijkt uit het onderdeel. Lege velden verschijnen niet.
5. Elke `niod:`-rij toont naam, IRI, beschrijving (waar aanwezig) en de definitie in de WO2 Thesaurus (`rdfs:isDefinedBy`). Elke rij heeft een eigen anker.
6. Verwijzingen naar een `ob:`-term uit de vocabulaire zijn interne links, ook vanuit de shape-tabellen. Andere termen linken naar hun IRI.
7. Een Nederlandse beschrijving gaat voor. Is er alleen een Engelse, dan staat die er met `lang="en"`.
8. Een `ob:`- of `niod:`-term zonder `rdfs:label`, of een anker dat twee keer voorkomt op de pagina, laat de generator stoppen met een Nederlandse melding.
9. `pnpm check` meldt elk `rdf:comment` met bestand, regel en de aanwijzing om `rdfs:comment` te gebruiken.
10. De generator heeft unit tests voor het inlezen en renderen van de vocabulaire.
11. De pagina gebruikt de bestaande opmaak van `/schema` en voldoet aan WCAG 2.2 AA.

## Open vragen

- De shapes gebruiken `ob:PersonalEvent` en `ob:ClosedCaption` als doelklasse, maar die staan niet in de vocabulaire. Vult Micon ze aan?
- 31 van de 47 `niod:`-gebeurtenistypen hebben geen beschrijving, alleen een thesauruslink. Is dat voldoende?
