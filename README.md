# tehillim

## Overview

This repository is the public entry point for Tehillim, a linked research project on the Hebrew Psalms. The project registers formal, lexical, syntactic, contextual, and textual-critical patterns in specified textual representations, then asks what each representation can and cannot make visible. It brings together the seven active repositories that produce, evaluate, preserve, and qualify those records:

| Repository                                                               | Function in the project                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [tehillim-embeddings](https://github.com/rdtaylorjr/tehillim-embeddings) | Builds lexical, morphological, syntactic, and semantic representations.                                      |
| [tehillim-benchmark](https://github.com/rdtaylorjr/tehillim-benchmark)   | Evaluates representations against bounded parallelism and genre tasks.                                       |
| [tehillim-compare](https://github.com/rdtaylorjr/tehillim-compare)       | Builds psalm-similarity matrices from selected representations.                                              |
| [tehillim-cluster](https://github.com/rdtaylorjr/tehillim-cluster)       | Partitions those similarity matrices and compares the partitions with the historical index.                  |
| [tehillim-data](https://github.com/rdtaylorjr/tehillim-data)             | Preserves materialized benchmark reports, observation-level records, profile shards, and interface payloads. |
| [tehillim-trublet](https://github.com/rdtaylorjr/tehillim-trublet)       | Replicates and tests a published computational account of wisdom vocabulary in the Hebrew Psalms.            |
| [tehillim-texttype](https://github.com/rdtaylorjr/tehillim-texttype)     | Audits the ETCBC text-type analysis across the Hebrew Psalms and its historical versions.                    |
| [tehillim-dss2etcbc](https://github.com/rdtaylorjr/tehillim-dss2etcbc)   | Transfers selected BHSA structural annotations to Dead Sea Scroll witnesses through explicit alignment.      |

The project does not treat a score, cluster, or database field as a literary judgment. A computational result records the behavior of an encoding under a stated operation. Interpretation remains answerable to the text, the source material, the unit of analysis, and the decisions that made the result possible.

## Data

Tehillim works at several levels of textual organization. The shared Masoretic base is the 2021 ETCBC Biblia Hebraica Stuttgartensia Amstelodamensis in Text-Fabric form. Its word, phrase, phrase-atom, clause, clause-atom, and section nodes make a hierarchy available for calculation. Each level carries an ETCBC analysis of Hebrew form. Fields such as `typ`, `function`, `rela`, `det`, `vs`, and `vt` are evidence supplied by a linguistic database. They require philological review when a result depends on them.

The representation and parallelism work uses the BHSA `half_verse` section node. This follows the Masoretic accentual division and supplies a stable computational address across vector files and annotations. It is not established here as a theory-neutral poetic colon. Clause boundaries, phrase atoms, prosodic division, and annotated parallel members can coincide or diverge. That divergence is part of the research problem.

The project also uses received classifications and external annotations. The benchmark suite evaluates licensed parallelism and seven-class genre materials. The clustering work compares selected partitions with a 14-category historical form-critical index. The text-type study accepts a runtime genre CSV for a separate test. The Trublet replication uses published wisdom lists. These targets record prior scholarly decisions. They organize comparison and falsification. They do not supply a final taxonomy of the Hebrew Psalms.

`tehillim-dss2etcbc` introduces a second textual witness. Its 11Q5 work retains glyphs, reconstruction, uncertainty, correction, removal, fragment, and morphology information beside each proposed correspondence with BHSA. A transferred clause or phrase boundary therefore remains conditional on a reading, a normalization, an alignment, and the Masoretic source structure.

The project separates representations from derived results. `tehillim-embeddings` currently holds 24,226 Parquet artifacts across lexical, morphological, syntactic, and semantic domains. `tehillim-data` holds 322 CSV, Parquet, and JSON result artifacts. Some source annotations and copyrighted materials remain unavailable for redistribution. Public access therefore permits inspection of many operations and outputs while leaving some input judgments inaccessible.

## Methodology

The project begins by registering material before extending a claim about genre, parallelism, literary relation, or textual history. It keeps graphic form, lexeme, morphology, syntactic annotation, source label, and derived score distinct wherever the data permit. Missingness, ambiguity, reconstruction, and disagreement are retained as conditions of a result.

`tehillim-embeddings` constructs multiple representations from the same BHSA material. Lexical representations distinguish consonantal word forms, homographs, and disambiguated lexemes. Morphological and syntactic representations use closed vocabularies and preserve non-applicability as part of a distribution. Semantic representations pool or align half-verse vectors. Each representation therefore states a different question. Shared lexical material, grammatical profile, and contextual-vector proximity cannot be treated as interchangeable evidence.

`tehillim-benchmark` evaluates these representations on two limited tasks. Parallelism evaluation retains 1,110 eligible cross-`half_verse` pairs derived from 2,292 annotation groups. It uses retrieval metrics, pair-separation measures, local controls, permutation procedures, and order-shuffle controls. Genre evaluation compares psalm-pair similarities inside and across received labels. The metrics test a representation against the selected target and control construction. They do not settle whether a given pair is parallel or whether a psalm belongs to a genre.

`tehillim-compare` builds the similarity matrices those partitions are drawn from. `tehillim-cluster` turns them into spectral partitions after a gap-style screen, silhouette selection, eigengap diagnostics, label permutations, and subsampling stability checks. It compares resulting partitions with the historical index through contingency tables, purity, adjusted mutual information, and adjusted Rand index. These statistics record correspondence between two constructed partitions. The underlying category systems remain open to criticism.

`tehillim-texttype` reads the full BHSA `txt` string for each clause, including embedded domains and undecided values. It measures distribution, nesting, transitions, boundary association, and profile similarity before asking whether those formal patterns correspond with divisions or genre labels. `tehillim-trublet` rebuilds a published lexical study, exposes unresolved reconstruction points, and removes specified vocabulary before recalculating lexical, syntactic, and contextual comparisons. `tehillim-dss2etcbc` applies string alignment with an evidential mask, rejects disagreement among independent passes, and reports textual variation only over fully legible aligned opportunities.

`tehillim-data` retains the reports, detail tables, and trajectory profiles produced by these procedures. It allows an aggregate claim to be traced to a row or a set of observations where the relevant artifact is present. It does not yet provide a complete release-level provenance chain across every input and output.

## Results

The project has produced findings about its representations and targets. These findings are bounded results. They are not conclusions about the essence of Hebrew poetry or the history of an individual text.

| Question                      | Registered result                                                                                                                                                                                                             | Scope and consequence                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parallelism retrieval         | The current public exports contain 148 variants. Semantic representations reach the highest retained average precision, 0.3951.                                                                                               | The result applies to 1,110 eligible pairs. The eligibility rule excludes many annotated members at the `half_verse` grain.                                   |
| Genre-label separation        | The current public exports contain 222 variants. A lexical representation reaches the highest retained average precision, 0.4595.                                                                                             | No representation family leads both benchmark tasks. The difference prevents a single account of similarity.                                                  |
| Received `Hymn` label         | Across 43 semantic genre rows, the mean AUC is 0.3852 and the maximum is 0.4694.                                                                                                                                              | This is evidence against the coherence of this supplied label under these representations. It requires review of label construction and representation scope. |
| Clause-level text type        | The 2021 Hebrew Psalms contain 7,283 clauses, 37 attested text-type strings, 706 transitions, and 12 uniform psalms. Full-profile genre separation reaches AUC 0.537 with permutation p 0.059.                                | The reported profile signal is weak. Depth and transition-rate summaries provide weaker results.                                                              |
| Wisdom-vocabulary replication | Removing 729 of 5,096 colons containing a published wisdom vocabulary removes lexical cohesion from all three received lists. Contextual cohesion remains, while tested syntactic profiles recover lament and no wisdom list. | The result separates lexical, contextual, and syntactic behavior. It does not identify the residual contextual signal as a literary property.                 |
| 11Q5 collation                | The included table contains 2,685 fully legible aligned opportunities across 400 verses. It records 658 variants, 24.5 percent, and 149 consonantally substantive variants, 5.5 percent.                                      | These rates describe an alignment and legibility rule. They do not estimate the textual history of 11Q5 as a whole.                                           |
| Psalm clustering              | The versioned baseline contains 79 cluster methods over 150 psalms.                                                                                                                                                           | A partition can be nonuniform, stable under subsampling, and weakly aligned with a historical index. These observations have separate warrants.               |

Negative and mixed results are retained. The Trublet replication leaves published density and inertia calculations unresolved because the required denominators and transformations are absent. The text-type study records a changed BHSA value at Psalm 64:8 across versions. The 11Q5 work distinguishes confirmation of cited readings from validation of projected boundaries. These constraints prevent a result from acquiring a stronger claim through display alone.

## Limitations

The project has no theory-free layer. BHSA features, Masoretic section nodes, received genre lists, parallelism annotations, inherited section inventories, and published editions carry analytical commitments. The work makes many of these commitments inspectable. It cannot remove them from the evidence.

The `half_verse` unit is a major current constraint. It gives the representation and benchmark work a common address, while it can be coarser or differently organized than syntactic clauses and finer-grained annotations. The retained parallelism benchmark measures an eligible subset formed by this unit, signature decomposition, ambiguity rules, and control selection. Its outcomes cannot be generalized to every annotated relation.

Several targets remain partly opaque. The licensed parallelism and genre materials have no public annotation manual, adjudication record, or inter-annotator agreement measure. The clustering index assigns one primary category to 144 psalms after excluding six composite or partial cases. Thirteen cross-listed psalms and four hedged cases remain as primary labels. Agreement with any of these targets describes source consistency under a procedure. It does not validate the source.

The project also has a provenance problem. The public interface contains 148 parallelism and 222 genre variants. `tehillim-data` stores 766 parallelism model rows across historical and intermediate outputs, alongside 222 genre models. No manifest maps each interface payload to exact inputs, code revisions, configuration values, seeds, and checksums. A numerical result can therefore be inspected without yet being fully reconstructed from a release record.

The representation families share a corpus and several linguistic decisions. Their results are not independent replications. Semantic vectors add model-specific opacity. The clustering pipeline has no independent confirmation set. The Trublet deletion control has 24 random draws and no correction across its exploratory comparison family. Boundary transfer to 11Q5 has no independent reference set for clause and phrase boundaries. These limits identify the next empirical work. They do not disappear through a larger table or a more polished interface.

## Reproducibility

Each active repository records its dependencies, inputs, operations, and unresolved conditions in its README. `tehillim-embeddings` supplies representations. `tehillim-benchmark` supplies scoring procedures. `tehillim-data` preserves result artifacts. The studies of text type, Trublet, and 11Q5 provide separate scripts and source-specific data requirements. `tehillim-compare` and `tehillim-cluster` publish their analyses to `tehillim-data`, while generated production JSON is excluded from their source checkouts.

There is no single public command that regenerates the project. Complete benchmark reconstruction requires permitted source annotations, matching embedding artifacts, runtime label files, and the corresponding code revisions. The public interface is repeatable as a client application. It does not rebuild the research outputs it displays. A complete research release requires a versioned manifest for every emitted partition, including corpus revision, source access condition, transformation, configuration, seed, input fingerprint, and output hash.

Reproducible computation and transparent interpretation remain distinct. Fixed seeds can repeat a procedure. They cannot replace a published rule for a genre label, a textual division, a correspondence judgment, or a reading of a damaged witness.

## Installation

The public interface requires Node.js and npm:

```bash
npm install
```

Research dependencies and source-access requirements are documented in the linked repositories.

## Usage

Run the public interface locally:

```bash
npm run dev
```

Run its client checks:

```bash
npm run verify
```

The interface reads committed summary files and configured detail artifacts. Use the linked repositories to inspect the representations, benchmark procedures, data tables, and study-specific outputs behind a displayed result.

## References

Eep Talstra Centre for Bible and Computer. [_Biblia Hebraica Stuttgartensia Amstelodamensis_](https://github.com/ETCBC/bhsa). 2021.

Berlin, Adele. _The Dynamics of Biblical Parallelism_. Bloomington: Indiana University Press, 1985.

Good, Phillip I. [_Permutation Tests: A Practical Guide to Resampling Methods for Testing Hypotheses_](https://doi.org/10.1007/978-1-4757-3235-1). Springer, 2000.

Roorda, Dirk, Christiaan Erwich, Cody Kingham, and SeHoon Park. 2023. [_ETCBC/bhsa_](https://doi.org/10.5281/zenodo.1007624).

Gillmayr-Bucher, Susanne. [“Relecture of Biblical Psalms: A Computer Aided Analysis of Textual Relations Based on Semantic Domains.”](https://doi.org/10.1163/9789004493339_021) Pages 309-321 in _Bible and Computer: The Stellenbosch AIBI-6 Conference_. Leiden: Brill, 2002.

Gunkel, Hermann, and Joachim Begrich. _Einleitung in die Psalmen: Die Gattungen der religiösen Lyrik Israels_. Vandenhoeck & Ruprecht, 1933.

Logos Bible Software. [_Psalms Explorer Dataset_](https://www.logos.com/product/54188/psalms-explorer-dataset).

Montaner, Luis Vegas. “Masoretic Tradition and Syntactic Analysis of the Psalms.” Pages 317-335 in _Tradition and Innovation in Biblical Interpretation: Studies Presented to Professor Eep Talstra on the Occasion of His Sixty-Fifth Birthday_, 2011.

Naaijer, Martijn, and Dirk Roorda. [“Parallel Texts in the Hebrew Bible, New Methods and Visualizations.”](https://doi.org/10.48550/arXiv.1603.01541) 2016.

Roorda, Dirk. [“Text-Fabric: Handling Biblical Data with IKEA Logistics.”](https://doi.org/10.7146/hn.v5i2.142740) _HIPHIL Novum_ 5.2 (2019): 126-135.

Sanders, James A. _The Psalms Scroll of Qumrân Cave 11 (11QPsa)._ Discoveries in the Judaean Desert of Jordan 4. Oxford: Clarendon Press, 1965.

Talstra, Eep. “Singers and Syntax: On the Balance of Grammar and Poetry in Psalm 8.” Pages 11-22 in _Give Ear to My Words: Psalms and Other Poetry in and around the Hebrew Bible_, 1996.

Trublet, Jacques. “Le corpus sapientiel et le Psautier: approche informatique du lexique.” In _Congress Volume Leuven 1989_, 248-263. Brill, 1991.

Van Peursen, Wido. [“Tracing Text Types in Biblical Hebrew.”](https://doi.org/10.1163/15685330-12341430) _Vetus Testamentum_ 70.1 (2020): 140-155.

## License

MIT. Source corpora, licensed annotations, commercial inputs, and external model artifacts have separate terms of use.
