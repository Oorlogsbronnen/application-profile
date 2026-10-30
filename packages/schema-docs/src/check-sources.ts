import { Parser } from "n3";
import { parseShapes } from "./parse-shapes.js";

/**
 * Controle van de bronbestanden in ontology/ vóór de build: is elk bestand
 * geldige Turtle, en accepteert de generator de shapes-bestanden? Fouten
 * worden uitgelegd in begrijpelijk Nederlands, voor wie de bestanden
 * bewerkt zonder kennis van de tooling.
 */

export type TurtleSource = {
  /** Pad vanaf de root van de repo, zoals het in meldingen verschijnt. */
  file: string;
  turtle: string;
  /** Shapes-bestanden gaan ook door de generator; de vocabulaire alleen door de syntaxcontrole. */
  shapes: boolean;
};

export type SourceProblem = {
  file: string;
  line: number | null;
  /** De regel uit het bestand waar de fout zit, als die bekend is. */
  lineText: string | null;
  explanation: string;
  technical: string;
};

/** Uitleg per bekende foutmelding van de Turtle-parser (n3). */
const EXPLANATIONS: [RegExp, (match: RegExpMatchArray) => string][] = [
  [
    /Undefined prefix "([^"]*)"/,
    ([, prefix]) =>
      `Het voorvoegsel "${prefix}" wordt gebruikt, maar staat niet bovenaan het bestand als @prefix. Voeg een @prefix-regel toe of gebruik een voorvoegsel dat wel bestaat.`,
  ],
  [
    /Expected punctuation to follow/,
    () =>
      "Na een waarde verwacht de parser een leesteken (; , . ] of ), maar er staat nog iets anders. Staat er een woord dubbel, of ontbreekt er een leesteken?",
  ],
  [
    /Expected dot to follow/,
    () =>
      "Hier verwacht de parser het einde van een uitspraak. Ontbreekt er een punt (.) aan het eind van de vorige regel, of een puntkomma (;) tussen twee eigenschappen?",
  ],
  [
    /Expected entity but got eof/,
    () =>
      "Het bestand houdt onverwacht op. Ontbreekt er een waarde na de laatste puntkomma, of een afsluitende ] of )?",
  ],
  [
    /Unexpected "/,
    () =>
      "Hier staat iets wat de parser niet herkent. Controleer de aanhalingstekens rond tekst, de haakjes en de spelling van voorvoegsels.",
  ],
];

export function explainTurtleError(message: string): string {
  for (const [pattern, explain] of EXPLANATIONS) {
    const match = message.match(pattern);
    if (match) {
      return explain(match);
    }
  }
  return "De Turtle-syntax klopt hier niet.";
}

export function checkSources(sources: TurtleSource[]): SourceProblem[] {
  return sources.flatMap((source) => {
    const problem = checkSource(source);
    return problem ? [problem] : [];
  });
}

function checkSource(source: TurtleSource): SourceProblem | null {
  try {
    new Parser().parse(source.turtle);
  } catch (error) {
    const technical = errorMessage(error);
    const line = errorLine(error);
    return {
      file: source.file,
      line,
      lineText: line
        ? (source.turtle.split("\n")[line - 1]?.trim() ?? null)
        : null,
      explanation: explainTurtleError(technical),
      technical,
    };
  }

  if (!source.shapes) {
    return null;
  }
  try {
    parseShapes(source.turtle);
  } catch (error) {
    const technical = errorMessage(error);
    return {
      file: source.file,
      line: null,
      lineText: null,
      explanation: `De schema-generator kan dit shapes-bestand niet verwerken: ${technical}`,
      technical,
    };
  }
  return null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** n3 geeft het regelnummer mee in `context.line`. */
function errorLine(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("context" in error)) {
    return null;
  }
  const { context } = error;
  if (typeof context !== "object" || context === null || !("line" in context)) {
    return null;
  }
  return typeof context.line === "number" ? context.line : null;
}

/** Leesbare melding voor in een terminal of build-log. */
export function formatProblems(problems: SourceProblem[]): string {
  const heading =
    problems.length === 1
      ? "De bronbestanden bevatten 1 fout:"
      : `De bronbestanden bevatten ${problems.length} fouten:`;
  const blocks = problems.map((problem) =>
    [
      `✗ ${problem.file}${problem.line ? `, regel ${problem.line}` : ""}`,
      problem.lineText ? `  ${problem.line} | ${problem.lineText}` : null,
      `  ${problem.explanation}`,
      problem.explanation.includes(problem.technical)
        ? null
        : `  (technische melding: ${problem.technical})`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  );
  return [
    heading,
    ...blocks,
    'Herstel de fout en probeer het opnieuw. Zie ook de README, sectie "Wijzigingen indienen".',
  ].join("\n\n");
}

/**
 * GitHub Actions-annotatie, zodat de fout in de pull request op de regel
 * zelf verschijnt. Zie de workflow-commando's van GitHub voor de escaping.
 */
export function githubAnnotation(problem: SourceProblem): string {
  return githubError(
    problem.explanation,
    [
      `file=${problem.file}`,
      problem.line ? `line=${problem.line}` : null,
      "title=Fout in bronbestand",
    ].filter((part): part is string => part !== null),
  );
}

export function githubError(message: string, properties: string[]): string {
  const escaped = message
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A");
  return `::error ${properties.join(",")}::${escaped}`;
}
