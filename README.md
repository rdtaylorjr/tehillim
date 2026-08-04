# TehillimAI

Computational research on the Hebrew Psalter.

## Contents

- **`index.html` / `styles.css`** — the static project website. Deploy as-is
  to Cloudflare Pages, GitHub Pages, Netlify, or another static host.
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
  See `app/README.md`.

## Quickstart

```bash
# 1. Generate the similarity data (requires a local ETCBC/bhsa clone)
cd pipeline && python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]" && python -m tehillim_pipeline.cli

# 2. Run the visualization app
cd ../app && npm install && npm run dev
```
