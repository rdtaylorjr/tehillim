/**
 * A horizontal gradient scale bar for a sequential color-encoded value
 * (the similarity heatmap's cell color) - without this, a color has no
 * stated meaning, and the same color can mean a different underlying
 * value on two different methods' heatmaps (each is domained on its own
 * data). `domainMax` may be a percentile rather than the true maximum
 * (see viz/heatmap.ts), so the top label reads "≥" rather than claiming
 * to be the highest score in the matrix.
 */
export function renderGradientLegend(
  container: HTMLElement,
  colorScale: (value: number) => string,
  domainMax: number,
): void {
  container.innerHTML = "";
  container.className = "heatmap-legend";

  const loLabel = document.createElement("span");
  loLabel.className = "heatmap-legend-label";
  loLabel.textContent = "0";

  const bar = document.createElement("span");
  bar.className = "heatmap-legend-bar";
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const stop = document.createElement("span");
    stop.style.background = colorScale((i / steps) * domainMax);
    bar.append(stop);
  }

  const hiLabel = document.createElement("span");
  hiLabel.className = "heatmap-legend-label";
  hiLabel.textContent = `≥${domainMax.toFixed(2)}`;

  const caption = document.createElement("span");
  caption.className = "heatmap-legend-caption";
  caption.textContent = "similarity";

  container.append(loLabel, bar, hiLabel, caption);
}
