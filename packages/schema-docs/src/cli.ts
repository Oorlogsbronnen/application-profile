import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPageContent } from "./load-content.js";
import { parseShapes } from "./parse-shapes.js";
import { renderPage } from "./render-page.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const shapesPath = resolve(repoRoot, "ontology/shapes.ttl");
const pagePath = resolve(
  repoRoot,
  "website/docs/datamodel/application-profile.mdx",
);
const staticTtlPath = resolve(repoRoot, "website/static/schema.ttl");

try {
  const turtle = readFileSync(shapesPath, "utf8");
  const { profile } = parseShapes(turtle);

  if (profile.classShapes.length === 0) {
    throw new Error("Geen NodeShapes gevonden in shapes.ttl.");
  }

  const content = loadPageContent({
    editorialPath: resolve(
      repoRoot,
      "website/docs/datamodel/_schema-toelichting.mdx",
    ),
    classExamplesDir: resolve(repoRoot, "ontology/examples"),
    fullExamplesDir: resolve(repoRoot, "ontology/examples/volledig"),
  });

  // Een voorbeeld met een verkeerde bestandsnaam zou anders geruisloos van de
  // pagina verdwijnen.
  const shapeNames = new Set(
    profile.classShapes.map((shape) => shape.localName),
  );
  for (const name of content.classExamples.keys()) {
    if (!shapeNames.has(name)) {
      throw new Error(
        `Voorbeeld ontology/examples/${name}.jsonld hoort bij geen enkele klasse-shape in shapes.ttl.`,
      );
    }
  }

  mkdirSync(dirname(pagePath), { recursive: true });
  writeFileSync(pagePath, renderPage(profile, content), "utf8");
  copyFileSync(shapesPath, staticTtlPath);

  const exampleCount = content.classExamples.size + content.fullExamples.length;
  console.log(
    `Schema-documentatie gegenereerd: ${profile.classShapes.length} klassen, ` +
      `${exampleCount} voorbeelden → ${pagePath}`,
  );
} catch (error) {
  console.error("Genereren van de schema-documentatie is mislukt.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
