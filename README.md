# Computational Analysis of Psalms (tehillim.dev)

This repo investigates how the Psalter's internal similarities (verbatim
duplicates, formulaic genre patterns, poetic parallelism, editorial
groupings) can be recovered computationally from the Masoretic Text, and
what each representation (lexical, morphosyntactic, embedding-based,
structural) makes visible or hides.

It is built directly on [ETCBC's](https://etcbc.nl/) infrastructure, the
[BHSA](https://github.com/ETCBC/bhsa) database and
[Text-Fabric](https://annotation.github.io/text-fabric/), and is designed
as a working laboratory for a specific research program: a layered sequence
of comparison methods, each motivated by a documented gap in the current
literature, each validated against known scholarly landmarks before the
next is attempted, and each expressed as running, tested code rather than
only as a proposal.

Eleven comparison methods are implemented, tested, and live in the
interactive app today (see below), including a full sweep of BHSA's
word-level grammatical annotations plus clause/phrase-level structure and
the ETCBC/valence module's verbal-argument data, each kept only where it
measurably clears a real discriminativeness bar rather than assumed useful
(see "What's implemented and validated now").

The remaining work splits
into two independent tracks: a **genre track** (can these psalms' internal
formal patterns be clustered by genre, unsupervised, and can a shift in
genre *within* a single psalm be located computationally?) and a
**textual & structural track** (verbatim reuse, poetic parallelism,
chiastic structure), each tied to a specific methodological question
raised by the literature reviewed here, and each described in full below.

## Research context

Work on similarity and reuse within the Psalter (and between the Psalter
and the rest of the Hebrew Bible) falls into two largely separate
literatures that this project tries to bring into the same pipeline.

### Literary and intertextual scholarship

Close-reading scholarship has long catalogued specific relationships within
and around the Psalter by hand: Psalm 18 duplicates 2 Samuel 22 almost
verbatim. Psalm 14 and Psalm 53 are variant recensions of the same
composition, differing mainly in divine-name preference. Psalm 108 is a
literal recombination of Psalm 57:8–12 and Psalm 60:7–14.

Beyond verbatim
duplication, form- and intertextuality-focused scholarship reads the
Psalter as a network of internal and external echo: Phil J. Botha's
*Intertextuality and the Interpretation of Psalm 1* traces how Psalm 1's
tree-planted-by-water imagery echoes Jeremiah 17 (and further afield,
Joshua 1, Ezekiel 47, and 1 Chronicles 22), arguing that "Torah" there
already carries a Deuteronomic, temple-oriented resonance rather than a
narrow legal sense.

Beth LaNeel Tanner's *The Book of Psalms Through the
Lens of Intertextuality* extends this to the Psalter as a whole, applying
Kristevan intertextuality and Lévi-Straussian *bricolage* to argue that the
Psalter's editorial arrangement is itself a meaning-making intertextual
act, not just a container for 150 independent poems.

A tradition-historical
literature also traces the Psalter's relationship to other wisdom and
lament corpora, e.g. work relating Job's dialogues to psalmic lament form,
arguing (against a purely intertextual account) that shared theological
*traditions*, not direct literary dependence, better explain parallels like
Job 7:17–18 / Psalm 8:5.

This scholarship is precise about *which* relationships matter and *why*,
but it is produced one pericope at a time, by hand.

It supplies exactly the
ground truth a computational method needs to be checked against. And, as
Beth LaNeel Tanner's and Phil J. Botha's work in particular makes clear, it
already assumes that similarity in the Psalter is plural: lexical,
structural, formal, and theological similarity are different things that
happen to co-occur or diverge, which is the premise this project's layered,
multi-method architecture is built to take seriously.

### Computational approaches

A distinct and currently very active NLP literature approaches the same
territory computationally, in two waves.

Earlier work matched shared
strings or lemmata directly: Martijn Naaijer and Dirk Roorda's *Parallel
Texts in the Hebrew Bible, New Methods and Visualizations*
(arXiv:1603.01541) develops algorithmic detection and synoptic
visualization of parallel passages across the Hebrew Bible, work that
grew directly out of the ETCBC/Text-Fabric ecosystem this project also
builds on (Roorda is Text-Fabric's author).

A 2026 paper in *Religions*,
*Detection and Typology of Psalmic Text Reuses in the New Testament*
(Religions 17(1):88, published in the context of the BiblIndex project),
takes the same lexical/lemma-based approach further: tokenization,
lemmatization, part-of-speech tagging, stop-word filtering and
WordNet-style synset assignment, combined into textometric similarity
measures, to trace how New Testament authors reused psalmic language,
demonstrating that literal quotations and a substantial range of looser
echoes are both recoverable without any neural model.

The current wave is transformer-based, in two stages. David M. Smiley's
*Intertextual Parallel Detection in Biblical Hebrew: A Transformer-Based
Benchmark* (arXiv:2506.24117) first benchmarks four *pretrained*
transformer models (E5, AlephBERT among them) zero-shot, with no
fine-tuning, and reports E5 and AlephBERT as the most promising while
explicitly naming fine-tuning as future work rather than something it
does itself.

The follow-up paper, *MiqraBERT: Regression-Based
Sentence-BERT Finetuning for Biblical Hebrew Parallel Detection*
(arXiv:2606.19638), is that recommended next step carried out: it
fine-tunes AlephBERT via cosine-similarity regression on 1,650 labeled
Hebrew Bible verse pairs (825 true parallels, 825 negatives) to move past
lexical overlap toward semantic, paraphrase-tolerant matching.

MiqraBERT reports a real, substantial gain over the pretrained
baseline (a 2.7-fold improvement in distributional separation between
parallel and non-parallel pairs, shrinking the ambiguous overlap region
from roughly 24% to about 6%), but with a striking genre asymmetry: recall@10
on narrative synoptic parallels (e.g. Samuel–Kings/Chronicles) reaches
87.1%, while recall@10 on *poetic* parallelism falls below 9%.

The authors
attribute this directly to mean-pooling a whole verse into one vector,
which erases the token-level signal poetic parallelism depends on.

A
separate, independently authored strand of transformer-based work,
McGovern, Sirin, and Lippincott's *Computational Discovery of Chiasmus in
Ancient Religious Text* (arXiv:2501.10739), uses sentence embeddings and
cosine-similarity matrices (deliberately avoiding LLMs, for
contamination and interpretability reasons) to detect chiastic (mirror-
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
where to go next.

Lexical/lemma methods (Naaijer & Roorda's algorithmic
approach, the Religions 2026 textometric method) are precise and fully
interpretable but blind to paraphrase: they cannot see a parallel that
shares no words.

Transformer embeddings fix that for narrative synoptic
material but currently *fail specifically on Hebrew poetry* (the genre
the Psalter is written in) because the standard architecture (mean-pool a
verse, cosine-compare the result) is a poor fit for parallelism, which
routinely pairs non-synonymous, non-cognate words across cola ("heaven" /
"earth", "day" / "night") in ways no single pooled vector preserves.

Both
literatures also note, without acting on it, that pretrained embedding
spaces are anisotropic (geometrically compressed in ways that distort raw
cosine similarity), a problem the papers reviewed above only ever address
by fine-tuning, never by directly correcting the embedding geometry itself.

That gap (poetic-genre failure driven by pooling granularity, and
anisotropy left uncorrected) is what the textual & structural track below
is built to close. It is a distinct question from the genre track: none of
the literature surveyed above attempts unsupervised genre discovery, let
alone locating a genre shift *within* a single psalm (the well-attested
lament-to-praise turn in psalms like 13 and 22). Phase 1 (implemented) is
the genre track's first result: a direct, independent test of whether a
*non*-lexical, non-embedding signal (verb morphology) can do real
form-critical work.

## Method roadmap

Every method reuses the same evaluation discipline: implement it, then
check it against the scholarly ground truth in `pipeline/ground_truth.py`
(twin psalms, the Elohistic Psalter boundary, the Songs of Ascent, the
Egyptian and Final Hallel, refrain psalms, acrostics, Wilson's five-book
editorial frames, and a deliberately hedged set of Gunkel's form-critical
genre exemplars) *before* moving on, the same discipline Smiley's and
Naaijer & Roorda's papers use when they validate against known
Samuel–Kings/Chronicles parallels.

Several of the later methods draw on techniques from two Georgia Tech
OMSA courses: ISYE 6740 *Computational Data Analysis* (clustering,
dimensionality reduction, density estimation, regularized/ensemble
classifiers) and ISYE 6525/8803 *Topics on High-Dimensional Data
Analytics* (functional data analysis, robust PCA, tensor decomposition,
sparse/structured regularization), chosen because they fill specific,
identifiable gaps in the literature above, not as a matter of course.

In
particular: nothing in the literature surveyed attempts *unsupervised*
genre discovery (every paper does supervised or algorithmic pairwise
parallel detection), and nothing attempts to locate a genre shift *within*
a single psalm at all.

### Genre track

Can the Psalter's genres (Gunkel's hymn, individual lament, communal
lament, thanksgiving, royal, wisdom) be recovered by unsupervised
clustering rather than assumed from hand-labeled exemplars, and can a
shift between genres *within* one psalm (the well-documented lament-to-
praise turn in psalms like 13 and 22) be located computationally?

Gunkel's Gattung was never form alone: he required a common form, a
common Stimmung (mood/attitude), and a common Sitz im Leben (cultic
setting), and later form-critical scholarship (Gerstenberger, Westermann,
both cited as exemplar-set authorities below) pushed harder still on the
Sitz im Leben question, since form alone underdetermines genre. Every
method in this track operationalizes only the form leg, from
grammatical-tag frequency profiles. The statistical validation section
below reports exactly how much genre structure survives on that basis
alone, not a claim to have recovered Gattung in Gunkel's full sense.

| Method | Status | Fills |
|---|---|---|
| **Verb-morphology signal**: TF-IDF cosine over verb stem/conjugation tag profiles | **Implemented** | Gunkel's form leg operationalized directly from BHSA's own morphology, tested independently of vocabulary. See "Statistical validation methodology" for how much of the genre claim survives correction |
| **Grammatical-person profile**: TF-IDF cosine over word-level and pronominal-suffix person/number tag profiles | **Implemented** | A second, independent form-critical marker (individual vs. communal address) that separates even more cleanly than verb morphology |
| **Clause type and text type (`typ`, `txt`)**: TF-IDF cosine over clause-atom-type and narrative/discursive/quotation tag profiles | **Implemented** | Completes what the verb-morphology method's own original motivation named (clause type, 40 constituent-order/verb-form patterns) and adds text type as a classical discourse-register marker. Clause-type turned out to be the single most discriminative method of any tried (66.7% of psalm pairs score below 0.5) |
| **Clause relation and verb sense**: TF-IDF cosine over clause-relation tags (`rela`) and ETCBC/valence verb argument-realization codes | **Implemented** | Two further independent syntactic/semantic signals (sparse but real: 22.5% and 12.6% word coverage respectively) that survived the same discriminativeness screening six other clause/phrase-level candidates failed |
| **Per-signal spectral clustering**: spectral clustering run independently over each of the eleven shipped similarity signals (the six syntactic/clause-structure signals above, plus the five lexical/vocabulary signals from the textual & structural track) | **Implemented** | The literature gap named above, directly, for the syntactic family: validated against Gunkel's exemplars (e.g. individual and communal laments separate cleanly under person-profile clustering). The lexical family's clusters are thematic rather than generic, surfaced side by side for comparison rather than silently omitted |
| **Data-driven cluster count**: silhouette score (and, computed but not yet wired in as an alternative selector, spectral eigengap) across a range of k, replacing a shared fixed k=6 that had been chosen by analogy to Gunkel's genre count rather than by anything about the data | **Implemented** | A principled answer to "is 6 the right number": checked against real data, it wasn't, for either validated genre-fingerprint signal. Every one of the eleven shipped clustering methods now picks its own k from its own similarity matrix (`pipeline/k_selection.py`) |
| Gaussian-mixture soft clustering and Random Forest proximity as independent cross-checks against the spectral partitions above | **Tried, not useful** | Random Forest proximity's downstream spectral clustering saturated the k-search ceiling (k=10) for 10 of the 13 eligible signals - the same failure signature this project already retired other near-degenerate methods for - and for person-profile, the one signal most visible in the UI, converged to a partition nearly identical to spectral's own (ARI 0.75), adding complexity without new information. GMM soft clustering showed the same pattern (k pinned at 8-10 for several signals), producing an uninterpretable, heavily overlapping partition on the 2D layout. Code kept on `feature/random-forest-gmm`, not merged |
| Sub-psalm segmentation via BHSA's half-verse (`label`) division | Planned (infrastructure) | Already-annotated in BHSA, no need to derive Masoretic colometry from scratch to get sub-verse units |
| **Intra-psalm genre trajectory and shift detection**: derivative-based edge detection on a single smoothed signal first, checked against the two already-known shift cases (Psalms 13, 22). Then, corpus-wide, functional PCA (with a pre-registered minimum-length threshold and an explicit absolute-vs-normalized-position choice, since fPCA's components mean different things under each and psalm length spans 2–176 verses) and robust PCA (low-rank "steady genre" + sparse "shift"), run alongside (not instead of) a single Hidden Markov Model fit jointly across all eligible psalms' half-verse sequences (Baum–Welch pools across the whole corpus. Fitting it on only the 2 known cases would starve it of data). Any corpus-wide changepoint scan needs the same Benjamini–Hochberg correction already built for the exemplar-cohesion tests (`pipeline/analysis.py`), not a per-psalm p-value taken in isolation | Planned | The specific, most novel deliverable: mapping *where* a psalm moves from one genre to another: two independently-motivated methods (continuous-trajectory FDA vs. discrete-regime HMM) cross-checked against each other, not just one pipeline taken on faith |
| Tensor decomposition (CP/Tucker/HOSVD) over a psalm × psalm × signal tensor: stacking the eleven already-computed similarity matrices, *not* a psalm × feature × signal tensor (which would first require harmonizing four incompatible tag vocabularies) | Planned | A principled way to combine independently-validated signals, rather than an ad hoc weighted average |
| Multi-relational graph fusion with spectral/Louvain–Leiden community detection, over sub-psalm nodes | Planned | Unifies clustering and shift detection into one computation: which community a psalm's own ordered nodes fall into, and where that community changes, *is* the shift map. Gated on two unresolved risks: whether half-verse-level (3–8 word) similarity carries any discriminative structure at all (checked the same way every whole-psalm signal was, % of pairs below 0.5, before reaching for denoising machinery), and how the graph weighs within-psalm adjacency against cross-psalm similarity, a free parameter that should be tuned by cross-validating against the already-validated whole-psalm partitions rather than set by hand |

### Textual & structural track

A separate, independently-motivated line of work on verbatim reuse and
poetic structure, the direct continuation of phase 0 and of the
literature review above.

| Method | Status | Fills |
|---|---|---|
| **Lexical similarity**: TF-IDF weighted cosine similarity over content-word lexemes | **Implemented** | Standard IR baseline. The most legible sanity check in the whole project (Psalm 14/53, Psalm 108/57/60) |
| **Root similarity and named-entity identity**: TF-IDF cosine over triliteral roots, and over proper-noun lexemes only | **Implemented** | Root similarity credits shared thematic vocabulary across derivationally related words that plain lexeme-matching misses. Named-entity identity isolates *which* names two psalms share (e.g. both naming Zion), a sharper, more discriminative version of the type-only onomastic signal below |
| Classical distance ensemble: character n-gram edit distance + root-level Dice/Jaccard, combined via logistic regression | Planned | A stronger, still fully interpretable classical baseline for near-verbatim reuse, in the same territory as Naaijer & Roorda and the *Religions* 2026 paper |
| **Transformer embeddings (AlephBERT, MiqraBERT) at half-verse level, mean-pool and soft-alignment aggregation compared** | **Implemented** | Tested MiqraBERT's own diagnosed pooling weakness directly. Result ran against the working hypothesis in both directions: unfinetuned AlephBERT, not MiqraBERT, is the project's strongest signal overall, and mean-pooling beat soft-alignment. All four ship, including MiqraBERT's negative (k=1) result. See "Statistical validation methodology" |
| E5 as a further embedding-model comparison point | Planned | Not yet run; would extend the same encoder-ablation logic to a non-Hebrew-specific multilingual model |
| Anisotropy correction (whitening / top-PC removal / kernel PCA) before cosine comparison | Planned | Both transformer papers diagnose this geometric flaw but only ever address it via fine-tuning |
| Optimal transport (Word-Mover's-Distance-style) between token embedding sets, replacing mean-pooling | Planned | The highest-leverage fix for the pooling-erasure failure. Both papers already use Wasserstein distance for *evaluation* but never as the similarity metric itself |
| Alignment kernels (Smith–Waterman / Needleman–Wunsch) at half-verse level, for chiasmus and refrain detection | Planned | A direct benchmark against the chiasmus paper's embedding-only approach |
| Frequent-itemset mining over root-pairs, building a data-driven fixed-word-pair lexicon | Planned | Computationally operationalizes a tradition Hebrew poetics scholarship has catalogued by hand for decades. Addresses the "black box" critique the NLP papers raise about themselves |

### Cross-cutting

- **Group LASSO / Elastic Net** (HDDA): explainability: which *family* of features (not just which single tag) actually drives a proposed cluster or shift.
- **Matrix completion** (HDDA): *not* a computational shortcut (computing every half-verse pair directly is trivial at this corpus size, ~4.5M pairs). The real use, if the discriminativeness check above passes: denoising a noisy-but-informative sub-psalm similarity matrix by assuming approximate low rank. It does not fix the different problem of a unit being too short to carry any signal at all. That's a resolution problem (half-verse vs. verse), not a missing-data problem, and no amount of completion recovers information the raw text never had.
- **Shrinkage / regularized covariance estimation**: the same small-*n*, high-dimensional problem MiqraBERT's 1,650-pair training set faces, relevant anywhere a model gets fit against `ground_truth.py`'s necessarily small labeled sets.
- **Continuous validation against scholarly ground truth**: ongoing since phase 0, the same discipline the cited papers use when validating against Samuel–Kings/Chronicles.

## What's implemented and validated now

Eleven methods ship in the live app today, organized into three families:
**lexical** (which specific words a pair of psalms share), **syntactic**
(how words are used, independent of vocabulary), and **clause structure**
(higher-level syntactic and discourse patterning, including one signal
from the ETCBC/valence companion module rather than core BHSA).

Every
method here earned its place by clearing a real, measured
discriminativeness bar against the actual similarity-score distribution it
produces across all 150 psalms, not by assumption. Six further candidates
were built, tested, and deliberately *not* shipped because they measured
near-degenerate. That negative result is documented below too.

**Lexical similarity** (phase 0). TF-IDF weighted cosine similarity over
BHSA content-word lexemes (nouns, verbs, adjectives, adverbs, proper
nouns, interjections, closed-class grammatical words excluded).

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
two psalms share. It turned out to be the most discriminative of the
newer lexical-family methods (60% of pairs score below 0.5), because the
signal was already present but diluted across ~2,100 other terms inside
plain lexical similarity.

**Verb-morphology similarity** (phase 1). TF-IDF cosine similarity over
verb stem (binyan) and conjugation tag frequency profiles (`vt`'s value
domain includes the non-finite `ptca`/`ptcp` participles, not just tensed
forms, so "mood" is a loose gloss here, not a precise one), extracted
directly from BHSA's `vs`/`vt` features: a computational operationalization
of Gunkel's form-critical claim that genres like the hymn are constituted
by recurring grammatical patterns (imperative-heavy calls to praise) rather
than shared vocabulary. This is deliberately *not* a parallel-passage
detector: two psalms can score highly here while sharing no words at all.

Validated empirically, not just asserted. And validated honestly: the
broad, hand-picked "hymn" exemplar set (11 psalms, already excluding
commonly-cited genre blends like Psalm 19, see `ground_truth.py`) does
*not* cohere as a whole (mean internal similarity 0.41, actually below
the 0.52 corpus-wide baseline), confirmed by a label-permutation test
(`pipeline/analysis.py`'s `permutation_test_cohesion`, the right tool
here since pairwise similarities aren't independent observations), which
finds this group is *not* more cohesive than a random same-size draw from
the corpus at all (p = 0.94 against 20,000 permutations).

This isn't an
exemplar-contamination artifact: even with acknowledged blends already
excluded, verb morphology still can't tell a quiet creation hymn (Psalm
8) from a pure imperative call-to-praise (the Final Hallel) as the same
formal register.

The same test applied to the other five exemplar sets,
corrected for running all six as one family (Benjamini-Hochberg,
`analysis.py`'s `benjamini_hochberg`) rather than reading each p-value in
isolation, is a negative picture: none of the six genres reach
significance under verb-morphology cohesion. Communal lament and
thanksgiving look suggestive in isolation (raw p = 0.030, 0.076) but do
not survive correction (BH-adjusted p = 0.18, 0.23). Individual lament,
royal, and wisdom were never close (raw p = 0.13, 0.20, 0.39) at this
sample size (4-11 psalms each), a materially more cautious result than even the
single-test picture already was, and the reason this section leads with
the one exemplar pair that holds up on its own narrow textual grounds
rather than as a genre-wide cohesion claim.

The narrower, textually
homogeneous case the hypothesis
was really about holds cleanly: Psalm 150, an almost pure sequence of Piel
imperatives ("Praise! Praise! Praise!"), is dramatically closer to its
Final Hallel siblings (Psalm 149: 0.43, Psalm 146: 0.41) than to a stark
individual lament (Psalm 88: 0.003) or a quiet creation hymn (Psalm 8:
0.008), and, in the live app, Psalm 150's single closest match under this
method is Psalm 117 (0.980), the Psalter's other short, pure
"Hallelujah, praise the LORD, all nations" hymn. A direct check confirms
this is an independent signal rather than lexical similarity in
disguise: Pearson correlation between the two methods' full similarity
matrices is 0.19.

**Grammatical-person profile.** TF-IDF cosine similarity over word-level
and pronominal-suffix person/number tag profiles ("I" vs. "we" vs. "you"
vs. "he/she/it"), extracted from BHSA's `ps`/`nu`/`prs_ps`/`prs_nu`
features: a second, independent form-critical marker distinguishing
individual from communal address.

This separates even more cleanly than
verb morphology, and (unlike verb morphology's broader exemplar
sets) part of the separation holds up under permutation testing even
after correcting for multiple comparisons, not just as a raw score
comparison: individual laments (Psalms 3, 22, 38, 51, 88) average 0.87
similarity with each other, and this is the one cohesion result across
both signals' twelve-test battery that survives Benjamini-Hochberg
correction for running six genre tests per signal (raw p = 0.0018,
BH-adjusted p = 0.011, against 20,000 permutations).

Communal laments (44,
74, 79, 80, 137) average 0.73 with each other, a real-looking raw signal
(p = 0.029) that, like verb-morphology's, does not survive correction once
weighed against the other five genre tests run alongside it (BH-adjusted
p = 0.086, well above the conventional 0.05 threshold).

The cross-group
separation is the one claim in this paragraph that does not need that
correction, because it was the single, specific, pre-registered contrast
the person-profile hypothesis was actually about, not one of six
exploratory per-genre tests: the two groups average only 0.41 similarity
with *each other*, below the 0.51 corpus-wide baseline, meaning an
individual and a communal lament are measurably *less* alike on this
dimension than two random psalms, confirmed directly by a
`permutation_test_separation` label-reshuffle test (p = 0.0033 against
20,000 permutations). Psalm 22 ("My God, my God, why have you
forsaken me") scores above 0.92 with fellow individual laments Psalm 38
and Psalm 88, and below 0.45 with communal laments Psalm 44 and Psalm 137.

Confirmed independent of both other methods: correlation with lexical
similarity and with verb-morphology similarity are each below 0.5.

**Lexical-set and named-entity-type profiles.** Two further syntactic
signals: lexical set is BHSA's finer subclassification of part-of-speech
(numerals, focus particles, prepositional/adverbial/copular uses of
otherwise-nominal or verbal words). Named-entity type is an onomastic
*register* (person- vs. place- vs. deity-name-dense), the coarser sibling
of the identity-based method above.

**Clause type, text type, clause relation, and verb sense.** Four
clause/phrase-structure signals, added in the most recent extraction pass
and screened against the same discriminativeness bar as everything else.
Clause type (`typ`, 40 constituent-order/verb-form patterns like
wayyiqtol-null vs. nominal clause) turned out to be the single most
discriminative method of any tried: 66.7% of psalm pairs score below 0.5,
ahead of even lexical similarity's own spread.

Text type (`txt`,
narrative/discursive/quotation with embedding) is BHSA's closest analogue
to a discourse-register feature. There is no separate "discourse" object
type in the corpus. `sentence`, `sentence_atom`, and `half_verse` carry no
independent content tags at all, checked directly against every feature in
the dataset.

Clause relation (`rela`) and verb sense (from the
ETCBC/valence module, Janet Dyk's verbal-valence research at VU/ETCBC,
part of the SYNVAR project, giving whether a verb occurrence takes a
direct object, a prepositional complement, or neither) both survived as
sparse-but-real signals (22.5% and 12.6% word coverage respectively).

**Nine methods built and deliberately not shipped.** Grammatical gender,
nominal state, phrase-dependent part-of-speech, clause kind, phrase
function, phrase determination, phrase type, verbal valence, and
grammatical role were all extracted, tested, and measured, and all
turned out structurally near-degenerate under TF-IDF-cosine (0–4.9% of
pairs score below 0.5, versus 15%+ for every shipped method).

The pattern
that emerged, and now documents itself in `pipeline/methods.py`:
TF-IDF-cosine over a tag-frequency profile is only discriminative when a
tag is either high-cardinality or *sparse* (fires on a minority
of words). Dense features, even with good category balance (phrase
function has 27 well-balanced codes and still only clears 2.8%), produce
nearly identical profile shapes across the whole Psalter, since every
psalm needs verbs, nouns, determined phrases, and core arguments
regardless of genre.

Their integration tests document the finding
directly rather than pretending it's a usable comparison method: a
negative result treated with the same rigor as a positive one.

All eleven shipped methods, and the interactive heatmap / network-graph /
ranked-match visualization built on top of them, are live in the app.
See `app/README.md`.

**Semantic-embedding signal (Cluster page only, no Compare-page
counterpart).** Every method above is a morphosyntactic tag-frequency
profile or a lexical-overlap measure, neither of which can represent
Stimmung, the mood/attitude leg of Gunkel's Gattung (see "Genre track"
above). `pipeline/semantic_embedding.py` is the first attempt at a signal
built on meaning rather than grammatical form: sentence embeddings over
BHSA's own `half_verse` sectional division (the Masoretic verse-internal
caesura), from MiqraBERT (David M. Smiley, arXiv:2606.19638), a
Sentence-BERT model fine-tuned from AlephBERT for Biblical Hebrew
parallel-passage detection, and from AlephBERT itself, unfinetuned, as an
ablation baseline. Two psalm-to-psalm aggregations are computed and
compared rather than one assumed correct: mean-pooling a psalm's
half-verse vectors into one, and a symmetric best-match ("soft-alignment")
comparison of each psalm's full half-verse set, the latter aimed directly
at the mean-pooling-erasure weakness MiqraBERT's own paper diagnoses for
poetic parallelism. Real results, and why the outcome ran against this
method's own working hypothesis, are reported in "Statistical validation
methodology" below. Half-verse granularity was chosen to match the unit
MiqraBERT's own training pairs used, not an arbitrary finer split. All
four variants (both encoders, both aggregations) are live on the Cluster
page, including MiqraBERT's negative (k=1, no structure found) result -
this project's standing practice is to ship a validated negative finding
plainly rather than omit it, the same precedent text-type's own k=1 set.
There is no Compare-page (`similarity.json`) counterpart: that page's
"why are these similar" explainability is built entirely around shared
TF-IDF terms, which has no embedding analogue - extending it is a
separate, larger question this phase didn't take on.

559 pipeline tests and 211 frontend tests currently
pass. `pipeline/ground_truth.py` and its integration tests are the
executable form of the "validate every phase against known scholarship"
discipline above.

### Statistical validation methodology

Descriptive point estimates (a raw mean similarity, a raw purity score)
can't say on their own whether an observed pattern reflects real structure
or corpus noise, and a classical t-test doesn't apply here: pairwise
similarities aren't independent observations (each psalm appears in
multiple pairs, so its own idiosyncrasy correlates every pair it's part
of, a dyadic/network dependency, the same issue Mantel tests and QAP
address in ecology and social-network analysis). Seven pieces of
inferential/diagnostic machinery close that gap, all in `pipeline/`:

- **Label-permutation significance testing, corrected for multiple
  comparisons** (`analysis.py`'s `permutation_test_cohesion`/
  `permutation_test_separation`, corrected by `benjamini_hochberg`):
  never assumes independence, only exchangeability under the null.
  Applied to all six Gunkel exemplar groups for both validated
  genre-fingerprint signals (twelve cohesion tests total, corrected as two
  six-test families rather than twelve isolated p-values, and using
  exemplar lists that already exclude four commonly-cited genre blends
  (Psalms 19, 32, 73, 133), see `ground_truth.py`): verb-morphology
  clears none of them, including its broad hymn set (p = 0.94, consistent
  with its own already-documented negative result) and communal lament
  and thanksgiving, whose raw p-values (0.030, 0.076) look suggestive
  alone but don't survive correction (BH-adjusted p = 0.18, 0.23).
  Person-profile fares only slightly better: individual-lament cohesion is
  the one cohesion result across both families that survives correction
  (raw p = 0.0018, BH-adjusted p = 0.011), while its own communal-lament
  cohesion (raw p = 0.029) falls further short once corrected
  (BH-adjusted p = 0.086). The one claim that doesn't need this
  correction (because it's the single, specific, pre-registered contrast
  the hypothesis was actually about, not one of twelve exploratory
  per-genre tests) is person-profile's individual-vs-communal separation
  (p = 0.0033), which holds up cleanly on its own. Read together, this is
  a materially more cautious picture than the raw score gaps alone
  suggested: the one claim in this section that holds up fully under
  correction is the individual/communal-lament distinction specifically
  (cohesion of the first group, plus the separation between the two),
  not a general "every exemplar genre coheres" result.
- **Gap statistic** (`k_selection.py`'s `gap_statistic`, citing Tibshirani,
  Walther & Hastie, 2001): silhouette score, used below to choose k, is
  mathematically undefined for a single cluster, so a silhouette-only
  sweep over k≥2 can never conclude "this signal shows no real cluster
  structure." It always reports some k as the winner, however
  uninformative the affinity matrix actually is. An earlier attempt to
  patch this (testing a partition's silhouette against random relabelings
  of itself) turned out to have no power to fail: see the
  partition-significance bullet below. The gap statistic closes the gap
  properly, comparing real within-cluster dispersion against dispersion
  on reference matrices with no structure by construction (random
  permutations of the real matrix's own similarity values, preserving
  their distribution while destroying which specific psalms are similar
  to which). Run against the real data, it does exactly what it exists to
  do: ten of the eleven signals show real structure, but **text-type
  genuinely shows none**: its silhouette sweep alone would have reported
  a confident-looking k=8, but the gap statistic finds that dispersion
  curve indistinguishable from a structureless reference's own, so
  text-type now ships with k=1 (flagged plainly in the app) rather than an
  8-way split with nothing real behind it.
- **Data-driven k-selection** (`k_selection.py`, silhouette score across a
  range of k, gated by the gap statistic above): `cluster_methods.py`
  used to fix `n_clusters=6` for every signal, chosen by matching Gunkel's
  traditional genre count, not by anything about the data. That was never
  checked until this diagnostic existed: run against the real similarity
  matrices, neither validated genre-fingerprint signal actually preferred
  6 (verb-morphology peaks sharply at k=2. Person-profile peaks at k=4,
  but only barely: its silhouette score at k=2 is 0.405 against k=4's
  0.411, a near-tie that the subsample-stability figure below treats with
  appropriate caution rather than reporting k=4 as a settled choice). Once
  that was known, keeping an admittedly arbitrary number stopped being
  defensible, so every one of the eleven shipped clustering methods now
  picks its own k via `data_driven_k`, computed fresh from its own
  similarity matrix, no shared cluster count at all. Ten signals land on
  their own k above 1 (2 for root/verb-morphology/named-entity/
  clause-relation/verb-sense, 4 for person-profile/clause-type, 5 for
  named-entity-identity, 9 for lexical-set, 10 for lexical), and text-type
  lands on k=1 (see above), itself informative: the signals with the
  least category structure to find collapse to the simplest possible
  split (or, for text-type, to no split at all), while richer signals
  support finer partitions.
- **Adjusted Mutual Information, not plain NMI, with its own
  permutation-significance test** (`genre_alignment.py`): NMI has no
  chance correction and biases upward with many small, uneven categories
  (this data's exact shape: 14 Gunkel genres over 144 indexed psalms,
  several with a single member). Recomputed at each signal's data-chosen
  k: verb-morphology's k=2 partition scores barely above zero (AMI ≈
  0.03), person-profile's k=4 partition is meaningfully stronger (AMI ≈
  0.22), a real, informative difference an arbitrary shared k had been
  obscuring. Neither AMI's chance-correction nor an eyeballed comparison
  actually tests whether one realized value is real, though, so every
  signal's AMI is now also permutation-tested and corrected across all
  eleven signals together with the same `benjamini_hochberg` used for the
  exemplar battery. The honest result: six of the ten testable signals
  clear correction (lexical, named-entity-identity, person-profile,
  clause-type, and, only barely at adjusted p ≈ 0.045, verb-morphology
  and named-entity), while root, lexical-set, clause-relation, and
  verb-sense do not. Worth flagging plainly: **lexical** (a *thematic*,
  not genre, signal, see its "thematic signal, not genre" badge in the
  app) has one of the strongest AMI-significance results of any signal.
  That is not evidence lexical similarity recovers genre. It is exactly
  the coincidental vocabulary correlation (hymns share praise words,
  laments share complaint words) the thematic badge exists to warn
  against, and statistical significance and correct interpretation are two
  different questions. The picture is also granularity-sensitive:
  coarsening to Gunkel's 6 families drops named-entity-identity and
  named-entity below significance while leaving the other four
  unchanged, another reason the family view is offered as a genuinely
  different lens rather than a cleaned-up version of the genre one.
- **Semantic-embedding AMI, run through the same battery** (`pipeline/
  semantic_embedding.py`, evaluated at the 6-family level, joint BH
  correction across all fifteen signals together, not run in isolation):
  the honest result cuts against this method's own working hypothesis in
  two separate ways. First, **unfinetuned AlephBERT, not MiqraBERT, is the
  strongest signal in the entire project** - mean-pooled AlephBERT reaches
  AMI ≈ 0.24 (BH-adjusted p ≈ 0.0015), ahead of person-profile (≈ 0.15),
  clause-type (≈ 0.14), and every other signal tested, syntactic or
  lexical. Second, **MiqraBERT collapses to k=1 for both aggregations** -
  the gap statistic finds no cluster structure at all, AMI = 0. The most
  plausible reading: MiqraBERT was fine-tuned specifically to separate
  *textual parallels* from *random unrelated pairs*, and the overwhelming
  majority of psalm-pairs are neither, so that fine-tuning objective
  likely collapsed exactly the general-semantic variation among
  non-parallel psalms that genre discrimination depends on, while
  AlephBERT's unfinetuned space still preserves it. Third, contrary to
  this method's own design rationale (see the paragraph above), **mean-
  pooling beat soft-alignment** for AlephBERT (0.24 vs. 0.20) - soft-
  alignment's local best-match matching, built to fix a poetic-parallelism
  problem specific to phrase-level correspondence, appears to import more
  noise than signal when the target is a whole-psalm property like genre
  rather than a local textual echo. None of this is circular: neither
  model was ever exposed to Gunkel's genre labels, unlike a hypothetical
  fine-tune against them directly (see the "could we fine-tune AlephBERT
  on our own labels" question this method's design already rejects, for
  exactly that reason, in favor of testing an independently-built
  representation). Two further findings from the immediate scholarly
  lineage this result sits in, worth citing directly rather than assumed:
  Wido van Peursen and Eep Talstra's prior computational work on
  parallel-passage detection in 2 Kings 18-19 (*Vetus Testamentum* 57/1,
  2007) is the methodological precedent MiqraBERT's own paper cites, and
  Bert Lobbezoo's 2015 TU Delft thesis, testing the same 162-feature
  WIVU/ETCBC grammatical family this project's own syntactic signals are
  built from against a 10,788-pair parallel-detection ground truth, found
  those grammatical features scored close to random guessing (best
  individual feature AUC 0.577, all 162 combined only 0.646) while string/
  lexical-distance features reached AUC 0.937 - an independent
  confirmation, on a different task and a different dataset, of the same
  qualitative pattern this project's own AMI results show: ETCBC
  morphosyntax is a weak signal for this kind of question, and lexical/
  semantic content carries the real one.
- **Spectral-embedding structure-captured** (`embedding.py`): the
  Cluster page's scatter plot used to lay psalms out via classical
  (Torgerson) MDS, which optimizes a different objective entirely
  (preserve variance in the raw similarity matrix) with no guaranteed
  relationship to the space spectral clustering actually partitions.
  Checked directly against real data, this let the 2D layout and the
  cluster hulls drawn on top of it visually contradict each other: a
  psalm could sit far from its own cluster's other members with nothing
  mathematically "wrong," because the picture and the partition were two
  independently-derived geometries presented as one. The scatter plot now
  uses the same normalized-Laplacian eigenspace `SpectralClusteringMethod`
  itself partitions, so for any signal whose k is 2, the picture *is*,
  exactly, the space the algorithm used to decide. `structureCaptured`
  reports what fraction of each signal's cluster-relevant spectral
  structure the 2D view actually shows: 0.98 for named-entity and 0.85
  for lexical-set (a 2D view is nearly the whole story), down to 0.15 for
  lexical, whose data-chosen k=10 genuinely needs far more than 2
  dimensions to represent. The analogue of classical MDS's own "percent
  variance explained," adapted for the Laplacian's opposite convention (a
  small eigenvalue, not a large one, is the meaningful one), deliberately
  not called "variance explained" itself, since it isn't a decomposition
  of statistical variance.
- **Partition-significance testing** (`k_selection.py`'s
  `_partition_significance`): tests each signal's own winning partition
  against random relabelings of its own distance matrix. Run against the
  real data, every one of the ten signals with real structure (all but
  text-type, whose k=1 has no multi-cluster partition to test) lands at
  the permutation floor (p ≈ 0.0005, the smallest value 2,000 permutations
  can report), an honest limit of this specific test worth stating
  plainly rather than presenting as uniform proof of genre structure: a
  spectral partition fit to *any* non-uniform affinity matrix will beat
  pure label-scrambling almost every time, since real TF-IDF-cosine
  matrices are never perfectly uniform even under a weak or non-genre
  signal. This is exactly why the gap statistic above was built as a
  separate, properly-powered test rather than relying on this one to
  cover the "no real structure" case: it doesn't, and now correctly
  doesn't have to, since text-type's k=1 already handles that possibility
  upstream. This test rules out "this partition is statistically
  indistinguishable from noise" for the other ten signals, but on its own
  cannot certify that a partition is genre-meaningful: that question is
  what the AMI significance above, and the stability figure below, are
  actually for.
- **Subsample k-stability** (`k_selection.py`'s `subsample_k_stability`):
  draws 100 random subsamples of the corpus (80% of the psalms each
  time, *without* replacement) and reruns the silhouette k-sweep on each,
  reporting what fraction agree with the k chosen on the full corpus.
  This replaced an earlier bootstrap-*with*-replacement version that had
  a real, uncorrected flaw: resampling a *relational* similarity matrix's
  indices with replacement can draw the same psalm twice, creating an
  off-diagonal pair that is trivially self-similar (1.0) with no analogue
  in the real data. Subsampling without replacement has no such artifact,
  and the fix was not merely more correct in principle, it materially
  changed the answer: root's stability jumped from an apparently
  near-arbitrary 3% under the flawed bootstrap to a genuinely
  well-supported 94% under the corrected method, exactly the direction a
  reviewer should worry about when a resampling scheme has a known
  self-similarity artifact. The current, corrected picture: verb-morphology
  and named-entity are perfectly stable (100%), root is now also highly
  stable (94%), verb-sense is stable (80%), person-profile sits at a
  moderate 63% (consistent with its own k=4-vs-k=2 near-tie noted above),
  lexical-set (39%), clause-relation (35%), named-entity-identity (33%),
  and lexical (19%) are progressively less settled, and clause-type (10%)
  is close to a coin flip and should be read with real caution as a
  specific cluster count, even though the gap statistic confirms it has
  *some* real structure. (Known, documented limitation that the fix does
  not remove: resampling a relational similarity matrix by index (even
  without replacement) is still an imperfect proxy for a true i.i.d.
  bootstrap, since psalms are not independent observations of each other.
  See the function's own docstring.)
- **Does TF-IDF weighting earn its place on a small, closed grammatical
  tag vocabulary?** TF-IDF's idf term is designed for large, open
  vocabularies where a rare term is genuinely informative. Over the
  verb-morphology signal's 47-tag stem-by-conjugation vocabulary, or
  person-profile's 15-tag vocabulary, a reviewer could reasonably suspect
  idf is mostly encoding "this tag is rare in Biblical Hebrew generally,"
  not anything psalm-specific, and adding little over plain
  relative-frequency cosine. Checked directly against real data (each
  method's TF-IDF-cosine matrix vs. the same feature counts run through
  an idf-disabled TfidfTransformer): that suspicion doesn't hold. For
  verb-morphology, idf values span a real range (1.05 to 5.32, std 1.38,
  reflecting genuinely uneven stem/conjugation rarity), and disabling idf
  collapses discriminativeness from 42.7% of pairs scoring below 0.5 down
  to 22.5%, roughly halving how separable the signal is. The two
  matrices' upper-triangle values correlate at only r = 0.94, not the
  r > 0.99 that would say idf is cosmetic. Person-profile shows the same
  direction on a smaller scale (49.7% down to 41.2%, r = 0.98). idf
  weighting is doing real, load-bearing work for both shipped signals,
  not decoration left over from a document-retrieval default.

## Built on ETCBC

This project is not a from-scratch reimplementation: extraction runs
directly on Text-Fabric against the BHSA database, using the same
form-to-function methodology the BHSA database itself is built on
(register the surface-level annotation first: `sp`, `vs`, `vt`, `lex`,
then derive functional/interpretive labels on top of it, rather than
baking interpretation into extraction).

It also draws on the companion
[ETCBC/valence](https://github.com/ETCBC/valence) module (Janet Dyk,
VU/ETCBC), loaded alongside BHSA via Text-Fabric's multi-location support
since it shares the same node numbering: verbal-argument annotation BHSA
itself doesn't carry. The `pipeline/corpus.py` module retains each word's
Text-Fabric node id specifically so later phases (disjunctive accents for
the segmentation phase below) can re-query the corpus directly rather than
re-deriving structure from scratch.

## Application architecture

Every similarity method produces the same shape of result: an N×N
similarity matrix plus a ranked-neighbors list per psalm, which is
exactly what the app's method selector, heatmap, and network graph already
handle generically. Each new method of that kind drops in without
changing any existing code, as it now has eleven times over.

Unsupervised
clustering produces a genuinely different shape (a partition of the whole
corpus, not a pairwise matrix) that doesn't fit that UI at all, so the app
is a single-page app with two client-side routes sharing the same
psalm-picker and detail-panel components rather than duplicating them: a
**Compare** route (the similarity heatmap, network graph, and ranked-match
panel, at `/compare/`) and a **Cluster** route (recovering Gunkel's psalm
genres with unsupervised clustering, via a 2D similarity scatter plot with
per-cluster hull outlines plus a genre-alignment matrix checking each
clustering against Gunkel's own psalm-by-psalm genre classification, at
`/cluster/`). See `app/README.md`.

A tiny router swaps the center panel
between the two without a full page reload. Visiting the site root
redirects to `/compare/`.

Both routes' method dropdowns draw their labels
from one shared
registry (`app/src/lib/featureNames.ts`) so the same signal reads
identically on each. Intra-psalm shift detection, which will produce a
third result shape (a sequence within one psalm), is still planned.

On the pipeline side, the same pattern extends the same way: a `Protocol`
per computation kind (`SimilarityMethod` and, since the clustering phase,
`ClusteringMethod`) paired with a generic result type, composed in
`methods.py`/`cluster_methods.py` without the extractor or the metric
knowing about each other. `ClusteringMethod` consumes an already-computed
`SimilarityResult` rather than building its own features from scratch, so
clustering is guaranteed to partition the same signal the Compare page
shows, not a silently different one. New capability is added by
introducing a new Protocol exactly when its first concrete method needs
it, not before.

## Repository structure

- **`pipeline/`**: the Python package described above (`corpus.py` →
  per-feature extractor modules → `similarity.py` → `methods.py` →
  `export.py`), plus `ground_truth.py` and its integration tests. See
  `pipeline/README.md`.
- **`app/`**: "Compare the Psalms", an interactive Vite + TypeScript + D3
  visualization: a similarity heatmap, a force-directed similarity network,
  a method selector, and a ranked most-similar-psalms panel. This *is* the
  site: `npm run build` writes straight to the repo root (`index.html`,
  `assets/`, `data/`), so `tehillim.dev` serves the comparison tool
  directly rather than a marketing page linking out to it. See
  `app/README.md`.
- **`about/`**: the earlier static marketing page (unchanged content),
  kept but no longer the site root, reachable at `/about/`.
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
folder. Deploy that root as one static site.

Since Compare and Cluster are
both client-side routes into that one built `index.html` rather than
separate physical pages, the host must fall back to serving `index.html`
for any path it doesn't otherwise recognize (e.g. a direct or refreshed
load of `/cluster/`) instead of 404ing. A `wrangler.jsonc` at the repo root
configures this for Cloudflare Workers static-asset deployment
(`assets.directory: "."`, `assets.not_found_handling:
"single-page-application"`, `npx wrangler deploy`). Cloudflare Pages,
GitHub Pages, or Netlify need the equivalent SPA-fallback setting pointed
at the repo root.

## References

- Botha, Philippus J. "Intertextuality and the Interpretation of Psalm 1." *Old Testament Essays* 18 (2005): 503–520. <https://www.researchgate.net/publication/228724588_Intertextuality_and_the_Interpretation_of_Psalm_1>
- Tanner, Beth LaNeel. *The Book of Psalms Through the Lens of Intertextuality.* Studies in Biblical Literature 26. New York: Peter Lang, 2001. Review: <https://spirin.org/The_Book_of_Psalms_Through_the_Lens_of_Intertextuality_Review>
- "Parallels between the Book of Job and the Psalms: A Tradition-Historical Rather Than Intertextual Approach." <https://www.academia.edu/37795524/Parallels_between_the_Book_of_Job_and_the_Psalms_A_tradition_historical_rather_than_intertextual_approach>
- Naaijer, Martijn, and Dirk Roorda. "Parallel Texts in the Hebrew Bible, New Methods and Visualizations." arXiv:1603.01541. <https://arxiv.org/pdf/1603.01541>
- "Detection and Typology of Psalmic Text Reuses in the New Testament." *Religions* 17, no. 1 (2026): 88. Special Issue: Computational Approaches to Ancient Jewish and Christian Texts. <https://www.mdpi.com/2077-1444/17/1/88>
- Smiley, David M. "Intertextual Parallel Detection in Biblical Hebrew: A Transformer-Based Benchmark." arXiv:2506.24117. <https://arxiv.org/pdf/2506.24117>
- Smiley, David M. "MiqraBERT: Regression-Based Sentence-BERT Finetuning for Biblical Hebrew Parallel Detection." arXiv:2606.19638. <https://arxiv.org/pdf/2606.19638>
- van Peursen, Willem Th., and Eep Talstra. "Computer-Assisted Analysis of Parallel Texts in the Bible: The Case of 2 Kings XVIII-XIX and Its Parallels in Isaiah and Chronicles." *Vetus Testamentum* 57, no. 1 (2007): 45-72.
- Lobbezoo, Bert. "Computer-Based Recognition of Intertextuality within the Hebrew Bible." MA thesis, Delft University of Technology, 2015.
- McGovern, Hope, Hale Sirin, and Tom Lippincott. "Computational Discovery of Chiasmus in Ancient Religious Text." Proceedings of NAACL 2025 (short papers). arXiv:2501.10739. <https://arxiv.org/html/2501.10739v1>
- Sigrist, David J. "Tracking Changes: A Proposal for a Linguistically Sensitive Schema for Categorizing Textual Variation of Hebrew Bible Texts in Light of Variant Scribal Practices Among the Judaean Desert Psalms Witnesses." Trinity Western University. <https://www.academia.edu/6126323/Tracking_Changes_A_Proposal_for_a_Linguistically_Sensitive_Schema_for_Categorizing_Textual_Variation_of_Hebrew_Bible_Texts_in_Light_of_Variant_Scribal_Practices_Among_the_Judaean_Desert_Psalms_Witnesses>
