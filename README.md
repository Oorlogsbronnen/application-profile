# Application Profile Oorlogsbronnen (OORLOGSBRONNEN-AP)

Dit repository bevat de bronbestanden en de documentatie van het **Application Profile (AP)** voor het Oorlogsbronnen-ecosysteem. Dit profiel definieert hoe metadata over personen, gebeurtenissen en bronnen gestructureerd wordt middels Linked Data standaarden.

## 📂 Projectstructuur

- `website/`: De [Docusaurus](https://docusaurus.io/)-documentatiesite van het data.oorlogsbronnen-platform (pnpm-workspace; zie `website/docs/` voor de inhoud).
- `ontology/`: Bevat de kern-vocabulaire (`schema_ext-oorlogsbronnen.ttl`) en de SHACL-shapes voor validatie: gedeelde bouwstenen (`shapes-bouwstenen.ttl`) plus één bestand per kennisgraaf (`shapes-personen.ttl` en `shapes-collecties.ttl`).
- `context/`: Bevat de JSON-LD context (`context.jsonld`) voor gebruik in API's.
- `.github/workflows/`: De controle van de bronbestanden die op elke pull request draait (zie de sectie "Wijzigingen indienen" hieronder), en de deploys naar acceptatie en productie (zie "Deployen").

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

**Groene check:** de bestanden zijn in orde en de pull request kan gemerged worden. Na de merge staat de wijziging vanzelf op acceptatie; naar productie gaat hij met een release (zie "Deployen").

**Rode check:** er zit een fout in een bronbestand. Zo vind je hem:

- Open in de pull request het tabblad **Files changed**. De fout staat als melding onder de regel waar hij zit.
- Of klik bij de check op **Details** voor de volledige melding, met bestand, regelnummer en uitleg.

Herstel de fout in dezelfde branch; de check draait daarna opnieuw. Vaak gaat het om een ontbrekende of dubbele `;` of `.`, een woord dat dubbel staat, of een voorvoegsel (zoals `schema:`) dat niet bovenaan het bestand als `@prefix` staat.

Ontwikkelaars draaien dezelfde controle lokaal met `pnpm check`. `pnpm build` begint er ook mee.

## 🚀 Deployen

De site draait bij Webslice op twee omgevingen. Deployen gaat automatisch via GitHub Actions.

| Omgeving   | Adres                              | Wanneer                           |
| ---------- | ---------------------------------- | --------------------------------- |
| Acceptatie | https://acc-data.oorlogsbronnen.nl | Bij elke merge naar `main`        |
| Productie  | https://data.oorlogsbronnen.nl     | Bij een release-tag (`*-release`) |

Acceptatie kun je ook met de hand opnieuw uitrollen: kies in GitHub onder **Actions → Deploy acceptance** de knop **Run workflow**.

### Een release naar productie

1. Controleer of `main` goed op acceptatie staat.
2. Tag die commit en push de tag:

   ```bash
   git switch main && git pull --ff-only
   git tag 1.2.0-release
   git push origin 1.2.0-release
   ```

3. Volg de deploy in GitHub onder **Actions → Deploy production**. De workflow controleert eerst of de tag op `main` staat; een tag op een andere branch wordt niet uitgerold.

### Terugdraaien

Open in GitHub onder **Actions → Deploy production** de run van een eerdere release en kies **Re-run all jobs**. Die versie wordt dan opnieuw uitgerold.

### Noodroute: met de hand deployen

Als GitHub Actions niet werkt, kun je vanaf een schone, actuele `main` zelf deployen:

```bash
pnpm deploy:acc            # acceptatie
pnpm deploy:prod           # productie (vraagt om bevestiging)
pnpm deploy:prod --dry-run # eerst bekijken wat er verandert
```

Hiervoor heb je SSH-toegang nodig tot de gebruiker `obnldt`. Vraag de beheerder om je publieke sleutel toe te voegen.

## 📄 Licentie

[https://creativecommons.org/licenses/by/4.0/deed.nl]
