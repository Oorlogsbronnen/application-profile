import React, { useEffect, useRef } from "react";
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
          instance.getTab()?.setQuery(query);
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
  }, [query, endpoint]);

  return <div ref={container} className={styles.editor} />;
}
