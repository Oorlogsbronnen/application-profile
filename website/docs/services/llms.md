---
title: LLMs
sidebar_position: 4
description: Hoe AI-agents en LLM-tools de documentatie van data.oorlogsbronnen machine-leesbaar kunnen ophalen via llms.txt.
---

# LLMs

Deze site is ook leesbaar voor AI-agents en LLM-tools zoals Claude Code en
Cursor, volgens de [llms.txt-conventie](https://llmstxt.org/). Werk je met zo'n
tool, wijs die dan op de onderstaande bestanden in plaats van de HTML-pagina's.
Dat scheelt tokens en de tekst is schoner.

## /llms.txt

[`/llms.txt`](pathname:///llms.txt) is het startpunt: een compacte index van
alle documentatiepagina's. Bovenaan staat de directe toegang tot de data: het
SPARQL-endpoint, het machine-leesbare datamodel
([`/schema.ttl`](pathname:///schema.ttl)), de REST API en de licenties. Voor
veel vragen is deze ene fetch genoeg.

## /llms-full.txt

[`/llms-full.txt`](pathname:///llms-full.txt) bevat de volledige documentatie
in één markdown-bestand, in dezelfde volgorde als het menu. Gebruik dit
bestand als een agent alle context in één keer moet laden.

## Markdown per pagina

Van elke pagina bestaat een markdown-versie: voeg `.md` toe aan het pad.
Bijvoorbeeld:

- [`/services/apis.md`](pathname:///services/apis.md) voor de API-documentatie
- [`/datasets/linked-data.md`](pathname:///datasets/linked-data.md) voor de
  pagina over linked data

De links in `/llms.txt` verwijzen rechtstreeks naar deze markdown-versies.

## Licenties

Ook voor geautomatiseerd gebruik gelden de
[rechten en gebruiksvoorwaarden](/rechten-en-gebruik). Vermeld de bron en let
erop dat de personen- en collectiedata niet-commercieel gelicenseerd is
(CC-BY-NC-SA 4.0).
