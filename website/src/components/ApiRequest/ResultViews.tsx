import React, { useEffect, useState } from "react";
import {
  arr,
  entities,
  first,
  fmtDate,
  safeUrl,
  sourceName,
  sourceUrl,
  stripHtml,
  textOf,
  type Json,
} from "./helpers";
import styles from "./views.module.css";

/* ---------- person_events: tijdlijn ---------- */

/**
 * De API levert gebeurtenissen in willekeurige volgorde en per bron apart.
 * Daarom sorteren we op datum en groeperen we vermeldingen van dezelfde dag.
 */
export function EventTimeline({ data }: { data: Json }) {
  const groups = new Map<string, Json[]>();
  entities(data).forEach((event) => {
    const date: string = first(event.startDate) ?? "";
    groups.set(date, [...(groups.get(date) ?? []), event]);
  });
  // Gebeurtenissen zonder datum komen achteraan.
  const dates = [...groups.keys()].sort((a, b) =>
    !a ? 1 : !b ? -1 : a.localeCompare(b),
  );

  return (
    <ol className={styles.timeline}>
      {dates.map((date) => (
        <li key={date} className={styles.timelineDate}>
          <div className={date ? styles.factDate : styles.muted}>
            {fmtDate(date) ?? "Datum onbekend"}
          </div>
          <ul className={styles.timelineEvents}>
            {groups.get(date)!.map((event: Json) => (
              <TimelineEvent key={event.id} event={event} />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function TimelineEvent({ event }: { event: Json }) {
  const type = textOf(first(event.additionalType));
  const from = textOf(first(event.fromLocation));
  const to = textOf(first(event.toLocation));
  const end = fmtDate(first(event.endDate));
  const description = first(event.description);
  const sources = arr(event.hadPrimarySource)
    .map(sourceUrl)
    .filter(Boolean) as string[];

  return (
    <li>
      {type && type !== first(event.name) && (
        <span className={styles.tag}>{type}</span>
      )}{" "}
      {first(event.name) ?? "Gebeurtenis"}
      {from && to && (
        <>
          {" "}
          <span className={styles.muted}>
            van {from} naar {to}
          </span>
        </>
      )}
      {end && <span className={styles.muted}> tot {end}</span>}
      {description && <div>{stripHtml(description)}</div>}
      {sources.length > 0 && (
        <div className={styles.sourceLine}>
          Bron: <SourceLinks urls={sources} />
        </div>
      )}
    </li>
  );
}

function SourceLinks({ urls }: { urls: string[] }) {
  return (
    <>
      {urls.map((url, i) => (
        <React.Fragment key={url}>
          {i > 0 && ", "}
          <a href={url} target="_blank" rel="noreferrer">
            {sourceName(url)} ↗
          </a>
        </React.Fragment>
      ))}
    </>
  );
}

/* ---------- person_observations: één kaart per bron ---------- */

export function ObservationList({ data }: { data: Json }) {
  const observations = entities(data);
  const images = observations.flatMap((o: Json) =>
    arr(o.image).flatMap((image: Json) => {
      const src = safeUrl(first(image.thumbnailUrl));
      return src ? [{ src, caption: first(image.caption) as string }] : [];
    }),
  );

  return (
    <div className={styles.card}>
      {images.length > 0 && <Gallery images={images} />}
      <ul className={styles.cardGrid}>
        {observations.map((o: Json) => (
          <ObservationCard key={o.id} observation={o} />
        ))}
      </ul>
    </div>
  );
}

function ObservationCard({ observation: o }: { observation: Json }) {
  const sources = arr(o.hadPrimarySource)
    .map(sourceUrl)
    .filter(Boolean) as string[];
  const description = first(o.description);
  const rows = [
    ["Geboren", fmtDate(first(o.birthDate)), first(o.birthPlace)],
    ["Overleden", fmtDate(first(o.deathDate)), first(o.deathPlace)],
    ["Beroep", arr(o.jobTitle).join(", ")],
    ["Woonplaats", arr(o.homeLocation).map(textOf).join(", ")],
    ["Ook genoemd", arr(o.alternateName).join(", ")],
  ].filter(([, ...values]) => values.some(Boolean));

  return (
    <li className={styles.itemCard}>
      <strong>{first(o.name) ?? "Naam onbekend"}</strong>
      {sources.length > 0 && (
        <div className={styles.sourceLine}>
          Bron: <SourceLinks urls={sources} />
        </div>
      )}
      <dl className={styles.rows}>
        {rows.map(([label, ...values]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{values.filter(Boolean).join(", ")}</dd>
          </div>
        ))}
      </dl>
      {description && (
        <details className={styles.more}>
          <summary>Beschrijving uit de bron</summary>
          {stripHtml(description)}
        </details>
      )}
    </li>
  );
}

/* ---------- person_related_objects: raster van objecten ---------- */

export function ObjectGrid({ data }: { data: Json }) {
  return (
    <ul className={styles.cardGrid}>
      {entities(data).map((object: Json) => (
        <ObjectCard key={object.id} object={object} />
      ))}
    </ul>
  );
}

function ObjectCard({ object: o }: { object: Json }) {
  const image = safeUrl(first(o.thumbnailUrl));
  const url = safeUrl(first(o.url)) ?? safeUrl(o.id);
  const institution = textOf(first(o.publisher)) ?? textOf(first(o.provider));
  const date = fmtDate(first(o.dateCreated) ?? first(o.startDate));
  const license = textOf(first(o.license));
  const description = first(o.description);

  return (
    <li className={styles.itemCard}>
      {image && <ObjectImage src={image} />}
      <div className={styles.chips}>
        {arr(o.additionalType).map((type: Json) => (
          <span key={textOf(type)} className={styles.tag}>
            {textOf(type)}
          </span>
        ))}
      </div>
      <strong>{first(o.name) ?? "Zonder titel"}</strong>
      {description && description !== first(o.name) && (
        <p className={styles.clamp}>{stripHtml(description)}</p>
      )}
      <dl className={styles.rows}>
        {date && (
          <div>
            <dt>Datum</dt>
            <dd>{date}</dd>
          </div>
        )}
        {institution && (
          <div>
            <dt>Collectie</dt>
            <dd>{institution}</dd>
          </div>
        )}
        {license && (
          <div>
            <dt>Rechten</dt>
            <dd>{license}</dd>
          </div>
        )}
      </dl>
      {url && (
        <a href={url} target="_blank" rel="noreferrer">
          Bekijk bij de bron ↗
        </a>
      )}
    </li>
  );
}

/**
 * Niet elke thumbnail bij een bron bestaat nog; verberg kapotte afbeeldingen.
 * De ref vangt een fout die optrad vóór de hydratie van de vooraf gerenderde pagina.
 */
function ObjectImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
      className={styles.objectImage}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/* ---------- Galerij met vergroting ---------- */

function Gallery({ images }: { images: { src: string; caption?: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i! + 1) % images.length);
      if (e.key === "ArrowLeft")
        setOpen((i) => (i! - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  return (
    <>
      <div className={styles.gallery}>
        {images.map((img, i) => (
          <button
            type="button"
            key={img.src + i}
            className={styles.thumb}
            onClick={() => setOpen(i)}
          >
            <img src={img.src} alt={img.caption ?? ""} loading="lazy" />
            {img.caption && <span>{img.caption}</span>}
          </button>
        ))}
      </div>
      {open !== null && (
        <div
          className={styles.lightbox}
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={images[open].src} alt={images[open].caption ?? ""} />
            <figcaption>
              {images[open].caption}
              <span>
                {open + 1} / {images.length} · ← → om te bladeren · Esc om te
                sluiten
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
