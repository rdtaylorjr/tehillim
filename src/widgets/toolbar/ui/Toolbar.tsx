import { useId } from "react";
import styles from "./Toolbar.module.css";
import field from "../../../shared/ui/Field.module.css";
import band from "../../../shared/ui/controlBand.module.css";
import {
  BENCHMARKS,
  PARALLELISM_TYPES,
  SOURCES,
  sentenceCase,
  sourceFor,
  unitLabel,
} from "../../../shared/lib/corpus";
import type { SourceId } from "../../../shared/lib/corpus";
import { ALL, headCrumbs, resolveRegister } from "../../../shared/lib/navigation";
import type { Selection, SelectionAction } from "../../../shared/lib/navigation";
import type { GenreRegister } from "../../../shared/lib/results";
import { Dropdown, DropdownPills, DropdownRow } from "../../../shared/ui/Dropdown";
import { PillGroup } from "../../../shared/ui/PillGroup";
import type { PillOption } from "../../../shared/ui/PillGroup";
import { VizHead } from "../../../shared/ui/VizHead";
import { ModelDropdown } from "./ModelDropdown";
import { asOptions } from "../lib/options";

export interface ToolbarProps {
  readonly selection: Selection;
  readonly dispatch: (action: SelectionAction) => void;
  /** Every model the selection holds, for the rung below the group. */
  readonly models?: readonly string[];
  /** Every source and unit register the family's results hold, with the classes each assigns. */
  readonly registers?: readonly GenreRegister[];
  /** Switching view is the page's to carry out, since entering detail navigates. */
  readonly onView?: (view: Selection["view"]) => void;
  /** Choosing a different model within the detail view, likewise. */
  readonly onOpenModel?: (model: string) => void;
}

const ALL_OPTION = { value: ALL, label: "All" } as const;

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
  registers = [],
  onView,
  onOpenModel,
}: ToolbarProps): React.ReactElement {
  const filterId = useId();
  const isDetail = selection.view === "detail";
  const benchmark = BENCHMARKS.find((b) => b.id === selection.benchmark);
  const source = sourceFor(selection.source);
  //: The register in view: the source's units to offer, and the classes it assigns.
  const register = resolveRegister(registers, selection);
  const units = registers.filter((r) => r.taxonomy === selection.source).map((r) => r.unit);
  const showsUnit = units.some((unit) => unit !== null);

  //: With the menu shut the toggle is the only place the choice is legible.
  const named = (value: string): string | null => (value === ALL ? null : sentenceCase(value));
  const benchmarkState = [
    benchmark?.label ?? "",
    selection.benchmark === "parallelism" ? named(selection.parallelismType) : source.label,
    selection.benchmark === "genre" && register?.unit ? unitLabel(register.unit) : null,
    selection.benchmark === "genre" && selection.genre !== ALL ? selection.genre : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className={styles.toolbar}>
      <VizHead subject="Benchmark" crumbs={headCrumbs(selection)}>
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
      </VizHead>

      {/* One band, one control per choice. It stays mounted on a detail page
          rather than being replaced, so the filters keep their state and the
          pane below is the only part that swaps. */}
      <div className={band.band}>
        <ModelDropdown
          selection={selection}
          dispatch={dispatch}
          //: The table shows every model at once, so only a detail page has to ask which.
          models={isDetail ? asOptions(models, (model) => model) : []}
          {...(onOpenModel === undefined ? {} : { onOpenModel })}
        />

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
              <DropdownRow label="Source">
                <select
                  aria-label="Source"
                  value={selection.source}
                  onChange={(event) => {
                    dispatch({
                      type: "source/selected",
                      source: event.target.value as SourceId,
                    });
                  }}
                >
                  {SOURCES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </DropdownRow>
              {showsUnit ? (
                <DropdownRow label="Unit">
                  <select
                    aria-label="Unit"
                    value={register?.unit ?? ""}
                    onChange={(event) => {
                      dispatch({ type: "unit/selected", unit: event.target.value });
                    }}
                  >
                    {units
                      .filter((unit): unit is string => unit !== null)
                      .map((unit) => (
                        <option key={unit} value={unit}>
                          {unitLabel(unit)}
                        </option>
                      ))}
                  </select>
                </DropdownRow>
              ) : null}
              <DropdownRow label={source.category}>
                <select
                  aria-label={source.category}
                  value={selection.genre}
                  onChange={(event) => {
                    dispatch({ type: "genre/selected", genre: event.target.value });
                  }}
                >
                  {[ALL_OPTION, ...asOptions(register?.genres ?? [], (v) => v)].map(
                    (option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ),
                  )}
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
