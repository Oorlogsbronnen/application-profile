import React, { useEffect, useMemo, useState } from "react";
import {
  OORLOGSBRONNEN_API_BASE,
  toSameOrigin,
} from "@site/src/lib/oorlogsbronnen-api";
import {
  entities,
  eventsOf,
  observationsOf,
  safeUrl,
  type Json,
} from "./helpers";
import PersonCard from "./PersonCard";
import {
  EventTimeline,
  ObjectGrid,
  ObservationList,
  PersonGrid,
} from "./ResultViews";
import styles from "./styles.module.css";

/**
 * Interactieve aanroep van de Oorlogsbronnen-API.
 *
 * Gebruik in MDX:
 *   <ApiRequest
 *     endpoint="/person/p/id/{id}"
 *     pathParams={{ id: "48968c01-..." }}
 *     view="events"
 *   />
 *
 * Met `view` kies je welk onderdeel van de response het overzicht toont. Zo
 * kan één endpoint op een pagina in stappen worden uitgelegd.
 *
 * Een queryparameter met een lijst als waarde mag meerdere keren voorkomen,
 * bv. query={{ about: ["https://…/2244", "https://…/2657"], count: 10 }}.
 * De gebruiker kan dan waardes toevoegen en verwijderen.
 *
 * Haalt het resultaat pas live op als de gebruiker op "Uitvoeren" klikt.
 * Lukt dat niet, dan toont de component een melding; een eerder opgehaald
 * resultaat blijft dan staan.
 */

type Params = Record<string, string | number>;
type Query = Record<string, string | number | string[]>;

interface Props {
  /** Pad na de basis-URL; {naam} wordt vervangen door pathParams.naam */
  endpoint: string;
  pathParams?: Params;
  query?: Query;
  /** Vervangt per parameter de standaardtoelichting uit LABELS */
  labels?: Record<string, string>;
  /** Toont alleen de JSON, zonder de visuele weergave van de cookbook */
  jsonOnly?: boolean;
  /** Welk onderdeel het overzicht toont; standaard afgeleid uit de URL */
  view?: View;
}

/**
 * Onderdelen van een response die het overzicht los kan tonen. `person` levert
 * profiel, vermeldingen en gebeurtenissen in één keer.
 */
type View = "person" | "events" | "observations" | "objects" | "persons";

const LABELS: Record<string, string> = {
  id: "ID van de persoon (UUID of ARK-link)",
  about: "Onderwerp: URI of exacte naam uit de WO2 Thesaurus",
  contentlocation: "Plaats: URI of exacte naam uit de WO2 Thesaurus",
  publisher: "Organisatie: URI of exacte naam uit de WO2 Organisatie Thesaurus",
  birthplace: "Geboorteplaats: URI of exacte naam uit de WO2 Thesaurus",
  deathplace: "Overlijdensplaats: URI of exacte naam uit de WO2 Thesaurus",
  keywords: "Trefwoord: URI of exacte naam uit de WO2 Thesaurus",
  count: "Aantal resultaten (1–50)",
  offset: "Aantal resultaten overslaan (0–300)",
};

/** Houdt URI's in de query leesbaar: de API accepteert `:` en `/` ongecodeerd. */
const encodeQueryValue = (v: string) =>
  encodeURIComponent(v).replace(/%3A/gi, ":").replace(/%2F/gi, "/");

type Result = {
  data: Json;
  url: string;
  http: number;
  ms: number;
};

type RunState = "idle" | "loading" | "failed";

function buildUrl(endpoint: string, path: Params, query: Query): string {
  const url =
    OORLOGSBRONNEN_API_BASE +
    endpoint.replace(/\{(\w+)\}/g, (_, k) =>
      encodeURIComponent(String(path[k] ?? `{${k}}`).trim()),
    );
  // Een lijst wordt een herhaalde parameter: ?about=…&about=…
  const qs = Object.entries(query)
    .flatMap(([k, v]) =>
      (Array.isArray(v) ? v : [v])
        .map((value) => String(value).trim())
        .filter((value) => value !== "")
        .map((value) => `${encodeURIComponent(k)}=${encodeQueryValue(value)}`),
    )
    .join("&");
  return qs ? `${url}?${qs}` : url;
}

/**
 * De API geeft regelmatig een 500-fout bij gelijktijdige verzoeken. Daarom doen
 * alle ApiRequest-blokken op een pagina hun verzoeken na elkaar.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

/** Andere bezoekers kunnen hetzelfde effect veroorzaken: probeer het nog één keer. */
async function fetchWithRetry(url: string): Promise<Response> {
  const target = toSameOrigin(url);
  const res = await fetch(target);
  if (res.status < 500) return res;
  await new Promise((resolve) => setTimeout(resolve, 500));
  return fetch(target);
}

export default function ApiRequest({
  endpoint,
  pathParams = {},
  query = { count: 10, offset: 0 },
  labels,
  jsonOnly = false,
  view,
}: Props) {
  const hintFor = (key: string) => labels?.[key] ?? LABELS[key];
  const [path, setPath] = useState<Params>(pathParams);

  // Een padparameter in de pagina-URL (bv. /api-cookbook/persoon?id=…) vult het
  // veld vooraf in; zo linkt "Personen zoeken" door naar een gekozen persoon.
  // Na het laden, zodat de vooraf gerenderde HTML gelijk blijft.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const fromUrl = Object.keys(pathParams).flatMap((key) => {
      const value = search.get(key)?.trim();
      return value ? [[key, value] as const] : [];
    });
    if (fromUrl.length > 0)
      setPath((p) => ({ ...p, ...Object.fromEntries(fromUrl) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [q, setQ] = useState<Query>(query);
  const [rawUrl, setRawUrl] = useState<string | null>(null); // handmatig bewerkte URL
  const [runState, setRunState] = useState<RunState>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [tab, setTab] = useState<"overzicht" | "json">("overzicht");
  const [copied, setCopied] = useState<string | null>(null);

  const builtUrl = useMemo(
    () => buildUrl(endpoint, path, q),
    [endpoint, path, q],
  );
  const url = (rawUrl ?? builtUrl).trim();
  const openUrl = safeUrl(url);

  async function load() {
    setRunState("loading");
    try {
      const next = await enqueue(async () => {
        const t0 = performance.now();
        const res = await fetchWithRetry(url);
        // Een proxy of server die iets anders dan JSON teruggeeft, is ook een storing.
        const data = await res.json();
        const ms = Math.round(performance.now() - t0);
        return { data, url, http: res.status, ms };
      });
      setResult(next);
      setRunState("idle");
    } catch {
      setRunState("failed");
    }
  }

  function run() {
    if (runState !== "loading") void load();
  }

  function copy(label: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  const field = (
    group: "path" | "query",
    key: string,
    value: string | number,
  ) => (
    <label
      key={`${group}-${key}`}
      className={
        group === "path" ? `${styles.field} ${styles.wide}` : styles.field
      }
    >
      <span className={styles.fieldLabel}>
        <code>{key}</code>
        {hintFor(key) && <span className={styles.hint}>{hintFor(key)}</span>}
      </span>
      <input
        className={styles.input}
        value={value}
        spellCheck={false}
        onChange={(e) => {
          setRawUrl(null);
          const v = e.target.value;
          group === "path"
            ? setPath((p) => ({ ...p, [key]: v }))
            : setQ((p) => ({ ...p, [key]: v }));
        }}
        onKeyDown={(e) => e.key === "Enter" && run()}
      />
    </label>
  );

  /** Herhaalbare parameter: één invoerveld per waarde. */
  const listField = (key: string, values: string[]) => {
    const shown = values.length > 0 ? values : [""];
    const update = (next: string[]) => {
      setRawUrl(null);
      setQ((p) => ({ ...p, [key]: next }));
    };
    return (
      <fieldset
        key={`query-${key}`}
        className={`${styles.field} ${styles.wide} ${styles.list}`}
      >
        <legend className={styles.fieldLabel}>
          <code>{key}</code>
          {hintFor(key) && <span className={styles.hint}>{hintFor(key)}</span>}
        </legend>
        {shown.map((value, i) => (
          <div key={i} className={styles.listRow}>
            <input
              className={styles.input}
              value={value}
              spellCheck={false}
              aria-label={`${key}, waarde ${i + 1}`}
              onChange={(e) =>
                update(shown.map((v, j) => (j === i ? e.target.value : v)))
              }
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
            {shown.length > 1 && (
              <button
                type="button"
                className={styles.remove}
                aria-label={`Verwijder ${key}, waarde ${i + 1}`}
                onClick={() => update(shown.filter((_, j) => j !== i))}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className={styles.add}
          onClick={() => update([...shown, ""])}
        >
          + waarde toevoegen
        </button>
      </fieldset>
    );
  };

  const count = result ? countOf(view ?? viewFor(result.url), result.data) : 0;
  // Vermeldingen en gebeurtenissen zitten in één profiel en worden niet gepagineerd.
  const mayHaveMore =
    view !== "events" &&
    view !== "observations" &&
    count > 0 &&
    count === result?.data?.count;

  return (
    <div className={styles.box}>
      <div className={styles.fields}>
        {Object.entries(path).map(([k, v]) => field("path", k, v))}
        {Object.entries(q).map(([k, v]) =>
          Array.isArray(v) ? listField(k, v) : field("query", k, v),
        )}
      </div>

      <div className={styles.urlRow}>
        <span className={styles.method}>GET</span>
        <input
          className={`${styles.input} ${styles.url}`}
          value={rawUrl ?? builtUrl}
          spellCheck={false}
          onChange={(e) => setRawUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          aria-label="Volledige URL"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className="button button--primary"
          onClick={run}
          disabled={runState === "loading"}
        >
          {runState === "loading" ? "Bezig…" : "▶ Uitvoeren"}
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => copy("url", url)}
        >
          {copied === "url" ? "Gekopieerd ✓" : "Kopieer URL"}
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => copy("curl", `curl "${url}"`)}
        >
          {copied === "curl" ? "Gekopieerd ✓" : "Kopieer curl"}
        </button>
        {openUrl && (
          <a
            className="button button--link"
            href={openUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in nieuw tabblad ↗
          </a>
        )}
        {rawUrl !== null && (
          <button
            type="button"
            className="button button--link"
            onClick={() => setRawUrl(null)}
          >
            Herstel URL
          </button>
        )}
      </div>

      <p role="status" className={styles.srOnly}>
        {runState === "loading"
          ? "Bezig met ophalen…"
          : runState === "failed"
            ? "Ophalen lukte niet."
            : result && `Resultaat opgehaald: ${count} resultaten.`}
      </p>

      {runState === "failed" && (
        <div className={styles.error}>
          De API is niet bereikbaar vanaf deze pagina.{" "}
          {result && "Hieronder blijft het eerdere resultaat staan. "}
          Probeer de URL in een nieuw tabblad of met curl.
        </div>
      )}

      {runState === "loading" && !result && (
        <p className={styles.loading}>Gegevens ophalen…</p>
      )}

      {result && (
        <div className={styles.result}>
          <div className={styles.statusBar}>
            <span className={result.http < 400 ? styles.ok : styles.bad}>
              HTTP {result.http}
            </span>
            <span>{result.ms} ms</span>
            {count > 0 && (
              <span>
                {count} {count === 1 ? "resultaat" : "resultaten"}
                {mayHaveMore && " — er kunnen er meer zijn, verhoog offset"}
              </span>
            )}
            {!jsonOnly && (
              <span className={styles.tabs}>
                <button
                  type="button"
                  aria-pressed={tab === "overzicht"}
                  className={
                    tab === "overzicht" ? styles.tabActive : styles.tab
                  }
                  onClick={() => setTab("overzicht")}
                >
                  Overzicht
                </button>
                <button
                  type="button"
                  aria-pressed={tab === "json"}
                  className={tab === "json" ? styles.tabActive : styles.tab}
                  onClick={() => setTab("json")}
                >
                  JSON
                </button>
              </span>
            )}
          </div>
          {jsonOnly || tab === "json" ? (
            <JsonTree value={result.data} />
          ) : (
            <Overview result={result} view={view} />
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Overzicht: weergave passend bij het opgevraagde endpoint ---------- */

const VIEWS: Record<View, React.ComponentType<{ data: Json }>> = {
  person: PersonCard,
  events: EventTimeline,
  observations: ObservationList,
  objects: ObjectGrid,
  persons: PersonGrid,
};

/** Op basis van de URL, zodat ook een handmatig bewerkte URL goed wordt getoond. */
const URL_VIEWS: [RegExp, View][] = [
  [/\/person\/p\/id\//, "person"],
  [/\/person_related_objects\//, "objects"],
  [/\/object\/[^?]/, "objects"],
  [/\/objects(\?|$)/, "objects"],
  [/\/persons(\?|$)/, "persons"],
];

const viewFor = (url: string): View | undefined =>
  URL_VIEWS.find(([pattern]) => pattern.test(url))?.[1];

/** Aantal getoonde resultaten: bij een onderdeel van `person` dat van het onderdeel. */
function countOf(view: View | undefined, data: Json): number {
  if (view === "events") return eventsOf(data).length;
  if (view === "observations") return observationsOf(data).length;
  return entities(data).length;
}

/** FastAPI-fouten: { detail: "tekst" } of { detail: [ { loc, msg } ] } */
function apiErrors(data: Json): string[] {
  const detail = data?.detail;
  if (Array.isArray(detail))
    return detail.map((d) => `${d.loc?.at(-1) ?? "verzoek"}: ${d.msg}`);
  return [typeof detail === "string" ? detail : "Onbekende fout"];
}

function Overview({ result, view }: { result: Result; view?: View }) {
  const { data, url, http } = result;
  if (http >= 400) {
    return (
      <div className={styles.error}>
        De API weigerde dit verzoek:
        <ul>
          {apiErrors(data).map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    );
  }
  const shown = view ?? viewFor(url);
  if (entities(data).length === 0) {
    return (
      <p className={styles.empty}>
        Geen resultaten. De API geeft dan gewoon <code>HTTP 200</code> met een
        lege <code>items</code>-lijst terug. Dat gebeurt ook bij een ID die niet
        bestaat, dus controleer de ID als je wel iets verwachtte.
      </p>
    );
  }
  if (countOf(shown, data) === 0) {
    return (
      <p className={styles.empty}>
        {shown === "events"
          ? "De bronnen noemen voor deze persoon geen gebeurtenissen."
          : "Deze persoon heeft geen vermeldingen in de response."}
      </p>
    );
  }
  const Component = shown && VIEWS[shown];
  return Component ? <Component data={data} /> : <JsonTree value={data} />;
}

/* ---------- Inklapbare JSON-weergave ---------- */

function JsonTree({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || typeof value !== "object") {
    return (
      <span className={typeof value === "string" ? styles.jStr : styles.jVal}>
        {JSON.stringify(value)}
      </span>
    );
  }
  const isArr = Array.isArray(value);
  const entries = isArr
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const [open, close] = isArr ? ["[", "]"] : ["{", "}"];
  if (entries.length === 0) return <span>{open + close}</span>;
  return (
    <details
      open={depth < 3}
      className={depth === 0 ? styles.jsonRoot : styles.json}
    >
      <summary>
        {open}
        <span className={styles.jCount}>
          {entries.length} {isArr ? "items" : "velden"}
        </span>
      </summary>
      <div className={styles.jBody}>
        {entries.map(([k, v]) => (
          <div key={k}>
            {!isArr && <span className={styles.jKey}>"{k}"</span>}
            {isArr && <span className={styles.jIdx}>{k}</span>}
            : <JsonTree value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
      {close}
    </details>
  );
}
