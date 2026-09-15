import type {
  ClusteringPayload,
  CompareIndex,
  CompareMethodData,
  GunkelPayload,
  MethodPayload,
  PsalmCore,
} from "../shared/model";

/** Three psalms, enough for every relationship the UI draws. */
export const PSALMS: PsalmCore[] = [
  { number: 1, verseCount: 6, wordCount: 90, incipit: "אַשְׁרֵי־הָאִישׁ" },
  { number: 2, verseCount: 12, wordCount: 100, incipit: "לָמָּה רָגְשׁוּ גוֹיִם" },
  { number: 3, verseCount: 9, wordCount: 80, incipit: "יְהוָה מָה־רַבּוּ" },
];

/** All 150, since the loader validates that count. */
export const GUNKEL: GunkelPayload = {
  generatedAt: "2026-01-01T00:00:00Z",
  genres: ["Hymn", "Individual Lament"],
  families: ["Hymn", "Lament"],
  psalms: Array.from({ length: 150 }, (_, i) => {
    const number = i + 1;
    if (number === 1) return { number, genre: "Hymn", family: "Hymn" };
    if (number === 2) return { number, genre: "Individual Lament", family: "Lament" };
    return { number, genre: null, family: null };
  }),
};

/** One method's matrix file, the shape the compare page fetches on selection. */
export const COMPARE_METHOD: CompareMethodData = {
  id: "lexeme_icf-mean-pool-cosine",
  psalmNumbers: [1, 2, 3],
  similar: {
    "1": [
      { psalm: 2, score: 0.42 },
      { psalm: 3, score: 0.21 },
    ],
    "2": [{ psalm: 1, score: 0.42 }],
    "3": [{ psalm: 1, score: 0.21 }],
  },
  matrix: [
    [1, 0.42, 0.21],
    [0.42, 1, 0.1],
    [0.21, 0.1, 1],
  ],
};

export const COMPARE_INDEX: CompareIndex = {
  generatedAt: "2026-01-01T00:00:00Z",
  corpus: { name: "ETCBC/BHSA", version: "2021" },
  psalms: PSALMS,
  methods: [
    {
      id: "lexeme_icf-mean-pool-cosine",
      description: "Cosine similarity between mean-pooled half-verse lexeme profiles.",
      domain: "lexical",
      representation: "lexeme_icf",
      modelBase: "lexeme_icf",
      textVariant: null,
      aggregation: "mean-pool",
      correction: null,
    },
    {
      id: "gemini_embedding_2_cantillation-mean-pool-cosine",
      description: "Cosine similarity between mean-pooled half-verse embeddings. Gemini.",
      domain: "semantic",
      representation: "gemini_embedding_2_cantillation",
      modelBase: "gemini_embedding_2",
      textVariant: "cantillation",
      aggregation: "mean-pool",
      correction: null,
    },
  ],
  defaultMethod: "lexeme_icf-mean-pool-cosine",
};

/** The default method's identity and matrix together, as the views receive it. */
export const SIMILARITY_METHOD: MethodPayload = {
  ...COMPARE_METHOD,
  description: "Cosine similarity between mean-pooled half-verse lexeme profiles.",
};

/** Serves every fixture method's matrix from memory. */
export const loadFixtureMethod = (
  id: string,
): Promise<{ status: "loaded"; data: CompareMethodData }> =>
  Promise.resolve({ status: "loaded" as const, data: { ...COMPARE_METHOD, id } });

/** Mirrors the shipped schema, which predates `kStability` and `structureCaptured`. */
export const CLUSTERING: ClusteringPayload = {
  generatedAt: "2026-01-01T00:00:00Z",
  corpus: { name: "ETCBC/BHSA", version: "2021" },
  psalms: PSALMS,
  clusterMethods: [
    {
      id: "verb-morphology-spectral",
      description: "Spectral clustering over verb-morphology similarity.",
      nClusters: 2,
      assignments: { "1": 0, "2": 1, "3": 0 },
      clusters: [
        { index: 0, size: 2, psalmNumbers: [1, 3] },
        { index: 1, size: 1, psalmNumbers: [2] },
      ],
      embedding: { x: [0, 1, 0.2], y: [0, 1, 0.1] },
      genreAlignment: {
        genres: ["Hymn", "Individual Lament"],
        counts: [
          [1, 0],
          [0, 1],
        ],
        genreTotals: [1, 1],
        clusterGenreLabels: ["Hymn", "Individual Lament"],
        purity: 1,
        ami: 0.5,
        ari: 0.4,
        amiPValue: 0.01,
        amiPValueAdjusted: 0.02,
      },
      familyAlignment: {
        genres: ["Hymn", "Lament"],
        counts: [
          [1, 0],
          [0, 1],
        ],
        genreTotals: [1, 1],
        clusterGenreLabels: ["Hymn", "Lament"],
        purity: 1,
        ami: 0.5,
        ari: 0.4,
        amiPValue: 0.01,
        amiPValueAdjusted: 0.02,
      },
    },
  ],
  defaultClusterMethod: "verb-morphology-spectral",
};
