import React, { useId, useState } from "react";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import styles from "./styles.module.css";

const API_BASE = "https://rest.spinque.com/4/oorlogsbronnen/api";

type ApiExampleProps = {
  /** Volledige request-URL; op de pagina aanpasbaar voordat hij wordt uitgevoerd. */
  url: string;
  /** Eerder vastgelegde response, getoond zolang er geen live response is. */
  recorded: unknown;
  /** Datum waarop de vastgelegde response is opgehaald. */
  recordedAt: string;
};

type LiveState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: unknown; viaProxy: boolean }
  | { status: "failed" };

/**
 * Toont een vastgelegde API-response met een bewerkbare request-URL en een
 * knop om de call live vanuit de browser uit te voeren. Eerst wordt de
 * directe URL geprobeerd (werkt zodra dit domein op de origin-allowlist van
 * Spinque staat), daarna dezelfde call via de same-origin proxy
 * (`/spinque-api/…`, zie static/_redirects); lukt geen van beide, dan blijft
 * de vastgelegde response staan, met een melding.
 */
export default function ApiExample({
  url,
  recorded,
  recordedAt,
}: ApiExampleProps): React.ReactElement {
  const [editedUrl, setEditedUrl] = useState(url);
  const [live, setLive] = useState<LiveState>({ status: "idle" });
  const inputId = useId();

  const run = async (): Promise<void> => {
    setLive({ status: "loading" });
    const target = editedUrl.trim();
    // De proxy spiegelt alleen de Spinque-basis; een andere URL proberen we
    // uitsluitend direct.
    const attempts: { target: string; viaProxy: boolean }[] = [
      { target, viaProxy: false },
      ...(target.startsWith(API_BASE)
        ? [{ target: target.replace(API_BASE, "/spinque-api"), viaProxy: true }]
        : []),
    ];
    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.target, {
          headers: { Accept: "application/json" },
        });
        if (response.ok) {
          setLive({
            status: "success",
            data: await response.json(),
            viaProxy: attempt.viaProxy,
          });
          return;
        }
      } catch {
        // volgende poging
      }
    }
    setLive({ status: "failed" });
  };

  const shown = live.status === "success" ? live.data : recorded;
  const label =
    live.status === "success"
      ? `Live response (zojuist opgehaald${live.viaProxy ? " via de proxy" : ""})`
      : `Vastgelegde response (${recordedAt})`;

  return (
    <div className={styles.example}>
      <label className={styles.urlLabel} htmlFor={inputId}>
        Request-URL — pas gerust de parameters aan:
      </label>
      <textarea
        id={inputId}
        className={styles.urlInput}
        value={editedUrl}
        rows={3}
        spellCheck={false}
        onChange={(event) => setEditedUrl(event.target.value)}
      />
      <p className={styles.actions}>
        <button
          type="button"
          className="button button--primary button--sm"
          onClick={() => void run()}
          disabled={live.status === "loading"}
        >
          {live.status === "loading" ? "Bezig…" : "Voer live uit in je browser"}
        </button>{" "}
        {editedUrl !== url && (
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => setEditedUrl(url)}
          >
            Herstel voorbeeld
          </button>
        )}
      </p>
      <div aria-live="polite">
        {live.status === "failed" && (
          <Admonition type="caution" title="Live uitvoeren lukte niet">
            De browser blokkeerde de directe call (CORS) en ook de proxy was
            niet bereikbaar, of de aangepaste URL is ongeldig. Hieronder staat
            de eerder vastgelegde response van het oorspronkelijke voorbeeld.
          </Admonition>
        )}
        <CodeBlock language="json" title={label} showLineNumbers={false}>
          {JSON.stringify(shown, null, 2)}
        </CodeBlock>
      </div>
    </div>
  );
}
