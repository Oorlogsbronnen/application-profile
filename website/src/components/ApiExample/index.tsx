import React, { memo, useId, useMemo, useState } from "react";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import { SPINQUE_API_BASE, SPINQUE_PROXY_PREFIX } from "@site/src/lib/spinque";
import styles from "./styles.module.css";

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
 * (zie static/_redirects); lukt geen van beide, dan blijft de vastgelegde
 * response staan, met een melding.
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
      ...(target.startsWith(SPINQUE_API_BASE)
        ? [
            {
              target: target.replace(SPINQUE_API_BASE, SPINQUE_PROXY_PREFIX),
              viaProxy: true,
            },
          ]
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
  const shownJson = useMemo(() => JSON.stringify(shown, null, 2), [shown]);
  const label =
    live.status === "success"
      ? `Live response (zojuist opgehaald${live.viaProxy ? " via de proxy" : ""})`
      : `Vastgelegde response (${recordedAt})`;
  // Korte melding voor de live-region (WCAG 4.1.3): de response zelf is
  // bewust géén live-region — die zou integraal voorgelezen worden.
  const statusMessage =
    live.status === "loading"
      ? "Bezig met live uitvoeren…"
      : live.status === "success"
        ? "Live response opgehaald; het resultaat staat hieronder."
        : live.status === "failed"
          ? "Live uitvoeren lukte niet; de eerder vastgelegde response blijft staan."
          : "";

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
      <p role="status" className={styles.status}>
        {statusMessage}
      </p>
      <ResponseBlock
        failed={live.status === "failed"}
        label={label}
        json={shownJson}
      />
    </div>
  );
}

/**
 * Gememoïseerd, zodat het (grote) response-codeblok niet bij elke
 * toetsaanslag in de URL-textarea opnieuw door de syntax-highlighter gaat.
 */
const ResponseBlock = memo(function ResponseBlock({
  failed,
  label,
  json,
}: {
  failed: boolean;
  label: string;
  json: string;
}): React.ReactElement {
  return (
    <div>
      {failed && (
        <Admonition type="caution" title="Live uitvoeren lukte niet">
          De browser blokkeerde de directe call (CORS) en ook de proxy was niet
          bereikbaar, of de aangepaste URL is ongeldig. Hieronder staat de
          eerder vastgelegde response van het oorspronkelijke voorbeeld.
        </Admonition>
      )}
      <CodeBlock language="json" title={label} showLineNumbers={false}>
        {json}
      </CodeBlock>
    </div>
  );
});
