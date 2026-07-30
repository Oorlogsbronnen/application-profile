# Application Profile Oorlogsbronnen (OORLOGSBRONNEN-AP)

Dit repository bevat de bronbestanden en de documentatie van het **Application Profile (AP)** voor het Oorlogsbronnen-ecosysteem. Dit profiel definieert hoe metadata over personen, gebeurtenissen en bronnen gestructureerd wordt middels Linked Data standaarden.

## 🚀 Live Documentatie

De volledige documentatie (gegenereerd met Widoco) is hier te vinden:
👉 **[Bekijk de documentatie](https://oorlogsbronnen.github.io/application-profile/)**

## 📂 Projectstructuur

- `website/`: De [Docusaurus](https://docusaurus.io/)-documentatiesite van het data.oorlogsbronnen-platform (pnpm-workspace; zie `website/docs/` voor de inhoud).
- `ontology/`: Bevat de kern-vocabulaire (`schema_ext-oorlogsbronnen.ttl`) en de SHACL-shapes voor validatie: gedeelde bouwstenen (`shapes-bouwstenen.ttl`) plus één bestand per kennisgraaf (`shapes-personen.ttl` en `shapes-collecties.ttl`).
- `context/`: Bevat de JSON-LD context (`context.jsonld`) voor gebruik in API's.
- `.github/workflows/`: De automatische build-pipeline die de documentatie ververst bij elke wijziging.

## 🛠 Gebruik voor Ontwikkelaars

### Linked Data Bronnen

Ontwikkelaars kunnen direct verwijzen naar de machine-leesbare definities:

- **Turtle (TTL):** `https://oorlogsbronnen.github.io/application-profile/full_profile.ttl`
- **JSON-LD Context:** `https://oorlogsbronnen.github.io/application-profile/context.jsonld`

### Validatie (SHACL)

Data kan gevalideerd worden tegen de regels in de shapes-bestanden (`ontology/shapes-*.ttl`); gebruik `shapes-bouwstenen.ttl` altijd samen met het bestand van de betreffende kennisgraaf. Dit garandeert dat velden zoals `niod:Omgekomen` of `schema:name` correct worden gebruikt.

## 🔄 Automatisering

Dit repository maakt gebruik van **GitHub Actions**. Bij elke `push` naar de `main` branch worden de volgende stappen uitgevoerd:

1.  Validatie van de RDF-syntax.
2.  Samenvoegen van vocabulaire en SHACL-regels.
3.  Genereren van een interactieve documentatiewebsite via Widoco.
4.  Publicatie naar de `gh-pages` branch.

## 📄 Licentie

[https://creativecommons.org/licenses/by/4.0/deed.nl]
