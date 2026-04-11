export class UnknownError extends Error {
  statusCode: number = 500;
  constructor(error: any) {
    super(error);
    if(error.name === "ZodError"){
this.message = error.errors
    }
    console.log(JSON.stringify(error));
  }
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
