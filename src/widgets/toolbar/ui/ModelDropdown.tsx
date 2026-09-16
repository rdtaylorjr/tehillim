import {
  MODEL_FAMILIES,
  TEXT_VARIANTS,
  facetFor,
  sentenceCase,
} from "../../../shared/lib/corpus";
import { ALL, showsFacet, showsText } from "../../../shared/lib/navigation";
import type { Selection, SelectionAction } from "../../../shared/lib/navigation";
import { Dropdown, DropdownPills, DropdownRow } from "../../../shared/ui/Dropdown";
import { PillGroup } from "../../../shared/ui/PillGroup";
import type { ModelFamily } from "../../../shared/lib/corpus";
import type { SelectOption } from "../../../shared/ui/SelectControl";
import { asOptions } from "../lib/options";

export interface ModelDropdownProps {
  readonly selection: Pick<Selection, "family" | "facet" | "text" | "model">;
  readonly dispatch: (action: SelectionAction) => void;
  /** The families the pills offer, every one in the catalog unless the page has fewer. */
  readonly families?: readonly ModelFamily[];
  /** Every model the filters admit, offered as the rung below them, or none to ask no model. */
  readonly models?: readonly SelectOption[];
  /** Choosing a model is the page's to carry out where it navigates, else it is dispatched. */
  readonly onOpenModel?: (model: string) => void;
  /** Rows a page adds above the model, for axes only its methods carry. */
  readonly children?: React.ReactNode;
  /** What those rows have chosen, as the toggle names it before the model. */
  readonly axes?: readonly string[];
}

const ALL_OPTION = { value: ALL, label: "All" } as const;

/** The model dropdown: family pills, then each filter the family varies along, then the model. */
export function ModelDropdown({
  selection,
  dispatch,
  families = MODEL_FAMILIES,
  models = [],
  onOpenModel,
  children,
  axes = [],
}: ModelDropdownProps): React.ReactElement {
  const family = families.find((f) => f.id === selection.family);
  const facet = facetFor(selection.family);
  const facetValues = showsFacet(selection.family) ? (facet?.values ?? []) : [];
  const texts = showsText(selection.family, selection.facet) ? TEXT_VARIANTS : [];
  const chosen = models.find((m) => m.value === selection.model)?.label ?? null;
  //: A corpus method named for its family alone would repeat the family on the toggle.
  const modelLabel = chosen === family?.label ? null : chosen;

  //: With the menu shut the toggle is the only place the choice is legible.
  const named = (value: string): string | null => (value === ALL ? null : sentenceCase(value));
  const state = [
    family?.label ?? "",
    facetValues.length > 0 ? named(selection.facet) : null,
    texts.length > 0 ? named(selection.text) : null,
    ...axes,
    modelLabel,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <Dropdown label="Model" current={state}>
      <DropdownRow>
        <DropdownPills>
          <PillGroup
            label="Models"
            options={families.map((f) => ({ id: f.id, label: f.label }))}
            value={selection.family}
            onSelect={(id) => {
              dispatch({ type: "family/selected", family: id as Selection["family"] });
            }}
          />
        </DropdownPills>
      </DropdownRow>
      {facetValues.length > 0 ? (
        <DropdownRow label={facet?.label ?? "Facet"}>
          <select
            aria-label={facet?.label ?? "Facet"}
            value={selection.facet}
            onChange={(event) => {
              dispatch({ type: "facet/selected", facet: event.target.value });
            }}
          >
            {[ALL_OPTION, ...asOptions(facetValues, sentenceCase)].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DropdownRow>
      ) : null}
      {texts.length > 0 ? (
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
            {[ALL_OPTION, ...asOptions(texts, sentenceCase)].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DropdownRow>
      ) : null}
      {children}
      {models.length > 0 && selection.model !== null ? (
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
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </DropdownRow>
      ) : null}
    </Dropdown>
  );
}
