import { describe, expect, test } from "bun:test";
import { createRetryFetch, defaultRetryConfig } from "../src/retry.js";

describe("createRetryFetch", () => {
  test("retries a 5xx then succeeds", async () => {
    let attempts = 0;
    const retryFetch = createRetryFetch(async () => {
      attempts++;
      if (attempts < 3) {
        return new Response(null, { status: 503 });
      }

      return new Response(JSON.stringify({ version: "dev" }), { status: 200 });
    }, zeroDelay(3));

    const response = await retryFetch(
      new Request("https://example.test/api/version"),
    );

    expect(response.status).toBe(200);
    expect(attempts).toBe(3);
  });

  test("never retries a non-429 4xx", async () => {
    let attempts = 0;
    const retryFetch = createRetryFetch(async () => {
      attempts++;

      return new Response(
        JSON.stringify({ code: "bad_request", message: "nope" }),
        { status: 400 },
      );
    }, zeroDelay(3));

    const response = await retryFetch(
      new Request("https://example.test/api/version"),
    );

    expect(response.status).toBe(400);
    expect(attempts).toBe(1);
  });

  test("honors Retry-After ahead of its own backoff", async () => {
    let attempts = 0;
    const retryFetch = createRetryFetch(async () => {
      attempts++;
      if (attempts < 2) {
        return new Response(null, {
          status: 429,
          headers: { "Retry-After": "0" },
        });
      }

      return new Response(JSON.stringify({ version: "dev" }), { status: 200 });
    }, zeroDelay(2));

    const response = await retryFetch(
      new Request("https://example.test/api/version"),
    );

    expect(response.status).toBe(200);
    expect(attempts).toBe(2);
  });

  test("gives up after maxRetries", async () => {
    let attempts = 0;
    const retryFetch = createRetryFetch(async () => {
      attempts++;

      return new Response(null, { status: 503 });
    }, zeroDelay(2));

    const response = await retryFetch(
      new Request("https://example.test/api/version"),
    );

    expect(response.status).toBe(503);
    expect(attempts).toBe(3); // first try + 2 retries
  });

  test("retries a network failure", async () => {
    let attempts = 0;
    const retryFetch = createRetryFetch(async () => {
      attempts++;
      if (attempts < 2) {
        throw new TypeError("fetch failed");
      }

      return new Response(JSON.stringify({ version: "dev" }), { status: 200 });
    }, zeroDelay(2));

    const response = await retryFetch(
      new Request("https://example.test/api/version"),
    );

    expect(response.status).toBe(200);
    expect(attempts).toBe(2);
  });

  test("replays a JSON request body on every attempt", async () => {
    let attempts = 0;
    const bodiesSeen: unknown[] = [];
    const retryFetch = createRetryFetch(async (request) => {
      attempts++;
      bodiesSeen.push(await request.json());
      if (attempts < 3) {
        return new Response(null, { status: 503 });
      }

      return new Response(JSON.stringify({ id: "1" }), { status: 201 });
    }, zeroDelay(3));

    const original = new Request("https://example.test/api/repos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ forge: "github", identifier: "a/a", token: "t" }),
    });

    const response = await retryFetch(original);

    expect(response.status).toBe(201);
    expect(attempts).toBe(3);
    expect(bodiesSeen).toEqual([
      { forge: "github", identifier: "a/a", token: "t" },
      { forge: "github", identifier: "a/a", token: "t" },
      { forge: "github", identifier: "a/a", token: "t" },
    ]);
  });

  test("stops retrying once the request is aborted", async () => {
    const controller = new AbortController();
    let attempts = 0;
    const retryFetch = createRetryFetch(async () => {
      attempts++;
      throw new DOMException("aborted", "AbortError");
    }, zeroDelay(3));

    controller.abort();
    const request = new Request("https://example.test/api/version", {
      signal: controller.signal,
    });

    await expect(retryFetch(request)).rejects.toThrow();
    expect(attempts).toBe(1);
  });
});

function zeroDelay(maxRetries: number) {
  return { ...defaultRetryConfig, maxRetries, baseDelayMs: 0 };
}
