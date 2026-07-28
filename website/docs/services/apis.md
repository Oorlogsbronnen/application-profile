---
title: API's
sidebar_position: 1
---

# API's

De data van Oorlogsbronnen is via een REST API te bevragen, gebouwd op [Spinque](https://www.spinque.com/). Deze pagina beschrijft de beschikbare endpoints en hoe je ze gebruikt.

## Endpoints

_De lijst met beschikbare Spinque API-endpoints volgt hier._

## Libraries

Voor JavaScript/TypeScript is er een officiële client-library:

- [`@spinque/query-api`](https://www.npmjs.com/package/@spinque/query-api): npm-package voor het bevragen van de Spinque API.

```ts
import { Query } from "@spinque/query-api";

const query: Query = {
  endpoint: "movie_search",
  parameters: { terms: "call me" },
};
```

## Verder lezen

- [Spinque API-documentatie: basisgebruik](https://docs.spinque.com/3.0/using-apis/basic.html)
