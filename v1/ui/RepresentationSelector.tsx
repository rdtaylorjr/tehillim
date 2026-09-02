import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./RepresentationSelector.module.css";
import { baseFeatureId, featureNameFromMethodId } from "../lib/featureNames";

type Aggregation = "Mean-Pool" | "Soft-Alignment";
type TextVariant = "Consonantal" | "Vocalized" | "Cantillation";
type Correction = "None" | "Top-PC removed" | "Whitened";

const TYPES = ["Lexical", "Syntactic", "Semantic"] as const;
type RepresentationType = (typeof TYPES)[number];

//: Per-type method lists for the two TF-IDF families; filtered against real data before display.
const METHODS: Record<
  Exclude<RepresentationType, "Semantic">,
  { id: string; label: string }[]
> = {
  Lexical: [
    { id: "lexical", label: "Lexical" },
    { id: "root", label: "Root" },
    { id: "named-entity-identity", label: "Named-entity identity" },
  ],
  Syntactic: [
    { id: "verb-morphology", label: "Verb morphology" },
    { id: "person-profile", label: "Grammatical person" },
    { id: "lexical-set", label: "Lexical set" },
    { id: "named-entity", label: "Named-entity type" },
    { id: "clause-type", label: "Clause type" },
    { id: "text-type", label: "Text type" },
    { id: "clause-relation", label: "Clause relation" },
    { id: "verb-sense", label: "Verb sense" },
  ],
};

//: Dropdown display order, grouped as in semantic_embedding.py.
const ENCODERS: { id: string; label: string }[] = [
  { id: "miqrabert", label: "MiqraBERT" },
  { id: "alephbert", label: "AlephBERT" },
  { id: "berel", label: "BEREL" },
  { id: "neodictabert", label: "NeoDictaBERT" },
  { id: "bge-multilingual-gemma2", label: "BGE-Multilingual-Gemma2" },
  { id: "qwen3-embedding", label: "Qwen3-Embedding" },
  { id: "kalm-embedding", label: "KaLM-Embedding" },
  { id: "llama-embed-nemotron", label: "Llama-Embed-Nemotron-8B" },
  { id: "gemini", label: "Gemini Embedding 2" },
  { id: "openai", label: "OpenAI text-embedding-3-large" },
  { id: "cohere", label: "Cohere Embed v4" },
  { id: "voyage", label: "Voyage 4" },
  { id: "bge-m3", label: "BGE-M3" },
  { id: "gte-multilingual-base", label: "GTE-Multilingual-Base" },
  { id: "me5-large-instruct", label: "mE5-Large-Instruct" },
];

//: Longest-id-first, so the prefix match can't let "bge-m3" shadow "bge-multilingual-gemma2".
const ENCODERS_BY_ID_LENGTH_DESC = [...ENCODERS].sort((a, b) => b.id.length - a.id.length);

const AGG_SLUG: Record<Aggregation, string> = {
  "Mean-Pool": "mean-pool",
  "Soft-Alignment": "soft-alignment",
};

const TEXT_VARIANTS: readonly TextVariant[] = ["Consonantal", "Vocalized", "Cantillation"];
const AGGREGATIONS: readonly Aggregation[] = ["Mean-Pool", "Soft-Alignment"];
const CORRECTIONS: readonly Correction[] = ["Top-PC removed", "Whitened", "None"];

//: Idle time before the panel auto-closes; only a pick starts this countdown, not opening the panel.
const AUTO_CLOSE_MS = 10000;

interface SelectorState {
  type: RepresentationType;
  method: string;
  encoder: string;
  agg: Aggregation;
  text: TextVariant;
  correction: Correction;
}

function semanticBaseId(
  encoderId: string,
  agg: Aggregation,
  text: TextVariant,
  correction: Correction,
): string {
  const aggSlug = AGG_SLUG[agg];
  if (correction === "Top-PC removed") return `${encoderId}-${aggSlug}-top-pc`;
  if (correction === "Whitened") return `${encoderId}-${aggSlug}-whitened`;
  if (text === "Consonantal") return `${encoderId}-${aggSlug}-consonantal`;
  if (text === "Vocalized") return `${encoderId}-${aggSlug}-vocalized`;
  return `${encoderId}-${aggSlug}`;
}

//: Reverse of semanticBaseId, for initializing state from an already-selected id.
function parseSemanticBaseId(baseId: string): Omit<SelectorState, "type" | "method"> | null {
  const encoder = ENCODERS_BY_ID_LENGTH_DESC.find((e) => baseId.startsWith(`${e.id}-`));
  if (!encoder) return null;
  const rest = baseId.slice(encoder.id.length + 1);
  for (const agg of AGGREGATIONS) {
    const slug = AGG_SLUG[agg];
    if (rest === slug) {
      return { encoder: encoder.id, agg, text: "Cantillation", correction: "None" };
    }
    if (rest === `${slug}-consonantal`) {
      return { encoder: encoder.id, agg, text: "Consonantal", correction: "None" };
    }
    if (rest === `${slug}-vocalized`) {
      return { encoder: encoder.id, agg, text: "Vocalized", correction: "None" };
    }
    if (rest === `${slug}-top-pc`) {
      return { encoder: encoder.id, agg, text: "Cantillation", correction: "Top-PC removed" };
    }
    if (rest === `${slug}-whitened`) {
      return { encoder: encoder.id, agg, text: "Cantillation", correction: "Whitened" };
    }
  }
  return null;
}

const FALLBACK_METHOD = METHODS.Lexical[0]?.id ?? "lexical";
const FALLBACK_ENCODER = ENCODERS[0]?.id ?? "miqrabert";

function initialState(baseId: string): SelectorState {
  const defaults = {
    encoder: FALLBACK_ENCODER,
    agg: "Mean-Pool",
    text: "Consonantal",
    correction: "Top-PC removed",
  } as const;
  for (const [type, methods] of Object.entries(METHODS) as [
    Exclude<RepresentationType, "Semantic">,
    { id: string }[],
  ][]) {
    if (methods.some((m) => m.id === baseId)) {
      return { type, method: baseId, ...defaults };
    }
  }
  const parsed = parseSemanticBaseId(baseId);
  if (parsed) return { type: "Semantic", method: FALLBACK_METHOD, ...parsed };
  return { type: "Lexical", method: FALLBACK_METHOD, ...defaults };
}

interface ChipProps {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
  readonly extra?: string;
}

function Chip({ label, active, onClick, extra }: ChipProps): React.ReactElement {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={[styles.representationChip, extra, active ? styles.isActive : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export interface RepresentationSelectorProps {
  /** Every method id this page's payload actually carries. */
  readonly availableIds: readonly string[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}

/** Faceted Type/Method/Encoder/Text/Aggregation/Correction picker; each row is
 * filtered against `availableIds`, so a facet the data doesn't carry never
 * appears. */
export function RepresentationSelector({
  availableIds,
  value,
  onChange,
}: RepresentationSelectorProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  //: True while a Method/Encoder select has focus; pauses the auto-close countdown.
  const selectFocused = useRef(false);
  const [open, setOpen] = useState(false);
  // The parent's value only ever changes because this control changed it, so
  // the faceted breakdown of that id is owned here rather than re-derived.
  const [state, setState] = useState<SelectorState>(() => initialState(baseFeatureId(value)));

  const catalog = useMemo(() => {
    const suffix = availableIds[0]?.endsWith("-spectral") ? "-spectral" : "-tfidf-cosine";
    const baseIds = new Set(availableIds.map(baseFeatureId));
    const has = (baseId: string): boolean => baseIds.has(baseId);
    const encoders = ENCODERS.filter(
      (e) => has(`${e.id}-mean-pool`) || has(`${e.id}-soft-alignment`),
    );
    return {
      suffix,
      has,
      encoders,
      types: TYPES.filter((type) =>
        type === "Semantic" ? encoders.length > 0 : METHODS[type].some((m) => has(m.id)),
      ),
      encoderHasText: (id: string): boolean =>
        has(`${id}-mean-pool-consonantal`) ||
        has(`${id}-mean-pool-vocalized`) ||
        has(`${id}-soft-alignment-consonantal`) ||
        has(`${id}-soft-alignment-vocalized`),
      encoderHasCorrection: (id: string): boolean =>
        has(`${id}-soft-alignment-top-pc`) || has(`${id}-soft-alignment-whitened`),
    };
  }, [availableIds]);

  //: Corrects state to a combination the data actually carries before anything reads it.
  const resolved = useMemo(() => {
    const type = catalog.types.includes(state.type)
      ? state.type
      : (catalog.types[0] ?? "Lexical");
    const methods = type === "Semantic" ? [] : METHODS[type].filter((m) => catalog.has(m.id));
    const method = methods.some((m) => m.id === state.method)
      ? state.method
      : (methods[0]?.id ?? state.method);
    const encoder = catalog.encoders.some((e) => e.id === state.encoder)
      ? state.encoder
      : (catalog.encoders[0]?.id ?? state.encoder);
    //: A stale value inherited from a prior encoder that doesn't apply here resets.
    const hasText = catalog.encoderHasText(encoder);
    const hasCorrection =
      catalog.encoderHasCorrection(encoder) && state.agg === "Soft-Alignment";
    const text = hasText ? state.text : "Consonantal";
    const correction = hasCorrection ? state.correction : "Top-PC removed";

    const baseId =
      type === "Semantic"
        ? semanticBaseId(
            encoder,
            state.agg,
            hasText ? text : "Cantillation",
            hasCorrection ? correction : "None",
          )
        : method;
    const id =
      availableIds.find((candidate) => baseFeatureId(candidate) === baseId) ??
      `${baseId}${catalog.suffix}`;

    return { type, methods, method, encoder, hasText, hasCorrection, text, correction, id };
  }, [availableIds, catalog, state]);

  const closePanel = useCallback((): void => {
    clearTimeout(closeTimer.current);
    setOpen(false);
  }, []);

  //: Restarts the auto-close countdown rather than closing directly, so multiple picks combine in one visit.
  const pick = useCallback(
    (next: Partial<SelectorState>): void => {
      setState((prev) => {
        const merged = { ...prev, ...next };
        // A value inherited from an encoder that has the axis, carried onto one
        // that doesn't, is cleared here rather than left to reappear on the next
        // encoder that happens to have it again. Deriving this for display only
        // would keep the stale value alive in state and do exactly that.
        const keepsText = catalog.encoderHasText(merged.encoder);
        const keepsCorrection =
          catalog.encoderHasCorrection(merged.encoder) && merged.agg === "Soft-Alignment";
        return {
          ...merged,
          text: keepsText ? merged.text : "Consonantal",
          correction: keepsCorrection ? merged.correction : "Top-PC removed",
        };
      });
      clearTimeout(closeTimer.current);
      if (!selectFocused.current) closeTimer.current = setTimeout(closePanel, AUTO_CLOSE_MS);
    },
    [catalog, closePanel],
  );

  useEffect(() => {
    onChange(resolved.id);
  }, [onChange, resolved.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onOutsideClick = (event: MouseEvent): void => {
      const container = containerRef.current;
      if (container && !event.composedPath().includes(container)) closePanel();
    };
    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") closePanel();
    };
    document.addEventListener("click", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [closePanel, open]);

  useEffect(
    () => () => {
      clearTimeout(closeTimer.current);
    },
    [],
  );

  const selectProps = {
    className: styles.representationSelect,
    onFocus: (): void => {
      selectFocused.current = true;
      clearTimeout(closeTimer.current);
    },
    onBlur: (): void => {
      selectFocused.current = false;
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(closePanel, AUTO_CLOSE_MS);
    },
  };

  return (
    <div ref={containerRef}>
      <button
        type="button"
        className={styles.representationToggle}
        aria-expanded={open}
        onClick={() => {
          setOpen((wasOpen) => !wasOpen);
        }}
      >
        {featureNameFromMethodId(resolved.id)}
      </button>

      <div
        className={`${styles.representationPanel}${open ? ` ${styles.isOpen}` : ""}`}
        aria-label="Representation"
      >
        <div className={styles.representationRow}>
          <div className={styles.representationOptions}>
            {catalog.types.map((type) => (
              <Chip
                key={type}
                label={type}
                active={type === resolved.type}
                extra={styles.representationTypeChip}
                onClick={() => {
                  pick({ type });
                }}
              />
            ))}
          </div>
        </div>

        {resolved.type === "Semantic" ? (
          <>
            <div className={styles.representationRow}>
              <span className={styles.representationRowLabel}>Encoder</span>
              <select
                {...selectProps}
                value={resolved.encoder}
                onChange={(event) => {
                  pick({ encoder: event.target.value });
                }}
              >
                {catalog.encoders.map((encoder) => (
                  <option key={encoder.id} value={encoder.id}>
                    {encoder.label}
                  </option>
                ))}
              </select>
            </div>

            {resolved.hasText ? (
              <div className={styles.representationRow}>
                <span className={styles.representationRowLabel}>Text</span>
                <div className={styles.representationOptions}>
                  {TEXT_VARIANTS.map((text) => (
                    <Chip
                      key={text}
                      label={text}
                      active={text === resolved.text}
                      onClick={() => {
                        pick({ text });
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className={styles.representationRow}>
              <span className={styles.representationRowLabel}>Aggregation</span>
              <div className={styles.representationOptions}>
                {AGGREGATIONS.map((agg) => (
                  <Chip
                    key={agg}
                    label={agg}
                    active={agg === state.agg}
                    onClick={() => {
                      pick({ agg });
                    }}
                  />
                ))}
              </div>
            </div>

            {resolved.hasCorrection ? (
              <div className={styles.representationRow}>
                <span className={styles.representationRowLabel}>Correction</span>
                <div className={styles.representationOptions}>
                  {CORRECTIONS.map((correction) => (
                    <Chip
                      key={correction}
                      label={correction}
                      active={correction === resolved.correction}
                      onClick={() => {
                        pick({ correction });
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.representationRow}>
            <span className={styles.representationRowLabel}>Method</span>
            <select
              {...selectProps}
              value={resolved.method}
              onChange={(event) => {
                pick({ method: event.target.value });
              }}
            >
              {resolved.methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
