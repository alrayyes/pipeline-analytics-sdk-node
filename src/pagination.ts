import type { PipelineAnalyticsClient } from "./client.js";
import { decodeError } from "./errors.js";
import type { components, operations } from "./generated/schema.js";

export type Repo = components["schemas"]["Repo"];
export type ListReposQuery = NonNullable<
  operations["listRepos"]["parameters"]["query"]
>;

/**
 * `GET /api/repos` is the one real pagination in the API (`limit`/`offset`
 * query params, `RepoList.hasMore` telling you whether to keep going).
 * `listRepos` walks every page transparently and hands back an async
 * iterable, so a caller does:
 *
 *   for await (const repo of listRepos(client)) { ... }
 *
 * rather than looping on a raw `offset`/`hasMore` pair by hand
 * (rules/sdk-generation.md's "Client shape").
 */
const DEFAULT_PAGE_SIZE = 50;

export function listRepos(
  client: PipelineAnalyticsClient,
  query: ListReposQuery = {},
): AsyncIterable<Repo> {
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;

  return {
    [Symbol.asyncIterator]() {
      return listReposGenerator(client, { ...query, limit })[
        Symbol.asyncIterator
      ]();
    },
  };
}

async function* listReposGenerator(
  client: PipelineAnalyticsClient,
  query: ListReposQuery,
): AsyncGenerator<Repo> {
  let offset = query.offset ?? 0;

  for (;;) {
    const { data, error, response } = await client.GET("/api/repos", {
      params: { query: { ...query, offset } },
    });

    if (error) {
      throw decodeError(response, error);
    }
    if (!data) {
      throw new Error("pipeline-analytics: list repos: empty response body");
    }

    yield* data.repos;

    if (!data.hasMore) {
      return;
    }

    offset += data.repos.length;
  }
}
