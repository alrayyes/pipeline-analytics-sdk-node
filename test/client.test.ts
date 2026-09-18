import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  createPipelineAnalyticsClient,
  SESSION_COOKIE_ENV_VAR,
} from "../src/client.js";

// Unit-tests only the hand-written parts (auth injection here) against a
// fake transport -- testing the generated request/response mapping again
// would just be testing openapi-typescript, not this SDK
// (rules/sdk-generation.md's "Testing against the spec, not a hand-written
// stub").

test("session cookie env var name is the documented, stable one", () => {
  // Every test below reads/writes process.env through this same exported
  // symbol, so they'd stay internally consistent even if its value
  // changed -- this is the one place that actually pins the literal,
  // since README/CONTRIBUTING and any caller's own shell config
  // hardcode this exact name.
  expect(SESSION_COOKIE_ENV_VAR).toBe("PIPELINE_ANALYTICS_SESSION");
});

describe("session cookie source", () => {
  const originalEnv = process.env[SESSION_COOKIE_ENV_VAR];

  beforeEach(() => {
    delete process.env[SESSION_COOKIE_ENV_VAR];
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[SESSION_COOKIE_ENV_VAR];
    } else {
      process.env[SESSION_COOKIE_ENV_VAR] = originalEnv;
    }
  });

  test("option only", async () => {
    const cookie = await cookieSentBy(
      createClientWithFakeTransport({ sessionCookie: "from-option" }),
    );
    expect(cookie).toBe("session=from-option");
  });

  test("env fallback", async () => {
    process.env[SESSION_COOKIE_ENV_VAR] = "from-env";
    const cookie = await cookieSentBy(createClientWithFakeTransport({}));
    expect(cookie).toBe("session=from-env");
  });

  test("option overrides env", async () => {
    process.env[SESSION_COOKIE_ENV_VAR] = "from-env";
    const cookie = await cookieSentBy(
      createClientWithFakeTransport({ sessionCookie: "from-option" }),
    );
    expect(cookie).toBe("session=from-option");
  });

  test("no cookie sent when neither is set", async () => {
    const cookie = await cookieSentBy(createClientWithFakeTransport({}));
    expect(cookie).toBeNull();
  });
});

test("falls back to no cookie when process is unavailable (browser bundle)", () => {
  const originalProcess = globalThis.process;
  // @ts-expect-error -- simulating a bundle target with no `process` global
  delete globalThis.process;
  try {
    expect(() =>
      createPipelineAnalyticsClient("https://example.test", {}),
    ).not.toThrow();
  } finally {
    globalThis.process = originalProcess;
  }
});

function createClientWithFakeTransport(options: { sessionCookie?: string }) {
  let capturedCookie: string | null = null;

  const client = createPipelineAnalyticsClient("https://example.test", {
    ...options,
    fetch: async (request) => {
      capturedCookie = request.headers.get("cookie");

      return new Response(JSON.stringify({ version: "dev" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  return { client, getCapturedCookie: () => capturedCookie };
}

async function cookieSentBy(
  ctx: ReturnType<typeof createClientWithFakeTransport>,
): Promise<string | null> {
  await ctx.client.GET("/api/version", {});

  return ctx.getCapturedCookie();
}
