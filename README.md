# Application Profile Oorlogsbronnen (OORLOGSBRONNEN-AP)

Dit repository bevat de bronbestanden en de documentatie van het **Application Profile (AP)** voor het Oorlogsbronnen-ecosysteem. Dit profiel definieert hoe metadata over personen, gebeurtenissen en bronnen gestructureerd wordt middels Linked Data standaarden.

## 📂 Projectstructuur

- `website/`: De [Docusaurus](https://docusaurus.io/)-documentatiesite van het data.oorlogsbronnen-platform (pnpm-workspace; zie `website/docs/` voor de inhoud).
- `ontology/`: Bevat de kern-vocabulaire (`schema_ext-oorlogsbronnen.ttl`) en de SHACL-shapes voor validatie: gedeelde bouwstenen (`shapes-bouwstenen.ttl`) plus één bestand per kennisgraaf (`shapes-personen.ttl` en `shapes-collecties.ttl`).
- `context/`: Bevat de JSON-LD context (`context.jsonld`) voor gebruik in API's.
- `.github/workflows/`: De controle van de bronbestanden die op elke pull request draait (zie de sectie "Wijzigingen indienen" hieronder).

## 🛠 Gebruik voor Ontwikkelaars

### Linked Data Bronnen

Ontwikkelaars kunnen direct verwijzen naar de machine-leesbare definities:

- **Turtle (TTL):** `https://oorlogsbronnen.github.io/application-profile/full_profile.ttl`
- **JSON-LD Context:** `https://oorlogsbronnen.github.io/application-profile/context.jsonld`

### Validatie (SHACL)

Data kan gevalideerd worden tegen de regels in de shapes-bestanden (`ontology/shapes-*.ttl`); gebruik `shapes-bouwstenen.ttl` altijd samen met het bestand van de betreffende kennisgraaf. Dit garandeert dat velden zoals `niod:Omgekomen` of `schema:name` correct worden gebruikt.

## ✏️ Wijzigingen indienen

Wijzig de `.ttl`-bestanden altijd via een pull request, ook als je ze op de GitHub-website bewerkt. Dan wordt elke wijziging gecontroleerd vóórdat hij live gaat.

1. Open het bestand op GitHub en klik op het potloodje om het te bewerken.
2. Klik op **Commit changes…** en kies **Create a new branch for this commit and start a pull request**.
3. Maak de pull request aan. GitHub draait automatisch de check **Controle bronbestanden**.

**Groene check:** de bestanden zijn in orde en de pull request kan gemerged worden. Na de merge staat de wijziging vanzelf online.

**Rode check:** er zit een fout in een bronbestand. Zo vind je hem:

- Open in de pull request het tabblad **Files changed**. De fout staat als melding onder de regel waar hij zit.
- Of klik bij de check op **Details** voor de volledige melding, met bestand, regelnummer en uitleg.

Herstel de fout in dezelfde branch; de check draait daarna opnieuw. Vaak gaat het om een ontbrekende of dubbele `;` of `.`, een woord dat dubbel staat, of een voorvoegsel (zoals `schema:`) dat niet bovenaan het bestand als `@prefix` staat.

Ontwikkelaars draaien dezelfde controle lokaal met `pnpm check`. `pnpm build` begint er ook mee.

## 📄 Licentie

[https://creativecommons.org/licenses/by/4.0/deed.nl]
