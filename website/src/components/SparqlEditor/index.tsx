import React, { useEffect, useId, useRef } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import CodeBlock from "@theme/CodeBlock";
import type Yasgui from "@zazuko/yasgui";
// Docusaurus bundelt alle CSS — ook die van lazy chunks — tot één bestand;
// een dynamische css-import bespaart hier dus niets. Statisch en vóór de
// module-css importeren geeft in elk geval een deterministische volgorde,
// zodat de overrides in styles.module.css bij gelijke specificiteit winnen.
import "@zazuko/yasgui/build/yasgui.min.css";
import styles from "./styles.module.css";

const DEFAULT_ENDPOINT = "https://sparql.ldmax.nl/wo2net";

type SparqlEditorProps = {
  /** De vooringevulde, direct uitvoerbare query. */
  query: string;
  /** SPARQL-endpoint; standaard het wo2net-endpoint van LDmax. */
  endpoint?: string;
};

/**
 * Yasgui werkt alleen in de browser (DOM, localStorage); tijdens de
 * server-side build tonen we de query als gewoon codeblok.
 */
export default function SparqlEditor(
  props: SparqlEditorProps,
): React.ReactElement {
  return (
    <BrowserOnly
      fallback={<CodeBlock language="sparql">{props.query}</CodeBlock>}
    >
      {() => <Editor {...props} />}
    </BrowserOnly>
  );
}

function Editor({
  query,
  endpoint = DEFAULT_ENDPOINT,
}: SparqlEditorProps): React.ReactElement {
  const container = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const hintId = useId();

  useEffect(() => {
    const element = container.current;
    if (!element) {
      return undefined;
    }
    let cancelled = false;
    let instance: Yasgui | undefined;

    // Yasgui is fors (script + css); hij laadt pas wanneer de editor bijna
    // in beeld komt, zodat een pagina met meerdere editors niet alles bij
    // page load parseert en instantieert.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        observer.disconnect();
        void (async () => {
          const { default: YasguiClass } = await import("@zazuko/yasgui");
          if (cancelled) {
            return;
          }
          // persistenceId null: elke editor toont altijd zijn eigen
          // voorbeeldquery in plaats van een eerdere sessie uit localStorage.
          instance = new YasguiClass(element, {
            requestConfig: { endpoint },
            persistenceId: null,
            autofocus: false,
          });
          const tab = instance.getTab();
          tab?.setQuery(query);
          // Statusmeldingen (WCAG 4.1.3): Yasgui rendert resultaten zonder
          // aankondiging; het statuselement hieronder meldt ze kort.
          tab?.on("query", () => {
            if (status.current) {
              status.current.textContent = "Query wordt uitgevoerd…";
            }
          });
          tab?.on("queryResponse", (responded) => {
            if (!status.current) {
              return;
            }
            status.current.textContent = responded
              .getYasr()
              ?.results?.hasError()
              ? "Query mislukt; de foutmelding staat in het resultatenpaneel."
              : "Query uitgevoerd; de resultaten staan onder de editor.";
          });
          // CodeMirror's invoerveld heeft geen label; zonder accessible name
          // presenteert het zich aan schermlezers als naamloos invoerveld.
          // De hint eronder wordt via aria-describedby meegelezen.
          for (const field of element.querySelectorAll("textarea")) {
            field.setAttribute("aria-label", "SPARQL-query (bewerkbaar)");
            field.setAttribute("aria-describedby", hintId);
          }
          // Yasgui's knoppen hebben Engelse accessible names; de site is
          // Nederlandstalig (WCAG 3.1.2).
          for (const [selector, text] of [
            [".yasqe_queryButton", "Voer query uit"],
            [".yasqe_share", "Deel query"],
          ]) {
            const button = element.querySelector(selector);
            button?.setAttribute("aria-label", text);
            button?.setAttribute("title", text);
          }
        })();
      },
      { rootMargin: "400px" },
    );
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      instance?.destroy();
      element.replaceChildren();
    };
  }, [query, endpoint, hintId]);

  return (
    <div className={styles.editor}>
      <div ref={container} />
      <p ref={status} role="status" className={styles.status} />
      {/* WCAG 2.1.2: Tab springt in de editor in; de Esc-uitweg moet gemeld. */}
      <p id={hintId} className={styles.keyboardHint}>
        Tab springt in de editor in; druk op <kbd>Esc</kbd> om de editor met het
        toetsenbord te verlaten.
      </p>
    </div>
  );
}
