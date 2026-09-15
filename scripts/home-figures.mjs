/** Builds public/data/home_figures.json, the numbers the landing page's cards draw. */
import { readFileSync, writeFileSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));

/** More rows than the card shows, so the table is cut at a row rule. */
const TABLE_ROWS = 10;

const semantic = read("public/data/ui_semantic.json").semantic;
const ranked = [...semantic.parallelism_overall]
  .sort((a, b) => (b.separation_auc ?? 0) - (a.separation_auc ?? 0))
  .slice(0, TABLE_ROWS);

const compare = read("public/data/compare.json");
const method = read(`detail-data/detail_compare_${compare.defaultMethod}.json`);
const matrix = method.matrix.map((row) => row.map((v) => Number(v.toFixed(4))));

const clustering = read("public/data/clustering.json");
const clusterMethod = [...clustering.clusterMethods].sort(
  (a, b) => b.nClusters - a.nClusters,
)[0];

const figures = {
  benchmark: { family: "semantic", benchmark: "parallelism", rows: ranked },
  compare: {
    method: method.id,
    psalms: compare.psalms.map((p) => p.number),
    matrix,
  },
  cluster: { method: clusterMethod.id, alignment: clusterMethod.familyAlignment },
};

writeFileSync("public/data/home_figures.json", JSON.stringify(figures));
console.log(
  `Wrote home_figures.json: ${String(ranked.length)} table rows, ` +
    `${String(matrix.length)}x${String(matrix.length)} matrix (${method.id}), ` +
    `${clusterMethod.id} with ${String(clusterMethod.nClusters)} clusters`,
);
