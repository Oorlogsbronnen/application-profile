import React, { useEffect, useState } from "react";
import Link from "@docusaurus/Link";
import {
  arr,
  entities,
  eventsOf,
  first,
  fmtDate,
  observationsOf,
  primarySources,
  safeUrl,
  sourceName,
  stripHtml,
  textOf,
  uuidOf,
  type Json,
} from "./helpers";
import styles from "./views.module.css";

/* ---------- person, onderdeel gebeurtenissen: tijdlijn ---------- */

/**
 * De API levert gebeurtenissen in willekeurige volgorde en per bron apart.
 * Daarom sorteren we op datum en groeperen we vermeldingen van dezelfde dag.
 */
export function EventTimeline({ data }: { data: Json }) {
  const groups = new Map<string, Json[]>();
  eventsOf(data).forEach((event) => {
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
            {groups.get(date)!.map((event: Json, i) => (
              <TimelineEvent key={`${event.id}-${i}`} event={event} />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function TimelineEvent({ event }: { event: Json }) {
  const type = textOf(first(event.additionalType));
  const from = textOf(
    first(event.fromLocation) ?? first(event.fromLocation_str),
  );
  const to = textOf(first(event.toLocation) ?? first(event.toLocation_str));
  // Sommige bronnen vullen endDate ook bij een gebeurtenis van één dag.
  const endDate: string | undefined = first(event.endDate);
  const end =
    endDate && endDate !== first(event.startDate) ? fmtDate(endDate) : null;
  const description = first(event.description);

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
      <SourceLine sources={event.hadPrimarySource} />
    </li>
  );
}

/** Bronnen met een `url` worden een link; de rest blijft platte tekst. */
function SourceLine({ sources }: { sources: Json }) {
  const items = primarySources(sources);
  if (items.length === 0) return null;
  return (
    <div className={styles.sourceLine}>
      Bron:{" "}
      {items.map(({ name, url }, i) => (
        <React.Fragment key={`${name}-${i}`}>
          {i > 0 && ", "}
          {url ? (
            <a href={url} target="_blank" rel="noreferrer">
              {name} ↗
            </a>
          ) : (
            name
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------- person, onderdeel vermeldingen: één kaart per bron ---------- */

export function ObservationList({ data }: { data: Json }) {
  const observations = observationsOf(data);
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
      <SourceLine sources={o.hadPrimarySource} />
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

/* ---------- objects en person_related_objects: raster van objecten ---------- */

type Icon = "photo" | "document" | "book" | "person";

/** schema.org-type → leesbaar label en pictogram; specifieke types eerst. */
const KINDS: [RegExp, { label: string; icon: Icon }][] = [
  [/\/(Photograph|ImageObject)$/, { label: "Foto", icon: "photo" }],
  [/\/ArchiveComponent$/, { label: "Archiefstuk", icon: "document" }],
  [/\/Book$/, { label: "Boek", icon: "book" }],
  [/\/CreativeWork$/, { label: "Creatief werk", icon: "document" }],
];

function objectKind(types: Json): { label?: string; icon: Icon } {
  const list = arr(types).filter((t): t is string => typeof t === "string");
  for (const [pattern, kind] of KINDS)
    if (list.some((t) => pattern.test(t))) return kind;
  return { icon: "document" };
}

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
  // Zonder dateCreated is het een periode: startDate tot endDate, bv. 1945–1950.
  const start = fmtDate(first(o.dateCreated) ?? first(o.startDate));
  const end = arr(o.dateCreated).length ? null : fmtDate(first(o.endDate));
  const date = end && end !== start ? `${start ?? "?"} – ${end}` : start;
  const license = textOf(first(o.license));
  const description = first(o.description);
  const kind = objectKind(o.type);
  // Liever de soort uit de bron; anders het schema.org-type.
  const tags = arr(o.additionalType).map(textOf).filter(Boolean) as string[];
  if (tags.length === 0 && kind.label) tags.push(kind.label);

  return (
    <li className={styles.itemCard}>
      <ObjectImage src={image} icon={kind.icon} />
      <div className={styles.chips}>
        {tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
          </span>
        ))}
      </div>
      {/* Sommige titels bevatten HTML, zoals <br/> */}
      <strong>{stripHtml(first(o.name) ?? "") || "Zonder titel"}</strong>
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
        {institution ? (
          <div>
            <dt>Collectie</dt>
            <dd>{institution}</dd>
          </div>
        ) : (
          url && (
            <div>
              <dt>Bron</dt>
              <dd>{sourceName(url)}</dd>
            </div>
          )
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

/* ---------- persons: raster van personen ---------- */

export function PersonGrid({ data }: { data: Json }) {
  return (
    <ul className={styles.cardGrid}>
      {entities(data).map((person: Json) => (
        <PersonResult key={person.id} person={person} />
      ))}
    </ul>
  );
}

function PersonResult({ person: p }: { person: Json }) {
  const name: string | undefined = first(p.name);
  // De id is een URL; de vervolgaanroepen hebben alleen de UUID nodig.
  const uuid = uuidOf(p.id);
  const photo = arr(p.image)
    .map((image: Json) => safeUrl(first(image?.thumbnailUrl)))
    .find(Boolean);
  const alt = arr(p.alternateName).filter((n: string) => n !== name);
  const rows = [
    ["Geboren", fmtDate(first(p.birthDate)), first(p.birthPlace)],
    ["Overleden", fmtDate(first(p.deathDate)), first(p.deathPlace)],
  ].filter(([, ...values]) => values.some(Boolean));

  return (
    <li className={styles.itemCard}>
      <ObjectImage src={photo} icon="person" portrait />
      <strong>{name ?? "Naam onbekend"}</strong>
      {alt.length > 0 && (
        <div className={styles.alt}>ook bekend als {alt.join(", ")}</div>
      )}
      <dl className={styles.rows}>
        {rows.map(([label, ...values]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{values.filter(Boolean).join(", ")}</dd>
          </div>
        ))}
      </dl>
      {uuid && (
        <Link to={`/api-cookbook/persoon?id=${uuid}`}>
          Alles over deze persoon →
        </Link>
      )}
    </li>
  );
}

/**
 * Toont de thumbnail, of een vervangende afbeelding als die ontbreekt of niet
 * laadt (niet elke thumbnail bij een bron bestaat nog). De ref vangt een fout
 * die optrad vóór de hydratie van de vooraf gerenderde pagina.
 */
function ObjectImage({
  src,
  icon,
  portrait = false,
}: {
  src?: string;
  icon: Icon;
  /** Portretfoto: snijd bij naar het bovenste deel, waar het gezicht zit. */
  portrait?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <FallbackImage icon={icon} />;
  return (
    <img
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
      className={
        portrait
          ? `${styles.objectImage} ${styles.objectImagePortrait}`
          : styles.objectImage
      }
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

const ICONS: Record<Icon, React.ReactNode> = {
  photo: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  book: (
    <>
      <path d="M4 5c3-1 6-1 8 1v14c-2-2-5-2-8-1z" />
      <path d="M20 5c-3-1-6-1-8 1v14c2-2 5-2 8-1z" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </>
  ),
};

function FallbackImage({ icon }: { icon: Icon }) {
  return (
    <div className={styles.fallbackImage}>
      <svg
        viewBox="0 0 24 24"
        width="40"
        height="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden
      >
        {ICONS[icon]}
      </svg>
      <span>
        {icon === "person"
          ? "Geen foto beschikbaar"
          : "Geen afbeelding beschikbaar"}
      </span>
    </div>
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
