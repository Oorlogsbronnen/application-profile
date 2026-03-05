Het creëren van documentatie voor een Application Profile (AP) kan snel complex worden als je alles handmatig moet bijhouden. De meest efficiënte aanpak is "Documentation as Code", waarbij de documentatie automatisch wordt gegenereerd op basis van je machine-leesbare bestanden (TTL/JSON-LD).

Hier is een stappenplan om een robuuste workflow op te zetten via GitHub en GitHub Pages.

1. De Motor: Kies je Tooling
Voor een Linked Data profiel dat verschillende standaarden combineert, raad ik aan om niet zelf HTML te schrijven. De meest gebruikte "best practice" tools zijn:

LODE (Live OWL Documentation Environment): De klassieke keuze voor OWL/RDFS.

Widoco: Een krachtige Java-gebaseerde tool die een complete website genereert inclusief diagrammen en navigatie.

Pylode: Een modern Python-alternatief dat zeer strakke, leesbare HTML produceert.

Mijn advies voor efficiëntie: Gebruik Widoco. Het handelt de cross-references tussen schema.org, Dublin Core en je eigen termen automatisch af en genereert een mensgerichte website vanuit je Turtle bestanden.

2. De Structuur: SHACL voor Validatie en Documentatie
Je noemde dat je nog niet hebt vastgelegd welke relaties bij welke classes horen. Een JSON-LD context doet dit inderdaad niet; die mapt alleen keys naar URI's.

Om dit vast te leggen én tegelijkertijd je documentatie te voeden, gebruik je SHACL (Shapes Constraint Language).

In SHACL definieer je NodeShapes (voor classes) en PropertyShapes (voor attributen en relaties).

Je kunt hierin sh:description, sh:name, sh:minCount en sh:maxCount opgeven.

Documentatie-tools kunnen deze SHACL-shapes uitlezen om tabellen te genereren van "Verplichte" en "Optionele" velden.

3. De GitHub Repository Opzet
Richt je repository als volgt in voor optimaal beheer:

/
├── ontology/
│   ├── my-profile.ttl       # Je eigen classes en properties (RDFS/OWL)
│   └── shapes.ttl           # De SHACL definities (het "Application Profile")
├── context/
│   └── context.jsonld       # Je JSON-LD context
├── docs/                    # Hier komt de gegenereerde output (GitHub Pages bron)
└── .github/workflows/       # Automatisering
    └── documentation.yml

4. Automatisering met GitHub Actions
Dit is de sleutel tot efficiënt beheer. Je wilt dat de documentatie vernieuwt zodra je de .ttl bestanden aanpast.

Maak een workflow (.github/workflows/documentation.yml) die:

De repository uitcheckt.

Een Docker-container van Widoco of Pylode draait.

De .ttl bestanden als input neemt en HTML genereert in de /docs map.

De wijzigingen commit of direct pusht naar de gh-pages branch.

5. Deployment naar GitHub Pages
Ga in je GitHub repo naar Settings > Pages.

Kies als bron de map /docs op je main branch (of gebruik een aparte gh-pages branch via de Action uit stap 4).

Je documentatie is nu live op https://<gebruiker>.github.io/<repo-naam>/.

Samenvatting van de Workflow
Definieer je eigen termen in een Turtle bestand.

Limiteer het gebruik van schema.org en DC via een SHACL bestand (hier leg je de regels van je profiel vast).

Push naar GitHub.

GitHub Actions ziet de wijziging en trapt de generator (bijv. Widoco) aan.

GitHub Pages serveert de nieuwe documentatie direct aan je gebruikers.
