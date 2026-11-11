# Automatisch deployen: `main` naar acceptatie, release-tags naar productie

`2026-11-11` · Ramiro Hammen

## Waarom

- Deployen naar Webslice gebeurt nu met de hand via `pnpm deploy:acc` en `pnpm deploy:prod` (zie `2026-11-11-deploy-webslice.md`). Wordt dat vergeten, dan loopt acceptatie achter op `main`.
- Een productie-release hoort een bewuste, herleidbare stap te zijn: een release-tag laat zien welke versie er draait.
- We volgen de Norday-conventie: tags `*-release`, environments `acceptance` en `production`, en de opzet van de workflows uit de template `statamic-next-stack` (een herbruikbare `deploy.yml`, aangeroepen door `deploy-acceptance.yml` en `deploy-production.yml`). Deployer gebruiken we niet: `scripts/deploy.sh` bouwt de statische site en zet hem met rsync over.

## Scope

- **Wel:** de drie workflows; zo min mogelijk aanpassingen aan `scripts/deploy.sh` zodat het ook in GitHub Actions draait; één deploy-sleutel voor beide servers; de releaseflow in `CLAUDE.md`.
- **Niet:** de deploy-sleutel beperken met `rrsync` (kan later); een goedkeuring op een environment; een Slack-melding; Netlify uitzetten.

## Acceptatiecriteria

1. Elke push naar `main`, ook een merge van een PR, deployt die commit naar acceptatie. "Run workflow" bij Deploy acceptance doet dat opnieuw.
2. Een gepushte tag `*-release` (bv. `1.0.0-release`) deployt de commit van die tag naar productie. Staat die commit niet op `main`, dan faalt de workflow zonder upload.
3. Terugdraaien: "Re-run all jobs" op de run van een oudere release in Actions → Deploy production.
4. Mislukt de build (inclusief `pnpm check`), dan wordt er niets geüpload en is de workflow rood.
5. Per omgeving draait er nooit meer dan één deploy tegelijk.
6. In `REVISION` op de server staat bij een deploy vanuit GitHub de GitHub-gebruiker die hem startte.
7. `pnpm deploy:acc` en `pnpm deploy:prod` werken lokaal precies als voorheen.

## Security

- Eén deploy-sleutel voor beide servers, als environment-secret `SSH_KEY` in zowel `acceptance` als `production`. De environments staan alleen `main` respectievelijk tags `*-release` toe, dus een workflow op een andere branch kan de sleutel niet lezen.
- De sleutel staat zonder beperking in `~obnldt/.ssh/authorized_keys` en geeft dus een shell als `obnldt`, ook de gebruiker van de API. Beperken met `rrsync` is een bewuste vervolgstap.
- Wie een `*-release`-tag mag pushen, bepaalt de tag-ruleset. Die is de bescherming van productie.
- De hostsleutels van beide servers staan vast in de workflow. De workflows hebben alleen `contents: read`.

## Open vragen

- Kunnen de runners van GitHub via SSH bij de productieserver (firewall, fail2ban)?
- Wie komen in de tag-ruleset?
