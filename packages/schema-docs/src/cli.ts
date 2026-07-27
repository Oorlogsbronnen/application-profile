import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

  mkdirSync(dirname(pagePath), { recursive: true });
  writeFileSync(pagePath, renderPage(profile), "utf8");
  copyFileSync(shapesPath, staticTtlPath);

  console.log(
    `Schema-documentatie gegenereerd: ${profile.classShapes.length} klassen, ` +
      `${profile.rules.length} regels, ${profile.bases.length} basistypen → ${pagePath}`,
  );
} catch (error) {
  console.error("Genereren van de schema-documentatie is mislukt.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
