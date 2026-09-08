import { useId } from "react";
import styles from "./Toolbar.module.css";
import field from "../../../shared/ui/Field.module.css";
import band from "../../../shared/ui/controlBand.module.css";
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
} from "../../../shared/lib/corpus";
import { ALL, showsFacet, showsText } from "../../../shared/lib/navigation";
import type { Selection, SelectionAction } from "../../../shared/lib/navigation";
import { Dropdown, DropdownPills, DropdownRow } from "../../../shared/ui/Dropdown";
import { PillGroup } from "../../../shared/ui/PillGroup";
import type { PillOption } from "../../../shared/ui/PillGroup";
import type { SelectOption } from "../../../shared/ui/SelectControl";
import { SelectionPath } from "./SelectionPath";

export interface ToolbarProps {
  readonly selection: Selection;
  readonly dispatch: (action: SelectionAction) => void;
  /** Every model the selection holds, for the rung below the group. */
  readonly models?: readonly string[];
  /** Switching view is the page's to carry out, since entering detail navigates. */
  readonly onView?: (view: Selection["view"]) => void;
  /** Choosing a different model within the detail view, likewise. */
  readonly onOpenModel?: (model: string) => void;
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
const VIEW_PILLS: readonly PillOption[] = [
  { id: "table", label: "Table" },
  { id: "detail", label: "Detail" },
];

/** The single toolbar: the path, then one dropdown per choice and the view switch. */
export function Toolbar({
  selection,
  dispatch,
  models = [],
  onView,
  onOpenModel,
}: ToolbarProps): React.ReactElement {
  const filterId = useId();
  const facet = facetFor(selection.family);
  const isDetail = selection.view === "detail";
  const family = MODEL_FAMILIES.find((f) => f.id === selection.family);
  const benchmark = BENCHMARKS.find((b) => b.id === selection.benchmark);

  //: With the menu shut the toggle is the only place the choice is legible.
  const named = (value: string): string | null => (value === ALL ? null : sentenceCase(value));
  const modelState = [
    family?.label ?? "",
    showsFacet(selection.family) ? named(selection.facet) : null,
    showsText(selection.family, selection.facet) ? named(selection.text) : null,
    isDetail ? selection.model : null,
  ]
    .filter(Boolean)
    .join(" / ");
  const benchmarkState = [
    benchmark?.label ?? "",
    selection.benchmark === "parallelism"
      ? named(selection.parallelismType)
      : named(selection.genre),
    selection.benchmark === "genre" && selection.metric !== "genre"
      ? titleCase(selection.metric)
      : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div
      className={[styles.toolbar, isDetail ? styles.isDetail : ""].filter(Boolean).join(" ")}
    >
      <div className={styles.summary}>
        <SelectionPath selection={selection} />
        {/* No way back here: the Table pill in the band below is the way back,
            and a second control for the same move is one too many. */}
        {isDetail ? null : (
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

      {/* One band, one control per choice. It stays mounted on a detail page
          rather than being replaced, so the filters keep their state and the
          pane below is the only part that swaps. */}
      <div className={band.band}>
        <Dropdown label="Model" current={modelState}>
          <DropdownRow>
            <DropdownPills>
              <PillGroup
                label="Models"
                options={FAMILY_PILLS}
                value={selection.family}
                onSelect={(id) => {
                  dispatch({ type: "family/selected", family: id as Selection["family"] });
                }}
              />
            </DropdownPills>
          </DropdownRow>
          {showsFacet(selection.family) && facet ? (
            <DropdownRow label={facet.label}>
              <select
                aria-label={facet.label}
                value={selection.facet}
                onChange={(event) => {
                  dispatch({ type: "facet/selected", facet: event.target.value });
                }}
              >
                {[ALL_OPTION, ...asOptions(facet.values, sentenceCase)].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </DropdownRow>
          ) : null}
          {showsText(selection.family, selection.facet) ? (
            <DropdownRow label="Text">
              <select
                aria-label="Text"
                value={selection.text}
                onChange={(event) => {
                  dispatch({
                    type: "text/selected",
                    text: event.target.value as Selection["text"],
                  });
                }}
              >
                {[ALL_OPTION, ...asOptions(TEXT_VARIANTS, sentenceCase)].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </DropdownRow>
          ) : null}
          {/* The rung below the group. The table shows every model at once, so
              only a detail page - which shows exactly one - has to ask which. */}
          {isDetail && models.length > 0 && selection.model !== null ? (
            <DropdownRow label="Model">
              <select
                aria-label="Model"
                value={selection.model}
                onChange={(event) => {
                  if (onOpenModel !== undefined) onOpenModel(event.target.value);
                  else dispatch({ type: "model/selected", model: event.target.value });
                }}
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </DropdownRow>
          ) : null}
        </Dropdown>

        <Dropdown label="Benchmark" current={benchmarkState}>
          <DropdownRow>
            <DropdownPills>
              <PillGroup
                label="Benchmarks"
                options={BENCHMARK_PILLS}
                value={selection.benchmark}
                onSelect={(id) => {
                  dispatch({
                    type: "benchmark/selected",
                    benchmark: id as Selection["benchmark"],
                  });
                }}
              />
            </DropdownPills>
          </DropdownRow>
          {selection.benchmark === "parallelism" ? (
            <DropdownRow label="Type">
              <select
                aria-label="Type"
                value={selection.parallelismType}
                onChange={(event) => {
                  dispatch({
                    type: "parallelismType/selected",
                    parallelismType: event.target.value as Selection["parallelismType"],
                  });
                }}
              >
                {[ALL_OPTION, ...asOptions(PARALLELISM_TYPES, (v) => v)].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </DropdownRow>
          ) : (
            <>
              <DropdownRow label="Genre">
                <select
                  aria-label="Genre"
                  value={selection.genre}
                  onChange={(event) => {
                    dispatch({
                      type: "genre/selected",
                      genre: event.target.value as Selection["genre"],
                    });
                  }}
                >
                  {[ALL_OPTION, ...asOptions(GENRES, (v) => v)].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </DropdownRow>
              <DropdownRow label="Metric">
                <select
                  aria-label="Metric"
                  value={selection.metric}
                  onChange={(event) => {
                    dispatch({
                      type: "metric/selected",
                      metric: event.target.value as Selection["metric"],
                    });
                  }}
                >
                  {[
                    { value: "genre", label: "Genre Discrimination" } as const,
                    ...asOptions(TRAJECTORY_METRICS, titleCase),
                  ].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </DropdownRow>
            </>
          )}
        </Dropdown>

        {/* Which of the two views the panel below is showing. A detail page is
            one model out of the group, so leaving it needs no separate way back. */}
        <div className={band.bandYield}>
          <PillGroup
            label="View"
            options={VIEW_PILLS}
            value={selection.view}
            onSelect={(id) => {
              const view = id as Selection["view"];
              if (onView !== undefined) onView(view);
              else {
                dispatch({ type: "view/selected", view });
                if (view === "table") dispatch({ type: "model/selected", model: null });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
