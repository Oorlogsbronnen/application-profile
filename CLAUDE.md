# Application Profile Oorlogsbronnen — Claude Code instructies

Dit bestand geldt voor iedereen die Claude Code in deze repo gebruikt. Lees het van begin tot eind voordat je begint.

## Project-context

Dit repository bevat het **Application Profile (AP)** voor het Oorlogsbronnen-ecosysteem: het definieert hoe metadata over personen, gebeurtenissen en bronnen gestructureerd wordt met Linked Data-standaarden. Er is geen applicatiecode — de deliverables zijn RDF-bestanden en de daaruit gegenereerde documentatie.

Dit werk voedt de **data.oorlogsbronnen-website**, die bestaat uit:

- uitleg van de REST API (Spinque, met de library [`@spinque/query-api`](https://www.npmjs.com/package/@spinque/query-api));
- de beschikbare Linked Data-server: [LDmax](https://platform.ldmax.nl/organisaties/wo2net) (organisatie Stichting WO2Net), met SPARQL-endpoint `https://platform.ldmax.nl/organisaties/wo2net/query` en als relevante datasets [`wo2net/personen`](https://platform.ldmax.nl/datasets/wo2net/personen/) en [`wo2net/collecties`](https://platform.ldmax.nl/datasets/wo2net/collecties/) (beide CC-BY-NC-SA 4.0);
- gegenereerde documentatie van de linked data op basis van de `.ttl`-bestanden.

De site draait op `data.oorlogsbronnen.nl` en is uitsluitend Nederlandstalig. De styling volgt het Oorlogsbronnen-ontwerpsysteem: het hoofdplatform is de **NetwerkOorlogsbronnen**-repo (netwerkoorlogsbronnen.nl, Next.js) — de design tokens staan daar in `styles/cssVars.ts` en de Relative-fontbestanden in `styles/fonts/`. Referentie-ontwerp in [Figma (NOB | Oorlogsbronnen.nl)](https://www.figma.com/design/pL5QrzmTgnXz1SlCPCfofu/NOB-%7C-Oorlogsbronnen.nl?node-id=7898-1837); primaire merkkleur is `#ba5345`.

De repo is een pnpm-monorepo:

- `website/` — de Docusaurus-site (docs-only) die de basis vormt van data.oorlogsbronnen. Documentatie schrijf je als markdown/MDX in `website/docs/`; de sidebar volgt de mappenstructuur.
- `packages/schema-docs/` — TypeScript-generator die uit `ontology/shapes.ttl` de application profile-pagina op `/schema` genereert (plus `/schema.ttl`). Draait automatisch mee in `pnpm start`/`pnpm build`; de gegenereerde bestanden zijn ge-gitignored. Zie `specs/2026-07-27-schema-docs-generator.md`.
- `ontology/schema_ext-oorlogsbronnen.ttl` — de kern-vocabulaire (de `niod:`-extensie op schema.org). Dit is het hart van het profiel.
- `ontology/shapes.ttl` — SHACL-shapes voor validatie van data tegen het profiel.
- `context/context.jsonld` — de JSON-LD context voor gebruik in API's.
- `schemas/schema.ttl` — een gevendorde kopie van de volledige schema.org-vocabulaire (~20k regels). Alleen referentie; **nooit handmatig bewerken**.
- `.github/workflows/generate-docs.yml` — bij elke push naar `main`: TTL-bestanden samenvoegen met rdflib, documentatie genereren met Widoco en publiceren naar `gh-pages` ([live documentatie](https://oorlogsbronnen.github.io/application-profile/)).
- Deploys van de website lopen via **Netlify's git-integratie** op de `data`-branch: elke push deployt automatisch naar [data-oorlogsbronnen.netlify.app](https://data-oorlogsbronnen.netlify.app/) (wachtwoord-beschermd, met deploy-previews per PR). De build-instellingen staan in de Netlify-UI, niet in de repo. **Netlify is tijdelijk (testfase)**; uiteindelijk draait de site op shared hosting — zie `specs/2026-07-27-netlify-deploy.md`.

## Tooling en commando's

Package manager: **pnpm** (workspaces). Draai `pnpm install` vanaf de root.

- Website: `pnpm start` (dev-server) · `pnpm build` (productie-build) · `pnpm typecheck` · `pnpm test` (unit tests van de generator)
- Valideer Turtle-syntax (spiegelt stap 1 van de CI, vereist `pip install rdflib`):
  ```sh
  python3 -c "
  from rdflib import Graph
  g = Graph()
  g.parse('ontology/schema_ext-oorlogsbronnen.ttl', format='turtle')
  g.parse('ontology/shapes.ttl', format='turtle')
  print('OK:', len(g), 'triples')
  "
  ```
- Valideer JSON-LD: `python3 -c "import json; json.load(open('context/context.jsonld'))"`
- Format (markdown/JSON): `npx prettier@latest --write <bestand>` — voor `.ttl` bestaat geen formatter; volg de bestaande serialisatie-stijl van het bestand.

## Branch-strategie

**`data` is de base branch voor nieuw werk**, niet `main`. Concreet:

- Maak feature branches aan vanaf `origin/data`: `git fetch origin data && git switch -c <naam> --no-track origin/data`.
- Richt pull requests op `data` (`gh pr create --base data`); features landen daar eerst.
- `main` blijft de publicatie-branch: een push daarheen triggert de docs-pipeline naar GitHub Pages. Promotie van `data` naar `main` gaat óók via een PR, nooit via een directe merge of push.

## Werkafspraken voor dit profiel

- Wijzigingen aan de vocabulaire, shapes en context horen consistent te zijn: een nieuwe of gewijzigde term in `schema_ext-oorlogsbronnen.ttl` heeft meestal ook een aanpassing in `shapes.ttl` en/of `context.jsonld` nodig. Controleer alle drie.
- Labels en comments in de ontologie zijn tweetalig (nl/en) waar mogelijk; Widoco genereert de documentatie met `-lang nl-en`.
- Gebruik de bestaande prefixes en naamgeving (`niod:` voor eigen termen, `schema:` voor schema.org) en voeg geen nieuwe namespaces toe zonder overleg.

## Algemene regels

De Norday-teamstandaarden (coding patterns, git-workflow, spec-driven development), de MCP-servers (Context7, Sentry) en het `/norday-engineering:spec`-command komen uit de `norday-engineering`-plugin en gelden hier automatisch. Installeer die plugin als dat nog niet is gebeurd: `/plugin marketplace add norday-agency/claude-plugins` en `/plugin install norday-engineering@norday-tools`.
