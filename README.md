# tehillim-react

The React front end for the Tehillim benchmarks: one page, one toolbar, and a pane beneath it
that swaps between the results table and a model's visualizations. This repo currently holds a
prototype of that shell, driven by stand-in rows, with no result data or charts wired in yet.

## Why the toolbar is shaped the way it is

Two selectors govern the page, and they are not steps in a sequence. Every combination of the
six model families and the two benchmarks is valid, so they read as crossed factors rather
than a path. Each one owns the filters below it, and nothing else:

- **Models** governs **Unit** or **Level**, and **Text**.
- **Benchmarks** governs **Type**, or **Genre** and **Metric**.

Which filters appear was taken from the live behaviour of the previous interface rather than
from its source, so the prototype reproduces it exactly:

| Family     | Facet selector    | Text selector          |
| ---------- | ----------------- | ---------------------- |
| Semantic   | none              | always                 |
| Lexical    | Unit              | only when Unit is Word |
| Phonology  | none              | never                  |
| Morphology | none              | never                  |
| Syntax     | Level             | never                  |
| Discourse  | none              | never                  |

Families with no benchmark data stay selectable. Their empty state explains the absence in the
content area, where there is room to say why, rather than encoding it as a disabled control.

## Commands

```bash
npm install
npm run dev       # Vite dev server
npm run verify    # typecheck, lint, format check, architecture lint, tests with coverage
npm run build     # production build
```

`verify` is the gate. It runs everything below and is the single command to trust.

## What enforces quality

Nothing here relies on remembering a convention.

- **TypeScript** in strict mode, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
  and `noPropertyAccessFromIndexSignature`, so indexing and optional properties cannot lie.
- **typescript-eslint** `strictTypeChecked` and `stylisticTypeChecked`: type-aware rules that
  a syntax-only pass cannot reach, including `no-unnecessary-condition` and
  `switch-exhaustiveness-check`.
- **eslint-plugin-react-hooks** for the rules of hooks and exhaustive dependencies.
- **eslint-plugin-jsx-a11y** so accessibility regressions fail the build.
- **eslint-plugin-react-refresh** to keep fast refresh sound.
- **Prettier**, checked in CI rather than merely available.
- **Steiger** enforcing Feature-Sliced Design: layers, slices, and segments, with each widget
  reached only through its public API.
- **Vitest** with React Testing Library, at coverage thresholds that fail the run when unmet.

## Architecture

Feature-Sliced Design, with imports flowing in one direction only:

```
src/
  app/        the page shell, holding selection state
  widgets/    toolbar, benchmark-table, model-detail  (each: ui/ + index.ts)
  shared/
    lib/      catalog (the option sets), selection (the reducer)
    ui/       PillGroup, SelectControl
```

Selection lives in one reducer rather than scattered `useState` calls, because the rules are
about relationships between fields: changing the family clears its facet, text and query, and
changing the metric resets the genre scope. A reducer keeps those cascades in one tested place,
and every action returns the identical object when nothing would change, so React can skip
re-rendering.

## Testing

Tests exercise behaviour through the DOM the way a reader would use it: roles and labels, not
class names or internal state. They assert the toolbar is never unmounted when the pane below
it swaps, which is the whole point of the single-page structure.

## Citations

Chicago author-date is used throughout. Each record below was verified against its primary
source rather than a search result. Note that the Research Data Journal's own article page
misspells the author's given name as "Drik"; the GitHub and Zenodo records both read "Dirk".

**Hebrew text and linguistic annotations**

> Eep Talstra Centre for Bible and Computer. *Biblia Hebraica Stuttgartensia (Amstelodamensis)*.
> Amsterdam: DANS. https://doi.org/10.17026/dans-z6y-skyh. Licensed CC BY-NC 4.0.

**Software used to read that dataset**

> Roorda, Dirk. *Text-Fabric*. Zenodo. https://doi.org/10.5281/zenodo.592193.

**The data paper describing both**

> Roorda, Dirk. 2018. "Coding the Hebrew Bible." *Research Data Journal for the Humanities and
> Social Sciences* 3: 1–15. https://doi.org/10.1163/24523666-01000011.

**Psalm form and genre data**

> Witthoff, David, Kris Lyle, Matt Nerdahl, Jimmy Parks, and Elliot Ritzema. *Psalms Explorer*.
> Edited by Eli Evans. Bellingham, WA: Logos Bible Software.
> https://www.logos.com/product/54188/psalms-explorer-dataset.

Used with permission. The resource carries the internal title "Psalms Form and Structure" in
its own front matter; Logos publishes it as Psalms Explorer, which is the name used here and in
the footer. These form and genre classifications reflect one interpretive scheme among several
in Hebrew Bible scholarship.

The BHSA licence is non-commercial and requires attribution, so any reuse of this work inherits
that condition.

## Status

Prototype. The result data, the real table columns, and the Plotly visualizations are not
wired in yet.
