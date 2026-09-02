import type {
  ClusteringPayload,
  GunkelPayload,
  PsalmCore,
  SimilarityPayload,
} from "../model/types";

/** Three psalms is enough for every relationship the UI draws, and small enough
 * that a failing assertion names a specific psalm rather than an index. */
export const PSALMS: PsalmCore[] = [
  { number: 1, verseCount: 6, wordCount: 90, incipit: "אַשְׁרֵי־הָאִישׁ" },
  { number: 2, verseCount: 12, wordCount: 100, incipit: "לָמָּה רָגְשׁוּ גוֹיִם" },
  { number: 3, verseCount: 9, wordCount: 80, incipit: "יְהוָה מָה־רַבּוּ" },
];

/** All 150, because the loader validates that count - a shorter list would pass
 * every test that injects the payload and fail the one path production takes.
 * Only the first two carry a category; the rest stand in for the composite and
 * partial psalms Gunkel leaves unclassified. */
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

export const SIMILARITY: SimilarityPayload = {
  generatedAt: "2026-01-01T00:00:00Z",
  corpus: { name: "ETCBC/BHSA", version: "2021" },
  psalms: PSALMS,
  methods: [
    {
      id: "lexical-tfidf-cosine",
      description: "Lexical similarity over shared content-word lexemes.",
      psalmNumbers: [1, 2, 3],
      psalmStats: [
        {
          number: 1,
          termCount: 40,
          uniqueTermCount: 30,
          topTerms: [
            { label: "אשׁר", description: "happy", category: "lexeme", score: 0.9 },
            { label: "דרך", description: "way", category: "lexeme", score: 0.7 },
          ],
        },
        { number: 2, termCount: 50, uniqueTermCount: 35, topTerms: [] },
        { number: 3, termCount: 30, uniqueTermCount: 25, topTerms: [] },
      ],
      similar: {
        "1": [
          {
            psalm: 2,
            score: 0.42,
            sharedTerms: [
              { label: "יהוה", description: "YHWH", category: "lexeme", score: 0.5 },
            ],
          },
          { psalm: 3, score: 0.21, sharedTerms: [] },
        ],
        "2": [{ psalm: 1, score: 0.42, sharedTerms: [] }],
        "3": [{ psalm: 1, score: 0.21, sharedTerms: [] }],
      },
      matrix: [
        [1, 0.42, 0.21],
        [0.42, 1, 0.1],
        [0.21, 0.1, 1],
      ],
    },
  ],
  defaultMethod: "lexical-tfidf-cosine",
};

/** Mirrors the shipped payload's schema, which predates `kStability` and
 * `structureCaptured` - the case the UI actually meets in production. */
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
