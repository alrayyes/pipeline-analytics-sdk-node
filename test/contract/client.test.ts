// Runs the client against a Prism mock server generated from
// pipeline-analytics's own pinned spec (see ci.yml's `contract` job) --
// never a hand-rolled stub. This proves the client's requests/responses
// conform to the spec's shape; it says nothing about whether the real
// server still matches that spec.
// Run locally with:
//   docker run -d -p 4010:4010 -v "$(pwd)/openapi:/spec:ro" \
//     stoplight/prism:5 mock -h 0.0.0.0 -m false /spec/openapi.yaml
import { describe, expect, test } from "bun:test";
import { createPipelineAnalyticsClient } from "../../src/client.js";

const baseUrl = process.env.PIPELINE_ANALYTICS_BASE_URL;

describe.skipIf(!baseUrl)("contract", () => {
  test("reports the running version", async () => {
    const client = createPipelineAnalyticsClient(baseUrl ?? "");
    const { data, error } = await client.GET("/api/version");

    expect(error).toBeUndefined();
    expect(typeof data?.version).toBe("string");
  });
});
