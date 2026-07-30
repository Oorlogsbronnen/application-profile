# Deploy van de documentatiesite via Netlify

`2026-07-27` · Steven Otto

## Waarom

De documentatiesite (zie `2026-07-27-docusaurus-monorepo.md`, daar bewust buiten scope gelaten) moet zonder handwerk live komen. `data` is de integratie-branch: wat daar landt is gereviewd en mag zichtbaar zijn.

**Netlify is tijdelijk, voor de testfase.** De site draait wachtwoord-beschermd op [data-oorlogsbronnen.netlify.app](https://data-oorlogsbronnen.netlify.app/). Uiteindelijk gaat data.oorlogsbronnen.nl op shared hosting draaien; die migratie krijgt te zijner tijd een eigen spec.

## Besluit: git-integratie in plaats van een eigen workflow

Aanvankelijk was een GitHub Actions-workflow voorzien die met `netlify-cli` zou deployen. Dat is vervallen: de repo is via Netlify's eigen git-integratie aan de `data`-branch gekoppeld. Netlify bouwt en deployt daarmee zelf bij elke push, levert deploy-previews per pull request, en er zijn geen repository-secrets nodig. De build-instellingen (commando, publish-map, Node-versie) staan in de Netlify-UI.

## Scope

- **Wel:** Netlify git-integratie op de `data`-branch (configuratie in Netlify zelf); vastleggen van dit besluit.
- **Niet:** een eigen deploy-workflow in GitHub Actions; DNS/domeinkoppeling; wijzigingen aan de bestaande Widoco-workflow op `main`.

## Acceptatiecriteria

1. Elke push naar `data` resulteert automatisch in een nieuwe deploy op data-oorlogsbronnen.netlify.app.
2. De site is tijdens de testfase met een wachtwoord afgeschermd.
3. De bestaande Widoco-workflow (push naar `main`) blijft ongewijzigd.
4. Er staan geen Netlify-secrets of -tokens in de repository.
