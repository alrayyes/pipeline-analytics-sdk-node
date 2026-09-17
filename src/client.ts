import createClient, { type Client as OpenapiFetchClient } from "openapi-fetch";
import type { paths } from "./generated/schema.js";
import {
  createRetryFetch,
  defaultRetryConfig,
  type RetryConfig,
} from "./retry.js";

/**
 * The environment variable {@link createPipelineAnalyticsClient} falls
 * back to when no session cookie is passed explicitly via
 * {@link ClientOptions.sessionCookie}.
 */
export const SESSION_COOKIE_ENV_VAR = "PIPELINE_ANALYTICS_SESSION";

export interface ClientOptions {
  /**
   * The pipeline-analytics session cookie value. Overrides
   * `PIPELINE_ANALYTICS_SESSION` when both are set. See the README's
   * "Authentication" section for how to obtain one -- pipeline-analytics
   * authenticates browsers with WebAuthn, not an API token, so there's no
   * headless credential-grant flow this SDK can drive on its own
   * (github.com/alrayyes/pipeline-analytics#178 tracks a real token flow).
   */
  sessionCookie?: string;
  /**
   * Replaces the underlying `fetch`. The retry wrapper (see `retry`)
   * wraps whatever this is, so pass something with its own request
   * behavior already configured (a proxying fetch, a test double) rather
   * than re-implementing retry yourself.
   */
  fetch?: (input: Request) => Promise<Response>;
  /** Overrides the default retry policy. */
  retry?: Partial<RetryConfig>;
}

/**
 * A pipeline-analytics API client -- the typed `openapi-fetch` client for
 * `paths`, so every operation is available as `client.GET("/api/repos",
 * ...)` / `client.POST("/api/repos", ...)` etc. See the README for the
 * common operations and {@link decodeError} for turning a failed response
 * into a typed error.
 */
export type PipelineAnalyticsClient = OpenapiFetchClient<paths>;

/**
 * Builds a client against `baseUrl` (the pipeline-analytics instance's
 * origin, e.g. `"https://pipeline-analytics.example.com"`).
 */
export function createPipelineAnalyticsClient(
  baseUrl: string,
  options: ClientOptions = {},
): PipelineAnalyticsClient {
  const sessionCookie = options.sessionCookie ?? getEnv(SESSION_COOKIE_ENV_VAR);
  const retryConfig: RetryConfig = { ...defaultRetryConfig, ...options.retry };
  const baseFetch = options.fetch ?? ((request: Request) => fetch(request));

  const client = createClient<paths>({
    baseUrl,
    fetch: createRetryFetch(baseFetch, retryConfig),
  });

  if (sessionCookie) {
    client.use({
      onRequest({ request }) {
        // Secure/HttpOnly/SameSite are Set-Cookie response attributes;
        // they don't apply to a Cookie header we send.
        request.headers.set("Cookie", `session=${sessionCookie}`);

        return request;
      },
    });
  }

  return client;
}

function getEnv(name: string): string | undefined {
  // Bun and Node both expose process.env; guarded for a browser bundle
  // that has no `process` at all.
  return typeof process !== "undefined" ? process.env[name] : undefined;
}
