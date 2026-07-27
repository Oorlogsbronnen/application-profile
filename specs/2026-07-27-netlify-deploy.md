# Netlify-deploy van de documentatiesite via GitHub Actions

`2026-07-27` · Steven Otto

## Waarom

De documentatiesite (zie `2026-07-27-docusaurus-monorepo.md`, daar bewust buiten scope gelaten) moet zonder handwerk live komen. `data` is de integratie-branch: wat daar landt is gereviewd en mag zichtbaar zijn.

**Netlify is tijdelijk, voor de testfase.** Uiteindelijk gaat data.oorlogsbronnen.nl op shared hosting draaien; de deploy-stap in de workflow wordt dan vervangen (de build-stappen blijven gelijk). Die migratie krijgt te zijner tijd een eigen spec.

## Scope

- **Wel:** een GitHub Actions-workflow die bij elke push naar `data` de site bouwt (pnpm) en naar Netlify deployt; documentatie van de benodigde secrets.
- **Niet:** DNS/domeinkoppeling in Netlify (handmatig, eenmalig); preview-deploys per PR; wijzigingen aan de bestaande Widoco-workflow op `main`.

## Acceptatiecriteria

1. Een push naar `data` triggert een workflow die `pnpm install` en `pnpm --filter website build` draait en `website/build/` naar Netlify (productie) deployt.
2. De workflow is ook handmatig te starten (`workflow_dispatch`).
3. De workflow gebruikt de repository-secrets `NETLIFY_AUTH_TOKEN` en `NETLIFY_SITE_ID`; welke secrets nodig zijn staat gedocumenteerd in `CLAUDE.md`.
4. De bestaande Widoco-workflow (push naar `main`) blijft ongewijzigd.
