# Automatisch deployen: `main` naar acceptatie, release-tags naar productie

`2026-11-11` · Steven Otto

## Waarom

- Deployen naar Webslice gebeurt nu met de hand via `pnpm deploy:acc` en `pnpm deploy:prod` (zie `2026-11-11-deploy-webslice.md`). Wordt dat vergeten, dan loopt acceptatie achter op `main`.
- Acceptatie hoort altijd te tonen wat er gemerged is, zonder dat iemand eraan hoeft te denken.
- Een productie-release moet een bewuste, herleidbare stap zijn: een release-tag laat zien welke versie er draait en maakt terugdraaien eenvoudig.
- We volgen de Norday-conventie: tags `*-release`, environments `acceptance` en `production`, en de opzet van de workflows uit de template `statamic-next-stack` (een herbruikbare `deploy.yml`, aangeroepen door `deploy-acceptance.yml` en `deploy-production.yml`). Zo werkt dit project zoals de andere. Deployer gebruiken we niet: de statische site wordt op de runner gebouwd en met rsync overgezet.
- Hiermee kan Netlify op termijn vervallen.

## Scope

- **Wel:** de herbruikbare workflow `.github/workflows/deploy.yml` en de workflows `deploy-acceptance.yml` (push naar `main` of handmatig) en `deploy-production.yml` (tag `*-release`); terugdraaien door de run van een oudere release opnieuw te draaien; de GitHub-environments `acceptance` en `production`; één deploy-sleutel als repository-secret `SSH_KEY`; een tag-ruleset op `*-release`; aanpassingen aan `scripts/deploy.sh` zodat hetzelfde script lokaal en in CI werkt; de releaseflow in `CLAUDE.md`.
- **Niet:** een goedkeuring op een environment (de tag-ruleset is de bescherming); een Slack-melding (kan later); de nginx-config; Netlify uitzetten.

## Acceptatiecriteria

### Acceptatie

1. Elke push naar `main`, ook een merge van een PR, deployt die commit automatisch naar acceptatie.

### Productie

2. Een gepushte tag die eindigt op `-release` (bv. `1.0.0-release`) deployt de commit van die tag naar productie. Andere tags starten geen deploy.
3. Staat de commit van de tag niet op `main`, dan faalt de workflow zonder upload, met een melding die dat uitlegt.
4. Alleen de mensen in de tag-ruleset kunnen tags `*-release` aanmaken, verplaatsen of verwijderen. GitHub weigert dat bij alle anderen.
5. "Re-run all jobs" op de run van een oudere release in Actions → Deploy production deployt die tag opnieuw naar productie, met dezelfde controles. Zo draai je terug naar een eerdere versie. "Run workflow" bij Deploy acceptance deployt `main` opnieuw naar acceptatie.

### Beide

6. Mislukt de build (inclusief `pnpm check`), dan wordt er niets geüpload en is de workflow rood.
7. Er draaien nooit twee deploys tegelijk naar dezelfde omgeving. Een nieuwe deploy wacht tot de lopende klaar is.
8. Na een geslaagde deploy staan in `REVISION` op de server de commit, bij productie de tag, de datum en tijd, de GitHub-gebruiker die de deploy startte, en een link naar de workflow-run.
9. `pnpm deploy:acc` en `pnpm deploy:prod` werken lokaal als noodroute met dezelfde controles. `pnpm deploy:prod` deployt alleen een commit die een `*-release`-tag heeft en op `main` staat.
10. `CLAUDE.md` beschrijft hoe je een release maakt (`git tag 1.2.0-release && git push origin 1.2.0-release`) en hoe je terugdraait.

## Security

- Er is één deploy-sleutel voor beide servers, zoals bij de org-secret `SSH_KEY` van Norday. Die is hier niet bruikbaar, omdat deze repo in de GitHub-organisatie `Oorlogsbronnen` staat; daarom is `SSH_KEY` een repository-secret met dezelfde naam. Hij komt niet in de repo of in de logs.
- Per server staat de publieke sleutel in `authorized_keys` met een eigen `rrsync`-map, dus ook met één sleutel kan elke server alleen bij zijn eigen `current/`.
- `obnldt` is ook de gebruiker waaronder de API draait. Daarom is de deploy-sleutel in `authorized_keys` beperkt met `restrict` en `rrsync`: hij kan alleen rsync uitvoeren binnen `current/` en geeft geen shell. Het script gebruikt daarom alleen rsync, ook voor de controles en `REVISION`. Toetsbaar: `ssh` met de deploy-sleutel geeft geen shell, en schrijven buiten `current/` wordt geweigerd.
- De hostsleutels van beide servers staan vast in de workflow. Wijkt een hostsleutel af, dan faalt de deploy.
- De workflows hebben alleen de GitHub-rechten die ze nodig hebben (`contents: read`).
- Wie een `*-release`-tag mag pushen, bepaalt de tag-ruleset. Die is de echte bescherming van productie: de controle "staat op `main`" draait als code uit de getagde commit zelf.

## Open vragen

- Kunnen de runners van GitHub via SSH bij de productieserver? Bij acceptatie kan dat: de workflow van `spinque-openapi` doet het al.
- Wie komen in de tag-ruleset?
- Voegen wij of Webslice de deploy-sleutel toe aan `~obnldt/.ssh/authorized_keys`?
