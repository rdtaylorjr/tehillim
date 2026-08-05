# Computational Analysis of Psalms (tehillim.dev)

This repo investigates how the Psalter's internal similarities — verbatim
duplicates, formulaic genre patterns, poetic parallelism, editorial
groupings — can be recovered computationally from the Masoretic Text, and
what each representation (lexical, morphosyntactic, embedding-based,
structural) makes visible or hides. It is built directly on the [ETCBC's](https://etcbc.nl/)
own infrastructure — the [BHSA](https://github.com/ETCBC/bhsa) database and
[Text-Fabric](https://annotation.github.io/text-fabric/) — and is designed
as a working laboratory for a specific research program: a layered sequence
of comparison methods, each motivated by a documented gap in the current
literature, each validated against known scholarly landmarks before the
next is attempted, and each expressed as running, tested code rather than
only as a proposal.

Eleven comparison methods are implemented, tested, and live in the
interactive app today (see below) — including a full sweep of BHSA's
word-level grammatical annotations plus clause/phrase-level structure and
the ETCBC/valence module's verbal-argument data, each kept only where it
measurably clears a real discriminativeness bar rather than assumed useful
(see "What's implemented and validated now"). The remaining work splits
into two independent tracks — a **genre track** (can these psalms' internal
formal patterns be clustered by genre, unsupervised, and can a shift in
genre *within* a single psalm be located computationally?) and a
**textual & structural track** (verbatim reuse, poetic parallelism,
chiastic structure) — each tied to a specific methodological question
raised by the literature reviewed here, and each described in full below.

## Research context

Work on similarity and reuse within the Psalter (and between the Psalter
and the rest of the Hebrew Bible) falls into two largely separate
literatures that this project tries to bring into the same pipeline.

### Literary and intertextual scholarship

Close-reading scholarship has long catalogued specific relationships within
and around the Psalter by hand: Psalm 18 duplicates 2 Samuel 22 almost
verbatim; Psalm 14 and Psalm 53 are variant recensions of the same
composition, differing mainly in divine-name preference; Psalm 108 is a
literal recombination of Psalm 57:8–12 and Psalm 60:7–14. Beyond verbatim
duplication, form- and intertextuality-focused scholarship reads the
Psalter as a network of internal and external echo: Phil J. Botha's
*Intertextuality and the Interpretation of Psalm 1* traces how Psalm 1's
tree-planted-by-water imagery echoes Jeremiah 17 (and further afield,
Joshua 1, Ezekiel 47, and 1 Chronicles 22), arguing that "Torah" there
already carries a Deuteronomic, temple-oriented resonance rather than a
narrow legal sense. Beth LaNeel Tanner's *The Book of Psalms Through the
Lens of Intertextuality* extends this to the Psalter as a whole, applying
Kristevan intertextuality and Lévi-Straussian *bricolage* to argue that the
Psalter's editorial arrangement is itself a meaning-making intertextual
act, not just a container for 150 independent poems. A tradition-historical
literature also traces the Psalter's relationship to other wisdom and
lament corpora — e.g. work relating Job's dialogues to psalmic lament form,
arguing (against a purely intertextual account) that shared theological
*traditions*, not direct literary dependence, better explain parallels like
Job 7:17–18 / Psalm 8:5.

This scholarship is precise about *which* relationships matter and *why*,
but it is produced one pericope at a time, by hand. It supplies exactly the
ground truth a computational method needs to be checked against — and, as
Beth LaNeel Tanner's and Phil J. Botha's work in particular makes clear, it
already assumes that similarity in the Psalter is plural: lexical,
structural, formal, and theological similarity are different things that
happen to co-occur or diverge, which is the premise this project's layered,
multi-method architecture is built to take seriously.

### Computational approaches

A distinct and currently very active NLP literature approaches the same
territory computationally, in two waves. Earlier work matched shared
strings or lemmata directly: Martijn Naaijer and Dirk Roorda's *Parallel
Texts in the Hebrew Bible, New Methods and Visualizations*
(arXiv:1603.01541) develops algorithmic detection and synoptic
visualization of parallel passages across the Hebrew Bible — work that
grew directly out of the ETCBC/Text-Fabric ecosystem this project also
builds on (Roorda is Text-Fabric's author). A 2026 paper in *Religions*,
*Detection and Typology of Psalmic Text Reuses in the New Testament*
(Religions 17(1):88, published in the context of the BiblIndex project),
takes the same lexical/lemma-based approach further: tokenization,
lemmatization, part-of-speech tagging, stop-word filtering and
WordNet-style synset assignment, combined into textometric similarity
measures, to trace how New Testament authors reused psalmic language —
demonstrating that literal quotations and a substantial range of looser
echoes are both recoverable without any neural model.

The current wave is transformer-based. David M. Smiley's *Intertextual
Parallel Detection in Biblical Hebrew: A Transformer-Based Benchmark*
(arXiv:2506.24117) and its companion paper, *MiqraBERT: Regression-Based
Sentence-BERT Finetuning for Biblical Hebrew Parallel Detection*
(arXiv:2606.19638), fine-tune AlephBERT via cosine-similarity regression on
1,650 labeled Hebrew Bible verse pairs (825 true parallels, 825 negatives)
to move past lexical overlap toward genuinely semantic, paraphrase-tolerant
matching. MiqraBERT reports a real, substantial gain over the pretrained
baseline — a 2.7-fold improvement in distributional separation between
parallel and non-parallel pairs, shrinking the ambiguous overlap region
from roughly 24% to about 6% — but with a striking genre asymmetry: recall@10
on narrative synoptic parallels (e.g. Samuel–Kings/Chronicles) reaches
87.1%, while recall@10 on *poetic* parallelism falls below 9%. The authors
attribute this directly to mean-pooling a whole verse into one vector,
which erases the token-level signal poetic parallelism depends on. A
companion strand of this work, *Computational Discovery of Chiasmus in
Ancient Religious Text* (arXiv:2501.10739), uses sentence embeddings and
cosine-similarity matrices — deliberately avoiding LLMs, for
contamination and interpretability reasons — to detect chiastic (mirror-
image) structure at verse and half-verse granularity, reporting
precision@k around 0.80 at verse level and 0.60 at half-verse level.
Finally, on the textual-criticism side, David J. Sigrist's Trinity Western
University thesis, *Tracking Changes: A Proposal for a Linguistically
Sensitive Schema for Categorizing Textual Variation of Hebrew Bible Texts
in Light of Variant Scribal Practices Among the Judaean Desert Psalms
Witnesses*, uses computational-linguistic categorization of scribal
variation across three Psalms case studies to test whether variant
practices among the Qumran Psalms manuscripts follow a linguistically
principled schema, rather than being ad hoc.

### The gap this project targets

Read together, these two literatures agree on a trend and disagree on
where to go next. Lexical/lemma methods (Naaijer & Roorda's algorithmic
approach; the Religions 2026 textometric method) are precise and fully
interpretable but blind to paraphrase — they cannot see a parallel that
shares no words. Transformer embeddings fix that for narrative synoptic
material but currently *fail specifically on Hebrew poetry* — the genre
the Psalter is written in — because the standard architecture (mean-pool a
verse, cosine-compare the result) is a poor fit for parallelism, which
routinely pairs non-synonymous, non-cognate words across cola ("heaven" /
"earth", "day" / "night") in ways no single pooled vector preserves. Both
literatures also note, without acting on it, that pretrained embedding
spaces are anisotropic (geometrically compressed in ways that distort raw
cosine similarity) — a problem the papers reviewed above only ever address
by fine-tuning, never by directly correcting the embedding geometry itself.

That gap — poetic-genre failure driven by pooling granularity, and
anisotropy left uncorrected — is what the textual & structural track below
is built to close. It is a distinct question from the genre track: none of
the literature surveyed above attempts unsupervised genre discovery, let
alone locating a genre shift *within* a single psalm (the well-attested
lament-to-praise turn in psalms like 13 and 22). Phase 1 (implemented) is
the genre track's first result — a direct, independent test of whether a
*non*-lexical, non-embedding signal (verb morphology) can do real
form-critical work.

## Method roadmap

Every method reuses the same evaluation discipline: implement it, then
check it against the scholarly ground truth in `pipeline/ground_truth.py`
(twin psalms, the Elohistic Psalter boundary, the Songs of Ascent, the
Egyptian and Final Hallel, refrain psalms, acrostics, Wilson's five-book
editorial frames, and a deliberately hedged set of Gunkel's form-critical
genre exemplars) *before* moving on — the same discipline Smiley's and
Naaijer & Roorda's papers use when they validate against known
Samuel–Kings/Chronicles parallels.

Several of the later methods draw on techniques from two Georgia Tech
OMSA courses — ISYE 6740 *Computational Data Analysis* (clustering,
dimensionality reduction, density estimation, regularized/ensemble
classifiers) and ISYE 6525/8803 *Topics on High-Dimensional Data
Analytics* (functional data analysis, robust PCA, tensor decomposition,
sparse/structured regularization) — chosen because they fill specific,
identifiable gaps in the literature above, not as a matter of course. In
particular: nothing in the literature surveyed attempts *unsupervised*
genre discovery (every paper does supervised or algorithmic pairwise
parallel detection), and nothing attempts to locate a genre shift *within*
a single psalm at all.

### Genre track

Can the Psalter's genres (Gunkel's hymn, individual lament, communal
lament, thanksgiving, royal, wisdom) be recovered by unsupervised
clustering rather than assumed from hand-labeled exemplars — and can a
shift between genres *within* one psalm (the well-documented lament-to-
praise turn in psalms like 13 and 22) be located computationally?

| Method | Status | Fills |
|---|---|---|
| **Verb-morphology genre fingerprint** — TF-IDF cosine over verb stem/mood tag profiles | **Implemented, validated** | Gunkel operationalized directly from BHSA's own morphology, tested independently of vocabulary |
| **Grammatical-person profile** — TF-IDF cosine over word-level and pronominal-suffix person/number tag profiles | **Implemented, validated** | A second, independent form-critical marker (individual vs. communal address) — separates even more cleanly than verb morphology |
| **Clause type and text type (`typ`, `txt`)** — TF-IDF cosine over clause-atom-type and narrative/discursive/quotation tag profiles | **Implemented, validated** | Completes what the verb-morphology method's own original motivation named (clause type, 40 constituent-order/verb-form patterns) and adds text type as a classical discourse-register marker — clause-type turned out to be the single most discriminative method of any tried (66.7% of psalm pairs score below 0.5) |
| **Clause relation and verb sense** — TF-IDF cosine over clause-relation tags (`rela`) and ETCBC/valence verb argument-realization codes | **Implemented, validated** | Two further independent syntactic/semantic signals (sparse but real: 22.5% and 12.6% word coverage respectively) that survived the same discriminativeness screening six other clause/phrase-level candidates failed |
| **Unsupervised genre clustering** — spectral clustering and Gaussian-mixture soft clustering over the signals above, plus density estimation to check whether the data actually supports Gunkel's ~6 categories, and Random Forest proximity as an independent cross-check | **Next** | The literature gap named above, directly — now backed by six independently-validated, non-redundant signals (verb morphology, person, clause type, text type, clause relation, verb sense) instead of two |
| Sub-psalm segmentation via BHSA's half-verse (`label`) division | Planned (infrastructure) | Already-annotated in BHSA — no need to derive Masoretic colometry from scratch to get sub-verse units |
| **Intra-psalm genre trajectory and shift detection** — smoothing splines → functional PCA to find trajectory shapes across the corpus; robust PCA (smooth low-rank "steady genre" + sparse "shift") and derivative-based edge detection to locate the shift point itself | Planned | The specific, most novel deliverable: mapping *where* a psalm moves from one genre to another |
| Tensor decomposition (CP/Tucker/HOSVD) combining verb-morphology, clause-type, person, and text-type jointly rather than one signal at a time, feeding richer factors back into the clustering step | Planned | A principled way to combine independently-validated signals, rather than an ad hoc weighted average |
| Multi-relational graph fusion with spectral/Louvain–Leiden community detection, over sub-psalm nodes | Planned (capstone) | Unifies clustering and shift detection into one computation: which community a psalm's own ordered nodes fall into, and where that community changes, *is* the shift map |

### Textual & structural track

A separate, independently-motivated line of work on verbatim reuse and
poetic structure — the direct continuation of phase 0 and of the
literature review above.

| Method | Status | Fills |
|---|---|---|
| **Lexical similarity** — TF-IDF weighted cosine similarity over content-word lexemes | **Implemented, validated** | Standard IR baseline; the most legible sanity check in the whole project (Psalm 14/53, Psalm 108/57/60) |
| **Root similarity and named-entity identity** — TF-IDF cosine over triliteral roots, and over proper-noun lexemes only | **Implemented, validated** | Root similarity credits shared thematic vocabulary across derivationally related words that plain lexeme-matching misses; named-entity identity isolates *which* names two psalms share (e.g. both naming Zion) — a sharper, more discriminative version of the type-only onomastic signal below |
| Classical distance ensemble — character n-gram edit distance + root-level Dice/Jaccard, combined via logistic regression | Planned | A stronger, still fully interpretable classical baseline for near-verbatim reuse, in the same territory as Naaijer & Roorda and the *Religions* 2026 paper |
| Transformer embeddings (E5, AlephBERT, MiqraBERT) at psalm *and* half-verse level | Planned | A direct, testable extension of MiqraBERT's own diagnosed weakness — does finer-grained pooling close its poetic-recall gap? |
| Anisotropy correction (whitening / top-PC removal / kernel PCA) before cosine comparison | Planned | Both transformer papers diagnose this geometric flaw but only ever address it via fine-tuning |
| Optimal transport (Word-Mover's-Distance-style) between token embedding sets, replacing mean-pooling | Planned | The highest-leverage fix for the pooling-erasure failure — both papers already use Wasserstein distance for *evaluation* but never as the similarity metric itself |
| Alignment kernels (Smith–Waterman / Needleman–Wunsch) at half-verse level, for chiasmus and refrain detection | Planned | A direct benchmark against the chiasmus paper's embedding-only approach |
| Frequent-itemset mining over root-pairs, building a data-driven fixed-word-pair lexicon | Planned | Computationally operationalizes a tradition Hebrew poetics scholarship has catalogued by hand for decades; addresses the "black box" critique the NLP papers raise about themselves |

### Cross-cutting

- **Group LASSO / Elastic Net** (HDDA) — explainability: which *family* of features (not just which single tag) actually drives a proposed cluster or shift.
- **Matrix completion / compressive sensing** (HDDA) — recovering full similarity structure from a reliable subset of sub-psalm comparisons, rather than computing every sparse, noisy short-unit pair directly.
- **Shrinkage / regularized covariance estimation** — the same small-*n*, high-dimensional problem MiqraBERT's 1,650-pair training set faces, relevant anywhere a model gets fit against `ground_truth.py`'s necessarily small labeled sets.
- **Continuous validation against scholarly ground truth** — ongoing since phase 0, the same discipline the cited papers use when validating against Samuel–Kings/Chronicles.

## What's implemented and validated now

Eleven methods ship in the live app today, organized into three families —
**lexical** (which specific words a pair of psalms share), **syntactic**
(how words are used, independent of vocabulary), and **clause structure**
(higher-level syntactic and discourse patterning, including one signal
from the ETCBC/valence companion module rather than core BHSA). Every
method here earned its place by clearing a real, measured
discriminativeness bar against the actual similarity-score distribution it
produces across all 150 psalms — not by assumption. Six further candidates
were built, tested, and deliberately *not* shipped because they measured
near-degenerate; that negative result is documented below too.

**Lexical similarity** (phase 0). TF-IDF weighted cosine similarity over
BHSA content-word lexemes (nouns, verbs, adjectives, adverbs, proper
nouns, interjections; closed-class grammatical words excluded).
Integration-tested against the textual-duplicate ground truth above: Psalm
14 ranks Psalm 53 as its single closest match (score 0.811, the highest
pairwise lexical similarity anywhere in the Psalter), and Psalm 108 shows
strong, correctly-attributed similarity to both of its literal sources,
Psalm 57 and Psalm 60.

**Root similarity and named-entity identity.** Two coarser/narrower
cousins of lexical similarity, both keyed on `lexeme` variants rather than
grammatical tags. Root similarity collapses derivationally related words
(a verb and its cognate noun) that lexical similarity keeps distinct.
Named-entity identity restricts the same TF-IDF-cosine machinery to
proper nouns only, isolating which specific names (Zion, Jacob, David, …)
two psalms share — it turned out to be the most discriminative of the
newer lexical-family methods (60% of pairs score below 0.5), because the
signal was already present but diluted across ~2,100 other terms inside
plain lexical similarity.

**Verb-morphology similarity** (phase 1). TF-IDF cosine similarity over
verb stem (binyan) and mood/conjugation tag frequency profiles, extracted
directly from BHSA's `vs`/`vt` features — a computational operationalization
of Gunkel's form-critical claim that genres like the hymn are constituted
by recurring grammatical patterns (imperative-heavy calls to praise) rather
than shared vocabulary. This is deliberately *not* a parallel-passage
detector: two psalms can score highly here while sharing no words at all.
Validated empirically, not just asserted — and validated honestly: the
broad, hand-picked "hymn" exemplar set does *not* cohere as a whole (mean
internal similarity 0.40, actually below the 0.52 corpus-wide baseline),
because it lumps together formally different hymn subtypes (a quiet
creation hymn, a mixed hymn/wisdom composition, and pure imperative
calls-to-praise). The narrower, textually homogeneous case the hypothesis
was really about holds cleanly: Psalm 150, an almost pure sequence of Piel
imperatives ("Praise! Praise! Praise!"), is dramatically closer to its
Final Hallel siblings (Psalm 149: 0.43; Psalm 146: 0.41) than to a stark
individual lament (Psalm 88: 0.003) or a quiet creation hymn (Psalm 8:
0.008) — and, in the live app, Psalm 150's single closest match under this
method is Psalm 117 (0.980), the Psalter's other short, pure
"Hallelujah — praise the LORD, all nations" hymn. A direct check confirms
this is a genuinely independent signal rather than lexical similarity in
disguise: Pearson correlation between the two methods' full similarity
matrices is 0.19.

**Grammatical-person profile.** TF-IDF cosine similarity over word-level
and pronominal-suffix person/number tag profiles ("I" vs. "we" vs. "you"
vs. "he/she/it"), extracted from BHSA's `ps`/`nu`/`prs_ps`/`prs_nu`
features — a second, independent form-critical marker distinguishing
individual from communal address. This separates even more cleanly than
verb morphology: individual laments (Psalms 3, 22, 38, 51, 88) average
0.87 similarity with each other, communal laments (44, 74, 79, 80, 137)
average 0.73, and the two groups average only 0.41 with *each other* —
below the 0.51 corpus-wide baseline, meaning an individual and a communal
lament are measurably *less* alike on this dimension than two random
psalms. Psalm 22 ("My God, my God, why have you forsaken me") scores
above 0.92 with fellow individual laments Psalm 38 and Psalm 88, and below
0.45 with communal laments Psalm 44 and Psalm 137. Confirmed independent
of both other methods: correlation with lexical similarity and with
verb-morphology similarity are each below 0.5.

**Lexical-set and named-entity-type profiles.** Two further syntactic
signals: lexical set is BHSA's finer subclassification of part-of-speech
(numerals, focus particles, prepositional/adverbial/copular uses of
otherwise-nominal or verbal words); named-entity type is an onomastic
*register* (person- vs. place- vs. deity-name-dense), the coarser sibling
of the identity-based method above.

**Clause type, text type, clause relation, and verb sense.** Four
clause/phrase-structure signals, added in the most recent extraction pass
and screened against the same discriminativeness bar as everything else.
Clause type (`typ`, 40 constituent-order/verb-form patterns like
wayyiqtol-null vs. nominal clause) turned out to be the single most
discriminative method of any tried — 66.7% of psalm pairs score below 0.5,
ahead of even lexical similarity's own spread. Text type (`txt`,
narrative/discursive/quotation with embedding) is BHSA's closest analogue
to a discourse-register feature — there is no separate "discourse" object
type in the corpus; `sentence`, `sentence_atom`, and `half_verse` carry no
independent content tags at all, checked directly against every feature in
the dataset. Clause relation (`rela`) and verb sense (from the
ETCBC/valence module — Janet Dyk's verbal-valence research at VU/ETCBC,
part of the SYNVAR project, giving whether a verb occurrence takes a
direct object, a prepositional complement, or neither) both survived as
sparse-but-real signals (22.5% and 12.6% word coverage respectively).

**Nine methods built and deliberately not shipped.** Grammatical gender,
nominal state, phrase-dependent part-of-speech, clause kind, phrase
function, phrase determination, phrase type, verbal valence, and
grammatical role were all extracted, tested, and measured — and all
turned out structurally near-degenerate under TF-IDF-cosine (0–4.9% of
pairs score below 0.5, versus 15%+ for every shipped method). The pattern
that emerged, and now documents itself in `pipeline/methods.py`:
TF-IDF-cosine over a tag-frequency profile is only discriminative when a
tag is either high-cardinality or genuinely *sparse* (fires on a minority
of words) — dense features, even with good category balance (phrase
function has 27 well-balanced codes and still only clears 2.8%), produce
nearly identical profile shapes across the whole Psalter, since every
psalm needs verbs, nouns, determined phrases, and core arguments
regardless of genre. Their integration tests document the finding
directly rather than pretending it's a usable comparison method — a
negative result treated with the same rigor as a positive one.

All eleven shipped methods, and the interactive heatmap / network-graph /
ranked-match visualization built on top of them, are live in the app —
see `app/README.md`. 372 pipeline tests and 60 frontend tests currently
pass; `pipeline/ground_truth.py` and its integration tests are the
executable form of the "validate every phase against known scholarship"
discipline above.

## Built on ETCBC's own tools

This project is not a from-scratch reimplementation: extraction runs
directly on Text-Fabric against the BHSA database, using the same
form-to-function methodology the ETCBC's own database is built on
(register the surface-level annotation first — `sp`, `vs`, `vt`, `lex` —
then derive functional/interpretive labels on top of it, rather than
baking interpretation into extraction). It also draws on the companion
[ETCBC/valence](https://github.com/ETCBC/valence) module (Janet Dyk,
VU/ETCBC), loaded alongside BHSA via Text-Fabric's multi-location support
since it shares the same node numbering — verbal-argument annotation BHSA
itself doesn't carry. The `pipeline/corpus.py` module retains each word's
Text-Fabric node id specifically so later phases (disjunctive accents for
the segmentation phase below) can re-query the corpus directly rather than
re-deriving structure from scratch.

## Application architecture

Every method in the *textual & structural* track (and phase 1's family in
the *genre* track) produces the same shape of result — an N×N similarity
matrix plus a ranked-neighbors list per psalm — which is exactly what the
current app's method selector, heatmap, and network graph already handle
generically; each new method of that kind drops in without changing any
existing code, as it now has ten times over. Unsupervised clustering and
intra-psalm shift detection produce a genuinely different shape (a
partition of the whole corpus; a sequence within one psalm) that doesn't
fit that UI at all, so once the clustering phase lands the app splits into
two pages — a **Compare** page (today's app, extended with more pairwise
methods over time) and a **Genre** page (cluster view, and eventually the
per-psalm trajectory chart) — sharing the same psalm picker and detail
components rather than duplicating them.

On the pipeline side, the same pattern extends the same way: a `Protocol`
(`SimilarityMethod` today; a `ClusteringMethod` once phase 2 needs one) and
a generic result type, composed in `methods.py` without either the
extractor or the metric knowing about the other. New capability is added
by introducing a new Protocol exactly when its first concrete method needs
it - not before.

## Repository structure

- **`pipeline/`** — the Python package described above (`corpus.py` →
  per-feature extractor modules → `similarity.py` → `methods.py` →
  `export.py`), plus `ground_truth.py` and its integration tests. See
  `pipeline/README.md`.
- **`app/`** — "Compare the Psalms", an interactive Vite + TypeScript + D3
  visualization: a similarity heatmap, a force-directed similarity network,
  a method selector, and a ranked most-similar-psalms panel. This *is* the
  site: `npm run build` writes straight to the repo root (`index.html`,
  `assets/`, `data/`), so `tehillim.dev` serves the comparison tool
  directly rather than a marketing page linking out to it. See
  `app/README.md`.
- **`about/`** — the earlier static marketing page (unchanged content),
  kept but no longer the site root; reachable at `/about/`.
- Root-level `index.html`, `assets/`, and `data/` are gitignored build
  output of `app/`, not committed source.

## Quickstart

```bash
# 1. Generate the similarity data (requires local ETCBC/bhsa and
#    ETCBC/valence clones)
cd pipeline && python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]" && python -m tehillim_pipeline.cli

# 2a. Iterate on the app with hot reload
cd ../app && npm install && npm run dev

# 2b. ...or build the real site (writes straight to the repo root)
cd ../app && npm install && npm run build
```

## Deployment

`npm run build` in `app/` writes the site directly to the repo root
(`index.html`, `assets/`, `data/`) alongside the untouched `about/`
folder; deploy that root as one static site. A `wrangler.jsonc` at the
repo root configures Cloudflare Workers static-asset deployment
(`assets.directory: "."`, `npx wrangler deploy`); Cloudflare Pages,
GitHub Pages, or Netlify work the same way pointed at the repo root.

## References

- Botha, Philippus J. "Intertextuality and the Interpretation of Psalm 1." *Old Testament Essays* 18 (2005): 503–520. <https://www.researchgate.net/publication/228724588_Intertextuality_and_the_Interpretation_of_Psalm_1>
- Tanner, Beth LaNeel. *The Book of Psalms Through the Lens of Intertextuality.* Studies in Biblical Literature 26. New York: Peter Lang, 2001. Review: <https://spirin.org/The_Book_of_Psalms_Through_the_Lens_of_Intertextuality_Review>
- "Parallels between the Book of Job and the Psalms: A Tradition-Historical Rather Than Intertextual Approach." <https://www.academia.edu/37795524/Parallels_between_the_Book_of_Job_and_the_Psalms_A_tradition_historical_rather_than_intertextual_approach>
- Naaijer, Martijn, and Dirk Roorda. "Parallel Texts in the Hebrew Bible, New Methods and Visualizations." arXiv:1603.01541. <https://arxiv.org/pdf/1603.01541>
- "Detection and Typology of Psalmic Text Reuses in the New Testament." *Religions* 17, no. 1 (2026): 88. Special Issue: Computational Approaches to Ancient Jewish and Christian Texts. <https://www.mdpi.com/2077-1444/17/1/88>
- Smiley, David M. "Intertextual Parallel Detection in Biblical Hebrew: A Transformer-Based Benchmark." arXiv:2506.24117. <https://arxiv.org/pdf/2506.24117>
- Smiley, David M. "MiqraBERT: Regression-Based Sentence-BERT Finetuning for Biblical Hebrew Parallel Detection." arXiv:2606.19638. <https://arxiv.org/pdf/2606.19638>
- McGovern, Hope, Hale Sirin, and Tom Lippincott. "Computational Discovery of Chiasmus in Ancient Religious Text." Proceedings of NAACL 2025 (short papers). arXiv:2501.10739. <https://arxiv.org/html/2501.10739v1>
- Sigrist, David J. "Tracking Changes: A Proposal for a Linguistically Sensitive Schema for Categorizing Textual Variation of Hebrew Bible Texts in Light of Variant Scribal Practices Among the Judaean Desert Psalms Witnesses." Trinity Western University. <https://www.academia.edu/6126323/Tracking_Changes_A_Proposal_for_a_Linguistically_Sensitive_Schema_for_Categorizing_Textual_Variation_of_Hebrew_Bible_Texts_in_Light_of_Variant_Scribal_Practices_Among_the_Judaean_Desert_Psalms_Witnesses>
