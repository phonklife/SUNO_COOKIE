/**
 * Errors raised by the Suno API client.
 *
 * Mirrors the status-code-to-error mapping documented for suno-api:
 * 400 -> bad request, 402 -> out of credits, 500 -> internal error,
 * 503 -> network error reaching Suno.
 */

export class SunoAPIError extends Error {
  readonly statusCode?: number;
  readonly responseBody?: unknown;

  constructor(message: string, statusCode?: number, responseBody?: unknown) {
    super(statusCode !== undefined ? `[${statusCode}] ${message}` : message);
    this.name = "SunoAPIError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends SunoAPIError {
  constructor(message: string, responseBody?: unknown) {
    super(message, 400, responseBody);
    this.name = "BadRequestError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PaymentRequiredError extends SunoAPIError {
  constructor(message: string, responseBody?: unknown) {
    super(message, 402, responseBody);
    this.name = "PaymentRequiredError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InternalServerError extends SunoAPIError {
  constructor(message: string, responseBody?: unknown) {
    super(message, 500, responseBody);
    this.name = "InternalServerError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ServiceUnavailableError extends SunoAPIError {
  constructor(message: string, responseBody?: unknown) {
    super(message, 503, responseBody);
    this.name = "ServiceUnavailableError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const STATUS_TO_ERROR: Record<number, new (message: string, responseBody?: unknown) => SunoAPIError> = {
  400: BadRequestError,
  402: PaymentRequiredError,
  500: InternalServerError,
  503: ServiceUnavailableError,
};

export function errorForStatus(statusCode: number, message: string, responseBody?: unknown): SunoAPIError {
  const ErrorClass = STATUS_TO_ERROR[statusCode];
  if (ErrorClass) {
    return new ErrorClass(message, responseBody);
  }
  return new SunoAPIError(message, statusCode, responseBody);
}
