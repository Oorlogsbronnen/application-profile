import React from "react";
import {
  arr,
  entities,
  first,
  fmtDate,
  idOf,
  labelOf,
  safeUrl,
  sourceName,
  stripHtml,
  uuidOf,
  type Json,
} from "./helpers";
import styles from "./views.module.css";

/** Visuele weergave van het endpoint `person`: de persoonsreconstructie. */

const WAR_START = "1940-05-10";
const WAR_END = "1945-05-05";

const GENDER: Record<string, string> = {
  "https://schema.org/Female": "Vrouw",
  "https://schema.org/Male": "Man",
};

function age(birth?: string, death?: string): number | null {
  if (!birth || !death) return null;
  const b = new Date(birth),
    d = new Date(death);
  if (isNaN(b.getTime()) || isNaN(d.getTime())) return null;
  let a = d.getFullYear() - b.getFullYear();
  if (
    d.getMonth() < b.getMonth() ||
    (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())
  )
    a--;
  return a;
}

export default function PersonCard({ data }: { data: Json }) {
  const p = entities(data)[0];
  const name = first(p.name) ?? "Onbekende persoon";
  const birth = first(p.birthDate);
  const death = first(p.deathDate);
  const gender = GENDER[idOf(first(p.gender)) ?? ""];
  const a = age(birth, death);
  const alt = arr(p.alternateName);
  const job = arr(p.jobTitle);
  const description = first(p.description);
  const family = [
    { label: "Ouders", people: arr(p.parent) },
    { label: "Partner", people: arr(p.spouse) },
    { label: "Kinderen", people: arr(p.children) },
  ].filter((group) => group.people.length > 0);
  const keywords = arr(p.keywords);
  const sameAs = arr(p.sameAs);

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <div className={styles.avatar} aria-hidden>
          {initials(name)}
        </div>
        <div>
          <h3 className={styles.name}>{name}</h3>
          {alt.length > 0 && (
            <div className={styles.alt}>ook bekend als {alt.join(", ")}</div>
          )}
          <div className={styles.meta}>
            {gender && <span>{gender}</span>}
            {(birth || death) && (
              <span>
                {birth?.slice(0, 4) ?? "?"} –{" "}
                {death?.slice(0, 4) ??
                  (first(p.deceased) === "true" ? "?" : "")}
              </span>
            )}
            {a !== null && <span>{a} jaar</span>}
            {job.map((j: string) => (
              <span key={j}>{j}</span>
            ))}
          </div>
        </div>
      </header>

      <Lifeline birth={birth} death={death} />

      <dl className={styles.facts}>
        <Fact label="Geboren" date={birth} place={first(p.birthPlace)} />
        <Fact label="Overleden" date={death} place={first(p.deathPlace)} />
      </dl>

      {description && <p className={styles.text}>{stripHtml(description)}</p>}

      {family.length > 0 && (
        <section>
          <h4 className={styles.h4}>Familie</h4>
          <dl className={styles.family}>
            {family.map(({ label, people }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className={styles.chips}>
                  {people.map((person: Json) => (
                    <PersonLink key={idOf(person)} person={person} />
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {keywords.length > 0 && (
        <section>
          <h4 className={styles.h4}>Trefwoorden (WO2 Thesaurus)</h4>
          <div className={styles.chips}>
            {keywords.map((k: Json) => (
              <a
                key={idOf(k)}
                className={styles.chip}
                href={safeUrl(idOf(k))}
                target="_blank"
                rel="noreferrer"
              >
                {labelOf(k) ?? idOf(k)}
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <span>
          ID <code>{first(p.identifier) ?? uuidOf(p.id)}</code>
        </span>
        {sameAs.map((s: Json) => {
          const url = safeUrl(idOf(s));
          return (
            url && (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                ook op {sourceName(url)} ↗
              </a>
            )
          );
        })}
        <a href={safeUrl(p.id)} target="_blank" rel="noreferrer">
          persistente link ↗
        </a>
      </footer>
    </div>
  );
}

/**
 * Een familielid: ARK-link met naam en levensjaren. Heeft de API alleen de
 * link, dan tonen we de UUID. De link opent het profiel op de cookbook-pagina;
 * een gewone <a> (geen Docusaurus-Link), zodat de pagina opnieuw laadt en de
 * ApiRequest-blokken de nieuwe ID uit de URL oppakken.
 */
function PersonLink({ person }: { person: Json }) {
  const id = idOf(person);
  const uuid = uuidOf(id);
  const name: string | undefined = first(person?.name);
  const birth: string | undefined = first(person?.birthDate);
  const death: string | undefined = first(person?.deathDate);
  const years =
    birth || death
      ? ` (${birth?.slice(0, 4) ?? "?"}–${death?.slice(0, 4) ?? ""})`
      : "";
  if (!name) {
    return (
      <a
        className={`${styles.chip} ${styles.chipCode}`}
        href={safeUrl(id)}
        target="_blank"
        rel="noreferrer"
      >
        {uuid ?? id}
      </a>
    );
  }
  return uuid ? (
    <a className={styles.chip} href={`/api-cookbook/persoon?id=${uuid}`}>
      {name}
      {years}
    </a>
  ) : (
    <span className={styles.chip}>
      {name}
      {years}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .filter((_, i, all) => i === 0 || i === all.length - 1)
    .join("")
    .toUpperCase();
}

function Fact({
  label,
  date,
  place,
}: {
  label: string;
  date?: string;
  place?: string;
}) {
  if (!date && !place) return null;
  const unknownPlace = !place || /niets bekend|onbekend/i.test(place);
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>
        <div className={styles.factDate}>
          {fmtDate(date) ?? "datum onbekend"}
        </div>
        <div className={unknownPlace ? styles.muted : undefined}>
          {place ?? "plaats onbekend"}
        </div>
      </dd>
    </div>
  );
}

/** Levenslijn met de oorlogsjaren (mei 1940 – mei 1945) gemarkeerd */
function Lifeline({ birth, death }: { birth?: string; death?: string }) {
  if (!birth && !death) return null;
  const t = (d: string) =>
    new Date(d.length === 4 ? `${d}-07-01` : d).getTime();
  const start = Math.min(t(birth ?? death!), t(WAR_START));
  const end = Math.max(t(death ?? birth!), t(WAR_END));
  const pad = (end - start) * 0.03;
  const lo = start - pad,
    hi = end + pad;
  const pos = (d: string) => `${((t(d) - lo) / (hi - lo)) * 100}%`;
  const lifeFrom = birth ? pos(birth) : "0%";
  const lifeTo = death ? pos(death) : "100%";

  return (
    <div className={styles.lifeline} aria-label="Levenslijn">
      <div className={styles.track}>
        <div
          className={styles.war}
          style={{
            left: pos(WAR_START),
            width: `calc(${pos(WAR_END)} - ${pos(WAR_START)})`,
          }}
          title="Tweede Wereldoorlog in Nederland"
        >
          <span>WO2</span>
        </div>
        <div
          className={styles.life}
          style={{ left: lifeFrom, width: `calc(${lifeTo} - ${lifeFrom})` }}
        />
        {birth && (
          <div
            className={styles.dot}
            style={{ left: pos(birth) }}
            title={`Geboren ${fmtDate(birth)}`}
          />
        )}
        {death && (
          <div
            className={`${styles.dot} ${styles.dotDeath}`}
            style={{ left: pos(death) }}
            title={`Overleden ${fmtDate(death)}`}
          />
        )}
      </div>
      <div className={styles.axis}>
        {birth && <span style={{ left: pos(birth) }}>{birth.slice(0, 4)}</span>}
        {death && <span style={{ left: pos(death) }}>{death.slice(0, 4)}</span>}
      </div>
    </div>
  );
}
