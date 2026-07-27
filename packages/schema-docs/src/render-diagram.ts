import type { ApplicationProfile } from "./model.js";
import {
  allowedClasses,
  rulesByName,
  shapeByTargetClass,
} from "./presenter.js";
import { localName } from "./iri.js";

/**
 * Mermaid-classDiagram van de klasse-shapes: overerving via sh:node en
 * verwijzingen via de klasse-constraints van de gebruikte regels.
 */
export function renderDiagram(profile: ApplicationProfile): string {
  const targetIndex = shapeByTargetClass(profile);
  const rules = rulesByName(profile);
  const shapeNames = new Set(
    profile.classShapes.map((shape) => shape.localName),
  );

  const lines: string[] = ["classDiagram", "  direction LR"];

  for (const shape of profile.classShapes) {
    const label = shape.name ?? shape.localName;
    lines.push(`  class ${shape.localName}["${label}"]`);
  }

  const edges = new Set<string>();
  for (const shape of profile.classShapes) {
    for (const parent of shape.inheritsFrom) {
      if (shapeNames.has(parent)) {
        edges.add(`  ${shape.localName} --|> ${parent}`);
      }
    }
    for (const property of shape.properties) {
      const rule = property.ruleRef ? rules.get(property.ruleRef) : undefined;
      if (!rule) {
        continue;
      }
      for (const allowedClass of allowedClasses(rule)) {
        const target = targetIndex.get(allowedClass.iri);
        if (target && target.localName !== shape.localName) {
          edges.add(
            `  ${shape.localName} --> ${target.localName} : ${localName(property.path.iri)}`,
          );
        }
      }
    }
  }

  lines.push(...[...edges].sort());
  return lines.join("\n");
}
