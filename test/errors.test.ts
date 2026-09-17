import { describe, expect, test } from "bun:test";
import { ApiError, decodeError } from "../src/errors.js";

describe("decodeError", () => {
  test("parses the error body", () => {
    const response = new Response(null, {
      status: 404,
      headers: { "x-request-id": "req-123" },
    });

    const apiErr = decodeError(response, {
      code: "not_found",
      message: "no such repo",
    });

    expect(apiErr).toBeInstanceOf(ApiError);
    expect(apiErr?.statusCode).toBe(404);
    expect(apiErr?.code).toBe("not_found");
    expect(apiErr?.apiMessage).toBe("no such repo");
    expect(apiErr?.requestId).toBe("req-123");
  });

  test("null on a successful status", () => {
    const response = new Response(null, { status: 200 });
    expect(decodeError(response, undefined)).toBeNull();
  });

  test("falls back to statusText and 'unknown' for a malformed body", () => {
    const response = new Response(null, {
      status: 500,
      statusText: "Internal Server Error",
    });

    const apiErr = decodeError(response, null);

    expect(apiErr?.code).toBe("unknown");
    expect(apiErr?.apiMessage).toBe("Internal Server Error");
    expect(apiErr?.requestId).toBeUndefined();
  });

  test("message includes the request id when present", () => {
    const response = new Response(null, {
      status: 400,
      headers: { "x-request-id": "abc" },
    });
    const apiErr = decodeError(response, {
      code: "bad_request",
      message: "nope",
    });
    expect(apiErr?.message).toBe(
      "pipeline-analytics: 400 bad_request: nope (request abc)",
    );
  });

  test("message omits the request id when absent", () => {
    const response = new Response(null, { status: 400 });
    const apiErr = decodeError(response, {
      code: "bad_request",
      message: "nope",
    });
    expect(apiErr?.message).toBe("pipeline-analytics: 400 bad_request: nope");
  });
});
