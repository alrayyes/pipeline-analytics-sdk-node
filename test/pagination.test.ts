import { describe, expect, test } from "bun:test";
import { createPipelineAnalyticsClient } from "../src/client.js";
import { ApiError } from "../src/errors.js";
import { listRepos } from "../src/pagination.js";

function repo(id: string) {
  return {
    id,
    forge: "github" as const,
    identifier: `owner/repo-${id}`,
    tokenMasked: `****${id}`,
    ingestionStatus: "active" as const,
  };
}

describe("listRepos", () => {
  test("iterates across every page", async () => {
    const pages = [
      { repos: [repo("1")], hasMore: true },
      { repos: [repo("2")], hasMore: false },
    ];
    let call = 0;
    const urls: string[] = [];

    const client = createPipelineAnalyticsClient("https://example.test", {
      fetch: async (request) => {
        urls.push(request.url);
        const page = pages[call];
        call++;

        return new Response(JSON.stringify(page), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const ids: string[] = [];
    for await (const r of listRepos(client)) {
      ids.push(r.id);
    }

    expect(ids).toEqual(["1", "2"]);
    expect(call).toBe(2);
    // Second page's offset must advance by exactly the first page's repo
    // count, not regress.
    expect(urls[0]).toContain("offset=0");
    expect(urls[1]).toContain("offset=1");
  });

  test("forwards every query field to each page's request", async () => {
    let call = 0;
    const urls: string[] = [];

    const client = createPipelineAnalyticsClient("https://example.test", {
      fetch: async (request) => {
        urls.push(request.url);
        call++;

        return new Response(
          JSON.stringify({ repos: [repo(String(call))], hasMore: call < 2 }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });

    const ids: string[] = [];
    for await (const r of listRepos(client, { forge: "github", limit: 5 })) {
      ids.push(r.id);
    }

    expect(ids).toEqual(["1", "2"]);
    // Both pages -- not just the first -- must still carry the caller's
    // query fields alongside the paginator's own offset.
    for (const url of urls) {
      expect(url).toContain("forge=github");
      expect(url).toContain("limit=5");
    }
  });

  test("throws a plain error on a successful response with no body", async () => {
    const client = createPipelineAnalyticsClient("https://example.test", {
      fetch: async () =>
        new Response("null", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    const drain = async () => {
      for await (const _r of listRepos(client)) {
        // draining the iterator is enough to trigger the error
      }
    };

    await expect(drain()).rejects.toThrow(
      "pipeline-analytics: list repos: empty response body",
    );
  });

  test("stops after one page when hasMore is false", async () => {
    let call = 0;
    const client = createPipelineAnalyticsClient("https://example.test", {
      fetch: async () => {
        call++;

        return new Response(
          JSON.stringify({ repos: [repo("1")], hasMore: false }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const ids: string[] = [];
    for await (const r of listRepos(client)) {
      ids.push(r.id);
    }

    expect(ids).toEqual(["1"]);
    expect(call).toBe(1);
  });

  test("throws a typed ApiError on a failed page", async () => {
    const client = createPipelineAnalyticsClient("https://example.test", {
      fetch: async () =>
        new Response(
          JSON.stringify({ code: "unauthorized", message: "no session" }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    const drain = async () => {
      for await (const _r of listRepos(client)) {
        // draining the iterator is enough to trigger the error
      }
    };

    await expect(drain()).rejects.toBeInstanceOf(ApiError);
  });
});
