/** Replaces `app`'s contents with a plain-text error state - both pages'
 * `main()` show this when their initial data fetch fails, e.g. because
 * the pipeline hasn't been run yet to generate the JSON payloads. */
export function renderLoadError(
  app: HTMLElement,
  error: unknown,
  options: { heading: string; missingDataFiles: string },
): void {
  const message = error instanceof Error ? error.message : String(error);
  app.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.style.padding = "60px 24px";
  wrapper.style.textAlign = "center";
  wrapper.style.fontFamily = "Inter, sans-serif";

  const heading = document.createElement("h1");
  heading.textContent = options.heading;

  const detail = document.createElement("p");
  detail.textContent = message;
  detail.style.color = "#5f6c72";

  const hint = document.createElement("p");
  hint.textContent = `Run the pipeline (see pipeline/README.md) to generate ${options.missingDataFiles}.`;
  hint.style.color = "#5f6c72";

  wrapper.append(heading, detail, hint);
  app.append(wrapper);
}
