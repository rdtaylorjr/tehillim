import { baseFeatureId, featureDisplay, featureRank } from "../../../shared/lib/corpus";

/** One representation, read off its id into the axes a reader picks along. */
export interface Signal {
  /** The id as the payload carries it, suffix and all. */
  readonly id: string;
  readonly baseId: string;
  /** "Lexical", "Syntactic", "Semantic", or "Other" for an unnamed signal. */
  readonly family: string;
  /** The encoder for a semantic signal, the signal itself for any other. */
  readonly model: string;
  readonly modelLabel: string;
  readonly text: string | null;
  readonly aggregation: string | null;
  readonly correction: string | null;
}

const UNNAMED_FAMILY = "Other";

const AGGREGATIONS = ["mean-pool", "soft-alignment"] as const;

const AGGREGATION_LABEL: Record<string, string> = {
  "mean-pool": "Mean-Pool",
  "soft-alignment": "Soft-Alignment",
};

const TEXT_LABEL: Record<string, string> = {
  consonantal: "Consonantal",
  vocalized: "Vocalized",
};

const CORRECTION_LABEL: Record<string, string> = {
  "top-pc": "Top-PC removed",
  whitened: "Whitened",
};

/** Canonical orders. A value outside them sorts last rather than being dropped. */
const AXIS_ORDER: Record<string, readonly string[]> = {
  family: ["Lexical", "Syntactic", "Semantic"],
  text: ["Consonantal", "Vocalized", "Cantillation"],
  aggregation: ["Mean-Pool", "Soft-Alignment"],
  correction: ["Top-PC removed", "Whitened", "None"],
};

interface SemanticParts {
  readonly encoder: string;
  readonly aggregation: string;
  readonly text: string;
  readonly correction: string;
}

/** Parses `<encoder>-<aggregation>` with an optional text or correction tail. */
function parseSemantic(baseId: string): SemanticParts | null {
  for (const aggregation of AGGREGATIONS) {
    const at = baseId.lastIndexOf(`-${aggregation}`);
    if (at <= 0) continue;
    const encoder = baseId.slice(0, at);
    const tail = baseId.slice(at + aggregation.length + 2);
    const common = { encoder, aggregation: AGGREGATION_LABEL[aggregation] ?? aggregation };
    if (tail === "") return { ...common, text: "Cantillation", correction: "None" };
    if (tail in TEXT_LABEL) {
      return { ...common, text: TEXT_LABEL[tail] ?? tail, correction: "None" };
    }
    if (tail in CORRECTION_LABEL) {
      return { ...common, text: "Cantillation", correction: CORRECTION_LABEL[tail] ?? tail };
    }
    return null;
  }
  return null;
}

/** One method id taken apart. An unrecognised id is filed under the Other family. */
export function parseSignal(id: string): Signal {
  const baseId = baseFeatureId(id);
  const display = featureDisplay(baseId);
  const semantic = parseSemantic(baseId);
  if (semantic !== null) {
    return {
      id,
      baseId,
      family: display.known ? display.family : "Semantic",
      model: semantic.encoder,
      // "Semantic (BGE-M3, Mean-Pool, Vocalized)" names the encoder first.
      modelLabel: display.detail?.split(",")[0]?.trim() ?? semantic.encoder,
      text: semantic.text,
      aggregation: semantic.aggregation,
      correction: semantic.correction,
    };
  }
  return {
    id,
    baseId,
    family: display.known ? display.family : UNNAMED_FAMILY,
    model: baseId,
    modelLabel: display.known ? (display.detail ?? display.family) : baseId,
    text: null,
    aggregation: null,
    correction: null,
  };
}

/** What the reader asked for, kept per axis so a value survives a model without it. */
export interface Choice {
  readonly family: string;
  readonly model: string;
  readonly text: string;
  readonly aggregation: string;
  readonly correction: string;
}

export const INITIAL_CHOICE: Choice = {
  family: "",
  model: "",
  text: "Consonantal",
  aggregation: "Mean-Pool",
  correction: "Top-PC removed",
};

/** The choice a given id stands for, for starting from an already-selected id. */
export function choiceOf(id: string): Choice {
  const signal = parseSignal(id);
  return {
    family: signal.family,
    model: signal.model,
    text: signal.text ?? INITIAL_CHOICE.text,
    aggregation: signal.aggregation ?? INITIAL_CHOICE.aggregation,
    correction: signal.correction ?? INITIAL_CHOICE.correction,
  };
}

function ordered(values: readonly string[], axis: string): string[] {
  const canonical = AXIS_ORDER[axis] ?? [];
  const rank = (value: string): number => {
    const at = canonical.indexOf(value);
    return at === -1 ? canonical.length : at;
  };
  return [...values].sort((a, b) => rank(a) - rank(b));
}

function distinct(values: readonly (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

/** The value asked for where the data has it, otherwise the first it does have. */
function settle(options: readonly string[], wanted: string): string {
  return options.includes(wanted) ? wanted : (options[0] ?? wanted);
}

export interface Row {
  readonly key: keyof Choice;
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly value: string;
}

export interface Resolution {
  /** The signal the choice resolves to, or null when the payload is empty. */
  readonly signal: Signal | null;
  readonly families: readonly string[];
  readonly family: string;
  /** Every axis the chosen model varies along. A single-valued axis is settled. */
  readonly rows: readonly Row[];
}

/** Resolves a choice against a payload, each axis narrowing within the ones above it. */
export function resolveChoice(
  signals: readonly Signal[],
  choice: Choice,
  /** Names the model row: Encoder on the semantic side, Method elsewhere. */
  modelLabelFor: (family: string) => string = (family) =>
    family === "Semantic" ? "Encoder" : "Method",
): Resolution {
  const families = ordered(distinct(signals.map((s) => s.family)), "family");
  const family = settle(families, choice.family);
  let pool = signals.filter((s) => s.family === family);

  const models = [...new Set(pool.map((s) => s.model))].sort(
    (a, b) =>
      featureRank(pool.find((s) => s.model === a)?.baseId ?? a) -
      featureRank(pool.find((s) => s.model === b)?.baseId ?? b),
  );
  const model = settle(models, choice.model);
  pool = pool.filter((s) => s.model === model);

  const rows: Row[] = [
    {
      key: "model",
      label: modelLabelFor(family),
      options: models.map((value) => ({
        value,
        label: pool.find((s) => s.model === value)?.modelLabel ?? signalLabel(signals, value),
      })),
      value: model,
    },
  ];

  for (const axis of ["text", "aggregation", "correction"] as const) {
    const options = ordered(distinct(pool.map((s) => s[axis])), axis);
    const value = settle(options, choice[axis]);
    pool = options.length > 0 ? pool.filter((s) => s[axis] === value) : pool;
    if (options.length > 1) {
      rows.push({
        key: axis,
        label: axis === "aggregation" ? "Aggregation" : axis === "text" ? "Text" : "Correction",
        options: options.map((option) => ({ value: option, label: option })),
        value,
      });
    }
  }

  return { signal: pool[0] ?? null, families, family, rows };
}

function signalLabel(signals: readonly Signal[], model: string): string {
  return signals.find((s) => s.model === model)?.modelLabel ?? model;
}
