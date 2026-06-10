/**
 * Canonical site URL for this deployment.
 *
 * NEXT_PUBLIC_SITE_URL is safe to expose to the browser — it only contains
 * the public domain of the deployment (no secrets). It is inlined into
 * client bundles at build time and read from process.env on the server.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Hostname of the deployment, e.g. "book.philosophie.ai" */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
