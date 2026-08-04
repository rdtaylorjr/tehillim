# TehillimAI

Computational research on the Hebrew Psalter.

## Contents

- **`index.html` / `styles.css`** — the static project website. Links to the
  comparison tool at `compare/index.html` (see below).
- **`pipeline/`** — Python package that computes psalm-to-psalm similarity
  from [ETCBC/BHSA](https://github.com/ETCBC/bhsa) data via
  [Text-Fabric](https://annotation.github.io/text-fabric/), and exports the
  result as JSON. Currently implements lexical similarity (TF-IDF weighted
  cosine similarity over content-word lexemes); the architecture anticipates
  additional comparison methods (morphological, syntactic, embedding- or
  LLM-based, discriminant-analysis-based). See `pipeline/README.md`.
- **`app/`** — "Compare the Psalms", an interactive Vite + TypeScript + D3
  visualization of the pipeline's output: a similarity heatmap, a
  force-directed similarity network, and a ranked most-similar-psalms panel.
  This is a *source* project — `app/index.html` only runs under the Vite dev
  server, it is not a page you can link to or deploy directly. See
  `app/README.md`.
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
