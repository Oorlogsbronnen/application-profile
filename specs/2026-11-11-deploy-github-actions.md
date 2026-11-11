# Automatisch deployen: `main` naar acceptatie, release-tags naar productie

`2026-11-11` · Steven Otto

## Waarom

- Deployen naar Webslice gebeurt nu met de hand via `pnpm deploy:acc` en `pnpm deploy:prod` (zie `2026-11-11-deploy-webslice.md`). Wordt dat vergeten, dan loopt acceptatie achter op `main`.
- Acceptatie hoort altijd te tonen wat er gemerged is, zonder dat iemand eraan hoeft te denken.
- Een productie-release moet een bewuste, herleidbare stap zijn: een release-tag laat zien welke versie er draait en maakt terugdraaien eenvoudig.
- We volgen de Norday-conventie voor Webslice-projecten (skill `monorepo-deploy`): tags `*-release` en environments `acceptance` en `production`. Zo werkt dit project zoals de andere.
- Hiermee kan Netlify op termijn vervallen.

## Scope

- **Wel:** de workflow `.github/workflows/deploy.yml`, die bij een push naar `main` naar acceptatie deployt en bij een tag `*-release` naar productie; een handmatige run vanaf een bestaande tag om terug te draaien; de GitHub-environments `acceptance` en `production`, elk met een eigen deploy-sleutel; een tag-ruleset op `*-release`; aanpassingen aan `scripts/deploy.sh` zodat hetzelfde script lokaal en in CI werkt; de releaseflow in `CLAUDE.md`.
- **Niet:** een goedkeuring op een environment (de tag-ruleset is de bescherming); een Slack-melding (kan later); de nginx-config; Netlify uitzetten.

## Acceptatiecriteria

### Acceptatie

1. Elke push naar `main`, ook een merge van een PR, deployt die commit automatisch naar acceptatie.

### Productie

2. Een gepushte tag die eindigt op `-release` (bv. `1.0.0-release`) deployt de commit van die tag naar productie. Andere tags starten geen deploy.
3. Staat de commit van de tag niet op `main`, dan faalt de workflow zonder upload, met een melding die dat uitlegt.
4. Alleen de mensen in de tag-ruleset kunnen tags `*-release` aanmaken, verplaatsen of verwijderen. GitHub weigert dat bij alle anderen.
5. "Run workflow" met een bestaande tag bij "Use workflow from" deployt die tag opnieuw naar productie, met dezelfde controles. Zo draai je terug naar een eerdere versie. Vanaf `main` deployt een handmatige run acceptatie opnieuw.

### Beide

6. Mislukt de build (inclusief `pnpm check`), dan wordt er niets geüpload en is de workflow rood.
7. Er draaien nooit twee deploys tegelijk naar dezelfde omgeving. Een nieuwe deploy wacht tot de lopende klaar is.
8. Na een geslaagde deploy staan in `REVISION` op de server de commit, bij productie de tag, de datum en tijd, de GitHub-gebruiker die de deploy startte, en een link naar de workflow-run.
9. `pnpm deploy:acc` en `pnpm deploy:prod` werken lokaal als noodroute met dezelfde controles. `pnpm deploy:prod` deployt alleen een commit die een `*-release`-tag heeft en op `main` staat.
10. `CLAUDE.md` beschrijft hoe je een release maakt (`git tag 1.2.0-release && git push origin 1.2.0-release`) en hoe je terugdraait.

## Security

- Elke omgeving heeft een eigen deploy-sleutel. Die bestaat alleen als secret `DEPLOY_SSH_KEY` in de GitHub-environment en komt niet in de repo of in de logs.
- De environment `production` staat alleen tags `*-release` toe en `acceptance` alleen `main`. Een run vanaf een feature branch kan de sleutels dus niet gebruiken.
- `obnldt` is ook de gebruiker waaronder de API draait. Daarom is de deploy-sleutel in `authorized_keys` beperkt met `restrict` en `rrsync`: hij kan alleen rsync uitvoeren binnen `current/` en geeft geen shell. Het script gebruikt daarom alleen rsync, ook voor de controles en `REVISION`. Toetsbaar: `ssh` met de deploy-sleutel geeft geen shell, en schrijven buiten `current/` wordt geweigerd.
- De hostsleutels van beide servers staan vast in de workflow. Wijkt een hostsleutel af, dan faalt de deploy.
- De workflow heeft alleen de GitHub-rechten die hij nodig heeft (`contents: read`).

## Open vragen

- Kunnen de runners van GitHub via SSH bij de productieserver? Bij acceptatie kan dat: de workflow van `spinque-openapi` doet het al.
- Wie komen in de tag-ruleset?
- Voegen wij of Webslice de deploy-sleutels toe aan `~obnldt/.ssh/authorized_keys`? De org-secret `SSH_KEY` van Norday is hier niet bruikbaar: deze repo staat in de GitHub-organisatie `Oorlogsbronnen`.
