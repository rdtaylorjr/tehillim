import { describe, expect, it } from "vitest";
import {
  NO_CORRECTION,
  axisLabel,
  axisLabels,
  choiceOfMethod,
  facetOfMethod,
  methodChoiceReducer,
  methodFamilies,
  resolveMethod,
} from "./methods";
import { ALL, INITIAL_SELECTION } from "./selection";
import type { CompareMethodMeta } from "../../model/types";

function method(overrides: Partial<CompareMethodMeta>): CompareMethodMeta {
  return {
    id: "x",
    description: "",
    domain: "lexical",
    representation: "x",
    modelBase: "x",
    textVariant: null,
    aggregation: "mean-pool",
    correction: null,
    ...overrides,
  };
}

const METHODS: CompareMethodMeta[] = [
  method({
    id: "lexeme_icf-mean-pool-cosine",
    representation: "lexeme_icf",
    modelBase: "lexeme_icf",
  }),
  method({
    id: "lexeme_icf-soft-alignment-cosine",
    representation: "lexeme_icf",
    modelBase: "lexeme_icf",
    aggregation: "soft-alignment",
  }),
  method({
    id: "homograph_icf-mean-pool-cosine",
    representation: "homograph_icf",
    modelBase: "homograph_icf",
  }),
  method({
    id: "word_vocalized_icf-mean-pool-cosine",
    representation: "word_vocalized_icf",
    modelBase: "word_icf",
    textVariant: "vocalized",
  }),
  method({
    id: "word_consonantal_icf-mean-pool-cosine",
    representation: "word_consonantal_icf",
    modelBase: "word_icf",
    textVariant: "consonantal",
  }),
  method({
    id: "alephbert_consonantal-soft-alignment-cosine",
    domain: "semantic",
    representation: "alephbert_consonantal",
    modelBase: "alephbert",
    textVariant: "consonantal",
    aggregation: "soft-alignment",
  }),
  method({
    id: "alephbert_consonantal-soft-alignment-whitened-cosine",
    domain: "semantic",
    representation: "alephbert_consonantal",
    modelBase: "alephbert",
    textVariant: "consonantal",
    aggregation: "soft-alignment",
    correction: "whitened",
  }),
];

const lexical = { ...INITIAL_SELECTION, family: "lexical" as const };

describe("facetOfMethod", () => {
  it("files a representation under the type its name carries, or none where the family has no facet", () => {
    expect(facetOfMethod(METHODS[0]!)).toBe("lexeme");
    expect(facetOfMethod(METHODS[3]!)).toBe("word");
    expect(facetOfMethod(METHODS[5]!)).toBeNull();
  });
});

describe("axisLabel and axisLabels", () => {
  it("reads an axis value as words, capitalized once", () => {
    expect(axisLabel("mean-pool")).toBe("Mean Pool");
    expect(axisLabel("soft-alignment")).toBe("Soft Alignment");
    expect(axisLabel(NO_CORRECTION)).toBe("None");
  });

  it("keeps an initialism upper case where the rule would lower it", () => {
    expect(axisLabel("top-pc")).toBe("Top PC");
  });

  it("names the axes a method carries, in the order the dropdown asks them", () => {
    expect(axisLabels(METHODS[0]!)).toEqual(["Mean Pool"]);
    expect(axisLabels(METHODS[6]!)).toEqual(["Soft Alignment", "Whitened"]);
  });
});

describe("methodFamilies", () => {
  it("offers the families the methods cover, in catalog order", () => {
    expect(methodFamilies(METHODS).map((f) => f.id)).toEqual(["lexical", "semantic"]);
    expect(methodFamilies([])).toEqual([]);
  });
});

describe("resolveMethod", () => {
  const axes = { aggregation: "mean-pool", correction: NO_CORRECTION };

  it("lists every model of the family under All, in name order, under the chosen aggregation", () => {
    const resolved = resolveMethod(METHODS, { selection: lexical, axes });
    expect(resolved.aggregations).toEqual(["mean-pool", "soft-alignment"]);
    expect(resolved.models.map((m) => m.value)).toEqual([
      "homograph_icf",
      "lexeme_icf",
      "word_consonantal_icf",
      "word_vocalized_icf",
    ]);
    expect(resolved.models[0]).toEqual({ value: "homograph_icf", label: "homograph_icf" });
  });

  it("narrows the models by facet and by text, as the benchmark's rows are narrowed", () => {
    const at = (over: Partial<typeof lexical>): string[] =>
      resolveMethod(METHODS, { selection: { ...lexical, ...over }, axes }).models.map(
        (m) => m.value,
      );
    expect(at({ facet: "lexeme" })).toEqual(["lexeme_icf"]);
    expect(at({ facet: "word", text: "vocalized" })).toEqual(["word_vocalized_icf"]);
  });

  it("lands on the asked-for aggregation, correction, and model where the data has them", () => {
    const choice = {
      selection: { ...lexical, model: "lexeme_icf" },
      axes: { aggregation: "soft-alignment", correction: NO_CORRECTION },
    };
    const resolved = resolveMethod(METHODS, choice);
    expect(resolved.method?.id).toBe("lexeme_icf-soft-alignment-cosine");
    expect(resolved.models.map((m) => m.value)).toEqual(["lexeme_icf"]);
    expect(resolved.corrections).toEqual([NO_CORRECTION]);
  });

  it("settles on the first model the axes above admit when the asked-for one is out", () => {
    const choice = {
      selection: { ...lexical, facet: "homograph", model: "lexeme_icf" },
      axes,
    };
    expect(resolveMethod(METHODS, choice).method?.id).toBe("homograph_icf-mean-pool-cosine");
  });

  it("offers a correction only under an aggregation some model carries it for, none first", () => {
    const semantic = { ...INITIAL_SELECTION, family: "semantic" as const };
    const choice = {
      selection: { ...semantic, model: "alephbert_consonantal" },
      axes: { aggregation: "soft-alignment", correction: "whitened" },
    };
    const resolved = resolveMethod(METHODS, choice);
    expect(resolved.method?.id).toBe("alephbert_consonantal-soft-alignment-whitened-cosine");
    expect(resolved.corrections).toEqual([NO_CORRECTION, "whitened"]);
  });

  it("opens on the method a choice was read from", () => {
    const resolved = resolveMethod(METHODS, choiceOfMethod(METHODS[1]!));
    expect(resolved.method?.id).toBe("lexeme_icf-soft-alignment-cosine");
    expect(resolved.corrections).toEqual([NO_CORRECTION]);
  });

  it("returns nothing for a family the payload lacks", () => {
    const choice = {
      selection: { ...INITIAL_SELECTION, family: "phonological" as const },
      axes: { aggregation: "", correction: NO_CORRECTION },
    };
    const resolved = resolveMethod(METHODS, choice);
    expect(resolved.method).toBeNull();
    expect(resolved.models).toEqual([]);
  });
});

describe("methodChoiceReducer", () => {
  it("routes toolbar actions through the selection reducer and keeps the axes", () => {
    const start = choiceOfMethod(METHODS[0]!);
    const next = methodChoiceReducer(start, { type: "facet/selected", facet: "word" });
    expect(next.selection.facet).toBe("word");
    expect(next.axes).toEqual(start.axes);
  });

  it("changes an axis without touching the selection", () => {
    const start = choiceOfMethod(METHODS[0]!);
    const next = methodChoiceReducer(start, {
      type: "aggregation/selected",
      aggregation: "soft-alignment",
    });
    expect(next.axes.aggregation).toBe("soft-alignment");
    expect(next.selection).toBe(start.selection);
  });

  it("opens the filters again on a family switch", () => {
    const start = methodChoiceReducer(choiceOfMethod(METHODS[0]!), {
      type: "facet/selected",
      facet: "lexeme",
    });
    const next = methodChoiceReducer(start, { type: "family/selected", family: "semantic" });
    expect((next.selection.facet, next.selection.text)).toBe(ALL);
    expect(next.selection.model).toBeNull();
  });
});
