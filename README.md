# pipeline-analytics-sdk-node

[![CI](https://github.com/alrayyes/pipeline-analytics-sdk-node/actions/workflows/ci.yml/badge.svg)](https://github.com/alrayyes/pipeline-analytics-sdk-node/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40pipeline-analytics%2Fsdk-node)](https://www.npmjs.com/package/@pipeline-analytics/sdk-node)
[![Codecov](https://codecov.io/gh/alrayyes/pipeline-analytics-sdk-node/graph/badge.svg)](https://codecov.io/gh/alrayyes/pipeline-analytics-sdk-node)
[![docs](https://img.shields.io/badge/docs-typedoc-blue)](https://alrayyes.github.io/pipeline-analytics-sdk-node/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Node/TypeScript client for [pipeline-analytics](https://github.com/alrayyes/pipeline-analytics)'s
REST API, generated from its OpenAPI spec with
[openapi-typescript](https://openapi-ts.dev/) and
[openapi-fetch](https://openapi-ts.dev/openapi-fetch/). It saves you from
hand-rolling HTTP requests, retries and pagination against the API yourself.

## Requirements

- Node.js 20+ or [Bun](https://bun.sh) 1.1+ — anything with a native `fetch`.
- A running pipeline-analytics instance.
- A session cookie for that instance (see "Authentication" below) — every
  endpoint except `getVersion` and the two webhook receivers needs one.

## Installation

```sh
bun add @pipeline-analytics/sdk-node
# or: npm install @pipeline-analytics/sdk-node
```

### Alternative registry: GitHub Packages

Every release also publishes to GitHub Packages under
`@alrayyes/pipeline-analytics-sdk-node` — the same code, a different scope,
because GitHub Packages' npm registry requires a package scoped to the
repo owner rather than the `pipeline-analytics` npm org. Worth it if
you're already authenticated to GitHub (CI in another of your own repos,
say) and would rather not hold a separate npmjs.com credential just to
install this one package.

Add a `.npmrc` pointing that scope at GitHub Packages:

```
@alrayyes:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

then install the scoped name instead:

```sh
npm install @alrayyes/pipeline-analytics-sdk-node
```

## Authentication

pipeline-analytics authenticates browsers with
[WebAuthn](https://webauthn.guide/), not an API token — there's no headless
credential-grant flow in its spec
([alrayyes/pipeline-analytics#178](https://github.com/alrayyes/pipeline-analytics/issues/178)
tracks a real token flow), so this SDK can't log in for you. Get a session
cookie by logging into the dashboard in a browser, opening dev tools, and
copying the `session` cookie's value. Pass it to
`createPipelineAnalyticsClient` or set `PIPELINE_ANALYTICS_SESSION` in the
environment:

```ts
import { createPipelineAnalyticsClient } from "@pipeline-analytics/sdk-node";

const client = createPipelineAnalyticsClient("https://pipeline-analytics.example.com", {
  sessionCookie: process.env.PIPELINE_ANALYTICS_SESSION,
});
```

A session cookie expires the same way it would in a browser; there's nothing
in this SDK to refresh it automatically.

## Usage

`getVersion` needs no session and is a good first call to prove the client
reaches the server at all. The client is a typed
[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) instance, so every
operation is `client.GET(path, ...)` / `client.POST(path, ...)`, returning
`{ data, error, response }`:

```ts
import { createPipelineAnalyticsClient } from "@pipeline-analytics/sdk-node";

const client = createPipelineAnalyticsClient("https://pipeline-analytics.example.com");

const { data } = await client.GET("/api/version", {});
console.log("server version:", data?.version);
```

Listing tracked repos needs a session, and demonstrates the pagination
iterator and typed error handling:

```ts
import { ApiError, createPipelineAnalyticsClient, listRepos } from "@pipeline-analytics/sdk-node";

const client = createPipelineAnalyticsClient("https://pipeline-analytics.example.com", {
  sessionCookie: process.env.PIPELINE_ANALYTICS_SESSION,
});

try {
  for await (const repo of listRepos(client)) {
    console.log(repo.identifier, repo.ingestionStatus);
  }
} catch (err) {
  if (err instanceof ApiError && err.statusCode === 401) {
    throw new Error("session cookie expired or invalid");
  }
  throw err;
}
```

Every other operation follows the same `client.GET`/`client.POST`/... pattern.
Use `decodeError` to turn a failed response into a `@pipeline-analytics/sdk-node`
`ApiError` uniformly:

```ts
import { decodeError } from "@pipeline-analytics/sdk-node";

const { data, error, response } = await client.GET("/api/repos/{repoId}/usage", {
  params: { path: { repoId } },
});
if (error) {
  throw decodeError(response, error);
}
```

The client retries a `429` or `5xx` response with exponential backoff and
jitter (honoring a server-sent `Retry-After`), and never retries any other
`4xx`. Tune it with the `retry` option, or swap the underlying `fetch`
entirely with the `fetch` option.

## Regenerating the types

See [CONTRIBUTING.md](CONTRIBUTING.md) — the generated types are pinned to a
specific pipeline-analytics commit and shouldn't drift from it silently.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for building, testing and the release
process.

## License

[MIT](LICENSE) — a permissive license for the client, independent of
pipeline-analytics' own AGPL-3.0.
