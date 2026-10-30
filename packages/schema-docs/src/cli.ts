import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkSources,
  formatProblems,
  githubAnnotation,
  githubError,
} from "./check-sources.js";
import { GROUPS, type GroupId } from "./groups.js";
import { loadPageContent } from "./load-content.js";
import { combineTurtle, parseProfile } from "./parse-shapes.js";
import { renderPage } from "./render-page.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ontologyDir = resolve(repoRoot, "ontology");
const docsDir = resolve(repoRoot, "website/docs/datamodel");
const staticDir = resolve(repoRoot, "website/static");

const pagePath = resolve(docsDir, "application-profile.mdx");

// Met --check (`pnpm check`) wordt alles gecontroleerd en gerenderd, maar
// niets weggeschreven.
const checkOnly = process.argv.includes("--check");
const inGitHubActions = process.env.GITHUB_ACTIONS === "true";

try {
  // Eerst alle bronbestanden, ook de vocabulaire die de generator verder niet
  // leest: een syntaxfout daarin zou anders ongemerkt online komen.
  const shapesFiles = new Set<string>([
    "shapes-bouwstenen.ttl",
    ...GROUPS.map((group) => group.shapesFile),
  ]);
  const ontologyFiles = readdirSync(ontologyDir)
    .filter((name) => name.endsWith(".ttl"))
    .sort();
  const problems = checkSources(
    ontologyFiles.map((name) => ({
      file: `ontology/${name}`,
      turtle: readFileSync(resolve(ontologyDir, name), "utf8"),
      shapes: shapesFiles.has(name),
    })),
  );
  if (problems.length > 0) {
    console.error(formatProblems(problems));
    if (inGitHubActions) {
      problems.forEach((problem) => console.log(githubAnnotation(problem)));
    }
    process.exit(1);
  }

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

  const page = renderPage(profile, content);
  if (checkOnly) {
    console.log(
      `Controle geslaagd: ${ontologyFiles.length} bronbestanden en ${shapeNames.size} klassen zijn in orde.`,
    );
    process.exit(0);
  }

  writeFileSync(pagePath, page, "utf8");

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
  const message = error instanceof Error ? error.message : String(error);
  console.error("Genereren van de schema-documentatie is mislukt.");
  console.error(message);
  if (inGitHubActions) {
    console.log(githubError(message, ["title=Genereren mislukt"]));
  }
  process.exit(1);
}
