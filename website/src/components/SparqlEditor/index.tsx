import React, { useEffect, useRef } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import type Yasgui from "@zazuko/yasgui";
// Statisch en vóór de module-css: onze overrides winnen dan bij gelijke
// specificiteit, in zowel de dev- als de productie-build.
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
      fallback={
        <pre>
          <code>{props.query}</code>
        </pre>
      }
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

    const init = async (): Promise<void> => {
      const { default: YasguiClass } = await import("@zazuko/yasgui");
      if (cancelled) {
        return;
      }
      // persistenceId null: elke editor toont altijd zijn eigen voorbeeldquery
      // in plaats van een eerdere sessie uit localStorage.
      instance = new YasguiClass(element, {
        requestConfig: { endpoint },
        persistenceId: null,
        autofocus: false,
      });
      instance.getTab()?.setQuery(query);
    };
    void init();

    return () => {
      cancelled = true;
      instance?.destroy();
      element.replaceChildren();
    };
  }, [query, endpoint]);

  return <div ref={container} className={styles.editor} />;
}
