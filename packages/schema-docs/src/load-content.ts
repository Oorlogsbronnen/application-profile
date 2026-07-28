import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Example, PageContent } from "./page-content.js";

export type ContentPaths = {
  editorialPath: string;
  classExamplesDir: string;
  fullExamplesDir: string;
};

/**
 * Laadt de redactionele en voorbeeld-inhoud van schijf. Ontbrekende bestanden
 * of mappen zijn geen fout (de bijbehorende onderdelen worden dan weggelaten);
 * een voorbeeldbestand met kapotte JSON breekt de build wél.
 */
export function loadPageContent(paths: ContentPaths): PageContent {
  return {
    editorial: loadEditorial(paths.editorialPath),
    classExamples: new Map(
      loadExamples(paths.classExamplesDir).map((example) => [
        example.name,
        example.json,
      ]),
    ),
    fullExamples: loadExamples(paths.fullExamplesDir),
  };
}

function loadEditorial(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }
  const body = readFileSync(path, "utf8").trim();
  return body === "" ? null : body;
}

function loadExamples(dir: string): Example[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonld"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "nl"))
    .map((file) => {
      const path = join(dir, file);
      const json = readFileSync(path, "utf8").trim();
      assertValidJson(json, path);
      return { name: basename(file, ".jsonld"), json };
    });
}

function assertValidJson(json: string, path: string): void {
  try {
    JSON.parse(json);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Voorbeeldbestand ${path} bevat geen geldige JSON: ${reason}`,
    );
  }
}
