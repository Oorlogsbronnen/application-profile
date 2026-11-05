import React, { useEffect, useMemo, useState } from "react";
import {
  OORLOGSBRONNEN_API_BASE,
  OORLOGSBRONNEN_API_PROXY_PREFIX,
} from "@site/src/lib/oorlogsbronnen-api";
import { entities, safeUrl, type Json } from "./helpers";
import PersonCard from "./PersonCard";
import { EventTimeline, ObjectGrid, ObservationList } from "./ResultViews";
import styles from "./styles.module.css";

/**
 * Interactieve aanroep van de Oorlogsbronnen-API voor de cookbook.
 *
 * Gebruik in MDX:
 *   <ApiRequest
 *     endpoint="/person_events/{id}"
 *     pathParams={{ id: "48968c01-..." }}
 *   />
 *
 * Haalt het resultaat live op bij het laden van de pagina en bij "Uitvoeren".
 * Lukt dat niet, dan toont de component een melding; een eerder opgehaald
 * resultaat blijft dan staan.
 */

type Params = Record<string, string | number>;

interface Props {
  /** Pad na de basis-URL; {naam} wordt vervangen door pathParams.naam */
  endpoint: string;
  pathParams?: Params;
  query?: Params;
}

const LABELS: Record<string, string> = {
  id: "ID van de persoon (UUID)",
  count: "Aantal resultaten (1–50)",
  offset: "Aantal resultaten overslaan (0–300)",
};

type Result = {
  data: Json;
  url: string;
  http: number;
  ms: number;
};

type RunState = "idle" | "loading" | "failed";

function buildUrl(endpoint: string, path: Params, query: Params): string {
  const url =
    OORLOGSBRONNEN_API_BASE +
    endpoint.replace(/\{(\w+)\}/g, (_, k) =>
      encodeURIComponent(String(path[k] ?? `{${k}}`).trim()),
    );
  const qs = Object.entries(query)
    .filter(([, v]) => String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v).trim())}`,
    )
    .join("&");
  return qs ? `${url}?${qs}` : url;
}

/** De browser mag de API alleen via hetzelfde domein aanroepen (geen CORS). */
function toFetchUrl(url: string): string {
  return url.startsWith(OORLOGSBRONNEN_API_BASE + "/")
    ? OORLOGSBRONNEN_API_PROXY_PREFIX +
        url.slice(OORLOGSBRONNEN_API_BASE.length)
    : url;
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
  const res = await fetch(url);
  if (res.status < 500) return res;
  await new Promise((resolve) => setTimeout(resolve, 500));
  return fetch(url);
}

export default function ApiRequest({
  endpoint,
  pathParams = {},
  query = { count: 10, offset: 0 },
}: Props) {
  const [path, setPath] = useState<Params>(pathParams);
  const [q, setQ] = useState<Params>(query);
  const [rawUrl, setRawUrl] = useState<string | null>(null); // handmatig bewerkte URL
  const [runState, setRunState] = useState<RunState>("loading");
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
        const res = await fetchWithRetry(toFetchUrl(url));
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

  // Alleen bij het laden van de pagina; daarna bepaalt de gebruiker wanneer.
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {LABELS[key] && <span className={styles.hint}>{LABELS[key]}</span>}
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

  const count = entities(result?.data).length;
  const mayHaveMore = count > 0 && count === result?.data?.count;

  return (
    <div className={styles.box}>
      <div className={styles.fields}>
        {Object.entries(path).map(([k, v]) => field("path", k, v))}
        {Object.entries(q).map(([k, v]) => field("query", k, v))}
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
            : `Resultaat opgehaald: ${count} resultaten.`}
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
            <span className={styles.tabs}>
              <button
                type="button"
                aria-pressed={tab === "overzicht"}
                className={tab === "overzicht" ? styles.tabActive : styles.tab}
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
          </div>
          {tab === "overzicht" ? (
            <Overview result={result} />
          ) : (
            <JsonTree value={result.data} />
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Overzicht: weergave passend bij het opgevraagde endpoint ---------- */

/** Op basis van de URL, zodat ook een handmatig bewerkte URL goed wordt getoond. */
const VIEWS: [RegExp, React.ComponentType<{ data: Json }>][] = [
  [/\/person\/p\/id\//, PersonCard],
  [/\/person_events\//, EventTimeline],
  [/\/person_observations\//, ObservationList],
  [/\/person_related_objects\//, ObjectGrid],
];

/** FastAPI-fouten: { detail: "tekst" } of { detail: [ { loc, msg } ] } */
function apiErrors(data: Json): string[] {
  const detail = data?.detail;
  if (Array.isArray(detail))
    return detail.map((d) => `${d.loc?.at(-1) ?? "verzoek"}: ${d.msg}`);
  return [typeof detail === "string" ? detail : "Onbekende fout"];
}

function Overview({ result }: { result: Result }) {
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
  if (entities(data).length === 0) {
    return (
      <p className={styles.empty}>
        Geen resultaten. De API geeft dan gewoon <code>HTTP 200</code> met een
        lege <code>items</code>-lijst terug. Dat gebeurt ook bij een ID die niet
        bestaat, dus controleer de ID als je wel iets verwachtte.
      </p>
    );
  }
  const View = VIEWS.find(([pattern]) => pattern.test(url))?.[1];
  return View ? <View data={data} /> : <JsonTree value={data} />;
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
