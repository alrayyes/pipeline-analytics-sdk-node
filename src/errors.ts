/**
 * Every 4xx/5xx pipeline-analytics returns shares the same `{code,
 * message}` body (openapi/openapi.yaml's `Error` schema). `ApiError`
 * carries that alongside the HTTP status and any request id, so a caller
 * never has to parse a raw `Response` or match against a bare string.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly apiMessage: string;
  // Not `requestId?: string` -- exactOptionalPropertyTypes then rejects
  // assigning the `string | undefined` decodeError actually produces,
  // since an optional property's *value*, once present, must be exactly
  // `string`. This field is always present; its value is just sometimes
  // undefined.
  readonly requestId: string | undefined;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    requestId?: string,
  ) {
    const suffix = requestId ? ` (request ${requestId})` : "";
    super(`pipeline-analytics: ${statusCode} ${code}: ${message}${suffix}`);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.apiMessage = message;
    this.requestId = requestId;
  }
}

interface ErrorBody {
  code?: string;
  message?: string;
}

/**
 * Builds an ApiError from a response and its already-parsed error body --
 * openapi-fetch decodes JSON before handing you `error`, so there's no
 * `Response` to read a second time. Returns null for a response that
 * isn't actually an error (status < 400), so callers can call this
 * unconditionally on openapi-fetch's `{ data, error, response }` result:
 *
 *   const { data, error, response } = await client.GET("/api/repos", {});
 *   const apiErr = decodeError(response, error);
 *   if (apiErr) throw apiErr;
 */
export function decodeError(
  response: Response,
  body: unknown,
): ApiError | null {
  if (response.status < 400) {
    return null;
  }

  const parsed = isErrorBody(body) ? body : {};

  return new ApiError(
    response.status,
    parsed.code ?? "unknown",
    parsed.message ?? response.statusText,
    response.headers.get("x-request-id") ?? undefined,
  );
}

function isErrorBody(value: unknown): value is ErrorBody {
  return typeof value === "object" && value !== null;
}
