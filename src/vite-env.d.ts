/// <reference types="vite/client" />

/** Injected at build time from package.json, so the version lives in one place. */
declare const __APP_VERSION__: string;

/** Content hash of the detail export, so a regenerated payload is a new URL to every cache. */
declare const __DETAIL_VERSION__: string;
