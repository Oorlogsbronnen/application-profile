import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPageContent } from "./load-content.js";
import type { GroupId } from "./model.js";
import { combineTurtle, parseProfile } from "./parse-shapes.js";
import { renderPage } from "./render-page.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const bouwstenenPath = resolve(repoRoot, "ontology/shapes-bouwstenen.ttl");
const groupFiles: { id: GroupId; path: string; staticName: string }[] = [
  {
    id: "personen",
    path: resolve(repoRoot, "ontology/shapes-personen.ttl"),
    staticName: "schema-personen.ttl",
  },
  {
    id: "objecten",
    path: resolve(repoRoot, "ontology/shapes-collecties.ttl"),
    staticName: "schema-collecties.ttl",
  },
];

const pagePath = resolve(
  repoRoot,
  "website/docs/datamodel/application-profile.mdx",
);
const staticDir = resolve(repoRoot, "website/static");

try {
  const bouwstenen = readFileSync(bouwstenenPath, "utf8");
  const groupSources = groupFiles.map((file) => ({
    ...file,
    turtle: readFileSync(file.path, "utf8"),
  }));

  const profile = parseProfile(bouwstenen, groupSources);
  for (const group of profile.groups) {
    if (group.shapes.length === 0) {
      const file = groupFiles.find((candidate) => candidate.id === group.id);
      throw new Error(
        `Geen NodeShapes gevonden in ${basename(file?.path ?? group.id)}.`,
      );
    }
  }

  const content = loadPageContent({
    editorialPath: resolve(
      repoRoot,
      "website/docs/datamodel/_schema-toelichting.mdx",
    ),
    groupIntroPaths: {
      personen: resolve(repoRoot, "website/docs/datamodel/_schema-personen.mdx"),
      objecten: resolve(repoRoot, "website/docs/datamodel/_schema-objecten.mdx"),
    },
    classExamplesDir: resolve(repoRoot, "ontology/examples"),
    fullExamplesDir: resolve(repoRoot, "ontology/examples/volledig"),
  });

  // Een voorbeeld met een verkeerde bestandsnaam zou anders geruisloos van de
  // pagina verdwijnen.
  const shapeNames = new Set(
    profile.groups.flatMap((group) =>
      group.shapes.map((shape) => shape.localName),
    ),
  );
  for (const name of content.classExamples.keys()) {
    if (!shapeNames.has(name)) {
      throw new Error(
        `Voorbeeld ontology/examples/${name}.jsonld hoort bij geen enkele klasse-shape in de shapes-bestanden.`,
      );
    }
  }

  mkdirSync(dirname(pagePath), { recursive: true });
  writeFileSync(pagePath, renderPage(profile, content), "utf8");

  // Machine-leesbare downloads: het volledige profiel en één bestand per
  // kennisgraaf, elk inclusief de bouwstenen zodat het zelfstandig valideert.
  writeFileSync(
    resolve(staticDir, "schema.ttl"),
    `${combineTurtle(bouwstenen, ...groupSources.map((source) => source.turtle))}\n`,
    "utf8",
  );
  for (const source of groupSources) {
    writeFileSync(
      resolve(staticDir, source.staticName),
      `${combineTurtle(bouwstenen, source.turtle)}\n`,
      "utf8",
    );
  }

  const classCount = shapeNames.size;
  const exampleCount = content.classExamples.size + content.fullExamples.length;
  console.log(
    `Schema-documentatie gegenereerd: ${classCount} klassen in ${profile.groups.length} kennisgrafen, ` +
      `${exampleCount} voorbeelden → ${pagePath}`,
  );
} catch (error) {
  console.error("Genereren van de schema-documentatie is mislukt.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
