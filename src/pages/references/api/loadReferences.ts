import type { ReferencesPayload } from "../model/types";

/** Committed alongside the site, since the library lives on one machine. */
export const REFERENCES_URL = `${import.meta.env.BASE_URL}data/references.json`;

/** The same works as BibTeX, written by the same generator. */
export const REFERENCES_BIB_URL = `${import.meta.env.BASE_URL}data/references.bib`;

export class ReferencesLoadError extends Error {}

/** `fetcher` is injectable so tests can drive the page without a server. */
export async function loadReferences(
  url: string = REFERENCES_URL,
  fetcher: typeof fetch = fetch,
): Promise<ReferencesPayload> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new ReferencesLoadError(
      `Failed to load references: ${String(response.status)} ${response.statusText}`,
    );
  }
  const payload = (await response.json()) as ReferencesPayload;
  if (!Array.isArray(payload.sections)) {
    throw new ReferencesLoadError("Malformed references payload: missing sections");
  }
  return payload;
}
