/**
 * A Node/TypeScript client for the pipeline-analytics REST API
 * (github.com/alrayyes/pipeline-analytics), generated from its OpenAPI
 * spec with openapi-typescript + openapi-fetch.
 *
 * Every operation except `getVersion` and the two webhook receivers
 * requires an authenticated session. pipeline-analytics authenticates
 * browsers with WebAuthn, not an API token -- there is no headless
 * credential-grant flow in the spec. Obtain a session cookie by logging
 * into the dashboard in a browser and copying the "session" cookie's
 * value; pass it to {@link createPipelineAnalyticsClient} or set
 * `PIPELINE_ANALYTICS_SESSION`. See the README for the full explanation
 * and an example.
 */

export type { ClientOptions, PipelineAnalyticsClient } from "./client.js";
export {
  createPipelineAnalyticsClient,
  SESSION_COOKIE_ENV_VAR,
} from "./client.js";
export { ApiError, decodeError } from "./errors.js";
export type { components, operations, paths } from "./generated/schema.js";
export type { ListReposQuery, Repo } from "./pagination.js";
export { listRepos } from "./pagination.js";
export type { RetryConfig } from "./retry.js";
export { defaultRetryConfig } from "./retry.js";
