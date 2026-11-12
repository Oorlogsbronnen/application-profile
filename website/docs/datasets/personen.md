---
title: Personen
sidebar_position: 1
---

# WO2 Personen Oorlogsbronnen 

Deze dataset bevat informatie over getuigen, slachtoffers en andere personen betrokken bij de Tweede Wereldoorlog in Nederland. Denk daarbij onder andere aan gevangenen in (concentratie)kampen en gevangenissen, slachtoffers van bombardementen, tewerkgestelden, verzetsstrijders, militairen, Joodse en Sinti- en Roma-slachtoffers. De gegevens zijn afkomstig uit meer dan honderd collecties en databases van archieven, musea, herinneringscentra en andere organisaties in Nederland en daarbuiten. De informatie over de personen is ook te vinden in de vorm van persoonspagina’s op [oorlogsbronnen.nl](https://oorlogsbronnen.nl).

## Unieke identifiers voor personen

Op Oorlogsbronnen wordt informatie over personen uit diverse datasets met persoonsvermeldingen geharmoniseerd door middel van matchingstrategieën, resulterend in meer dan 800.000 unieke [persoonsreconstructies](/schema#PersoonsReconstructieShape). Elke persoonsreconstructie heeft een Persistent Identifier (PID), specifiek een Archival Resource Key (ARK), waarin een unieke identifier (UUID) is opgenomen.

De structuur van een ARK URI is als volgt:

`ark:/59857/p48968c01-9f60-492d-8712-58d3b8c2b388`

1. Het ARK Label: De identifier begint verplicht met de vaste prefix `ark:/`.
2. Het NAAN (Name Assigning Authority Number): Dit is een uniek, geregistreerd identificatienummer dat door de California Digital Library (CDLIB) wordt toegewezen aan de betreffende erfgoedinstelling of het archief dat de data publiceert. In dit geval is dit `59857`.
3. De Record identifier: Een unieke code (UUID) die door de instelling zelf aan een specifieke persoon of document is toegekend: `48968c01-9f60-492d-8712-58d3b8c2b388` de `p` voor de UUID staat voor `persoon`. 
4. In de praktijk wordt een Name Mapping Authority (NMA), `https://n2t.net/` voor de  om een direct klikbare, toekomstbestendige URL te creëren.

### Voorbeelden van gebruik

- De URL `https://n2t.net/ark:/59857/p48968c01-9f60-492d-8712-58d3b8c2b388` verwijst naar `https://www.oorlogsbronnen.nl/person/48968c01-9f60-492d-8712-58d3b8c2b388` voor informatie op de website.  
- De URL `https://n2t.net/ark:/59857/p48968c01-9f60-492d-8712-58d3b8c2b388.ttl` verwijst naar dezelfde data in de vorm van een TTL-versie.

Zie ook [Content Negotiation](/services/contentnegotiation.mdx)
