# TehillimAI: Computational Approaches to the Hebrew Psalter

TehillimAI investigates how the Psalter's internal similarities — verbatim
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

Two methods are implemented, tested, and live in the interactive app today
(see below); a further ten are planned, in order, each tied to a specific
methodological question raised by the literature reviewed here.

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
anisotropy left uncorrected — is what phases 3 through 6 of this project's
roadmap are built to close, and phase 1 (implemented) is a direct,
independent test of whether a *non*-lexical, non-embedding signal (verb
morphology) can do useful work in the meantime.

## Method roadmap

Each method reuses the same evaluation discipline: implement it, then
check it against the scholarly ground truth in `pipeline/ground_truth.py`
(twin psalms, the Elohistic Psalter boundary, the Songs of Ascent, the
Egyptian and Final Hallel, refrain psalms, acrostics, Wilson's five-book
editorial frames, and a deliberately hedged set of Gunkel's form-critical
genre exemplars) *before* moving to the next phase — the same discipline
Smiley's and Naaijer & Roorda's papers use when they validate against
known Samuel–Kings/Chronicles parallels.

| # | Method | Status | Motivation |
|---|---|---|---|
| 0 | **Lexical similarity** — TF-IDF weighted cosine similarity over content-word lexemes | **Implemented, validated** | Standard IR baseline; the interpretable floor every later method is compared against |
| 1 | **Verb-morphology similarity** — TF-IDF cosine over verb stem/mood tag profiles, a Gunkel-style form-critical genre fingerprint | **Implemented, validated** | Tests a signal orthogonal to vocabulary; explicitly *not* aimed at parallel-passage detection (see "What's implemented" below) |
| 2 | Classical distance ensemble — character n-gram edit distance + root-level Dice/Jaccard, combined via logistic regression | Planned | A stronger, still fully interpretable classical baseline before any neural method is introduced |
| 3 | Sub-psalm segmentation via Masoretic disjunctive accents (verse, colon, and one strophic scheme as competing granularities) | Planned (infrastructure) | Everything downstream depends on this: MiqraBERT's own poetic-recall failure is attributed to verse-level pooling |
| 4 | Transformer embeddings (E5, AlephBERT, MiqraBERT) at psalm *and* colon level | Planned | A direct, testable extension of MiqraBERT's diagnosed weakness — does colon-level embedding close the recall gap? |
| 5 | Anisotropy correction (whitening / top-PC removal / kernel PCA) before cosine comparison | Planned | Both papers above diagnose this geometric flaw but only ever address it via fine-tuning |
| 6 | Optimal transport (Word-Mover's-Distance-style) between token embedding sets, replacing mean-pooling | Planned | The highest-leverage step: directly targets the "heaven/earth, day/night" pooling-erasure failure; both papers already use Wasserstein distance for *evaluation* but never as the similarity metric itself |
| 7 | Alignment kernels (Smith–Waterman / Needleman–Wunsch) at colon level for chiasmus, tricolon, and refrain detection | Planned | A direct benchmark comparison against the chiasmus paper's embedding-only approach |
| 8 | Frequent-itemset mining over root-pairs to build a data-driven fixed-word-pair lexicon | Planned | An interpretable structural-parallelism feature, addressing the "black box" critique the NLP papers raise about themselves |
| 9 | Multi-relational graph fusion (lexical + syntactic + distance + embedding/OT + alignment + word-pair) with spectral / Louvain–Leiden community detection | Planned | The actual clustering step, once enough independent signals exist to fuse |
| 10 | Shrinkage / regularized covariance estimation for any model fit on small labeled ground truth | Planned (cross-cutting) | The same small-n, high-dimensional problem MiqraBERT's 1,650-pair training set faces |
| 11 | Continuous validation against scholarly ground truth, every phase | **Ongoing since phase 0** | Modeled directly on how the cited papers validate against Samuel–Kings/Chronicles |

## What's implemented and validated now

**Phase 0 — lexical similarity.** TF-IDF weighted cosine similarity over
BHSA content-word lexemes (nouns, verbs, adjectives, adverbs, proper
nouns, interjections; closed-class grammatical words excluded).
Integration-tested against the textual-duplicate ground truth above: Psalm
14 ranks Psalm 53 as its single closest match (score 0.811, the highest
pairwise lexical similarity anywhere in the Psalter), and Psalm 108 shows
strong, correctly-attributed similarity to both of its literal sources,
Psalm 57 and Psalm 60.

**Phase 1 — verb-morphology similarity.** TF-IDF cosine similarity over
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

Both methods, and the interactive heatmap / network-graph / ranked-match
visualization built on top of them, are live in the app — see
`app/README.md`. 112 pipeline tests and 60 frontend tests currently pass;
`pipeline/ground_truth.py` and its integration tests are the executable
form of the "validate every phase against known scholarship" discipline
above.

## Built on ETCBC's own tools

This project is not a from-scratch reimplementation: extraction runs
directly on Text-Fabric against the BHSA database, using the same
form-to-function methodology the ETCBC's own database is built on
(register the surface-level annotation first — `sp`, `vs`, `vt`, `lex` —
then derive functional/interpretive labels on top of it, rather than
baking interpretation into extraction). The `pipeline/corpus.py` module
retains each word's Text-Fabric node id specifically so later phases
(clause and phrase structure, disjunctive accents for phase 3's
segmentation) can re-query the corpus directly rather than re-deriving
structure from scratch.

## Repository structure

- **`index.html` / `styles.css`** — the static project website. Links to the
  comparison tool at `compare/index.html` (see below).
- **`pipeline/`** — the Python package described above (`corpus.py` →
  `features.py`/`verb_morphology.py` → `similarity.py` → `methods.py` →
  `export.py`), plus `ground_truth.py` and its integration tests. See
  `pipeline/README.md`.
- **`app/`** — "Compare the Psalms", an interactive Vite + TypeScript + D3
  visualization: a similarity heatmap, a force-directed similarity network,
  a method selector, and a ranked most-similar-psalms panel. This is a
  *source* project — `app/index.html` only runs under the Vite dev server,
  it is not a page you can link to or deploy directly. See `app/README.md`.
- **`compare/`** — gitignored build output of `app/`, produced by
  `npm run build`. This is the real, self-contained static page that
  `index.html` links to, and what actually gets deployed.

## Quickstart

```bash
# 1. Generate the similarity data (requires a local ETCBC/bhsa clone)
cd pipeline && python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]" && python -m tehillim_pipeline.cli

# 2a. Iterate on the app with hot reload
cd ../app && npm install && npm run dev

# 2b. ...or build it so the main site's "Compare Psalms" link works
cd ../app && npm install && npm run build   # writes ../compare/
```

## Deployment

Deploy the whole repo root (`index.html`, `styles.css`, `compare/`) as one
static site — Cloudflare Pages, GitHub Pages, Netlify, etc. Run
`npm run build` in `app/` first (or as a build step in CI) so `compare/`
exists; it's gitignored as a build artifact, not committed.

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
