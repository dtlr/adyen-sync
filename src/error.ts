export class ErrorBase<T extends string> extends Error {
  requestId?: string;
  name: T;
  message: string;
  cause: unknown;

  constructor({
    requestId,
    name,
    message,
    cause,
  }: {
    requestId?: string;
    name: T;
    message: string;
    cause?: unknown;
  }) {
    super();
    this.requestId = requestId;
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

type ErrorName =
  | "ADYEN_CONFIG_MISSING"
  | "ROUTE_ADYEN_WEBBHOOK"
  | "UPDATE_DATABASE"
  | "DATABASE_CONFIG_MISSING"
  | "ADYEN API"
  | "ROUTE_FLEET";
export class AdyenSyncError extends ErrorBase<ErrorName> {}
