import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GROUPS, type GroupId } from "./groups.js";
import { loadPageContent } from "./load-content.js";
import { combineTurtle, parseProfile } from "./parse-shapes.js";
import { renderPage } from "./render-page.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ontologyDir = resolve(repoRoot, "ontology");
const docsDir = resolve(repoRoot, "website/docs/datamodel");
const staticDir = resolve(repoRoot, "website/static");

const pagePath = resolve(docsDir, "application-profile.mdx");

try {
  const bouwstenen = readFileSync(
    resolve(ontologyDir, "shapes-bouwstenen.ttl"),
    "utf8",
  );
  const groupSources = GROUPS.map((group) => ({
    ...group,
    turtle: readFileSync(resolve(ontologyDir, group.shapesFile), "utf8"),
  }));

  const profile = parseProfile(bouwstenen, groupSources);
  profile.groups.forEach((group, index) => {
    if (group.shapes.length === 0) {
      throw new Error(
        `Geen NodeShapes gevonden in ${groupSources[index]?.shapesFile}.`,
      );
    }
  });

  const content = loadPageContent({
    editorialPath: resolve(docsDir, "_schema-toelichting.mdx"),
    groupIntroPaths: Object.fromEntries(
      GROUPS.map((group) => [group.id, resolve(docsDir, group.introFile)]),
    ) as Record<GroupId, string>,
    classExamplesDir: resolve(ontologyDir, "examples"),
    fullExamplesDir: resolve(ontologyDir, "examples/volledig"),
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

  const exampleCount = content.classExamples.size + content.fullExamples.length;
  console.log(
    `Schema-documentatie gegenereerd: ${shapeNames.size} klassen in ${profile.groups.length} kennisgrafen, ` +
      `${exampleCount} voorbeelden → ${pagePath}`,
  );
} catch (error) {
  console.error("Genereren van de schema-documentatie is mislukt.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
