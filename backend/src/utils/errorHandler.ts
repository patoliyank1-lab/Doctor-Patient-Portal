export type AppErrorOptions = {
  errors?: string[];
  cause?: unknown;
};

export class AppError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(message: string, statusCode: number, options?: AppErrorOptions) {
    super(message, { cause: options?.cause as any });
    this.statusCode = statusCode;
    this.errors = options?.errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnknownError extends AppError {
  constructor(error: unknown) {
    super("Something went wrong!", 500, { cause: error });
  }
}
