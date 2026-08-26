import { useId, useMemo } from "react";
import styles from "./Toolbar.module.css";
import field from "../../../shared/ui/Field.module.css";
import {
  BENCHMARKS,
  GENRES,
  MODEL_FAMILIES,
  PARALLELISM_TYPES,
  TEXT_VARIANTS,
  TRAJECTORY_METRICS,
  facetFor,
  sentenceCase,
  titleCase,
} from "../../../shared/lib/catalog";
import { selectionPath } from "../../../shared/lib/path";
import { ALL, showsFacet, showsText } from "../../../shared/lib/selection";
import type { Selection, SelectionAction } from "../../../shared/lib/selection";
import { PillGroup } from "../../../shared/ui/PillGroup";
import type { PillOption } from "../../../shared/ui/PillGroup";
import { SelectControl } from "../../../shared/ui/SelectControl";
import type { SelectOption } from "../../../shared/ui/SelectControl";
import { useMinorCrumbFit } from "../lib/useMinorCrumbFit";
import type { ObserverFactory } from "../lib/useMinorCrumbFit";
import { SelectionPath } from "./SelectionPath";

export interface ToolbarProps {
  readonly selection: Selection;
  readonly dispatch: (action: SelectionAction) => void;
  /** Injected in tests so the fit measurement can be driven without a real observer. */
  readonly createObserver?: ObserverFactory;
}

const ALL_OPTION = { value: ALL, label: "All" } as const;

/** Keeps each dropdown's option type exactly the union its values came from. */
const asOptions = <V extends string>(
  values: readonly V[],
  label: (value: V) => string,
): SelectOption<V>[] => values.map((value) => ({ value, label: label(value) }));

const FAMILY_PILLS: readonly PillOption[] = MODEL_FAMILIES.map((f) => ({
  id: f.id,
  label: f.label,
}));
const BENCHMARK_PILLS: readonly PillOption[] = BENCHMARKS.map((b) => ({
  id: b.id,
  label: b.label,
}));

/**
 * The single toolbar. The path heads it and folds the two branches away; each branch owns the
 * filters it yields, right aligned so they share one rail with the field above them.
 */
export function Toolbar({
  selection,
  dispatch,
  createObserver,
}: ToolbarProps): React.ReactElement {
  const filterId = useId();
  const modelsId = useId();
  const benchmarksId = useId();
  const facet = facetFor(selection.family);
  const isDetail = selection.model !== null;
  const pathKey = selectionPath(selection)
    .map((crumb) => crumb.label)
    .join("/");
  const fitNames = useMemo(() => ({ crumbs: styles.crumbs, hideMinor: styles.hideMinor }), []);
  const rowRef = useMinorCrumbFit(pathKey, fitNames, createObserver);

  return (
    <div
      className={[
        styles.toolbar,
        selection.collapsed ? styles.isCollapsed : "",
        isDetail ? styles.isDetail : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.summary} ref={rowRef}>
        <SelectionPath
          selection={selection}
          onToggle={() => {
            dispatch({ type: "collapsed/toggled" });
          }}
        />
        {isDetail ? (
          <button
            type="button"
            className={styles.back}
            onClick={() => {
              dispatch({ type: "model/selected", model: null });
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
              <path
                d="M7 2L3.5 5.5 7 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
        ) : (
          <div className={`${field.control} ${styles.summaryControl}`}>
            <label htmlFor={filterId}>Filter</label>
            <input
              id={filterId}
              type="text"
              value={selection.query}
              onChange={(event) => {
                dispatch({ type: "query/changed", query: event.target.value });
              }}
            />
          </div>
        )}
      </div>

      <div className={styles.branches}>
        <div className={styles.branch} role="group" aria-labelledby={modelsId}>
          <span className={styles.branchHead} id={modelsId}>
            Models
          </span>
          <PillGroup
            label="Models"
            options={FAMILY_PILLS}
            value={selection.family}
            onSelect={(id) => {
              dispatch({ type: "family/selected", family: id as Selection["family"] });
            }}
          />
          <div className={styles.branchYield}>
            {showsFacet(selection.family) && facet ? (
              <SelectControl
                label={facet.label}
                options={[ALL_OPTION, ...asOptions(facet.values, sentenceCase)]}
                value={selection.facet}
                onSelect={(value) => {
                  dispatch({ type: "facet/selected", facet: value });
                }}
              />
            ) : null}
            {showsText(selection.family, selection.facet) ? (
              <SelectControl
                label="Text"
                options={[ALL_OPTION, ...asOptions(TEXT_VARIANTS, sentenceCase)]}
                value={selection.text}
                onSelect={(value) => {
                  dispatch({ type: "text/selected", text: value });
                }}
              />
            ) : null}
          </div>
        </div>

        <div className={styles.branch} role="group" aria-labelledby={benchmarksId}>
          <span className={styles.branchHead} id={benchmarksId}>
            Benchmarks
          </span>
          <PillGroup
            label="Benchmarks"
            options={BENCHMARK_PILLS}
            value={selection.benchmark}
            onSelect={(id) => {
              dispatch({ type: "benchmark/selected", benchmark: id as Selection["benchmark"] });
            }}
          />
          <div className={styles.branchYield}>
            {selection.benchmark === "parallelism" ? (
              <SelectControl
                label="Type"
                options={[ALL_OPTION, ...asOptions(PARALLELISM_TYPES, (v) => v)]}
                value={selection.parallelismType}
                onSelect={(value) => {
                  dispatch({ type: "parallelismType/selected", parallelismType: value });
                }}
              />
            ) : (
              <>
                <SelectControl
                  label="Genre"
                  options={[ALL_OPTION, ...asOptions(GENRES, (v) => v)]}
                  value={selection.genre}
                  onSelect={(value) => {
                    dispatch({ type: "genre/selected", genre: value });
                  }}
                />
                <SelectControl
                  label="Metric"
                  options={[
                    { value: "genre", label: "Genre Discrimination" } as const,
                    ...asOptions(TRAJECTORY_METRICS, titleCase),
                  ]}
                  value={selection.metric}
                  onSelect={(value) => {
                    dispatch({ type: "metric/selected", metric: value });
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
