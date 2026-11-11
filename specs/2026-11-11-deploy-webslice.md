# Deploy naar acceptatie en productie met `pnpm deploy:acc` en `pnpm deploy:prod`

`2026-11-11` · Steven Otto

## Waarom

- De site gaat op twee Webslice-servers draaien: acceptatie op acc-data.oorlogsbronnen.nl (`obnl-acc-ws1.cust.webslice.eu`) en productie op data.oorlogsbronnen.nl (`obnl-prd-ws1.cust.webslice.eu`).
- Acceptatie wordt nu met de hand bijgewerkt: lokaal bouwen en de inhoud van `website/build` uploaden. Daardoor loopt acceptatie achter op `main` en is niet te zien welke versie er draait.
- Uploaden zonder opruimen laat verwijderde pagina's online staan (bv. `iiif/`, `datamodel/`) en stapelt oude `assets/` en zoekindexen op.
- Eén commando per omgeving maakt deployen herhaalbaar, voor iedereen met toegang, en is de stap weg van Netlify (zie `2026-07-27-netlify-deploy.md`).

## Scope

- **Wel:** de commando's `pnpm deploy:acc` en `pnpm deploy:prod`, die de site vanaf `main` bouwen en naar de juiste server synchroniseren; een proefrun die laat zien wat er zou veranderen; de doelservers (host, gebruiker, pad) vast in de repo; documentatie in `CLAUDE.md`.
- **Niet:** de DNS van data.oorlogsbronnen.nl, die nu nog naar LDmax doorstuurt; automatisch deployen via GitHub Actions; de nginx-config op de servers; de Spinque-proxy (`/spinque-api`, een tijdelijke Netlify-fix); de API op `/services/api` (aparte repo `spinque-openapi`); Netlify, dat ongewijzigd blijft draaien.

## Acceptatiecriteria

### Beide omgevingen

1. `pnpm deploy:acc` en `pnpm deploy:prod` vanaf de repo-root draaien `pnpm build` en zetten daarna `website/build/` op de doelmap van hun server (zie de tabel hieronder).
2. Het script stopt zonder iets te uploaden als je niet op `main` zit, als `main` na een `git fetch` niet gelijk is aan `origin/main`, of als er lokale wijzigingen in getrackte bestanden zijn of ongetrackte bestanden in de mappen die de build inleest (`website/`, `packages/`, `ontology/`, `context/`). Elke weigering geeft een Nederlandse melding met de reden.
3. Mislukt de build (inclusief de bronbestandencontrole van `pnpm check`), dan wordt er niets geüpload.
4. Met `--dry-run` (bv. `pnpm deploy:prod --dry-run`) toont het script welke bestanden het zou toevoegen, wijzigen en verwijderen, zonder iets op de server te veranderen.
5. Na een deploy is de inhoud van de doelmap gelijk aan `website/build/`: bestanden die niet in de build staan, zijn verwijderd.
6. Tijdens het uploaden blijft de oude site bruikbaar: verwijderen en vervangen gebeurt pas nadat alle nieuwe bestanden zijn overgezet.
7. De deploy komt niet aan iets buiten de doelmap en het bestand `REVISION`: de API, logs en nginx-config blijven onaangeroerd.
8. Na een geslaagde deploy staat in `REVISION` (naast de doelmap, buiten de publieke map) de gedeployde commit-hash, de datum en tijd, en de git-gebruiker. Het script toont dezelfde gegevens in de terminal.
9. Zonder SSH-toegang tot de server, of als de doelmap daar niet bestaat, stopt het script met een duidelijke melding, voordat er iets is gebouwd of geüpload.
10. `CLAUDE.md` beschrijft beide commando's, de proefrun en hoe je toegang tot de servers krijgt.

### Productie

11. Vóór het uploaden toont `pnpm deploy:prod` de commit en de server, en het gaat pas verder als je dat bevestigt door `productie` te typen. Bij elke andere invoer stopt het zonder iets te uploaden.

| Omgeving   | Commando           | Server                                 | Doelmap                                             |
| ---------- | ------------------ | -------------------------------------- | --------------------------------------------------- |
| Acceptatie | `pnpm deploy:acc`  | `obnldt@obnl-acc-ws1.cust.webslice.eu` | `~/html/acc-data.oorlogsbronnen.nl/current/public/` |
| Productie  | `pnpm deploy:prod` | `obnldt@obnl-prd-ws1.cust.webslice.eu` | `~/html/data.oorlogsbronnen.nl/current/public/`     |

## Security

- Inloggen gebeurt met de eigen SSH-sleutel van de ontwikkelaar, die op de server is toegevoegd aan `~obnldt/.ssh/authorized_keys`. In de repo staan geen wachtwoorden, sleutels of tokens; host en gebruiker zijn geen geheimen.
- `--delete` werkt alleen binnen de doelmap. De doelmappen staan vast in het script en kunnen niet via een argument worden overschreven, zodat een verkeerd of leeg pad nooit tot verwijderen elders leidt.

## Open vragen

- Directe links naar mappen zonder slash aan het eind (bv. `/schema`) geven op acceptatie een 301 naar `http://acc-data.oorlogsbronnen.nl:8080/schema/`, en die werkt niet. Dit zit in de nginx-config (`absolute_redirect off;` lost het op), dus de serverbeheerder moet het aanpassen, ook op productie. Wie pakt dat op?
- Wie krijgen SSH-toegang tot de servers, en wie voegt hun sleutels toe?
