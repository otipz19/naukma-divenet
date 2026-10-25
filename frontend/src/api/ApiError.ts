/** One invalid request field, as in the back-end's RFC 9457 `errors` list. */
export interface FieldViolation {
  field: string;
  message: string;
}

/** The parts of an RFC 9457 problem document the UI uses. */
export interface Problem {
  title?: string;
  detail?: string;
  instance?: string;
  errors: FieldViolation[];
}

/** Every failed API call rejects with this error, so callers handle one shape. */
export class ApiError extends Error {
  readonly kind: "http" | "network";
  readonly status?: number;
  readonly problem?: Problem;

  private constructor(
    kind: "http" | "network",
    message: string,
    options: { status?: number; problem?: Problem; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
    this.problem = options.problem;
  }

  static network(cause: unknown): ApiError {
    return new ApiError("network", "The API could not be reached.", { cause });
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const problem = await readProblem(response);
    return new ApiError("http", problem?.title ?? `HTTP ${response.status}`, {
      status: response.status,
      problem,
    });
  }
}

async function readProblem(response: Response): Promise<Problem | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) return undefined;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return undefined;
  }
  if (typeof body !== "object" || body === null) return undefined;
  const record = body as Record<string, unknown>;
  return {
    title: asString(record.title),
    detail: asString(record.detail),
    instance: asString(record.instance),
    errors: Array.isArray(record.errors) ? record.errors.filter(isFieldViolation) : [],
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isFieldViolation(value: unknown): value is FieldViolation {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.field === "string" && typeof record.message === "string";
}
