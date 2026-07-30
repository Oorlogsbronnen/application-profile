import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GROUPS } from "../src/groups.js";
import type { ApplicationProfile } from "../src/model.js";
import { parseProfile } from "../src/parse-shapes.js";

const ontologyDir = resolve(__dirname, "../../../ontology");

export function readShapes(file: string): string {
  return readFileSync(resolve(ontologyDir, file), "utf8");
}

/** Het profiel geparseerd uit de echte shapes-bestanden, zoals de CLI dat doet. */
export function loadRealProfile(): ApplicationProfile {
  return parseProfile(
    readShapes("shapes-bouwstenen.ttl"),
    GROUPS.map((group) => ({
      id: group.id,
      turtle: readShapes(group.shapesFile),
    })),
  );
}
